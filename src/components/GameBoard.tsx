'use client';

import React, { useRef, useEffect } from 'react';
import { useGameConfig } from '@/contexts/GameContext';
import { getPegPositions, PegPosition } from '@/utils/ballPhysics';

interface GameBoardProps {
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

export default function GameBoard({ 
  width = 600, 
  height = 800, 
  children 
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { config } = useGameConfig();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置画布尺寸
    canvas.width = width;
    canvas.height = height;
    
    // 清空画布
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, width, height);
    
    // 绘制钉子
    drawPegs(ctx, config.rows, width, height);
    
    // 绘制边界线
    drawBoundaries(ctx, config.rows, width, height);
    
  }, [config.rows, width, height]);
  
  const drawPegs = (
    ctx: CanvasRenderingContext2D, 
    rows: number, 
    boardWidth: number, 
    boardHeight: number
  ) => {
    const pegPositions = getPegPositions(rows, boardWidth, boardHeight);
    const pegRadius = 3;
    
    pegPositions.forEach(peg => {
      // 绘制钉子阴影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(peg.x + 1, peg.y + 1, pegRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制钉子主体
      ctx.fillStyle = '#f8fafc'; // 更亮的白色
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制钉子边框
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      
      // 绘制高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(peg.x - 1, peg.y - 1, pegRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  
  const drawBoundaries = (
    ctx: CanvasRenderingContext2D,
    rows: number,
    boardWidth: number,
    boardHeight: number
  ) => {
    const rowHeight = boardHeight / (rows + 1);
    const colWidth = boardWidth / (rows + 1);
    
    ctx.strokeStyle = '#475569'; // slate-600
    ctx.lineWidth = 2;
    
    // 绘制左右边界
    ctx.beginPath();
    ctx.moveTo(colWidth * 0.5, 0);
    ctx.lineTo(colWidth * 0.5, boardHeight - rowHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(colWidth * (rows + 0.5), 0);
    ctx.lineTo(colWidth * (rows + 0.5), boardHeight - rowHeight);
    ctx.stroke();
  };
  
  return (
    <div 
      className="relative bg-slate-800 rounded-lg overflow-hidden shadow-lg"
      style={{ width, height }}
    >
      {/* 背景画布 - 钉子和边界 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width, height }}
      />
      
      {/* 动态内容层 - 球和动画 */}
      <div className="absolute inset-0">
        {children}
      </div>
      
      {/* 顶部投球区域指示器 */}
      <div 
        className="absolute bg-green-400 rounded-full animate-pulse"
        style={{
          left: '50%',
          top: '10px',
          transform: 'translateX(-50%)',
          width: '8px',
          height: '8px',
          boxShadow: '0 0 10px #4ade80'
        }}
      />
      
      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
          Rows: {config.rows}
        </div>
      )}
    </div>
  );
}

// 钉子组件 (可选，用于更详细的渲染)
export function Peg({ x, y, size = 8 }: { x: number; y: number; size?: number }) {
  return (
    <div
      className="absolute bg-slate-100 border border-slate-300 rounded-full"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
      }}
    />
  );
}

// 路径显示组件 (用于调试)
export function PathDisplay({ 
  path, 
  boardWidth, 
  boardHeight, 
  rows 
}: { 
  path: number[]; 
  boardWidth: number; 
  boardHeight: number; 
  rows: number; 
}) {
  const rowHeight = boardHeight / (rows + 1);
  const colWidth = boardWidth / (rows + 1);
  
  return (
    <svg 
      className="absolute inset-0 pointer-events-none"
      width={boardWidth} 
      height={boardHeight}
    >
      <polyline
        points={path.map((col, row) => {
          const x = col * colWidth + colWidth / 2;
          const y = row * rowHeight + rowHeight / 2;
          return `${x},${y}`;
        }).join(' ')}
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
        strokeDasharray="4,4"
        opacity="0.7"
      />
      
      {/* 路径点 */}
      {path.map((col, row) => {
        const x = col * colWidth + colWidth / 2;
        const y = row * rowHeight + rowHeight / 2;
        return (
          <circle
            key={row}
            cx={x}
            cy={y}
            r="3"
            fill="#ef4444"
            opacity="0.8"
          />
        );
      })}
    </svg>
  );
}