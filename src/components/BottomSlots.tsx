'use client';

import React from 'react';
import { useGameConfig } from '@/contexts/GameContext';
import { PAYOUT_MULTIPLIERS, getMultiplierColor, getMultiplierGradient } from '@/types/game';

interface BottomSlotsProps {
  width: number;
  height?: number;
  highlightedSlot?: number; // 高亮显示哪个槽位
}

export default function BottomSlots({ 
  width, 
  height = 60, 
  highlightedSlot 
}: BottomSlotsProps) {
  const { config } = useGameConfig();
  const multipliers = PAYOUT_MULTIPLIERS[config.rows] || [];
  const slotCount = config.rows + 1;
  const slotWidth = width / slotCount;

  return (
    <div 
      className="relative bg-slate-800/95 overflow-hidden"
      style={{ width, height: height }}
    >
      {/* 槽位容器 */}
      <div className="flex h-full items-center justify-center gap-px">
        {Array.from({ length: slotCount }, (_, index) => {
          const multiplier = multipliers[index] || 1;
          const isHighlighted = highlightedSlot === index;
          const bgColor = getMultiplierColor(multiplier);
          const gradientColor = getMultiplierGradient(multiplier);
          
          return (
            <div
              key={index}
              className={`
                flex-1 flex items-center justify-center
                relative transition-all duration-300
                ${isHighlighted ? 'transform scale-110 z-20' : 'hover:scale-105'}
              `}
              style={{ 
                minHeight: height - 4,
                maxWidth: `${slotWidth - 2}px`
              }}
            >
              {/* 倍率显示 */}
              <div 
                className={`
                  w-full h-full relative cursor-help text-center font-bold text-white
                  flex items-center justify-center transition-all duration-300
                  ${isHighlighted ? 'animate-pulse z-20' : 'hover:scale-105'}
                `}
                style={{ 
                  background: gradientColor,
                  borderRadius: '0.3em',
                  fontSize: multiplier >= 100 ? '10px' : multiplier >= 10 ? '11px' : '12px',
                  boxShadow: isHighlighted 
                    ? `0 0.2em 0 0 ${bgColor}, 0 0 20px ${bgColor}80, 0 0 40px ${bgColor}40`
                    : `0 0.2em 0 0 ${bgColor}aa`,
                  animationTimingFunction: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                  animationDuration: isHighlighted ? '0.3s' : undefined,
                  transform: isHighlighted ? 'translateY(-2px)' : 'translateY(0)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                {multiplier}x
              </div>
              
              {/* 高亮效果 */}
              {isHighlighted && (
                <>
                  {/* 外围发光 */}
                  <div 
                    className="absolute inset-0 animate-pulse"
                    style={{ 
                      borderRadius: '0.3em',
                      background: `radial-gradient(ellipse, ${bgColor}60 0%, transparent 70%)`,
                      transform: 'scale(1.2)',
                      zIndex: -1
                    }}
                  />
                  
                  {/* 边框高亮 */}
                  <div 
                    className="absolute inset-0 border animate-ping"
                    style={{ 
                      borderRadius: '0.3em',
                      borderColor: bgColor,
                      borderWidth: '2px',
                      animationDuration: '1s'
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      
    </div>
  );
}

// 单个槽位组件
export function SlotItem({ 
  index, 
  multiplier, 
  isHighlighted = false, 
  onClick 
}: {
  index: number;
  multiplier: number;
  isHighlighted?: boolean;
  onClick?: () => void;
}) {
  const bgColor = getMultiplierColor(multiplier);
  
  return (
    <div
      className={`
        relative cursor-pointer transition-all duration-200
        flex flex-col items-center justify-center
        border border-slate-500 rounded
        ${isHighlighted ? 'transform scale-110 z-10' : 'hover:scale-105'}
      `}
      style={{ 
        backgroundColor: bgColor,
        opacity: isHighlighted ? 1 : 0.8
      }}
      onClick={onClick}
    >
      {/* 倍率显示 */}
      <div className="text-white font-bold text-sm">
        {multiplier}x
      </div>
      
      {/* 槽位编号 */}
      <div className="text-white/70 text-xs">
        #{index + 1}
      </div>
      
      {/* 高亮效果 */}
      {isHighlighted && (
        <div className="absolute inset-0 bg-white/20 rounded animate-pulse" />
      )}
    </div>
  );
}

// 倍率说明组件
export function MultiplierLegend() {
  const colorRanges = [
    { min: 10, color: '#ff4444', label: '极高倍率 (10x+)' },
    { min: 5, color: '#ff6600', label: '高倍率 (5x-10x)' },
    { min: 2, color: '#ffaa00', label: '中高倍率 (2x-5x)' },
    { min: 1, color: '#00aa00', label: '基础倍率 (1x-2x)' },
    { min: 0, color: '#666666', label: '低倍率 (<1x)' }
  ];

  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold mb-3">倍率说明</h3>
      <div className="space-y-2">
        {colorRanges.map((range, index) => (
          <div key={index} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: range.color }}
            />
            <span className="text-slate-300 text-sm">{range.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 槽位统计组件
export function SlotStats({ 
  results, 
  rows 
}: { 
  results: Array<{ slotIndex: number; fakePayout: number }>;
  rows: number;
}) {
  const slotCount = rows + 1;
  const slotCounts = Array(slotCount).fill(0);
  
  // 统计每个槽位的落球次数
  results.forEach(result => {
    if (result.slotIndex >= 0 && result.slotIndex < slotCount) {
      slotCounts[result.slotIndex]++;
    }
  });
  
  const maxCount = Math.max(...slotCounts, 1);
  
  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold mb-3">落球统计</h3>
      
      <div className="space-y-2">
        {slotCounts.map((count, index) => {
          const percentage = results.length > 0 ? (count / results.length) * 100 : 0;
          const barWidth = (count / maxCount) * 100;
          
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 text-slate-300 text-sm">#{index + 1}</div>
              
              <div className="flex-1 bg-slate-700 rounded-full h-4 relative">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
                  {count}
                </div>
              </div>
              
              <div className="w-12 text-slate-400 text-xs text-right">
                {percentage.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 text-slate-400 text-sm">
        总计: {results.length} 次投球
      </div>
    </div>
  );
}