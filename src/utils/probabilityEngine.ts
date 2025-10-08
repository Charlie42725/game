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
  
  console.log(`[DEBUG] Calculating slot for ${rows} rows, probabilities:`, probabilities);
  
  if (!probabilities) {
    // 如果沒有預定義的機率，使用隨機分佈
    const slots = rows + 1;
    return Math.floor(Math.random() * slots);
  }
  
  // 使用累積機率分佈來選擇槽位
  const random = Math.random() * 100; // 0-100
  let cumulative = 0;
  
  console.log(`[DEBUG] Random value: ${random}`);
  
  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i];
    console.log(`[DEBUG] Slot ${i}: probability=${probabilities[i]}, cumulative=${cumulative}`);
    if (random <= cumulative) {
      console.log(`[DEBUG] Selected slot: ${i}`);
      return i;
    }
  }
  
  // 回退到最後一個槽位
  const fallbackSlot = probabilities.length - 1;
  console.log(`[DEBUG] Fallback to slot: ${fallbackSlot}`);
  return fallbackSlot;
}

/**
 * 根據最終槽位生成球的路徑（完全確定性）
 * @param rows 行數
 * @param finalSlot 最終槽位索引
 * @returns 球的路徑數組
 */
export function generatePathToSlot(rows: number, finalSlot: number): number[] {
  console.log(`[DEBUG] Generating DETERMINISTIC path for ${rows} rows to slot ${finalSlot}`);
  
  const path: number[] = [];
  let currentPosition = rows / 2; // 從中央開始
  
  path.push(currentPosition);
  
  // 計算需要到達的最終位置
  const targetPosition = finalSlot;
  
  console.log(`[DEBUG] Starting position: ${currentPosition}, target: ${targetPosition}`);
  
  // 完全確定性的路徑生成 - 每一步都朝向目標
  for (let row = 1; row <= rows; row++) {
    const remainingRows = rows - row;
    const currentDiff = targetPosition - currentPosition;
    
    if (remainingRows === 0) {
      // 最後一行，確保到達目標位置
      currentPosition = targetPosition;
    } else {
      // 計算理想的移動步長
      const idealStep = currentDiff / remainingRows;
      
      // 每次移動0.5或-0.5，選擇最接近理想步長的方向
      if (idealStep > 0.25) {
        // 需要向右移動
        currentPosition += 0.5;
      } else if (idealStep < -0.25) {
        // 需要向左移動
        currentPosition -= 0.5;
      } else {
        // 接近目標，根據精確差值微調
        if (currentDiff > 0) {
          currentPosition += 0.5;
        } else if (currentDiff < 0) {
          currentPosition -= 0.5;
        }
        // 如果currentDiff == 0，保持當前位置
      }
    }
    
    // 確保不超出邊界
    currentPosition = Math.max(0, Math.min(rows, currentPosition));
    
    path.push(currentPosition);
    
    console.log(`[DEBUG] Row ${row}: position=${currentPosition}, diff=${targetPosition - currentPosition}, remaining=${remainingRows}`);
  }
  
  // 最終確認：如果最後位置不是目標槽位，強制設定
  const finalPosition = path[path.length - 1];
  if (Math.abs(finalPosition - targetPosition) > 0.1) {
    console.log(`[DEBUG] Force correcting final position from ${finalPosition} to ${targetPosition}`);
    path[path.length - 1] = targetPosition;
  }
  
  console.log(`[DEBUG] Generated DETERMINISTIC path:`, path);
  console.log(`[DEBUG] Final position: ${path[path.length - 1]}, expected slot: ${targetPosition}`);
  
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