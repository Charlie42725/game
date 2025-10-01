'use client';

import React, { useState } from 'react';
import { useGameHistory } from '@/contexts/GameContext';
import { 
  calculateResultStats, 
  calculateStreaks, 
  formatGameResult,
  generateResultSummary 
} from '@/utils/gameLogic';

export default function GameHistory() {
  const { history, clearHistory } = useGameHistory();
  const [showStats, setShowStats] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  
  const stats = calculateResultStats(history.results);
  const streaks = calculateStreaks(history.results);
  
  if (history.results.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <div className="text-slate-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">还没有游戏记录</p>
          <p className="text-xs text-slate-500 mt-1">开始投球后，历史记录将显示在这里</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800 rounded-lg">
      {/* 头部控制 */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">游戏记录</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
            >
              {showStats ? '隐藏统计' : '显示统计'}
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
            >
              {showDetails ? '简化' : '详细'}
            </button>
            <button
              onClick={clearHistory}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              清空
            </button>
          </div>
        </div>
        
        {/* 快速统计 */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-slate-400">总投注</div>
            <div className="text-white font-semibold">{history.results.length}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">净盈亏</div>
            <div className={`font-semibold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(8)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">胜率</div>
            <div className="text-white font-semibold">{(stats.winRate * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* 详细统计 */}
      {showStats && (
        <div className="p-4 bg-slate-700/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-slate-300 font-medium mb-2">投注统计</h4>
              <div className="space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>总投注额:</span>
                  <span className="text-white">{stats.totalBets.toFixed(8)} BTC</span>
                </div>
                <div className="flex justify-between">
                  <span>总赔付:</span>
                  <span className="text-white">{stats.totalPayout.toFixed(8)} BTC</span>
                </div>
                <div className="flex justify-between">
                  <span>平均倍率:</span>
                  <span className="text-white">{stats.averageMultiplier.toFixed(2)}x</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-slate-300 font-medium mb-2">连胜记录</h4>
              <div className="space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>当前连胜:</span>
                  <span className="text-green-400">{streaks.currentWinStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span>当前连败:</span>
                  <span className="text-red-400">{streaks.currentLossStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span>最长连胜:</span>
                  <span className="text-white">{streaks.longestWinStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span>最长连败:</span>
                  <span className="text-white">{streaks.longestLossStreak}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 最大盈亏 */}
          {(stats.biggestWin > 0 || stats.biggestLoss < 0) && (
            <div className="mt-4 pt-3 border-t border-slate-600">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {stats.biggestWin > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">最大单次盈利:</span>
                    <span className="text-green-400">+{stats.biggestWin.toFixed(8)}</span>
                  </div>
                )}
                {stats.biggestLoss < 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">最大单次亏损:</span>
                    <span className="text-red-400">{stats.biggestLoss.toFixed(8)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 记录列表 */}
      <div className="max-h-96 overflow-y-auto">
        {history.results.slice(0, 50).map((result, index) => {
          const formatted = formatGameResult(result);
          const summary = generateResultSummary(result);
          
          return (
            <div 
              key={result.id}
              className={`
                p-3 border-b border-slate-700 last:border-b-0 hover:bg-slate-700/30 transition-colors
                ${index === 0 ? 'bg-slate-700/20' : ''}
              `}
            >
              {showDetails ? (
                <div className="space-y-2">
                  {/* 基本信息 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${formatted.profitColor === 'text-green-400' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-white font-medium">
                        槽位 #{result.slotIndex + 1}
                      </span>
                      <span className="text-yellow-400 font-bold">
                        {formatted.multiplier}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {/* 详细数据 */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">投注额</div>
                      <div className="text-white">{formatted.betAmount}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">赔付</div>
                      <div className="text-white">{formatted.payout}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">盈亏</div>
                      <div className={formatted.profitColor}>
                        {formatted.profit.startsWith('-') ? '' : '+'}
                        {formatted.profit}
                      </div>
                    </div>
                  </div>
                  
                  {/* 配置信息 */}
                  <div className="text-xs text-slate-500">
                    {result.rows} 行 | {result.risk} 风险
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${formatted.profitColor === 'text-green-400' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-white text-sm">{summary}</span>
                  </div>
                  <div className={`text-sm font-medium ${formatted.profitColor}`}>
                    {formatted.profit.startsWith('-') ? '' : '+'}
                    {formatted.profit}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {history.results.length > 50 && (
          <div className="p-3 text-center text-slate-400 text-sm">
            显示最近 50 条记录，共 {history.results.length} 条
          </div>
        )}
      </div>
    </div>
  );
}

// 简化的历史记录组件
export function SimpleGameHistory() {
  const { history } = useGameHistory();
  
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">最近结果</h3>
      
      {history.results.length === 0 ? (
        <div className="text-slate-400 text-sm text-center py-4">
          暂无记录
        </div>
      ) : (
        <div className="space-y-2">
          {history.results.slice(0, 5).map(result => {
            const formatted = formatGameResult(result);
            return (
              <div key={result.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  槽位 #{result.slotIndex + 1} • {formatted.multiplier}
                </span>
                <span className={formatted.profitColor}>
                  {formatted.profit.startsWith('-') ? '' : '+'}
                  {formatted.profit}
                </span>
              </div>
            );
          })}
          
          {history.results.length > 5 && (
            <div className="text-slate-500 text-xs text-center pt-2">
              还有 {history.results.length - 5} 条记录...
            </div>
          )}
        </div>
      )}
    </div>
  );
}