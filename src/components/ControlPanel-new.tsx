'use client';

import React, { useState } from 'react';
import { useGameConfig, useGameState } from '@/contexts/GameContext';
import { RiskLevel, AutoBetConfig } from '@/types/game';

interface ControlPanelProps {
  onManualBet: () => void;
  onAutoBet: () => void;
  isAutoBetting: boolean;
  canBet: boolean;
  gameState: string;
}

export default function ControlPanel({ 
  onManualBet, 
  onAutoBet, 
  isAutoBetting, 
  canBet, 
  gameState 
}: ControlPanelProps) {
  const { config, setBet, setRows, setRisk, setAutoBet } = useGameConfig();
  const [showAutoBet, setShowAutoBet] = useState(false);
  const [autoBetForm, setAutoBetForm] = useState({
    rounds: 10,
    stopOnWin: 0,
    stopOnLoss: 0
  });

  const handleBetChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.00000001) {
      setBet(numValue);
    }
  };

  const handleRowsChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 6 && numValue <= 16) {
      setRows(numValue);
    }
  };

  const handleRiskChange = (risk: RiskLevel) => {
    setRisk(risk);
  };

  const betOptions = [0.00000001, 0.00000002, 0.00000005, 0.0000001, 0.0000002, 0.0000005, 0.000001];
  const rowOptions = [8, 9, 10, 11, 12, 13, 14, 15, 16];

  const riskLevels: { key: RiskLevel; label: string; color: string }[] = [
    { key: 'low', label: '簡單', color: 'from-green-500 to-emerald-500' },
    { key: 'medium', label: '中等', color: 'from-yellow-500 to-orange-500' },
    { key: 'high', label: '困難', color: 'from-red-500 to-pink-500' }
  ];

  return (
    <div className="space-y-6">
      {/* 投注額設置 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          投注額
        </label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {betOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => setBet(amount)}
              className={`px-3 py-2 text-xs rounded-lg transition-all ${
                config.bet === amount
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {amount.toFixed(8)}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="number"
            step="0.00000001"
            min="0.00000001"
            value={config.bet}
            onChange={(e) => handleBetChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            placeholder="自定義投注額"
          />
        </div>
      </div>

      {/* 行數設置 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          行數設置
        </label>
        <div className="grid grid-cols-5 gap-1 mb-3">
          {rowOptions.map((rows) => (
            <button
              key={rows}
              onClick={() => setRows(rows)}
              className={`px-2 py-2 text-xs rounded-lg transition-all ${
                config.rows === rows
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {rows}排
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-400 text-center">
          當前: {config.rows} 排 ({config.rows + 1} 個槽位)
        </div>
      </div>

      {/* 風險等級 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          風險等級
        </label>
        <div className="space-y-2">
          {riskLevels.map((level) => (
            <button
              key={level.key}
              onClick={() => handleRiskChange(level.key)}
              className={`w-full px-4 py-3 rounded-lg transition-all text-white font-medium ${
                config.risk === level.key
                  ? `bg-gradient-to-r ${level.color}`
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {level.label}
              <div className="text-xs opacity-75 mt-1">
                {level.key === 'low' && '低風險，穩定回報'}
                {level.key === 'medium' && '中等風險，平衡收益'}
                {level.key === 'high' && '高風險，高回報'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 投注按鈕 */}
      <div className="space-y-3">
        <button
          onClick={onManualBet}
          disabled={!canBet && !isAutoBetting}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            canBet && !isAutoBetting
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transform hover:scale-[1.02] hover:shadow-xl'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {gameState === 'dropping' ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>投注中...</span>
            </div>
          ) : (
            '🎯 投注'
          )}
        </button>

        <button
          onClick={onAutoBet}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            isAutoBetting
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-yellow-500 hover:bg-yellow-600 text-black'
          }`}
        >
          {isAutoBetting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span>停止自動投注</span>
            </div>
          ) : (
            '⚡ 自動投注'
          )}
        </button>
      </div>

      {/* 自動投注設置 */}
      {showAutoBet && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
          <h4 className="text-white font-medium mb-3">自動投注設置</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">投注輪數</label>
              <input
                type="number"
                value={autoBetForm.rounds}
                onChange={(e) => setAutoBetForm({...autoBetForm, rounds: parseInt(e.target.value) || 10})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">贏到停止</label>
              <input
                type="number"
                step="0.00000001"
                value={autoBetForm.stopOnWin}
                onChange={(e) => setAutoBetForm({...autoBetForm, stopOnWin: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">輸到停止</label>
              <input
                type="number"
                step="0.00000001"
                value={autoBetForm.stopOnLoss}
                onChange={(e) => setAutoBetForm({...autoBetForm, stopOnLoss: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                min="0"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const autoConfig: AutoBetConfig = {
                    rounds: autoBetForm.rounds,
                    isActive: true,
                    stopOnWin: autoBetForm.stopOnWin || undefined,
                    stopOnLoss: autoBetForm.stopOnLoss || undefined
                  };
                  setAutoBet(autoConfig);
                  setShowAutoBet(false);
                }}
                className="flex-1 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              >
                確認
              </button>
              <button
                onClick={() => setShowAutoBet(false)}
                className="flex-1 py-2 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 遊戲狀態指示 */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">遊戲狀態:</span>
          <span className={`font-medium ${
            gameState === 'dropping' ? 'text-yellow-400' :
            gameState === 'idle' ? 'text-green-400' : 'text-slate-400'
          }`}>
            {gameState === 'dropping' && '投注中'}
            {gameState === 'idle' && '準備就緒'}
            {gameState === 'landed' && '結算中'}
            {gameState === 'settling' && '處理中'}
          </span>
        </div>
        {isAutoBetting && (
          <div className="mt-2 pt-2 border-t border-slate-700">
            <div className="flex items-center text-xs text-slate-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
              自動投注運行中
            </div>
          </div>
        )}
      </div>
    </div>
  );
}