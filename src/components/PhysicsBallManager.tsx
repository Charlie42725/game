'use client';

import React from 'react';
import { BallState } from '@/types/game';
import PhysicsBall from './PhysicsBall';

interface PhysicsBallManagerProps {
  balls: BallState[];
  boardWidth: number;
  boardHeight: number;
  rows: number;
  onBallLanded: (ballId: string, slotIndex: number) => void;
}

export function PhysicsBallManager({
  balls,
  boardWidth,
  boardHeight,
  rows,
  onBallLanded
}: PhysicsBallManagerProps) {
  
  const handlePhysicsAnimationEnd = (ballId: string, finalSlot: number) => {
    console.log(`[DEBUG] Physics ball ${ballId} landed in slot ${finalSlot}`);
    onBallLanded(ballId, finalSlot);
  };

  const handlePositionChange = (ballId: string, row: number, col: number) => {
    // 可以在這裡添加位置變化的回調邏輯
    // console.log(`Ball ${ballId} at row ${row}, col ${col}`);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {balls.map(ball => (
        <PhysicsBall
          key={ball.id}
          ball={ball}
          boardWidth={boardWidth}
          boardHeight={boardHeight}
          rows={rows}
          onAnimationEnd={(finalSlot) => handlePhysicsAnimationEnd(ball.id, finalSlot)}
          onPositionChange={(row, col) => handlePositionChange(ball.id, row, col)}
        />
      ))}
    </div>
  );
}

export default PhysicsBallManager;