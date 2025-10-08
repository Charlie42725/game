'use client';

import { useState, useEffect } from 'react';
import { RiskLevel } from '@/types/game';

// 預設倍率配置
const DEFAULT_MULTIPLIERS = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [25, 8, 4, 2, 1.5, 1, 0.5, 1, 1.5, 2, 4, 8, 25],
    16: [43, 26, 8.1, 4, 1.9, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.9, 4, 8.1, 26, 43]
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [76, 10, 5, 2, 0.8, 0.4, 0.2, 0.4, 0.8, 2, 5, 10, 76],
    16: [170, 24, 8.9, 3, 1.4, 0.6, 0.4, 0.2, 0.2, 0.2, 0.4, 0.6, 1.4, 3, 8.9, 24, 170]
  }
};

interface MultiplierConfig {
  [key: string]: {
    [rows: number]: number[];
  };
}

export default function AdminPage() {
  const [multipliers, setMultipliers] = useState<MultiplierConfig>(DEFAULT_MULTIPLIERS);
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel>('medium');
  const [selectedRows, setSelectedRows] = useState<number>(12);
  const [isLoading, setIsLoading] = useState(true);

  // 載入保存的配置
  useEffect(() => {
    const saved = localStorage.getItem('customMultipliers');
    if (saved) {
      try {
        setMultipliers(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load multipliers:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // 保存配置
  const saveMultipliers = () => {
    localStorage.setItem('customMultipliers', JSON.stringify(multipliers));
    alert('倍率配置已保存！');
  };

  // 重設為預設值
  const resetToDefaults = () => {
    if (confirm('確定要重設為預設倍率嗎？')) {
      setMultipliers(DEFAULT_MULTIPLIERS);
      localStorage.removeItem('customMultipliers');
      alert('已重設為預設倍率！');
    }
  };

  // 更新單個倍率
  const updateMultiplier = (risk: string, rows: number, index: number, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;

    setMultipliers(prev => ({
      ...prev,
      [risk]: {
        ...prev[risk],
        [rows]: prev[risk][rows].map((mult, i) => i === index ? numValue : mult)
      }
    }));
  };

  // 批量設定倍率
  const setBatchMultipliers = (risk: string, rows: number, values: string) => {
    const valueArray = values.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    const expectedLength = rows + 1;
    
    if (valueArray.length !== expectedLength) {
      alert(`需要輸入 ${expectedLength} 個倍率值（用逗號分隔）`);
      return;
    }

    setMultipliers(prev => ({
      ...prev,
      [risk]: {
        ...prev[risk],
        [rows]: valueArray
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 標題區 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 倍率管理後台</h1>
          <p className="text-gray-300">調整遊戲獲勝倍率配置</p>
        </div>

        {/* 控制面板 */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
            <div className="flex gap-4">
              {/* 風險等級選擇 */}
              <select 
                value={selectedRisk} 
                onChange={(e) => setSelectedRisk(e.target.value as RiskLevel)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="low">低風險</option>
                <option value="medium">中風險</option>
                <option value="high">高風險</option>
              </select>

              {/* 行數選擇 */}
              <select 
                value={selectedRows} 
                onChange={(e) => setSelectedRows(parseInt(e.target.value))}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value={8}>8 行</option>
                <option value={12}>12 行</option>
                <option value={16}>16 行</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={saveMultipliers}
                className="btn-sakura px-6 py-2 rounded-lg font-semibold transition-all hover:scale-105"
              >
                💾 保存配置
              </button>
              <button 
                onClick={resetToDefaults}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
              >
                🔄 重設預設
              </button>
            </div>
          </div>

          {/* 批量設定 */}
          <div className="mb-4">
            <label className="block text-white mb-2 font-semibold">
              批量設定獲勝倍率（用逗號分隔，需要 {selectedRows + 1} 個值）：
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="例：0.2,0.4,0.8,1.5,2,5,10,5,2,1.5,0.8,0.4,0.2 (球落在該槽位時的獲勝倍率)"
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setBatchMultipliers(selectedRisk, selectedRows, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  setBatchMultipliers(selectedRisk, selectedRows, input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                設定
              </button>
            </div>
          </div>
        </div>

        {/* 倍率編輯區 */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {selectedRisk === 'low' ? '低風險' : selectedRisk === 'medium' ? '中風險' : '高風險'} - {selectedRows} 行 獲勝倍率設定
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {multipliers[selectedRisk]?.[selectedRows]?.map((multiplier, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <label className="block text-white mb-2 font-semibold">
                  槽位 {index} {index === Math.floor((selectedRows + 1) / 2) ? '(中間)' : ''}
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  value={multiplier}
                  onChange={(e) => updateMultiplier(selectedRisk, selectedRows, index, e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center font-bold text-lg"
                />
                <div className="text-center mt-1 text-sm text-gray-300">
                  {multiplier}x
                </div>
              </div>
            ))}
          </div>

          {/* 視覺化預覽 */}
          <div className="mt-6">
            <h3 className="text-xl font-bold text-white mb-3">獲勝倍率分佈預覽</h3>
            <p className="text-gray-300 text-sm mb-3">
              球落在不同槽位時的獲勝倍率 (投注金額 × 倍率 = 獲得金額)
            </p>
            <div className="flex justify-center">
              <div className="flex gap-1">
                {multipliers[selectedRisk]?.[selectedRows]?.map((multiplier, index) => (
                  <div 
                    key={index} 
                    className={`
                      px-2 py-1 rounded text-xs font-bold text-center min-w-[40px]
                      ${multiplier >= 10 ? 'bg-red-500 text-white' : 
                        multiplier >= 5 ? 'bg-orange-500 text-white' : 
                        multiplier >= 2 ? 'bg-yellow-500 text-black' : 
                        multiplier >= 1 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}
                    `}
                    title={`槽位 ${index}: 投注 1 BTC 獲得 ${multiplier} BTC`}
                  >
                    {multiplier}x
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 回到遊戲按鈕 */}
        <div className="text-center mt-6">
          <a 
            href="/" 
            className="inline-block btn-gold px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105"
          >
            🎮 回到遊戲
          </a>
        </div>
      </div>
    </div>
  );
}