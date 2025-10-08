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

// 從localStorage獲取自定義機率的函數
export function getCustomProbabilities(rows: number): number[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem('customProbabilities');
    if (saved) {
      const config = JSON.parse(saved);
      return config[rows] || null;
    }
  } catch (error) {
    console.error('載入自定義機率失敗:', error);
  }
  
  return null;
}

/**
 * 基於機率分佈決定球的最終落點
 * @param rows 行數
 * @returns 最終的槽位索引 (0-based)
 */
export function calculateFinalSlot(rows: number): number {
  // 首先嘗試獲取自定義機率
  let probabilities = getCustomProbabilities(rows);
  
  // 如果沒有自定義機率，使用預設機率
  if (!probabilities) {
    probabilities = DROP_PROBABILITIES[rows];
  }
  
  console.log(`[DEBUG] Calculating slot for ${rows} rows, probabilities:`, probabilities);
  
  if (!probabilities) {
    // 如果沒有任何機率數據，使用隨機分佈
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
 * 根據最終槽位生成球的路徑（帶物理碰撞但結果確定）
 * @param rows 行數
 * @param finalSlot 最終槽位索引
 * @returns 球的路徑數組
 */
export function generatePathToSlot(rows: number, finalSlot: number): number[] {
  console.log(`[DEBUG] Generating PHYSICS path for ${rows} rows to slot ${finalSlot}`);
  
  const path: number[] = [];
  let currentPosition = rows / 2; // 從中央開始
  
  path.push(currentPosition);
  
  const targetPosition = finalSlot;
  
  // 預先計算需要的總偏移
  const totalOffset = targetPosition - currentPosition;
  console.log(`[DEBUG] Total offset needed: ${totalOffset} (from ${currentPosition} to ${targetPosition})`);
  
  // 決定每一步的方向，確保總和等於目標偏移
  const directions: number[] = [];
  let accumulatedOffset = 0;
  
  // 為每一行生成碰撞方向，但確保最終到達目標
  for (let row = 1; row <= rows; row++) {
    const remainingRows = rows - row;
    const remainingOffset = totalOffset - accumulatedOffset;
    
    let direction: number;
    
    if (remainingRows === 0) {
      // 最後一行，使用剩餘的偏移
      direction = remainingOffset;
    } else {
      // 計算理想步長
      const idealStep = remainingOffset / (remainingRows + 1);
      
      // 添加一些隨機性來模擬碰撞，但偏向理想方向
      const randomFactor = (Math.random() - 0.5) * 0.6; // -0.3 到 0.3 的隨機值
      const biasedDirection = idealStep + randomFactor;
      
      // 限制每步只能是 ±0.5
      if (biasedDirection > 0.25) {
        direction = 0.5;
      } else if (biasedDirection < -0.25) {
        direction = -0.5;
      } else {
        // 當接近目標時，根據剩餘偏移決定
        if (remainingOffset > 0.25) {
          direction = 0.5;
        } else if (remainingOffset < -0.25) {
          direction = -0.5;
        } else {
          // 微小偏移或已到達，可以隨機碰撞
          direction = Math.random() < 0.5 ? -0.5 : 0.5;
          
          // 但如果這會讓我們偏離太遠，就修正方向
          const futureOffset = accumulatedOffset + direction;
          const futureRemaining = totalOffset - futureOffset;
          if (Math.abs(futureRemaining) > remainingRows * 0.5) {
            direction = -direction; // 反向
          }
        }
      }
    }
    
    directions.push(direction);
    accumulatedOffset += direction;
    
    console.log(`[DEBUG] Row ${row}: direction=${direction}, accumulated=${accumulatedOffset}, remaining=${totalOffset - accumulatedOffset}`);
  }
  
  // 修正最後幾步，確保精確到達目標
  const finalOffset = accumulatedOffset;
  const offsetError = totalOffset - finalOffset;
  
  if (Math.abs(offsetError) > 0.01 && directions.length > 0) {
    console.log(`[DEBUG] Correcting offset error: ${offsetError}`);
    // 將誤差分配到最後幾步
    const stepsToCorrect = Math.min(3, directions.length);
    const correctionPerStep = offsetError / stepsToCorrect;
    
    for (let i = 0; i < stepsToCorrect; i++) {
      const stepIndex = directions.length - 1 - i;
      directions[stepIndex] += correctionPerStep;
    }
  }
  
  // 根據方向數組生成最終路徑
  currentPosition = rows / 2; // 重置起始位置
  
  for (let i = 0; i < directions.length; i++) {
    currentPosition += directions[i];
    
    // 確保不超出邊界
    currentPosition = Math.max(0, Math.min(rows, currentPosition));
    
    path.push(currentPosition);
  }
  
  // 強制最終位置為目標（以防邊界限制影響）
  if (Math.abs(path[path.length - 1] - targetPosition) > 0.1) {
    console.log(`[DEBUG] Force final correction: ${path[path.length - 1]} -> ${targetPosition}`);
    path[path.length - 1] = targetPosition;
  }
  
  console.log(`[DEBUG] Generated PHYSICS path:`, path);
  console.log(`[DEBUG] Final position: ${path[path.length - 1]}, target: ${targetPosition}`);
  
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