'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GameProvider } from '@/contexts/GameContext';
import { useBalls, useGameConfig, useGameHistory, useGameState } from '@/contexts/GameContext';
import { generateBallPath } from '@/utils/ballPhysics';
import { calculateBallDrop } from '@/utils/probabilityEngine';
import { calculateGameResult } from '@/utils/gameLogic';
import { useAutoBet } from '@/utils/autoBet';
import { BallState, GameResult } from '@/types/game';

import ControlPanel from '@/components/ControlPanel';
import GameBoard from '@/components/GameBoard';
import BottomSlots from '@/components/BottomSlots';
import { BallManager } from '@/components/Ball';
import GameHistory from '@/components/GameHistory';

// 游戏主组件
function PlinkoGame() {
  const { config } = useGameConfig();
  const { gameState, setGameState, canBet } = useGameState();
  const { balls, addBall, removeBall } = useBalls();
  
  // 移除調試日誌
  const { addResult } = useGameHistory();
  const { startAutoBet, stopAutoBet, isAutoBetting } = useAutoBet();
  
  const [highlightedSlot, setHighlightedSlot] = useState<number | undefined>();
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [pendingResults, setPendingResults] = useState<Map<string, (result: GameResult) => void>>(new Map());
  
  // 游戏板尺寸 - 调整比例让它更接近参考图片
  const boardWidth = 580;
  const boardHeight = 650;

  // 控制紀錄抽屜顯示
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  
  // 执行单次投注
  const executeSingleBet = useCallback(async (): Promise<GameResult> => {
    return new Promise((resolve) => {
      if (!canBet() && !isAutoBetting) {
        throw new Error('Cannot bet at this time');
      }
      
      setGameState('dropping');
      
      // 使用新的機率系統生成球的路径和結果
      const ballDrop = calculateBallDrop(config.rows, config.risk);
      
      console.log('Ball drop calculated:', ballDrop);
      
      // 创建新球
      const ball: BallState = {
        id: `ball-${Date.now()}-${Math.random()}`,
        currentRow: 0,
        currentCol: ballDrop.path[0], // 使用路径的第一个位置
        path: ballDrop.path,
        isActive: true,
        startTime: Date.now()
      };
      
      // 球創建成功
      addBall(ball);
      
      // 存储resolve回调
      setPendingResults(prev => new Map(prev).set(ball.id, resolve));
    });
  }, [config, canBet, isAutoBetting, setGameState, addBall]);
  
  // 处理投注按钮点击
  const handleBetClick = useCallback(async () => {
    if (!canBet()) return;
    
    try {
      await executeSingleBet();
    } catch (error) {
      console.error('Bet failed:', error);
      setGameState('idle');
    }
  }, [canBet, executeSingleBet, setGameState]);
  
  // 处理自动投注
  const handleAutoBetStart = useCallback(async () => {
    if (!config.autoBetConfig) return;
    
    try {
      await startAutoBet(config.autoBetConfig, executeSingleBet);
    } catch (error) {
      console.error('Auto bet failed:', error);
      stopAutoBet();
    }
  }, [config.autoBetConfig, startAutoBet, stopAutoBet, executeSingleBet]);
  
  // 球落地处理
  const handleBallLanded = useCallback((ballId: string, slotIndex: number) => {
    const ball = balls.find(b => b.id === ballId);
    if (!ball) return;
    
    // 计算结果
    const result = calculateGameResult(ball.id, ball.path, config);
    result.slotIndex = slotIndex; // 使用实际计算的槽位
    
    // 添加到历史
    addResult(result);
    setLastResult(result);
    
    // 高亮槽位
    setHighlightedSlot(slotIndex);
    setTimeout(() => setHighlightedSlot(undefined), 2000);
    
    // 移除球
    removeBall(ballId);
    
    // 完成Promise
    const resolver = pendingResults.get(ballId);
    if (resolver) {
      resolver(result);
      setPendingResults(prev => {
        const newMap = new Map(prev);
        newMap.delete(ballId);
        return newMap;
      });
    }
    
    // 更新游戏状态
    if (!isAutoBetting) {
      setGameState('idle');
    }
  }, [balls, config, addResult, removeBall, pendingResults, isAutoBetting, setGameState]);
  
  // 监听全局事件
  useEffect(() => {
    const handleBetEvent = () => handleBetClick();
    const handleAutoBetEvent = () => handleAutoBetStart();
    
    window.addEventListener('bet-clicked', handleBetEvent);
    window.addEventListener('auto-bet-start', handleAutoBetEvent);
    
    return () => {
      window.removeEventListener('bet-clicked', handleBetEvent);
      window.removeEventListener('auto-bet-start', handleAutoBetEvent);
    };
  }, [handleBetClick, handleAutoBetStart]);
  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* 头部信息 */}
      <header className="bg-slate-800 shadow-lg p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-yellow-400">Plinko 游戏</h1>
            <div className="text-sm text-slate-400">
              MVP 演示版本
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-400">余额: </span>
              <span className="text-green-400 font-semibold">1000.00000000 BTC</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">状态: </span>
              <span className={`font-semibold ${
                gameState === 'idle' ? 'text-green-400' : 
                gameState === 'dropping' ? 'text-yellow-400' : 'text-blue-400'
              }`}>
                {gameState === 'idle' ? '待机' : 
                 gameState === 'dropping' ? '投球中' : '结算中'}
              </span>
            </div>
            {/* 右上角紀錄按鈕 */}
            <button
              className="ml-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
              onClick={() => setShowHistoryDrawer(true)}
              aria-label="查看游戏记录"
            >
              游戏记录
            </button>
          </div>
        </div>
      </header>
      
      {/* 主要内容区 */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* 左侧控制面板 */}
          <div className="xl:col-span-1">
            <ControlPanel />
            {/* 最后结果显示 */}
            {lastResult && (
              <div className="mt-6 bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">最后结果</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">槽位:</span>
                    <span className="text-white">#{lastResult.slotIndex + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">倍率:</span>
                    <span className="text-yellow-400 font-bold">{lastResult.fakePayout}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">盈亏:</span>
                    <span className={`font-semibold ${
                      (lastResult.fakePayout * lastResult.bet - lastResult.bet) >= 0 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {(lastResult.fakePayout * lastResult.bet - lastResult.bet) >= 0 ? '+' : ''}
                      {(lastResult.fakePayout * lastResult.bet - lastResult.bet).toFixed(8)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* 中间游戏区域 */}
          <div className="xl:col-span-2">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">游戏区域</h2>
                <div className="text-sm text-slate-400">
                  {config.rows} 行 • {config.risk} 风险
                </div>
              </div>
              {/* 游戏棋盘 */}
              <div className="relative">
                <GameBoard width={boardWidth} height={boardHeight}>
                  {/* 球动画 */}
                  <BallManager
                    balls={balls}
                    boardWidth={boardWidth}
                    boardHeight={boardHeight}
                    rows={config.rows}
                    onBallLanded={handleBallLanded}
                  />
                </GameBoard>
                {/* 底部槽位 */}
                <div className="mt-1">
                  <BottomSlots
                    width={boardWidth}
                    height={50}
                    highlightedSlot={highlightedSlot}
                  />
                </div>
              </div>
              {/* 游戏信息 */}
              <div className="mt-4 text-center">
                {isAutoBetting && (
                  <div className="bg-yellow-900/50 text-yellow-300 px-4 py-2 rounded-lg">
                    自动投注进行中...
                  </div>
                )}
                {gameState === 'dropping' && !isAutoBetting && (
                  <div className="text-yellow-400">
                    球正在下落中...
                  </div>
                )}
                {gameState === 'idle' && balls.length === 0 && (
                  <div className="text-slate-400">
                    点击投注按钮开始游戏
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* 右側紀錄移除，改用抽屜 */}
        </div>
        {/* 紀錄抽屜/彈窗 */}
        {showHistoryDrawer && (
          <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40">
            <div className="w-full max-w-md bg-slate-900 h-full shadow-xl p-0 relative animate-slideInRight">
              <div className="flex justify-between items-center p-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-yellow-400">游戏记录</h3>
                <button
                  className="text-slate-400 hover:text-white text-xl px-2"
                  onClick={() => setShowHistoryDrawer(false)}
                  aria-label="关闭记录"
                >×</button>
              </div>
              <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
                <GameHistory />
              </div>
            </div>
            {/* 點擊遮罩區域也可關閉 */}
            <div className="flex-1" onClick={() => setShowHistoryDrawer(false)} />
          </div>
        )}
      </div>
      
      {/* 页脚 */}
      <footer className="bg-slate-800 border-t border-slate-700 p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-sm">
          <p>Plinko 游戏 MVP 版本</p>
          <p className="mt-1">
            这是一个演示版本，所有倍率和计算都是模拟的，不涉及真实资金交易
          </p>
        </div>
      </footer>
    </div>
  );
}

// 主页面组件
export default function Home() {
  return (
    <GameProvider>
      <PlinkoGame />
    </GameProvider>
  );
}