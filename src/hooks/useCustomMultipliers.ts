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

export function useCustomMultipliers() {
  const [multipliers, setMultipliers] = useState<MultiplierConfig>(DEFAULT_MULTIPLIERS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 從localStorage載入自定義倍率
    const loadCustomMultipliers = () => {
      try {
        const saved = localStorage.getItem('customMultipliers');
        if (saved) {
          const customConfig = JSON.parse(saved);
          setMultipliers(customConfig);
        }
      } catch (error) {
        console.error('載入自定義倍率失敗:', error);
        setMultipliers(DEFAULT_MULTIPLIERS);
      } finally {
        setIsLoaded(true);
      }
    };

    // 監聽storage變化，當管理後台更新倍率時同步更新
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customMultipliers') {
        loadCustomMultipliers();
      }
    };

    loadCustomMultipliers();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 獲取指定配置的倍率
  const getMultipliers = (rows: number, risk: RiskLevel): number[] => {
    const riskConfig = multipliers[risk] || DEFAULT_MULTIPLIERS[risk];
    return (riskConfig as any)?.[rows] || [];
  };

  // 重設為預設倍率
  const resetToDefaults = () => {
    setMultipliers(DEFAULT_MULTIPLIERS);
    localStorage.removeItem('customMultipliers');
  };

  // 更新倍率配置
  const updateMultipliers = (newConfig: MultiplierConfig) => {
    setMultipliers(newConfig);
    localStorage.setItem('customMultipliers', JSON.stringify(newConfig));
  };

  return {
    multipliers,
    isLoaded,
    getMultipliers,
    resetToDefaults,
    updateMultipliers
  };
}