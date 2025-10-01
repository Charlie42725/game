import { PathGenerator } from '@/types/game';

/**
 * 生成球的掉落路径
 * 从顶部中央开始，每层向左或右偏移
 * 返回每层的列位置数组
 */
export const generateBallPath: PathGenerator = (rows: number): number[] => {
  const path: number[] = [];
  let currentPosition = rows / 2; // 从中央开始
  
  // 生成球路徑
  path.push(currentPosition);
  
  // 生成每一层的位置
  for (let row = 1; row <= rows; row++) {
    // 每层随机向左(-0.5)或右(+0.5)偏移
    const direction = Math.random() < 0.5 ? -0.5 : 0.5;
    currentPosition += direction;
    
    // 确保不超出边界
    currentPosition = Math.max(0, Math.min(rows, currentPosition));
    
    path.push(currentPosition);
  }
  
  return path;
};

/**
 * 根据最终位置计算落在哪个槽位
 */
export function calculateSlotIndex(finalPosition: number, rows: number): number {
  // 槽位数量 = 行数 + 1
  const slotCount = rows + 1;
  
  // 将最终位置映射到槽位索引 (0 到 slotCount-1)
  let slotIndex = Math.floor(finalPosition);
  
  // 确保在有效范围内
  slotIndex = Math.max(0, Math.min(slotCount - 1, slotIndex));
  
  return slotIndex;
}

/**
 * 计算球在特定行列的屏幕坐标
 */
export interface BallPosition {
  x: number;
  y: number;
}

export function calculateBallPosition(
  row: number, 
  col: number, 
  boardWidth: number, 
  boardHeight: number,
  rows: number
): BallPosition {
  // 计算每行的垂直间距
  const rowHeight = boardHeight / (rows + 1);
  
  // 计算每列的水平间距
  const colWidth = boardWidth / (rows + 1);
  
  // 计算位置 - 修正坐标计算，确保球从顶部正确开始
  const x = col * colWidth;
  const y = row * rowHeight + rowHeight * 0.5; // 球从每行的中间开始
  
  return { x, y };
}

/**
 * 获取指定行数的钉子位置
 */
export interface PegPosition {
  row: number;
  col: number;
  x: number;
  y: number;
}

export function getPegPositions(
  rows: number,
  boardWidth: number,
  boardHeight: number
): PegPosition[] {
  const pegs: PegPosition[] = [];
  const rowHeight = boardHeight / (rows + 1);
  const colWidth = boardWidth / (rows + 1);
  
  // 生成每行的钉子
  for (let row = 1; row < rows; row++) {
    // 每行的钉子数量递增
    const pegsInRow = row + 1;
    
    for (let col = 0; col < pegsInRow; col++) {
      // 计算钉子在该行的居中位置
      const startOffset = (rows + 1 - pegsInRow) / 2;
      const pegCol = startOffset + col;
      
      const x = pegCol * colWidth + colWidth / 2;
      const y = row * rowHeight + rowHeight / 2;
      
      pegs.push({
        row,
        col,
        x,
        y
      });
    }
  }
  
  return pegs;
}

/**
 * 验证路径是否有效
 */
export function validatePath(path: number[], rows: number): boolean {
  if (path.length !== rows + 1) {
    return false;
  }
  
  // 检查每步移动是否合法 (只能向左或右移动0.5)
  for (let i = 1; i < path.length; i++) {
    const diff = Math.abs(path[i] - path[i - 1]);
    if (diff !== 0.5) {
      return false;
    }
  }
  
  return true;
}

/**
 * 生成用于演示的预设路径
 */
export function generateDemoPath(rows: number, targetSlot: number): number[] {
  const path: number[] = [];
  let currentPosition = rows / 2; // 从中央开始
  
  path.push(currentPosition);
  
  // 计算需要到达目标槽位的总偏移
  const targetPosition = targetSlot + 0.5;
  const totalOffset = targetPosition - currentPosition;
  const stepsNeeded = rows;
  const averageStep = totalOffset / stepsNeeded;
  
  // 生成朝向目标的路径，但仍有随机性
  for (let row = 1; row <= rows; row++) {
    let direction: number;
    
    if (Math.abs(averageStep) < 0.1) {
      // 如果接近目标，随机移动
      direction = Math.random() < 0.5 ? -0.5 : 0.5;
    } else {
      // 70% 概率朝向目标，30% 概率随机
      if (Math.random() < 0.7) {
        direction = averageStep > 0 ? 0.5 : -0.5;
      } else {
        direction = Math.random() < 0.5 ? -0.5 : 0.5;
      }
    }
    
    currentPosition += direction;
    
    // 确保不超出边界
    currentPosition = Math.max(0, Math.min(rows, currentPosition));
    
    path.push(currentPosition);
  }
  
  return path;
}

/**
 * 插值函数，用于平滑动画
 */
export function interpolatePath(path: number[], progress: number): { row: number; col: number } {
  // progress 从 0 到 1
  const totalSteps = path.length - 1;
  const currentStep = progress * totalSteps;
  const stepIndex = Math.floor(currentStep);
  const stepProgress = currentStep - stepIndex;
  
  if (stepIndex >= totalSteps) {
    return {
      row: totalSteps,
      col: path[path.length - 1]
    };
  }
  
  // 在当前步骤和下一步骤之间插值
  const currentCol = path[stepIndex];
  const nextCol = path[stepIndex + 1];
  const interpolatedCol = currentCol + (nextCol - currentCol) * stepProgress;
  
  return {
    row: stepIndex + stepProgress,
    col: interpolatedCol
  };
}