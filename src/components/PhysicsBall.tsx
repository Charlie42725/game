'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BallState } from '@/types/game';
import {
  BallPhysicsState,
  CollisionPoint,
  generatePegs,
  createInitialBallState,
  updateBallPhysics,
  calculateFinalSlot
} from '@/utils/physicsEngine';
import CollisionEffects from './CollisionEffects';

interface PhysicsBallProps {
  ball: BallState;
  boardWidth: number;
  boardHeight: number;
  rows: number;
  onAnimationEnd?: (finalSlot: number) => void;
  onPositionChange?: (row: number, col: number) => void;
}

const PhysicsBall: React.FC<PhysicsBallProps> = ({
  ball,
  boardWidth,
  boardHeight,
  rows,
  onAnimationEnd,
  onPositionChange
}) => {
  const [ballState, setBallState] = useState<BallPhysicsState | null>(null);
  const [collisions, setCollisions] = useState<CollisionPoint[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);
  
  console.log(`[PhysicsBall] Rendering ball ${ball.id}, active: ${ball.isActive}, ballState exists: ${!!ballState}`);
  
  const animationRef = useRef<number | null>(null);
  const pegsRef = useRef(generatePegs(rows, boardWidth, boardHeight));
  const lastTimeRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);

  // 添加碰撞點的回調函數
  const addCollisionPoint = useCallback((point: CollisionPoint) => {
    setCollisions(prev => [...prev, point]);
    
    // 播放碰撞音效 - 使用Web Audio API創建更好的音效
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 創建一個短促的碰撞聲
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 設置頻率和音量
      oscillator.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.type = 'sine';
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
      
    } catch (error) {
      // 如果Web Audio API不可用，回退到HTML5 Audio
      console.log('Web Audio API not available, skipping sound');
    }
  }, []);

  // 移除完成的碰撞效果
  const handleEffectComplete = useCallback((id: string) => {
    setCollisions(prev => prev.filter(collision => collision.id !== id));
  }, []);

  // 初始化球狀態
  useEffect(() => {
    if (!ball.isActive || hasStartedRef.current) return;
    
    hasStartedRef.current = true;
    pegsRef.current = generatePegs(rows, boardWidth, boardHeight);
    
    const startX = boardWidth / 2;
    const startY = 20; // 從頂部稍微下方開始
    
    // 根據ball.path計算目標槽位
    const finalPosition = ball.path[ball.path.length - 1];
    const targetSlot = Math.round(finalPosition);
    
    console.log(`[Physics] Ball ${ball.id} targeting slot ${targetSlot} from path:`, ball.path);
    
    const initialBallState = createInitialBallState(startX, startY);
    
    // 添加初始引導力朝向目標槽位
    const targetX = (targetSlot + 0.5) * (boardWidth / (rows + 1));
    const directionBias = (targetX - startX) / boardWidth;
    initialBallState.vx = directionBias * 2; // 增加初始引導力
    
    setBallState(initialBallState);
    setIsAnimating(true);
    setCurrentRow(0);
    
    // 清除之前的碰撞效果
    setCollisions([]);
  }, [ball.isActive, ball.id, ball.path, rows, boardWidth, boardHeight]);

  // 物理動畫循環
  useEffect(() => {
    if (!isAnimating || !ballState) return;

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.02); // 限制最大時間步長
      lastTimeRef.current = currentTime;

        setBallState(prevState => {
          if (!prevState) return null;

          const newState = { ...prevState };
          
          // 計算目標槽位和引導力
          const finalPosition = ball.path[ball.path.length - 1];
          const targetSlot = Math.round(finalPosition);
          const targetX = (targetSlot + 0.5) * (boardWidth / (rows + 1));
          
          // 添加朝向目標的輕微引導力
          const currentDistanceToTarget = targetX - newState.x;
          const guidanceForce = currentDistanceToTarget * 0.001; // 很小的引導力
          newState.vx += guidanceForce;
          
          // 更新物理狀態
          updateBallPhysics(
            newState,
            pegsRef.current,
            deltaTime,
            boardWidth,
            boardHeight,
            addCollisionPoint
          );

          // 計算當前行數（用於回調）
          const newRow = Math.floor((newState.y / boardHeight) * (rows + 1));
          if (newRow !== currentRow) {
            setCurrentRow(newRow);
            const col = (newState.x / boardWidth) * (rows + 1);
            onPositionChange?.(newRow, col);
          }

          // 檢查是否到達底部
          if (newState.y >= boardHeight - newState.radius) {
            setIsAnimating(false);
            
            // 使用預定的槽位而不是物理計算的槽位，確保機率準確
            const finalSlot = targetSlot;
            console.log(`[Physics] Ball landed: physics=${calculateFinalSlot(newState.x, boardWidth, rows)}, predetermined=${finalSlot}, using predetermined`);
            
            setTimeout(() => {
              onAnimationEnd?.(finalSlot);
            }, 200); // 稍微延遲以顯示完整的落地效果
            
            return newState;
          }

          return newState;
        });      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, ballState, boardWidth, boardHeight, rows, currentRow, onPositionChange, onAnimationEnd, addCollisionPoint]);

  // 清理函數
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!ballState) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 碰撞效果 */}
      <CollisionEffects 
        collisions={collisions} 
        onEffectComplete={handleEffectComplete}
      />
      
      {/* 球本身 */}
      <div
        className="absolute z-20 transition-none"
        style={{
          left: ballState.x - ballState.radius,
          top: ballState.y - ballState.radius,
          width: ballState.radius * 2,
          height: ballState.radius * 2,
        }}
      >
        {/* 球的主體 */}
        <div 
          className="physics-ball w-full h-full rounded-full relative overflow-hidden shadow-lg"
          style={{
            background: `radial-gradient(circle at 30% 30%, 
              #ffffff 0%, 
              #ff6b9d 30%, 
              #c44569 60%, 
              #8b3a62 100%)`,
            boxShadow: `
              0 4px 15px rgba(255, 107, 157, 0.4),
              0 2px 10px rgba(0,0,0,0.3),
              inset -2px -2px 6px rgba(0,0,0,0.2),
              inset 2px 2px 6px rgba(255,255,255,0.3)
            `
          }}
        >
          {/* 球的高光 */}
          <div 
            className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-70"
            style={{
              filter: 'blur(0.5px)'
            }}
          />
          
          {/* 球的反射 */}
          <div 
            className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-white rounded-full opacity-40"
          />
        </div>
        
        {/* 球的拖尾效果 */}
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, 
              rgba(255, 107, 157, 0.6) 0%, 
              transparent 70%)`,
            transform: `scale(${1 + Math.abs(ballState.vy) * 0.1})`,
            filter: 'blur(1px)'
          }}
        />
      </div>

      {/* 釘子顯示（總是顯示，不僅僅在開發模式） */}
      {pegsRef.current.map((peg, index) => {
        // 檢查這個釘子是否最近有碰撞
        const recentCollision = collisions.find(
          collision => 
            Math.abs(collision.x - peg.x) < 15 && 
            Math.abs(collision.y - peg.y) < 15 &&
            Date.now() - collision.timestamp < 300 // 300ms內的碰撞
        );
        
        return (
          <div
            key={index}
            className={`absolute rounded-full border-2 shadow-lg transition-all duration-200 ${
              recentCollision ? 'peg-glow active bg-white border-white' : 'bg-gray-400 border-gray-300'
            }`}
            style={{
              left: peg.x - peg.radius,
              top: peg.y - peg.radius,
              width: peg.radius * 2,
              height: peg.radius * 2,
              boxShadow: recentCollision 
                ? '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4)' 
                : '0 2px 6px rgba(0,0,0,0.2)'
            }}
          />
        );
      })}
    </div>
  );
};

export default PhysicsBall;