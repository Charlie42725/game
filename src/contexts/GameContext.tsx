'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  GameConfig, 
  BallState, 
  GameResult, 
  GameHistory, 
  GameState, 
  RiskLevel, 
  AutoBetConfig 
} from '@/types/game';

// 游戏状态接口
interface GameContextState {
  gameState: GameState;
  config: GameConfig;
  balls: BallState[];
  history: GameHistory;
  balance: number; // MVP 版本只是显示用，不计算真实盈亏
}

// 动作类型
type GameAction =
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'UPDATE_CONFIG'; payload: Partial<GameConfig> }
  | { type: 'SET_BET'; payload: number }
  | { type: 'SET_ROWS'; payload: number }
  | { type: 'SET_RISK'; payload: RiskLevel }
  | { type: 'SET_AUTO_BET'; payload: AutoBetConfig | null }
  | { type: 'ADD_BALL'; payload: BallState }
  | { type: 'UPDATE_BALL'; payload: { id: string; updates: Partial<BallState> } }
  | { type: 'REMOVE_BALL'; payload: string }
  | { type: 'ADD_RESULT'; payload: GameResult }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'RESET_GAME' };

// 初始状态
const initialState: GameContextState = {
  gameState: 'idle',
  config: {
    bet: 0.00000001,
    rows: 16,
    risk: 'medium',
    autoBetConfig: null
  },
  balls: [],
  history: {
    results: [],
    totalBets: 0,
    totalWins: 0
  },
  balance: 1000 // MVP 版本的假余额
};

// Reducer 函数
function gameReducer(state: GameContextState, action: GameAction): GameContextState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };

    case 'UPDATE_CONFIG':
      return { 
        ...state, 
        config: { ...state.config, ...action.payload } 
      };

    case 'SET_BET':
      return { 
        ...state, 
        config: { ...state.config, bet: action.payload } 
      };

    case 'SET_ROWS':
      return { 
        ...state, 
        config: { ...state.config, rows: action.payload } 
      };

    case 'SET_RISK':
      return { 
        ...state, 
        config: { ...state.config, risk: action.payload } 
      };

    case 'SET_AUTO_BET':
      return { 
        ...state, 
        config: { ...state.config, autoBetConfig: action.payload } 
      };

    case 'ADD_BALL':
      return { 
        ...state, 
        balls: [...state.balls, action.payload] 
      };

    case 'UPDATE_BALL':
      return {
        ...state,
        balls: state.balls.map(ball =>
          ball.id === action.payload.id
            ? { ...ball, ...action.payload.updates }
            : ball
        )
      };

    case 'REMOVE_BALL':
      return {
        ...state,
        balls: state.balls.filter(ball => ball.id !== action.payload)
      };

    case 'ADD_RESULT':
      const newResult = action.payload;
      return {
        ...state,
        history: {
          results: [newResult, ...state.history.results].slice(0, 100), // 最多保留100条记录
          totalBets: state.history.totalBets + newResult.bet,
          totalWins: state.history.totalWins + (newResult.fakePayout * newResult.bet)
        }
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: {
          results: [],
          totalBets: 0,
          totalWins: 0
        }
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        config: state.config, // 保留配置
        balance: state.balance // 保留余额
      };

    default:
      return state;
  }
}

// Context
interface GameContextType {
  state: GameContextState;
  dispatch: React.Dispatch<GameAction>;
  // 辅助函数
  canBet: () => boolean;
  isAutoBetting: () => boolean;
  getLastResult: () => GameResult | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider 组件
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // 辅助函数
  const canBet = (): boolean => {
    return state.gameState === 'idle' && state.balls.length === 0 && state.config.bet > 0;
  };

  const isAutoBetting = (): boolean => {
    return state.config.autoBetConfig?.isActive === true;
  };

  const getLastResult = (): GameResult | null => {
    return state.history.results[0] || null;
  };

  const contextValue: GameContextType = {
    state,
    dispatch,
    canBet,
    isAutoBetting,
    getLastResult
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// 辅助 Hook 们
export function useGameConfig() {
  const { state, dispatch } = useGame();
  return {
    config: state.config,
    setBet: (bet: number) => dispatch({ type: 'SET_BET', payload: bet }),
    setRows: (rows: number) => dispatch({ type: 'SET_ROWS', payload: rows }),
    setRisk: (risk: RiskLevel) => dispatch({ type: 'SET_RISK', payload: risk }),
    setAutoBet: (config: AutoBetConfig | null) => dispatch({ type: 'SET_AUTO_BET', payload: config })
  };
}

export function useGameState() {
  const { state, dispatch, canBet, isAutoBetting } = useGame();
  return {
    gameState: state.gameState,
    setGameState: (gameState: GameState) => dispatch({ type: 'SET_GAME_STATE', payload: gameState }),
    canBet,
    isAutoBetting
  };
}

export function useBalls() {
  const { state, dispatch } = useGame();
  return {
    balls: state.balls,
    addBall: (ball: BallState) => dispatch({ type: 'ADD_BALL', payload: ball }),
    updateBall: (id: string, updates: Partial<BallState>) => 
      dispatch({ type: 'UPDATE_BALL', payload: { id, updates } }),
    removeBall: (id: string) => dispatch({ type: 'REMOVE_BALL', payload: id })
  };
}

export function useGameHistory() {
  const { state, dispatch } = useGame();
  return {
    history: state.history,
    addResult: (result: GameResult) => dispatch({ type: 'ADD_RESULT', payload: result }),
    clearHistory: () => dispatch({ type: 'CLEAR_HISTORY' }),
    getLastResult: () => state.history.results[0] || null
  };
}