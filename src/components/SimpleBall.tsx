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

  // 處理碰撞 - 帶有機率傾向的自然反彈
  const handleCollision = (ballState: SimpleBallState, peg: Peg) => {
    const dx = ballState.x - peg.x;
    const dy = ballState.y - peg.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    // 正規化碰撞向量
    const nx = dx / distance;
    const ny = dy / distance;
    
    // 分離球和釘子
    const overlap = (12 + 3) - distance;
    ballState.x += nx * overlap * 0.8;
    ballState.y += ny * overlap * 0.8;
    
    // 計算基本反彈速度
    const dotProduct = ballState.vx * nx + ballState.vy * ny;
    ballState.vx -= 2 * dotProduct * nx * 0.8; // 🚀 提高彈性，減少速度損失
    ballState.vy -= 2 * dotProduct * ny * 0.8;
    
    // 🎯 機率影響的微妙偏向 - 讓碰撞有輕微的方向性偏好
    if (targetSlot !== undefined) {
      const slotWidth = boardWidth / (rows + 1);
      const targetX = slotWidth * (targetSlot + 0.5);
      const distanceToTarget = targetX - ballState.x;
      const progressToBottom = Math.min(1, ballState.y / (boardHeight * 0.8));
      
      // 只在中後期有輕微影響，且影響很小
      if (progressToBottom > 0.4 && Math.abs(distanceToTarget) > 30) {
        const bias = Math.sign(distanceToTarget) * 0.5 * progressToBottom;
        ballState.vx += bias;
      }
    }
    
    // 🚀🚀 提高速度限制，讓球可以更快移動
    const maxHorizontalSpeed = 12;
    if (Math.abs(ballState.vx) > maxHorizontalSpeed) {
      ballState.vx = ballState.vx > 0 ? maxHorizontalSpeed : -maxHorizontalSpeed;
    }
    
    // 自然隨機性 - 增加一點動態性
    ballState.vx += (Math.random() - 0.5) * 2;
    ballState.vy += (Math.random() - 0.5) * 1;
  };

  // 初始化球
  useEffect(() => {
    if (!ball.isActive) return;
    
    console.log(`[Physics] Initializing ball ${ball.id} with target slot: ${targetSlot}`);
    
    setBallPos({
      x: boardWidth / 2,
      y: 20,
      vx: (Math.random() - 0.5) * 4, // 隨機初始x速度
      vy: 10 // 🚀🚀 大幅增加初始向下速度
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

      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.008); // 🚀🚀 提高到120fps，更流暢更快
      lastTimeRef.current = currentTime;

      setBallPos(prevPos => {
        if (!prevPos) return null;

        const newPos = { ...prevPos };
        
        // 重力
        newPos.vy += 50 * deltaTime; // 🚀🚀 大幅提高重力，超快掉落
        
        // 自然路徑引導 - 影響碰撞結果而不是強制拖拽
        if (targetSlot !== undefined) {
          const slotWidth = boardWidth / (rows + 1);
          const targetX = slotWidth * (targetSlot + 0.5);
          const distanceToTarget = targetX - newPos.x;
          
          // 漸進式微調 - 只在接近釘子時輕微影響
          const progressToBottom = Math.min(1, newPos.y / (boardHeight * 0.85));
          
          // 檢查是否即將碰撞釘子
          let nearPeg = false;
          for (const peg of pegs) {
            const dx = newPos.x - peg.x;
            const dy = newPos.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 25) { // 接近釘子範圍
              nearPeg = true;
              break;
            }
          }
          
          // 只在特定情況下輕微調整
          if (nearPeg && Math.abs(distanceToTarget) > 20 && progressToBottom > 0.3) {
            // 微小的方向性偏好 - 不是強制力，而是輕微的傾向
            const subtleInfluence = Math.sign(distanceToTarget) * 0.15 * progressToBottom;
            newPos.vx += subtleInfluence;
            
            // 調試信息
            if (Math.random() < 0.01) {
              console.log(`🎱 [Subtle] Near peg, target: ${targetSlot}, influence: ${subtleInfluence.toFixed(3)}`);
            }
          }
        }
        
        // 阻力 - 幾乎沒有阻力
        newPos.vx *= 0.9999; // 🚀🚀 幾乎沒有x阻力
        newPos.vy *= 0.9999; // 🚀🚀 幾乎沒有y阻力
        
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
        
        // 最終階段的自然引導
        if (targetSlot !== undefined && newPos.y > boardHeight * 0.85) {
          const slotWidth = boardWidth / (rows + 1);
          const targetX = slotWidth * (targetSlot + 0.5);
          const distanceToTarget = targetX - newPos.x;
          
          // 最後階段的溫和引導 - 看起來像自然的軌跡調整
          if (Math.abs(distanceToTarget) > 25) {
            const gentleForce = Math.sign(distanceToTarget) * 1.5; // 🚀🚀 增加引導力
            newPos.vx += gentleForce;
            
            // 🚀🚀 保持更多垂直速度
            newPos.vy *= 0.99;
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
          // � 智能結果判定：結合物理位置和機率目標
          let finalSlot: number;
          
          // 計算物理位置對應的槽位
          newPos.x = Math.max(safeMargin, Math.min(boardWidth - safeMargin, newPos.x));
          const physicsSlot = Math.floor((newPos.x / boardWidth) * (rows + 1));
          const clampedPhysicsSlot = Math.max(0, Math.min(rows, physicsSlot));
          
          if (targetSlot !== undefined) {
            // 如果物理位置接近目標，使用目標
            const slotDifference = Math.abs(clampedPhysicsSlot - targetSlot);
            if (slotDifference <= 1) {
              // 物理位置合理，使用目標槽位
              finalSlot = targetSlot;
              console.log(`🎯 [Natural] Physics slot ${clampedPhysicsSlot} close to target ${targetSlot}, using target`);
            } else {
              // 物理位置偏差較大，需要微調
              const progressToBottom = Math.min(1, newPos.y / boardHeight);
              if (progressToBottom > 0.9) {
                // 最底部：優先使用目標
                finalSlot = targetSlot;
                console.log(`🎯 [Override] Bottom area, forcing target ${targetSlot} (was physics ${clampedPhysicsSlot})`);
              } else {
                // 其他情況：使用物理位置但記錄偏差
                finalSlot = clampedPhysicsSlot;
                console.log(`⚠️ [Physics] Using physics slot ${clampedPhysicsSlot} (target was ${targetSlot})`);
              }
            }
          } else {
            finalSlot = clampedPhysicsSlot;
            console.log(`📍 [Physics] No target, using physics slot: ${finalSlot}`);
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