'use client';

import React, { useEffect, useState, useRef } from 'react';
import { BallState } from '@/types/game';
import { calculateBallPosition, interpolatePath } from '@/utils/ballPhysics';

interface BallProps {
  ball: BallState;
  boardWidth: number;
  boardHeight: number;
  rows: number;
  onAnimationEnd?: () => void;
  onPositionChange?: (row: number, col: number) => void;
}

export default function Ball({
  ball,
  boardWidth,
  boardHeight,
  rows,
  onAnimationEnd,
  onPositionChange
}: BallProps) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);
  
  // 动画配置
  const animationDuration = 3000; // 3秒
  const ballSize = 16; // 增大彈珠尺寸
  
  useEffect(() => {
    console.log('Ball useEffect triggered:', ball.id, 'isActive:', ball.isActive, 'hasStarted:', hasStartedRef.current);
    
    if (!ball.isActive) {
      console.log('Ball not active, skipping animation');
      return;
    }
    
    if (hasStartedRef.current) {
      console.log('Animation already started, skipping');
      return;
    }
    
    // 延遲啟動動畫，避免被 React Strict Mode 的重複執行干擾
    const timeoutId = setTimeout(() => {
      if (!ball.isActive || hasStartedRef.current) return;
      
      hasStartedRef.current = true;
      setAnimationProgress(0);
      
      console.log('Starting ball animation with setInterval for:', ball.id);
      
      const startTime = Date.now();
      let frameCount = 0;
      
      intervalRef.current = setInterval(() => {
        frameCount++;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        console.log(`Frame ${frameCount}: Ball ${ball.id} progress: ${progress.toFixed(3)}, elapsed: ${elapsed}ms`);
        setAnimationProgress(progress);
        
        if (progress >= 1) {
          console.log(`Ball ${ball.id} animation completed after ${frameCount} frames`);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          hasStartedRef.current = false;
          onAnimationEnd?.();
        }
      }, 50);
    }, 100); // 延遲 100ms
    
    return () => {
      console.log('Cleanup for ball:', ball.id);
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // 重要：清理時不要重置 hasStartedRef，避免重複啟動
    };
  }, [ball.id]);
  
  // 重置狀態 - 暫時註解掉避免干擾
  // useEffect(() => {
  //   if (!ball.isActive) {
  //     hasStartedRef.current = false;
  //     setAnimationProgress(0);
  //   }
  // }, [ball.isActive]);
  
  // 计算当前球的屏幕位置
  const currentPos = interpolatePath(ball.path, animationProgress);
  const screenPos = calculateBallPosition(
    currentPos.row,
    currentPos.col,
    boardWidth,
    boardHeight,
    rows
  );
  
  // 強制位置更新測試
  if (animationProgress > 0) {
    console.log(`Ball ${ball.id}: progress=${animationProgress.toFixed(3)}, currentPos=(${currentPos.row.toFixed(2)}, ${currentPos.col.toFixed(2)}), screenPos=(${screenPos.x.toFixed(1)}, ${screenPos.y.toFixed(1)})`);
  }
  
  // 计算球的旋转角度
  const rotationAngle = animationProgress * 360 * 4;
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: screenPos.x - ballSize / 2,
        top: screenPos.y - ballSize / 2,
        width: ballSize,
        height: ballSize,
        zIndex: 10,
        filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
        opacity: ball.isActive ? 1 : 0,
        // 移除 transition，避免干擾位置更新
        transform: `translate3d(0, 0, 0)` // 強制硬件加速
      }}
    >
      {/* 彈珠 */}
      <div
        className="w-full h-full rounded-full relative overflow-hidden"
        style={{
          transform: `rotate(${rotationAngle}deg)`,
          background: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.8) 8%, transparent 15%),
            radial-gradient(circle at 70% 70%, rgba(0,0,0,0.1) 20%, transparent 30%),
            linear-gradient(135deg, 
              #ff6b6b 0%, 
              #ee5a52 25%, 
              #ff8787 50%, 
              #ff6b6b 75%, 
              #e55555 100%
            )
          `,
          boxShadow: `
            inset 2px 2px 8px rgba(255,255,255,0.6),
            inset -2px -2px 8px rgba(0,0,0,0.3),
            0 4px 12px rgba(0,0,0,0.4),
            0 2px 6px rgba(0,0,0,0.2)
          `,
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        {/* 主要高光 - 彈珠特有的反射 */}
        <div
          className="absolute top-1 left-1 w-2.5 h-2.5 bg-white rounded-full opacity-90"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 50%, transparent 80%)',
            filter: 'blur(0.5px)'
          }}
        />
        
        {/* 次要反射光 */}
        <div
          className="absolute top-2.5 right-1.5 w-1 h-1 bg-white rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)'
          }}
        />
        
        {/* 彈珠內部紋理 */}
        <div
          className="absolute inset-0.5 rounded-full opacity-30"
          style={{
            background: `
              radial-gradient(circle at 40% 40%, rgba(255,255,255,0.3) 0%, transparent 50%),
              conic-gradient(from 45deg, 
                rgba(255,255,255,0.1) 0%, 
                transparent 25%, 
                rgba(255,255,255,0.1) 50%, 
                transparent 75%, 
                rgba(255,255,255,0.1) 100%
              )
            `
          }}
        />
      </div>
      
      {/* 轨迹效果 - 更微妙 */}
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, rgba(253, 224, 71, 0.6) 0%, transparent 70%)`,
          animation: animationProgress > 0 ? 'pulse 0.8s ease-out' : 'none'
        }}
      />
    </div>
  );
}

// 缓动函数 - 模拟重力加速度
function easeInOutQuad(t: number): number {
  // 开始慢，中间快，结束时稍微减速
  if (t < 0.1) {
    return 0.5 * t * t / 0.01; // 慢启动
  } else if (t < 0.9) {
    return 0.05 + 0.85 * (t - 0.1) / 0.8; // 匀速段
  } else {
    const remainingT = (t - 0.9) / 0.1;
    return 0.9 + 0.1 * (2 * remainingT - remainingT * remainingT); // 轻微减速
  }
}

// 球管理器组件
interface BallManagerProps {
  balls: BallState[];
  boardWidth: number;
  boardHeight: number;
  rows: number;
  onBallLanded: (ballId: string, slotIndex: number) => void;
}

export function BallManager({
  balls,
  boardWidth,
  boardHeight,
  rows,
  onBallLanded
}: BallManagerProps) {
  const handleAnimationEnd = (ballId: string) => {
    const ball = balls.find(b => b.id === ballId);
    if (ball) {
      // 计算最终槽位 - 使用更精確的四捨五入
      const finalPosition = ball.path[ball.path.length - 1];
      const slotIndex = Math.round(finalPosition);
      
      console.log(`[DEBUG] Ball ${ballId} landed at position ${finalPosition}, calculated slot: ${slotIndex}`);
      
      onBallLanded(ballId, slotIndex);
    }
  };

  // 移除過多的日誌
  
  return (
    <>
      {balls.map(ball => (
        <Ball
          key={ball.id}
          ball={ball}
          boardWidth={boardWidth}
          boardHeight={boardHeight}
          rows={rows}
          onAnimationEnd={() => handleAnimationEnd(ball.id)}
        />
      ))}
    </>
  );
}

// 多球效果组件
interface MultiBallProps {
  ballCount: number;
  boardWidth: number;
  boardHeight: number;
  rows: number;
  onAllBallsLanded?: () => void;
}

export function MultiBall({
  ballCount,
  boardWidth,
  boardHeight,
  rows,
  onAllBallsLanded
}: MultiBallProps) {
  const [activeBalls, setActiveBalls] = useState<number>(ballCount);
  
  const handleBallEnd = () => {
    setActiveBalls(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        onAllBallsLanded?.();
      }
      return newCount;
    });
  };
  
  return (
    <div className="absolute inset-0">
      {Array.from({ length: ballCount }, (_, index) => {
        // 为每个球生成不同的路径和延迟
        const ball: BallState = {
          id: `multi-${index}`,
          currentRow: 0,
          currentCol: rows / 2,
          path: [], // 需要在使用时生成
          isActive: true,
          startTime: Date.now() + index * 100 // 100ms延迟
        };
        
        return (
          <Ball
            key={ball.id}
            ball={ball}
            boardWidth={boardWidth}
            boardHeight={boardHeight}
            rows={rows}
            onAnimationEnd={handleBallEnd}
          />
        );
      })}
    </div>
  );
}

// 球轨迹预览组件
export function BallTrailPreview({
  path,
  boardWidth,
  boardHeight,
  rows,
  opacity = 0.5
}: {
  path: number[];
  boardWidth: number;
  boardHeight: number;
  rows: number;
  opacity?: number;
}) {
  const points = path.map((col, row) => {
    const pos = calculateBallPosition(row, col, boardWidth, boardHeight, rows);
    return { x: pos.x, y: pos.y };
  });
  
  return (
    <svg 
      className="absolute inset-0 pointer-events-none"
      width={boardWidth} 
      height={boardHeight}
      style={{ opacity }}
    >
      {/* 连接线 */}
      <polyline
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeDasharray="4,2"
      />
      
      {/* 路径点 */}
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="3"
          fill="#fbbf24"
          opacity={0.7}
        />
      ))}
    </svg>
  );
}