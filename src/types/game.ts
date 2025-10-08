// 游戏配置接口
export interface GameConfig {
  bet: number;          // 投注额
  rows: number;         // 行数 (8-16)
  risk: RiskLevel;      // 风险等级
  autoBetConfig: AutoBetConfig | null;
}

// 风险等级
export type RiskLevel = 'low' | 'medium' | 'high';

// 自动投注配置
export interface AutoBetConfig {
  rounds: number;       // 投注轮数
  isActive: boolean;    // 是否激活
  stopOnWin?: number;   // 赢到多少停止
  stopOnLoss?: number;  // 输到多少停止
}

// 球的状态
export interface BallState {
  id: string;
  currentRow: number;   // 当前所在行
  currentCol: number;   // 当前所在列
  path: number[];       // 路径数组 (每行的偏移)
  isActive: boolean;    // 是否正在运动
  startTime: number;    // 开始时间
}

// 游戏结果
export interface GameResult {
  id: string;
  slotIndex: number;    // 落地槽位索引
  fakePayout: number;   // 假倍率
  bet: number;         // 投注额
  timestamp: number;    // 时间戳
  rows: number;        // 使用的行数
  risk: RiskLevel;     // 风险等级
}

// 历史记录
export interface GameHistory {
  results: GameResult[];
  totalBets: number;
  totalWins: number;
}

// 游戏状态枚举
export type GameState = 'idle' | 'dropping' | 'landed' | 'settling';

// 槽位倍率映射
export interface SlotMultiplier {
  index: number;
  multiplier: number;
  color: string;  // 用于UI显示颜色
}

// 预定义的倍率表 (根据你提供的配置)
export const PAYOUT_MULTIPLIERS: Record<number, Record<RiskLevel, number[]>> = {

  8: {
    low: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  9: {
    low: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
    medium: [18, 4, 1.7, 0.97, 0.5, 0.5, 0.9, 1.7, 4, 18],
    high: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43]
  },
  10: {
    low: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    medium: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    high: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76]
  },
  11: {
    low: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
    medium: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
    high: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120]
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  13: {
    low: [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
    medium: [43, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 43],
    high: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260]
  },
  14: {
    low: [7.1, 4, 1.9, 1.3, 1.1, 1, 0.5, 0.5, 1, 1.1, 1.3, 1.9, 4, 7.1],
    medium: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
    high: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
  },
  15: {
    low: [15, 8, 3, 2, 1.5, 1.1, 1, 1, 0.7, 0.7, 1, 1, 1.1, 1.5, 2, 3, 8, 15],
    medium: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
    high: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620]
  },
  16: {
    low: [16, 9, 2, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 26, 130, 1000]
  }
};

// 掉落機率分佈 (你提供的數據)
export const DROP_PROBABILITIES: Record<number, number[]> = {
 
  8: [0.39, 3.13, 10.94, 21.88, 27.34, 21.88, 10.94, 3.13, 0.39],
  9: [0.1953, 1.7578, 7.0313, 16.4063, 24.6094, 24.6094, 16.4063, 7.0313, 1.7578, 0.1953],
  10: [0.0977, 0.9766, 4.3945, 11.7188, 20.5078, 24.6094, 20.5078, 11.7188, 4.3945, 0.9766, 0.0977],
  11: [0.0488, 0.5371, 2.6855, 8.0566, 16.1133, 22.5586, 22.5586, 16.1133, 8.0566, 2.6855, 0.5371, 0.0488],
  12: [0.0244, 0.2930, 1.6133, 5.3711, 12.0850, 19.3359, 22.5586, 19.3359, 12.0850, 5.3711, 1.6133, 0.2930, 0.0244],
  13: [0.0122, 0.1587, 0.9521, 3.4912, 8.7280, 15.7104, 20.9473, 20.9473, 15.7104, 8.7280, 3.4912, 0.9521, 0.1587, 0.0122],
  14: [0.0061, 0.0854, 0.5554, 2.2217, 6.1096, 12.2192, 18.3289, 20.9473, 18.3289, 12.2192, 6.1096, 2.2217, 0.5554, 0.0854, 0.0061],
  15: [0.0031, 0.0458, 0.3204, 1.3885, 4.1656, 9.1644, 15.2740, 19.6381, 19.6381, 15.2740, 9.1644, 4.1656, 1.3885, 0.3204, 0.0458, 0.0031],
  16: [1.5625, 9.375, 23.4375, 31.25, 23.4375, 9.375, 1.5625],
};

// 根据倍率获取颜色 (参考原图配色)
export function getMultiplierColor(multiplier: number): string {
  if (multiplier >= 100) return '#dc2626'; // 深红色 - 110x
  if (multiplier >= 40) return '#ef4444';  // 红色 - 41x
  if (multiplier >= 10) return '#f97316';  // 橙色 - 10x
  if (multiplier >= 5) return '#f59e0b';   // 琥珀色 - 5x
  if (multiplier >= 3) return '#eab308';   // 黄色 - 3x
  if (multiplier >= 1.5) return '#facc15'; // 浅黄色 - 1.5x
  if (multiplier >= 1) return '#84cc16';   // 绿色 - 1x
  if (multiplier >= 0.5) return '#22d3ee'; // 青色 - 0.5x
  return '#6b7280';                        // 灰色 - 0.3x
}

// 获取倍率的渐变色 (参考原图配色)
export function getMultiplierGradient(multiplier: number): string {
  if (multiplier >= 100) return 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'; // 深红
  if (multiplier >= 40) return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';  // 红色
  if (multiplier >= 10) return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';  // 橙色
  if (multiplier >= 5) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';   // 琥珀
  if (multiplier >= 3) return 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)';   // 黄色
  if (multiplier >= 1.5) return 'linear-gradient(135deg, #facc15 0%, #eab308 100%)'; // 浅黄
  if (multiplier >= 1) return 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)';   // 绿色
  if (multiplier >= 0.5) return 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)'; // 青色
  return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';                       // 灰色
}

// 球路径生成函数类型
export type PathGenerator = (rows: number) => number[];

// 动画配置
export interface AnimationConfig {
  ballSize: number;     // 球的大小
  speed: number;        // 动画速度
  pegSize: number;      // 钉子大小
  boardWidth: number;   // 棋盘宽度
  boardHeight: number;  // 棋盘高度
}