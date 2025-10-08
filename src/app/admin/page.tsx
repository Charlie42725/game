'use client';

import { useState, useEffect } from 'react';
import { DROP_PROBABILITIES } from '@/types/game';
import { getCustomProbabilities } from '@/utils/probabilityEngine';

export default function AdminPage() {
  const [probabilities, setProbabilities] = useState<Record<number, number[]>>(DROP_PROBABILITIES);
  const [selectedRows, setSelectedRows] = useState<number>(12);
  const [isLoading, setIsLoading] = useState(true);
  const [usingCustomProbabilities, setUsingCustomProbabilities] = useState(false);

  // 載入實際使用的機率配置（優先自定義，回退到預設）
  useEffect(() => {
    const loadCurrentProbabilities = () => {
      const currentProbs: Record<number, number[]> = {};
      let hasCustom = false;
      
      // 為每個行數載入實際使用的機率
      Object.keys(DROP_PROBABILITIES).forEach(rowsStr => {
        const rows = parseInt(rowsStr);
        const customProbs = getCustomProbabilities(rows);
        if (customProbs) {
          hasCustom = true;
          currentProbs[rows] = customProbs;
        } else {
          currentProbs[rows] = DROP_PROBABILITIES[rows];
        }
      });
      
      setProbabilities(currentProbs);
      setUsingCustomProbabilities(hasCustom);
    };

    loadCurrentProbabilities();
    setIsLoading(false);
  }, []);

  // 保存配置
  const saveProbabilities = () => {
    localStorage.setItem('customProbabilities', JSON.stringify(probabilities));
    setUsingCustomProbabilities(true);
    alert('✅ 機率配置已保存並同步到遊戲邏輯！\n\n📋 重要提醒：\n• 新機率將立即應用於下次掉球\n• 如果遊戲頁面已開啟，建議刷新頁面確保使用最新配置\n• 機率修改僅影響球的落點分佈，倍率保持不變');
  };

  // 重設為預設值
  const resetToDefaults = () => {
    if (confirm('確定要重設為預設機率嗎？\n這將清除所有自定義機率設定。')) {
      setProbabilities(DROP_PROBABILITIES);
      localStorage.removeItem('customProbabilities');
      setUsingCustomProbabilities(false);
      alert('✅ 已重設為預設機率！\n遊戲邏輯已同步使用原始機率分佈。');
    }
  };

  // 更新單個機率
  const updateProbability = (rows: number, index: number, value: string) => {
    const newValue = parseFloat(value) || 0;
    setProbabilities(prev => ({
      ...prev,
      [rows]: prev[rows].map((prob, i) => i === index ? newValue : prob)
    }));
  };

  // 標準化機率到100%
  const normalizeProbabilities = (rows: number) => {
    const probs = probabilities[rows];
    const sum = probs.reduce((acc, prob) => acc + prob, 0);
    if (sum === 0) return;

    const normalized = probs.map(prob => (prob / sum) * 100);
    setProbabilities(prev => ({
      ...prev,
      [rows]: normalized
    }));
  };

  // 批量設定機率
  const setBatchProbabilities = (rows: number, inputValue: string) => {
    try {
      const values = inputValue.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
      if (values.length !== rows + 1) {
        alert(`請輸入 ${rows + 1} 個機率值`);
        return;
      }
      
      setProbabilities(prev => ({
        ...prev,
        [rows]: values
      }));
      alert('✅ 批量設定完成！\n請記得點擊【💾 保存配置】按鈕來應用更改。');
    } catch (error) {
      alert('❌ 輸入格式錯誤！\n請使用逗號分隔的數字，例如：5,10,15,20,25,15,5,3,2');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-2xl font-semibold animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          載入中...
        </div>
      </div>
    );
  }

  const currentProbs = probabilities[selectedRows] || [];
  const totalProbability = currentProbs.reduce((sum, prob) => sum + prob, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 p-6 relative overflow-hidden">
      {/* 裝飾性背景元素 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-sakura-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 right-1/3 w-28 h-28 bg-gold-500/10 rounded-full blur-xl animate-pulse delay-3000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* 標題區 */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-sakura-200 to-gold-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">
            🎰 機率管理後台
          </h1>
          <p className="text-xl text-gray-200 font-medium mb-3">調整球落入各槽位的機率分佈</p>
          
          {/* 狀態指示器 */}
          <div className="flex justify-center gap-4 mb-4">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-600/80 to-amber-600/80 rounded-full border border-yellow-400/50 shadow-lg">
              <span className="text-yellow-100 text-sm font-semibold">💡 注意：倍率固定不變，只調整機率</span>
            </div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full border shadow-lg ${
              usingCustomProbabilities
                ? 'bg-gradient-to-r from-emerald-600/80 to-teal-600/80 border-emerald-400/50'
                : 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 border-blue-400/50'
            }`}>
              <span className="text-white text-sm font-semibold">
                {usingCustomProbabilities ? '🎯 使用自定義機率' : '📋 使用預設機率'}
              </span>
            </div>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="glass-effect rounded-2xl p-8 mb-8 border border-white/20 shadow-2xl backdrop-blur-md">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
            <div className="flex gap-4">
              {/* 行數選擇 */}
              <select 
                value={selectedRows} 
                onChange={(e) => setSelectedRows(parseInt(e.target.value))}
                className="px-4 py-2 bg-gradient-to-r from-sakura-600 to-sakura-500 border-2 border-sakura-300 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:from-sakura-500 hover:to-sakura-400 focus:ring-2 focus:ring-sakura-300 focus:outline-none"
              >
                <option value={8} className="bg-sakura-800 text-white">8 行 (9槽)</option>
                <option value={9} className="bg-sakura-800 text-white">9 行 (10槽)</option>
                <option value={10} className="bg-sakura-800 text-white">10 行 (11槽)</option>
                <option value={11} className="bg-sakura-800 text-white">11 行 (12槽)</option>
                <option value={12} className="bg-sakura-800 text-white">12 行 (13槽)</option>
                <option value={13} className="bg-sakura-800 text-white">13 行 (14槽)</option>
                <option value={14} className="bg-sakura-800 text-white">14 行 (15槽)</option>
                <option value={15} className="bg-sakura-800 text-white">15 行 (16槽)</option>
                <option value={16} className="bg-sakura-800 text-white">16 行 (17槽)</option>
              </select>

              <div className="text-white">
                <span className="text-sm">機率總和: </span>
                <span className={`font-bold ${Math.abs(totalProbability - 100) < 0.1 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProbability.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => normalizeProbabilities(selectedRows)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-400/30"
              >
                📊 標準化到100%
              </button>
              <button 
                onClick={saveProbabilities}
                className="btn-sakura px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl border-2 border-sakura-300/50"
              >
                💾 保存配置
              </button>
              <button 
                onClick={resetToDefaults}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-500 hover:to-slate-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-gray-400/30"
              >
                🔄 重設預設
              </button>
            </div>
          </div>

          {/* 批量設定 */}
          <div className="mb-4">
            <label className="block text-white mb-2 font-semibold">
              批量設定機率（用逗號分隔，需要 {selectedRows + 1} 個值，總和建議為100%）：
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="例：5,10,15,20,25,15,5,3,2 （單位：%）"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-white/10 to-white/5 border-2 border-white/30 rounded-xl text-white placeholder-gray-300 font-medium shadow-inner backdrop-blur-sm focus:border-sakura-400 focus:ring-2 focus:ring-sakura-300/50 focus:outline-none transition-all duration-300"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setBatchProbabilities(selectedRows, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  setBatchProbabilities(selectedRows, input.value);
                  input.value = '';
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-emerald-400/30"
              >
                設定
              </button>
            </div>
          </div>
        </div>

        {/* 機率編輯區 */}
        <div className="glass-effect rounded-2xl p-8 border border-white/20 shadow-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white mb-4">
            {selectedRows} 行遊戲機率設定
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {currentProbs.map((probability, index) => (
              <div key={index} className={`bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                index === Math.floor((selectedRows + 1) / 2) 
                  ? 'border-gold-400/50 bg-gradient-to-br from-gold-600/20 to-gold-500/10' 
                  : 'border-white/20 hover:border-sakura-400/50'
              }`}>
                <label className={`block mb-3 font-bold text-lg ${
                  index === Math.floor((selectedRows + 1) / 2) 
                    ? 'text-gold-300' 
                    : 'text-white'
                }`}>
                  槽位 {index} {index === Math.floor((selectedRows + 1) / 2) ? '👑 中間' : ''}
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => updateProbability(selectedRows, index, e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg text-white text-center font-bold text-xl shadow-inner backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
                    index === Math.floor((selectedRows + 1) / 2)
                      ? 'bg-gradient-to-r from-gold-600/30 to-gold-500/20 border-2 border-gold-400/50 focus:ring-gold-300/50'
                      : 'bg-gradient-to-r from-white/15 to-white/10 border-2 border-white/30 focus:border-sakura-400 focus:ring-sakura-300/50'
                  }`}
                />
                <div className={`text-center mt-2 text-sm font-semibold ${
                  index === Math.floor((selectedRows + 1) / 2) 
                    ? 'text-gold-200' 
                    : 'text-gray-300'
                }`}>
                  {probability.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>

          {/* 視覺化預覽 */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
              📊 機率分佈視覺化
            </h3>
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 border-2 border-white/20 shadow-inner">
              <div className="flex justify-center items-end gap-2 h-40">
                {currentProbs.map((probability, index) => (
                  <div 
                    key={index} 
                    className={`rounded-t-lg text-xs text-white font-bold flex items-end justify-center transition-all duration-500 hover:scale-110 cursor-pointer shadow-lg ${
                      index === Math.floor((selectedRows + 1) / 2)
                        ? 'bg-gradient-to-t from-gold-600 to-gold-400'
                        : 'bg-gradient-to-t from-sakura-600 via-sakura-500 to-sakura-400'
                    }`}
                    style={{ 
                      height: `${Math.max((probability / Math.max(...currentProbs)) * 100, 10)}%`,
                      minHeight: '25px',
                      width: `${75 / currentProbs.length}%`
                    }}
                    title={`槽位 ${index}: ${probability.toFixed(2)}%`}
                  >
                    <span className="mb-1">
                      {probability > 3 ? probability.toFixed(1) : ''}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-3">
                {currentProbs.map((_, index) => (
                  <div 
                    key={index} 
                    className={`text-sm font-semibold text-center ${
                      index === Math.floor((selectedRows + 1) / 2)
                        ? 'text-gold-300'
                        : 'text-gray-300'
                    }`}
                    style={{ width: `${75 / currentProbs.length}%` }}
                  >
                    {index}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 回到遊戲按鈕 */}
        <div className="text-center mt-8">
          <a 
            href="/" 
            className="inline-block btn-gold px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-gold-500/25 border-2 border-gold-400/50"
          >
            🎮 回到遊戲
          </a>
        </div>
      </div>
    </div>
  );
}