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
      {balls.map(ball => (
        <SimpleBall
          key={ball.id}
          ball={ball}
          boardWidth={boardWidth}
          boardHeight={boardHeight}
          rows={rows}
          onAnimationEnd={(finalSlot) => handleBallEnd(ball.id, finalSlot)}
        />
      ))}
    </div>
  );
}

export default SimpleBallManager;