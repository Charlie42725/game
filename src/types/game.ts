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

// 预定义的倍率表 (根据参考图片调整，左右对称)
export const PAYOUT_MULTIPLIERS: Record<number, number[]> = {
  8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
  9: [5.6, 2.0, 1.6, 1.0, 0.7, 0.7, 1.0, 1.6, 2.0, 5.6],
  10: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
  11: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  12: [10.0, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10.0],
  13: [8.1, 4.0, 3.0, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3.0, 4.0, 8.1],
  14: [7.1, 4.0, 1.9, 1.4, 1.3, 1.1, 1.0, 0.5, 1.0, 1.1, 1.3, 1.4, 1.9, 4.0, 7.1],
  15: [15.0, 8.0, 3.0, 2.0, 1.5, 1.1, 1.0, 0.7, 0.7, 1.0, 1.1, 1.5, 2.0, 3.0, 8.0, 15.0],
  16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
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