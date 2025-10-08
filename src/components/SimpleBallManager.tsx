'use client';

import React from 'react';
import { BallState } from '@/types/game';
import SimpleBall from './SimpleBall';

interface SimpleBallManagerProps {
  balls: BallState[];
  boardWidth: number;
  boardHeight: number;
  rows: number;
  onBallLanded: (ballId: string, slotIndex: number) => void;
}

export function SimpleBallManager({
  balls,
  boardWidth,
  boardHeight,
  rows,
  onBallLanded
}: SimpleBallManagerProps) {
  
  const handleBallEnd = (ballId: string, finalSlot: number) => {
    console.log(`Simple ball ${ballId} landed in slot ${finalSlot}`);
    onBallLanded(ballId, finalSlot);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {balls.map(ball => {
        // 🎯 關鍵：從後台機率數據獲取目標槽位
        const targetSlot = ball.path && ball.path.length > 0 
          ? Math.round(ball.path[ball.path.length - 1]) // 路徑終點就是機率系統計算的目標
          : undefined;
          
        console.log(`🎯 [Manager] Ball ${ball.id} target slot: ${targetSlot} (from backend probability)`);
          
        return (
          <SimpleBall
            key={ball.id}
            ball={ball}
            boardWidth={boardWidth}
            boardHeight={boardHeight}
            rows={rows}
            targetSlot={targetSlot}
            onAnimationEnd={(finalSlot) => handleBallEnd(ball.id, finalSlot)}
          />
        );
      })}
    </div>
  );
}

export default SimpleBallManager;