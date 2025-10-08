'use client';

import React, { useEffect, useState, useRef } from 'react';
import { BallState } from '@/types/game';

interface SimpleBallProps {
  ball: BallState;
  boardWidth: number;
  boardHeight: number;
  rows: number;
  onAnimationEnd?: (finalSlot: number) => void;
}

// 簡單的物理狀態
interface SimpleBallState {
  x: number;
  y: number;
  vx: number; // x速度
  vy: number; // y速度
}

// 釘子位置
interface Peg {
  x: number;
  y: number;
  radius: number;
}

const SimpleBall: React.FC<SimpleBallProps> = ({
  ball,
  boardWidth,
  boardHeight,
  rows,
  onAnimationEnd
}) => {
  const [ballPos, setBallPos] = useState<SimpleBallState | null>(null);
  const [pegs] = useState<Peg[]>(() => {
    // 使用與遊戲板相同的釘子位置計算
    const pegArray: Peg[] = [];
    const rowHeight = boardHeight / (rows + 1);
    const colWidth = boardWidth / (rows + 1);
    
    // 生成每行的釘子 (與 ballPhysics.ts 中的 getPegPositions 相同)
    for (let row = 1; row < rows; row++) {
      // 每行的钉子数量递增
      const pegsInRow = row + 1;
      
      for (let col = 0; col < pegsInRow; col++) {
        // 计算钉子在该行的居中位置
        const startOffset = (rows + 1 - pegsInRow) / 2;
        const pegCol = startOffset + col;
        
        const x = pegCol * colWidth + colWidth / 2;
        const y = row * rowHeight + rowHeight / 2;
        
        pegArray.push({
          x,
          y,
          radius: 8
        });
      }
    }
    return pegArray;
  });

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // 檢測碰撞
  const checkCollision = (ball: SimpleBallState, peg: Peg): boolean => {
    const dx = ball.x - peg.x;
    const dy = ball.y - peg.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= (12 + 3); // 球半徑12 + 釘子實際半徑3 (與遊戲板一致)
  };

  // 處理碰撞
  const handleCollision = (ballState: SimpleBallState, peg: Peg) => {
    const dx = ballState.x - peg.x;
    const dy = ballState.y - peg.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    // 正規化碰撞向量
    const nx = dx / distance;
    const ny = dy / distance;
    
    // 分離球和釘子
    const overlap = (12 + 3) - distance; // 使用實際釘子半徑3
    ballState.x += nx * overlap * 0.6;
    ballState.y += ny * overlap * 0.6;
    
    // 計算反彈速度
    const dotProduct = ballState.vx * nx + ballState.vy * ny;
    ballState.vx -= 2 * dotProduct * nx * 0.8; // 0.8是彈性係數
    ballState.vy -= 2 * dotProduct * ny * 0.8;
    
    // 添加一些隨機性
    ballState.vx += (Math.random() - 0.5) * 2;
    ballState.vy += (Math.random() - 0.5) * 1;
  };

  // 初始化球
  useEffect(() => {
    if (!ball.isActive) return;
    
    setBallPos({
      x: boardWidth / 2,
      y: 20,
      vx: (Math.random() - 0.5) * 2, // 隨機初始x速度
      vy: 3 // 初始向下速度
    });
    
    lastTimeRef.current = null;
  }, [ball.isActive, ball.id, boardWidth]);

  // 物理更新循環
  useEffect(() => {
    if (!ballPos) return;

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.016); // 限制在60fps
      lastTimeRef.current = currentTime;

      setBallPos(prevPos => {
        if (!prevPos) return null;

        const newPos = { ...prevPos };
        
        // 重力
        newPos.vy += 15 * deltaTime; // 重力加速度
        
        // 阻力
        newPos.vx *= 0.999;
        newPos.vy *= 0.999;
        
        // 更新位置
        newPos.x += newPos.vx;
        newPos.y += newPos.vy;
        
        // 檢查與釘子的碰撞
        for (const peg of pegs) {
          if (checkCollision(newPos, peg)) {
            handleCollision(newPos, peg);
            
            // 創建碰撞光效
            const flash = document.createElement('div');
            flash.style.cssText = `
              position: absolute;
              left: ${peg.x - 15}px;
              top: ${peg.y - 15}px;
              width: 30px;
              height: 30px;
              background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
              border-radius: 50%;
              pointer-events: none;
              z-index: 1000;
              animation: flash 0.3s ease-out;
            `;
            
            const gameBoard = document.querySelector('.game-board');
            if (gameBoard) {
              gameBoard.appendChild(flash);
              setTimeout(() => gameBoard.removeChild(flash), 300);
            }
          }
        }
        
        // 邊界碰撞
        if (newPos.x <= 12 || newPos.x >= boardWidth - 12) {
          newPos.vx = -newPos.vx * 0.8;
          newPos.x = Math.max(12, Math.min(boardWidth - 12, newPos.x));
        }
        
        // 檢查是否到達底部
        if (newPos.y >= boardHeight - 12) {
          const finalSlot = Math.floor((newPos.x / boardWidth) * (rows + 1));
          const clampedSlot = Math.max(0, Math.min(rows, finalSlot));
          
          setTimeout(() => {
            onAnimationEnd?.(clampedSlot);
          }, 100);
          
          return newPos; // 停止動畫
        }

        return newPos;
      });

      if (ballPos && ballPos.y < boardHeight - 12) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ballPos, pegs, boardWidth, boardHeight, rows, onAnimationEnd]);

  if (!ballPos) return null;

  return (
    <div className="absolute inset-0 pointer-events-none game-board">
      {/* 球 */}
      <div
        className="absolute z-20 transition-none"
        style={{
          left: ballPos.x - 12,
          top: ballPos.y - 12,
          width: 24,
          height: 24,
        }}
      >
        <div 
          className="w-full h-full rounded-full shadow-lg"
          style={{
            background: `radial-gradient(circle at 30% 30%, 
              #ffffff 0%, 
              #ff6b9d 30%, 
              #c44569 60%, 
              #8b3a62 100%)`,
            boxShadow: `
              0 2px 8px rgba(0,0,0,0.4),
              inset -1px -1px 3px rgba(0,0,0,0.3),
              inset 1px 1px 3px rgba(255,255,255,0.4)
            `
          }}
        >
          {/* 高光 */}
          <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-80" />
        </div>
      </div>

      {/* 釘子 (只在開發模式顯示) */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {pegs.map((peg, index) => (
            <div
              key={index}
              className="absolute bg-white rounded-full shadow-md border border-gray-300"
              style={{
                left: peg.x - 3, // 使用實際釘子半徑3
                top: peg.y - 3,
                width: 6, // 直徑6
                height: 6,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default SimpleBall;