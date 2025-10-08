import { RiskLevel, DROP_PROBABILITIES, PAYOUT_MULTIPLIERS } from '@/types/game';

// 從localStorage獲取自定義倍率的函數
function getCustomMultipliers(rows: number, risk: RiskLevel): number[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem('customMultipliers');
    if (saved) {
      const config = JSON.parse(saved);
      return config[risk]?.[rows] || null;
    }
  } catch (error) {
    console.error('載入自定義倍率失敗:', error);
  }
  
  return null;
}

/**
 * 基於機率分佈決定球的最終落點
 * @param rows 行數
 * @returns 最終的槽位索引 (0-based)
 */
export function calculateFinalSlot(rows: number): number {
  const probabilities = DROP_PROBABILITIES[rows];
  
  if (!probabilities) {
    // 如果沒有預定義的機率，使用隨機分佈
    const slots = rows + 1;
    return Math.floor(Math.random() * slots);
  }
  
  // 使用累積機率分佈來選擇槽位
  const random = Math.random() * 100; // 0-100
  let cumulative = 0;
  
  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i];
    if (random <= cumulative) {
      return i;
    }
  }
  
  // 回退到最後一個槽位
  return probabilities.length - 1;
}

/**
 * 根據最終槽位生成球的路徑
 * @param rows 行數
 * @param finalSlot 最終槽位索引
 * @returns 球的路徑數組
 */
export function generatePathToSlot(rows: number, finalSlot: number): number[] {
  const path: number[] = [];
  let currentPosition = rows / 2; // 從中央開始
  
  path.push(currentPosition);
  
  // 計算需要到達的最終位置
  const targetPosition = finalSlot;
  
  // 生成路徑，逐步向目標位置移動
  for (let row = 1; row <= rows; row++) {
    const remainingRows = rows - row;
    const currentDiff = targetPosition - currentPosition;
    
    // 如果已經接近目標或沒有剩餘行數，隨機移動
    if (remainingRows === 0) {
      path.push(currentPosition);
      continue;
    }
    
    // 計算需要的平均移動方向
    const averageMove = currentDiff / remainingRows;
    
    // 基於平均移動方向和隨機性決定下一步
    let direction: number;
    
    if (Math.abs(averageMove) > 0.4) {
      // 如果需要大幅移動，偏向目標方向
      direction = averageMove > 0 ? 0.5 : -0.5;
      // 添加一些隨機性
      if (Math.random() < 0.2) {
        direction *= -1;
      }
    } else {
      // 隨機移動
      direction = Math.random() < 0.5 ? -0.5 : 0.5;
    }
    
    currentPosition += direction;
    
    // 確保不超出邊界
    currentPosition = Math.max(0, Math.min(rows, currentPosition));
    
    path.push(currentPosition);
  }
  
  return path;
}

/**
 * 獲取指定行數和風險等級的倍率表
 * @param rows 行數
 * @param risk 風險等級
 * @returns 倍率數組
 */
export function getMultipliers(rows: number, risk: RiskLevel): number[] {
  // 首先嘗試獲取自定義倍率
  const customMultipliers = getCustomMultipliers(rows, risk);
  if (customMultipliers && customMultipliers.length > 0) {
    return customMultipliers;
  }
  
  // 回退到預設倍率
  const multipliers = PAYOUT_MULTIPLIERS[rows];
  
  if (!multipliers) {
    // 默認倍率
    const slots = rows + 1;
    return Array.from({ length: slots }, (_, i) => {
      const center = Math.floor(slots / 2);
      const distance = Math.abs(i - center);
      return Math.max(0.1, 2 - distance * 0.3);
    });
  }
  
  return multipliers[risk] || multipliers.medium || [];
}

/**
 * 完整的球路徑和結果計算
 * @param rows 行數
 * @param risk 風險等級
 * @returns 包含路徑和最終槽位的結果
 */
export function calculateBallDrop(rows: number, risk: RiskLevel) {
  // 1. 根據機率分佈決定最終槽位
  const finalSlot = calculateFinalSlot(rows);
  
  // 2. 生成到達該槽位的路徑
  const path = generatePathToSlot(rows, finalSlot);
  
  // 3. 獲取對應的倍率
  const multipliers = getMultipliers(rows, risk);
  const payout = multipliers[finalSlot] || 1;
  
  return {
    path,
    finalSlot,
    payout
  };
}