'use client';

import React, { useEffect, useState } from 'react';
import { CollisionPoint } from '@/utils/physicsEngine';

interface CollisionEffectsProps {
  collisions: CollisionPoint[];
  onEffectComplete?: (id: string) => void;
}

interface ActiveEffect {
  collision: CollisionPoint;
  opacity: number;
  scale: number;
  startTime: number;
}

const CollisionEffects: React.FC<CollisionEffectsProps> = ({
  collisions,
  onEffectComplete
}) => {
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);

  useEffect(() => {
    // 為新的碰撞點添加效果
    const newEffects = collisions
      .filter(collision => 
        !activeEffects.find(effect => effect.collision.id === collision.id)
      )
      .map(collision => ({
        collision,
        opacity: 1,
        scale: 0.1,
        startTime: Date.now()
      }));

    if (newEffects.length > 0) {
      setActiveEffects(prev => [...prev, ...newEffects]);
    }
  }, [collisions]);

  useEffect(() => {
    const animationInterval = setInterval(() => {
      setActiveEffects(prevEffects => {
        const currentTime = Date.now();
        const updatedEffects: ActiveEffect[] = [];

        prevEffects.forEach(effect => {
          const elapsed = currentTime - effect.startTime;
          const duration = 800; // 效果持續時間 (毫秒)
          const progress = elapsed / duration;

          if (progress < 1) {
            // 更新動畫屬性
            const easeOut = 1 - Math.pow(1 - progress, 3);
            updatedEffects.push({
              ...effect,
              opacity: Math.max(0, 1 - progress * 1.2),
              scale: 0.1 + easeOut * 1.5
            });
          } else {
            // 效果完成，通知父組件
            onEffectComplete?.(effect.collision.id);
          }
        });

        return updatedEffects;
      });
    }, 16); // ~60fps

    return () => clearInterval(animationInterval);
  }, [onEffectComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {activeEffects.map(effect => (
        <div
          key={effect.collision.id}
          className="absolute"
          style={{
            left: effect.collision.x - 25,
            top: effect.collision.y - 25,
            width: 50,
            height: 50,
            transform: `scale(${effect.scale})`,
            opacity: effect.opacity,
            transition: 'none' // 禁用CSS過渡，使用JS動畫
          }}
        >
          {/* 主要光暈 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, 
                rgba(255, 255, 255, ${effect.opacity * 0.8}) 0%, 
                rgba(255, 255, 255, ${effect.opacity * 0.6}) 30%, 
                rgba(255, 255, 255, ${effect.opacity * 0.3}) 60%, 
                transparent 100%)`
            }}
          />
          
          {/* 內部亮點 */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white"
            style={{
              opacity: effect.opacity * 1.2,
              boxShadow: `0 0 ${10 * effect.scale}px rgba(255, 255, 255, ${effect.opacity})`
            }}
          />
          
          {/* 外部發光環 */}
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: `rgba(255, 255, 255, ${effect.opacity * 0.4})`,
              animation: 'none' // 禁用默認動畫
            }}
          />
          
          {/* 粒子效果 */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: `
                  translate(-50%, -50%) 
                  rotate(${i * 60}deg) 
                  translateY(-${15 + effect.scale * 10}px)
                `,
                opacity: effect.opacity * 0.6,
                boxShadow: `0 0 ${3 * effect.scale}px rgba(255, 255, 255, ${effect.opacity * 0.8})`
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default CollisionEffects;