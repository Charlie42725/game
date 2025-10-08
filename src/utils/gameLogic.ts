import { GameResult, GameConfig } from '@/types/game';
import { getMultipliers } from '@/utils/probabilityEngine';

/**
 * 根据球的最终位置计算游戏结果
 */
export function calculateGameResult(
  ballId: string,
  finalPath: number[],
  config: GameConfig
): GameResult {
  const finalPosition = finalPath[finalPath.length - 1];
  const slotIndex = Math.floor(finalPosition);
  
  // 使用新的機率系統獲取倍率
  const multipliers = getMultipliers(config.rows, config.risk);
  const fakePayout = multipliers[slotIndex] || 1;
  
  return {
    id: ballId,
    slotIndex,
    fakePayout,
    bet: config.bet,
    timestamp: Date.now(),
    rows: config.rows,
    risk: config.risk
  };
}

/**
 * 验证游戏结果是否有效
 */
export function validateGameResult(result: GameResult, rows: number): boolean {
  // 检查槽位索引是否在有效范围内
  const maxSlotIndex = rows;
  if (result.slotIndex < 0 || result.slotIndex > maxSlotIndex) {
    return false;
  }
  
  // 检查倍率是否合理
  if (result.fakePayout < 0 || result.fakePayout > 100) {
    return false;
  }
  
  // 检查投注额是否为正数
  if (result.bet <= 0) {
    return false;
  }
  
  // 检查时间戳是否合理
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  if (result.timestamp < oneHourAgo || result.timestamp > now) {
    return false;
  }
  
  return true;
}

/**
 * 计算理论盈亏 (MVP版本只做显示，不计算真实资金)
 */
export function calculatePayout(result: GameResult): number {
  return result.bet * result.fakePayout;
}

/**
 * 计算净盈亏
 */
export function calculateProfit(result: GameResult): number {
  return calculatePayout(result) - result.bet;
}

/**
 * 批量计算多个结果的统计信息
 */
export interface ResultStats {
  totalBets: number;
  totalPayout: number;
  totalProfit: number;
  winRate: number;
  biggestWin: number;
  biggestLoss: number;
  averageMultiplier: number;
  slotDistribution: Record<number, number>;
}

export function calculateResultStats(results: GameResult[]): ResultStats {
  if (results.length === 0) {
    return {
      totalBets: 0,
      totalPayout: 0,
      totalProfit: 0,
      winRate: 0,
      biggestWin: 0,
      biggestLoss: 0,
      averageMultiplier: 0,
      slotDistribution: {}
    };
  }
  
  let totalBets = 0;
  let totalPayout = 0;
  let totalProfit = 0;
  let winCount = 0;
  let biggestWin = 0;
  let biggestLoss = 0;
  let totalMultiplier = 0;
  const slotDistribution: Record<number, number> = {};
  
  results.forEach(result => {
    const payout = calculatePayout(result);
    const profit = calculateProfit(result);
    
    totalBets += result.bet;
    totalPayout += payout;
    totalProfit += profit;
    totalMultiplier += result.fakePayout;
    
    // 统计胜负
    if (profit > 0) {
      winCount++;
      biggestWin = Math.max(biggestWin, profit);
    } else {
      biggestLoss = Math.min(biggestLoss, profit);
    }
    
    // 统计槽位分布
    slotDistribution[result.slotIndex] = (slotDistribution[result.slotIndex] || 0) + 1;
  });
  
  return {
    totalBets,
    totalPayout,
    totalProfit,
    winRate: winCount / results.length,
    biggestWin,
    biggestLoss,
    averageMultiplier: totalMultiplier / results.length,
    slotDistribution
  };
}

/**
 * 获取风险等级对应的倍率调整 (MVP版本暂不实现，保留接口)
 */
export function getRiskMultiplierAdjustment(risk: 'low' | 'medium' | 'high'): number {
  // MVP版本返回1，不调整倍率
  return 1;
}

/**
 * 检查是否达到自动停止条件
 */
export function shouldStopAutoBet(
  results: GameResult[],
  stopOnWin?: number,
  stopOnLoss?: number
): { shouldStop: boolean; reason?: string } {
  if (!stopOnWin && !stopOnLoss) {
    return { shouldStop: false };
  }
  
  const stats = calculateResultStats(results);
  
  // 检查盈利停止条件
  if (stopOnWin && stats.totalProfit >= stopOnWin) {
    return {
      shouldStop: true,
      reason: `达到盈利目标: ${stats.totalProfit.toFixed(8)} >= ${stopOnWin}`
    };
  }
  
  // 检查亏损停止条件
  if (stopOnLoss && Math.abs(stats.totalProfit) >= stopOnLoss) {
    return {
      shouldStop: true,
      reason: `达到亏损限制: ${Math.abs(stats.totalProfit).toFixed(8)} >= ${stopOnLoss}`
    };
  }
  
  return { shouldStop: false };
}

/**
 * 格式化结果显示
 */
export function formatGameResult(result: GameResult): {
  betAmount: string;
  payout: string;
  profit: string;
  multiplier: string;
  profitColor: string;
} {
  const payout = calculatePayout(result);
  const profit = calculateProfit(result);
  
  return {
    betAmount: result.bet.toFixed(8),
    payout: payout.toFixed(8),
    profit: profit.toFixed(8),
    multiplier: `${result.fakePayout}x`,
    profitColor: profit >= 0 ? 'text-green-400' : 'text-red-400'
  };
}

/**
 * 生成结果摘要文本
 */
export function generateResultSummary(result: GameResult): string {
  const profit = calculateProfit(result);
  const isWin = profit >= 0;
  
  return `槽位 #${result.slotIndex + 1} | ${result.fakePayout}x | ${
    isWin ? '+' : ''
  }${profit.toFixed(8)} BTC`;
}

/**
 * 计算连胜/连败信息
 */
export function calculateStreaks(results: GameResult[]): {
  currentWinStreak: number;
  currentLossStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
} {
  if (results.length === 0) {
    return {
      currentWinStreak: 0,
      currentLossStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0
    };
  }
  
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;
  
  // 从最新结果开始计算当前连胜/连败
  for (let i = 0; i < results.length; i++) {
    const profit = calculateProfit(results[i]);
    const isWin = profit >= 0;
    
    if (i === 0) {
      // 当前连胜/连败
      if (isWin) {
        currentWinStreak = 1;
        currentLossStreak = 0;
      } else {
        currentWinStreak = 0;
        currentLossStreak = 1;
      }
    } else {
      const prevProfit = calculateProfit(results[i - 1]);
      const prevIsWin = prevProfit >= 0;
      
      if (isWin && prevIsWin) {
        currentWinStreak++;
      } else if (!isWin && !prevIsWin) {
        currentLossStreak++;
      } else {
        break; // 连胜/连败中断
      }
    }
  }
  
  // 计算历史最长连胜/连败
  for (let i = 0; i < results.length; i++) {
    const profit = calculateProfit(results[i]);
    const isWin = profit >= 0;
    
    if (isWin) {
      tempWinStreak++;
      tempLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
    } else {
      tempLossStreak++;
      tempWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
    }
  }
  
  return {
    currentWinStreak,
    currentLossStreak,
    longestWinStreak,
    longestLossStreak
  };
}