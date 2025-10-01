import { AutoBetConfig, GameResult } from '@/types/game';
import { shouldStopAutoBet } from '@/utils/gameLogic';

export class AutoBetManager {
  private isRunning = false;
  private currentRound = 0;
  private totalRounds = 0;
  private stopOnWin?: number;
  private stopOnLoss?: number;
  private results: GameResult[] = [];
  private onBetCallback?: () => Promise<GameResult>;
  private onCompleteCallback?: (reason: string) => void;
  private onUpdateCallback?: (round: number, total: number) => void;
  private timeoutId?: NodeJS.Timeout;

  constructor(config: AutoBetConfig) {
    this.totalRounds = config.rounds;
    this.stopOnWin = config.stopOnWin;
    this.stopOnLoss = config.stopOnLoss;
  }

  /**
   * 开始自动投注
   */
  start(
    onBet: () => Promise<GameResult>,
    onComplete: (reason: string) => void,
    onUpdate?: (round: number, total: number) => void
  ) {
    if (this.isRunning) {
      console.warn('Auto bet is already running');
      return;
    }

    this.onBetCallback = onBet;
    this.onCompleteCallback = onComplete;
    this.onUpdateCallback = onUpdate;
    this.isRunning = true;
    this.currentRound = 0;
    this.results = [];

    console.log(`Starting auto bet: ${this.totalRounds} rounds`);
    this.scheduleNextBet();
  }

  /**
   * 停止自动投注
   */
  stop(reason = '用户手动停止') {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }

    console.log(`Auto bet stopped: ${reason}`);
    this.onCompleteCallback?.(reason);
  }

  /**
   * 安排下一次投注
   */
  private scheduleNextBet() {
    if (!this.isRunning) return;

    // 检查是否达到轮数限制
    if (this.currentRound >= this.totalRounds) {
      this.stop(`完成所有 ${this.totalRounds} 轮投注`);
      return;
    }

    // 检查停止条件
    if (this.results.length > 0) {
      const stopCondition = shouldStopAutoBet(
        this.results,
        this.stopOnWin,
        this.stopOnLoss
      );
      
      if (stopCondition.shouldStop) {
        this.stop(stopCondition.reason || '达到停止条件');
        return;
      }
    }

    // 延迟下一次投注 (避免过于频繁)
    this.timeoutId = setTimeout(() => {
      this.executeBet();
    }, 1000); // 1秒间隔
  }

  /**
   * 执行单次投注
   */
  private async executeBet() {
    if (!this.isRunning || !this.onBetCallback) return;

    try {
      this.currentRound++;
      this.onUpdateCallback?.(this.currentRound, this.totalRounds);

      console.log(`Auto bet round ${this.currentRound}/${this.totalRounds}`);
      
      // 执行投注
      const result = await this.onBetCallback();
      this.results.push(result);

      // 安排下一次投注
      this.scheduleNextBet();
      
    } catch (error) {
      console.error('Auto bet failed:', error);
      this.stop('投注执行失败');
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      remainingRounds: this.totalRounds - this.currentRound,
      results: this.results
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AutoBetConfig>) {
    if (config.rounds !== undefined) {
      this.totalRounds = config.rounds;
    }
    if (config.stopOnWin !== undefined) {
      this.stopOnWin = config.stopOnWin;
    }
    if (config.stopOnLoss !== undefined) {
      this.stopOnLoss = config.stopOnLoss;
    }
  }
}

/**
 * 自动投注Hook
 */
import { useRef, useCallback } from 'react';
import { useGameConfig, useGameHistory, useGameState } from '@/contexts/GameContext';

export function useAutoBet() {
  const managerRef = useRef<AutoBetManager | null>(null);
  const { config, setAutoBet } = useGameConfig();
  const { addResult } = useGameHistory();
  const { setGameState } = useGameState();

  const startAutoBet = useCallback(async (
    autoBetConfig: AutoBetConfig,
    onSingleBet: () => Promise<GameResult>
  ) => {
    // 停止现有的自动投注
    if (managerRef.current) {
      managerRef.current.stop();
    }

    // 创建新的管理器
    managerRef.current = new AutoBetManager(autoBetConfig);

    // 更新配置状态
    setAutoBet(autoBetConfig);
    setGameState('dropping');

    // 开始自动投注
    managerRef.current.start(
      onSingleBet,
      (reason) => {
        // 完成回调
        console.log('Auto bet completed:', reason);
        setAutoBet(null);
        setGameState('idle');
      },
      (current, total) => {
        // 进度更新回调
        console.log(`Auto bet progress: ${current}/${total}`);
      }
    );

  }, [setAutoBet, setGameState]);

  const stopAutoBet = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stop('用户手动停止');
      managerRef.current = null;
    }
    setAutoBet(null);
    setGameState('idle');
  }, [setAutoBet, setGameState]);

  const getAutoBetStatus = useCallback(() => {
    return managerRef.current?.getStatus() || null;
  }, []);

  const isAutoBetting = config.autoBetConfig?.isActive || false;

  return {
    startAutoBet,
    stopAutoBet,
    getAutoBetStatus,
    isAutoBetting
  };
}

/**
 * 批量投注结果处理
 */
export class BatchResultProcessor {
  private results: GameResult[] = [];
  private onBatchComplete?: (results: GameResult[]) => void;
  private batchSize: number;
  
  constructor(batchSize = 10, onBatchComplete?: (results: GameResult[]) => void) {
    this.batchSize = batchSize;
    this.onBatchComplete = onBatchComplete;
  }

  addResult(result: GameResult) {
    this.results.push(result);
    
    if (this.results.length >= this.batchSize) {
      this.processBatch();
    }
  }

  private processBatch() {
    if (this.results.length === 0) return;
    
    const batch = [...this.results];
    this.results = [];
    
    this.onBatchComplete?.(batch);
  }

  flush() {
    if (this.results.length > 0) {
      this.processBatch();
    }
  }

  getQueuedResults() {
    return [...this.results];
  }
}

/**
 * 自动投注策略
 */
export interface AutoBetStrategy {
  name: string;
  description: string;
  adjustBet: (lastResult: GameResult, currentBet: number) => number;
}

export const AUTO_BET_STRATEGIES: AutoBetStrategy[] = [
  {
    name: 'fixed',
    description: '固定投注额',
    adjustBet: (lastResult, currentBet) => currentBet
  },
  {
    name: 'martingale',
    description: '马丁格尔 (输了加倍)',
    adjustBet: (lastResult, currentBet) => {
      const profit = (lastResult.fakePayout * lastResult.bet) - lastResult.bet;
      return profit < 0 ? currentBet * 2 : lastResult.bet;
    }
  },
  {
    name: 'fibonacci',
    description: '斐波那契数列',
    adjustBet: (lastResult, currentBet) => {
      // 简化的斐波那契实现
      const profit = (lastResult.fakePayout * lastResult.bet) - lastResult.bet;
      if (profit >= 0) {
        return Math.max(lastResult.bet * 0.618, 0.00000001); // 黄金比例回撤
      } else {
        return currentBet * 1.618; // 黄金比例增长
      }
    }
  },
  {
    name: 'paroli',
    description: 'Paroli (赢了加倍)',
    adjustBet: (lastResult, currentBet) => {
      const profit = (lastResult.fakePayout * lastResult.bet) - lastResult.bet;
      return profit > 0 ? currentBet * 2 : lastResult.bet;
    }
  }
];

/**
 * 获取策略调整后的投注额
 */
export function getAdjustedBet(
  strategy: string,
  lastResult: GameResult,
  currentBet: number
): number {
  const strategyConfig = AUTO_BET_STRATEGIES.find(s => s.name === strategy);
  if (!strategyConfig) {
    return currentBet;
  }
  
  const adjustedBet = strategyConfig.adjustBet(lastResult, currentBet);
  
  // 确保投注额在合理范围内
  return Math.max(0.00000001, Math.min(adjustedBet, 1)); // 最小值和最大值限制
}