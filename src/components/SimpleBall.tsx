'use client';

import React, { useEffect, useState, useRef } from 'react';
import { BallState } from '@/types/game';

interface SimpleBallProps {
  ball: BallState;
  boardWidth: number;
  boardHeight: number;
  rows: number;
  targetSlot?: number; // 新增目標槽位
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
  targetSlot,
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
    ballState.x += nx * overlap * 0.8; // 增加分離力度
    ballState.y += ny * overlap * 0.8;
    
    // 計算反彈速度 - 降低彈性以減少劇烈彈跳
    const dotProduct = ballState.vx * nx + ballState.vy * ny;
    ballState.vx -= 2 * dotProduct * nx * 0.6; // 降低彈性係數到0.6
    ballState.vy -= 2 * dotProduct * ny * 0.6;
    
    // 限制水平速度，防止球彈得太遠
    const maxHorizontalSpeed = 4;
    if (Math.abs(ballState.vx) > maxHorizontalSpeed) {
      ballState.vx = ballState.vx > 0 ? maxHorizontalSpeed : -maxHorizontalSpeed;
    }
    
    // 添加輕微隨機性，但不要太大
    ballState.vx += (Math.random() - 0.5) * 1;
    ballState.vy += (Math.random() - 0.5) * 0.5;
  };

  // 初始化球
  useEffect(() => {
    if (!ball.isActive) return;
    
    console.log(`[Physics] Initializing ball ${ball.id} with target slot: ${targetSlot}`);
    
    setBallPos({
      x: boardWidth / 2,
      y: 20,
      vx: (Math.random() - 0.5) * 2, // 隨機初始x速度
      vy: 3 // 初始向下速度
    });
    
    lastTimeRef.current = null;
  }, [ball.isActive, ball.id, boardWidth, targetSlot]);

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
        newPos.vy += 12 * deltaTime; // 降低重力，讓運動更平穩
        
        // 強力機率引導 - 確保完全遵循後台數據
        if (targetSlot !== undefined) {
          const slotWidth = boardWidth / (rows + 1);
          const targetX = slotWidth * (targetSlot + 0.5);
          const distanceToTarget = targetX - newPos.x;
          
          // 計算引導力強度 - 三段式增強
          const progressToBottom = Math.min(1, newPos.y / (boardHeight * 0.9));
          let guidanceMultiplier = 0;
          
          if (progressToBottom > 0.7) {
            // 底部30%：極強引導，確保到達目標
            guidanceMultiplier = 8 + (progressToBottom - 0.7) * 20; // 8-14倍強度
          } else if (progressToBottom > 0.4) {
            // 中部30%：中等引導
            guidanceMultiplier = 2 + (progressToBottom - 0.4) * 20; // 2-8倍強度
          } else {
            // 頂部40%：輕微引導，保持物理真實感
            guidanceMultiplier = progressToBottom * 5; // 0-2倍強度
          }
          
          // 應用引導力 - 距離越遠力度越強
          const distanceRatio = Math.min(1, Math.abs(distanceToTarget) / (slotWidth * 0.5));
          const guidanceForce = Math.sign(distanceToTarget) * guidanceMultiplier * distanceRatio * 0.5;
          newPos.vx += guidanceForce;
          
          // 底部區域額外限制速度發散
          if (progressToBottom > 0.8) {
            newPos.vx *= 0.7; // 減少水平速度以提高精確性
          }
          
          // 調試信息
          if (Math.random() < 0.02) { // 2%機率打印調試信息
            console.log(`[Physics] 🎯 Target: ${targetSlot}, X: ${newPos.x.toFixed(1)}→${targetX.toFixed(1)}, Dist: ${distanceToTarget.toFixed(1)}, Progress: ${(progressToBottom*100).toFixed(1)}%, Force: ${guidanceForce.toFixed(2)}`);
          }
        }
        
        // 阻力
        newPos.vx *= 0.998; // 增加阻力
        newPos.vy *= 0.999;
        
        // 更新位置
        newPos.x += newPos.vx;
        newPos.y += newPos.vy;
        
        // 確保球不會跑到遊戲區域外 (預防性檢查)
        const gameAreaMargin = boardWidth * 0.05; // 5% 邊距
        if (newPos.x < gameAreaMargin) {
          newPos.x = gameAreaMargin;
          newPos.vx = Math.abs(newPos.vx) * 0.7;
        }
        if (newPos.x > boardWidth - gameAreaMargin) {
          newPos.x = boardWidth - gameAreaMargin;
          newPos.vx = -Math.abs(newPos.vx) * 0.7;
        }
        
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
        
        // 三角形邊界檢測
        const rowHeight = boardHeight / (rows + 1);
        const colWidth = boardWidth / (rows + 1);
        const currentRow = Math.floor(newPos.y / rowHeight);
        
        if (currentRow >= 1 && currentRow <= rows) {
          // 計算當前行的左右邊界
          const leftBoundary = colWidth * 0.5;
          const rightBoundary = colWidth * (rows + 0.5);
          
          // 檢測左邊界碰撞
          if (newPos.x <= leftBoundary + 12) {
            newPos.vx = Math.abs(newPos.vx) * 0.8; // 向右反彈
            newPos.x = leftBoundary + 12;
          }
          
          // 檢測右邊界碰撞
          if (newPos.x >= rightBoundary - 12) {
            newPos.vx = -Math.abs(newPos.vx) * 0.8; // 向左反彈
            newPos.x = rightBoundary - 12;
          }
        } else {
          // 在三角形範圍外，強制邊界檢測
          if (newPos.x <= 12) {
            newPos.vx = Math.abs(newPos.vx) * 0.8;
            newPos.x = 12;
          }
          if (newPos.x >= boardWidth - 12) {
            newPos.vx = -Math.abs(newPos.vx) * 0.8;
            newPos.x = boardWidth - 12;
          }
        }
        
        // 最終安全檢查 - 強制保持在合理範圍內
        const safeMargin = 30;
        if (newPos.x < safeMargin) {
          newPos.x = safeMargin;
          newPos.vx = Math.abs(newPos.vx);
        }
        if (newPos.x > boardWidth - safeMargin) {
          newPos.x = boardWidth - safeMargin;
          newPos.vx = -Math.abs(newPos.vx);
        }
        
        // 檢查是否到達底部
        if (newPos.y >= boardHeight - 12) {
          // 🎯 關鍵修復：完全遵循後台機率數據
          let finalSlot: number;
          
          if (targetSlot !== undefined) {
            // 使用後台計算的目標槽位（完全遵循機率數據）
            finalSlot = targetSlot;
            console.log(`🎯 [Physics End] Using backend target slot: ${finalSlot}`);
          } else {
            // 後備方案：基於物理位置計算
            newPos.x = Math.max(safeMargin, Math.min(boardWidth - safeMargin, newPos.x));
            finalSlot = Math.floor((newPos.x / boardWidth) * (rows + 1));
            finalSlot = Math.max(0, Math.min(rows, finalSlot));
            console.log(`⚠️ [Physics End] No target, using physics position: ${finalSlot}`);
          }
          
          setTimeout(() => {
            onAnimationEnd?.(finalSlot);
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