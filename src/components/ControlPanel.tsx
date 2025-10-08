'use client';

import React, { useState } from 'react';
import { useGameConfig, useGameState } from '@/contexts/GameContext';
import { RiskLevel, AutoBetConfig } from '@/types/game';

export default function ControlPanel() {
  const { config, setBet, setRows, setRisk, setAutoBet } = useGameConfig();
  const { gameState, canBet } = useGameState();
  const [showAutoBet, setShowAutoBet] = useState(false);
  const [autoBetForm, setAutoBetForm] = useState({
    rounds: 10,
    stopOnWin: 0,
    stopOnLoss: 0,
    interval: 0.8 // 🎲 改為0.8秒間隔，更快速
  });

  const handleBetChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setBet(numValue);
    }
  };

  const handleRowsChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 8 && numValue <= 16) {
      setRows(numValue);
    }
  };

  const handleRiskChange = (risk: RiskLevel) => {
    setRisk(risk);
  };

  const handleBetClick = () => {
    // 投注按鈕點擊
    if (canBet()) {
      // 触发投注事件，这将在主组件中处理
      const event = new CustomEvent('bet-clicked', { 
        detail: { config } 
      });
      // 發送投注事件
      window.dispatchEvent(event);
    }
  };

  const handleAutoBetToggle = () => {
    if (config.autoBetConfig?.isActive) {
      // 停止自动投注
      console.log('🛑 [ControlPanel] Stopping auto bet');
      setAutoBet(null);
    } else {
      // 开始自动投注
      const autoBetConfig: AutoBetConfig = {
        rounds: autoBetForm.rounds,
        isActive: true,
        stopOnWin: autoBetForm.stopOnWin > 0 ? autoBetForm.stopOnWin : undefined,
        stopOnLoss: autoBetForm.stopOnLoss > 0 ? autoBetForm.stopOnLoss : undefined,
        interval: Math.max(500, autoBetForm.interval * 1000) // 🎲 轉換為毫秒，最少0.5秒
      };
      
      console.log('🎮 [ControlPanel] Setting auto bet config:', autoBetConfig);
      setAutoBet(autoBetConfig);
      // 🎯 配置會通過 useEffect 自動觸發自動投注
    }
  };

  const getBetButtonText = () => {
    if (config.autoBetConfig?.isActive) {
      return '停止自动';
    }
    if (gameState === 'dropping') {
      return '投球中...';
    }
    return '投注';
  };

  const getBetButtonColor = () => {
    if (config.autoBetConfig?.isActive) {
      return 'bg-red-500 hover:bg-red-600';
    }
    if (!canBet()) {
      return 'bg-gray-400 cursor-not-allowed';
    }
    return 'bg-green-500 hover:bg-green-600';
  };

  return (
    <div className="w-80 bg-slate-800 text-white p-6 rounded-lg shadow-lg xl:h-[650px] flex flex-col">
      {/* 投注模式切换 */}
      <div className="mb-6">
        <div className="flex rounded-lg bg-slate-700 p-1">
          <button
            onClick={() => setShowAutoBet(false)}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
              !showAutoBet 
                ? 'bg-slate-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            手动投注
          </button>
          <button
            onClick={() => setShowAutoBet(true)}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
              showAutoBet 
                ? 'bg-slate-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            自动投注
          </button>
        </div>
      </div>

      {/* 投注额设置 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          投注额
        </label>
        <div className="flex items-center bg-slate-700 rounded-lg">
          <input
            type="number"
            value={config.bet}
            onChange={(e) => handleBetChange(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2 text-white placeholder-slate-400 outline-none"
            placeholder="0.00000000"
            step="0.00000001"
            min="0"
          />
          <span className="px-3 text-slate-400 text-sm">BTC</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          US${(config.bet * 50000).toFixed(2)} {/* 假设 1 BTC = 50000 USD */}
        </div>
      </div>

      {/* 快捷投注按钮 */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button 
            onClick={() => setBet(config.bet / 2)}
            className="flex-1 bg-slate-700 hover:bg-slate-600 py-1 px-2 rounded text-sm transition-colors"
          >
            ½
          </button>
          <button 
            onClick={() => setBet(config.bet * 2)}
            className="flex-1 bg-slate-700 hover:bg-slate-600 py-1 px-2 rounded text-sm transition-colors"
          >
            2×
          </button>
        </div>
      </div>

      {/* 难度选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          难度
        </label>
        <select
          value={config.risk}
          onChange={(e) => handleRiskChange(e.target.value as RiskLevel)}
          className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg outline-none"
        >
          <option value="low">低</option>
          <option value="medium">中等</option>
          <option value="high">高</option>
        </select>
      </div>

      {/* 排数选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          排数
        </label>
        <select
          value={config.rows}
          onChange={(e) => handleRowsChange(e.target.value)}
          className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg outline-none"
        >
          {Array.from({ length: 9 }, (_, i) => i + 8).map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {/* 自动投注设置 */}
      {showAutoBet && (
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              投注次数
            </label>
            <input
              type="number"
              value={autoBetForm.rounds}
              onChange={(e) => setAutoBetForm(prev => ({ 
                ...prev, 
                rounds: parseInt(e.target.value) || 1 
              }))}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg outline-none"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              盈利停止 (可选)
            </label>
            <input
              type="number"
              value={autoBetForm.stopOnWin}
              onChange={(e) => setAutoBetForm(prev => ({ 
                ...prev, 
                stopOnWin: parseFloat(e.target.value) || 0 
              }))}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg outline-none"
              min="0"
              step="0.00000001"
              placeholder="0 (不设限制)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              亏损停止 (可选)
            </label>
            <input
              type="number"
              value={autoBetForm.stopOnLoss}
              onChange={(e) => setAutoBetForm(prev => ({ 
                ...prev, 
                stopOnLoss: parseFloat(e.target.value) || 0 
              }))}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg outline-none"
              min="0"
              step="0.00000001"
              placeholder="0 (不设限制)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              🎲 投注间隔 (秒)
            </label>
            <input
              type="number"
              value={autoBetForm.interval}
              onChange={(e) => setAutoBetForm(prev => ({ 
                ...prev, 
                interval: Math.max(1, parseFloat(e.target.value) || 1.8)
              }))}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg outline-none"
              min="0.5"
              max="5"
              step="0.1"
              placeholder="0.8"
            />
            <div className="text-xs text-gray-400 mt-1">
              建議0.8-2秒，快速投注
            </div>
          </div>
        </div>
      )}

      {/* 投注按钮 */}
      <button
        onClick={showAutoBet ? handleAutoBetToggle : handleBetClick}
        disabled={!showAutoBet && !canBet()}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${getBetButtonColor()}`}
      >
        {getBetButtonText()}
      </button>

      {/* 自动投注状态显示 */}
      {config.autoBetConfig?.isActive && (
        <div className="mt-4 p-3 bg-yellow-900/50 rounded-lg">
          <div className="text-sm">
            <div className="text-yellow-400 font-medium mb-1">自动投注进行中</div>
            <div className="text-slate-300">
              剩余: {config.autoBetConfig.rounds} 次
            </div>
          </div>
        </div>
      )}
    </div>
  );
}