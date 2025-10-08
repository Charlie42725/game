import { PathGenerator } from '@/types/game';

/**
 * 碰撞點信息
 */
export interface CollisionPoint {
  x: number;
  y: number;
  timestamp: number;
  id: string;
}

/**
 * 球的物理狀態
 */
export interface BallPhysicsState {
  x: number;
  y: number;
  vx: number; // x方向速度
  vy: number; // y方向速度
  radius: number;
  bounces: CollisionPoint[]; // 碰撞記錄
}

/**
 * 釘子位置和屬性
 */
export interface Peg {
  x: number;
  y: number;
  radius: number;
  row: number;
  col: number;
}

/**
 * 物理常數
 */
const PHYSICS_CONSTANTS = {
  GRAVITY: 0.8,           // 重力加速度
  BOUNCE_DAMPING: 0.7,    // 彈跳阻尼
  FRICTION: 0.99,         // 摩擦係數
  PEG_RADIUS: 8,          // 釘子半徑
  BALL_RADIUS: 12,        // 球半徑
  MIN_VELOCITY: 0.1,      // 最小速度閾值
  COLLISION_RESTITUTION: 0.8, // 恢復係數
  COLLISION_FORCE: 5      // 碰撞力度
};

/**
 * 生成釘子陣列
 */
export function generatePegs(
  rows: number, 
  boardWidth: number, 
  boardHeight: number
): Peg[] {
  const pegs: Peg[] = [];
  const rowHeight = boardHeight / (rows + 2);
  
  for (let row = 1; row <= rows; row++) {
    const pegsInRow = row + 1;
    const pegSpacing = boardWidth / (pegsInRow + 1);
    
    for (let col = 0; col < pegsInRow; col++) {
      const x = pegSpacing * (col + 1);
      const y = rowHeight * (row + 1);
      
      pegs.push({
        x,
        y,
        radius: PHYSICS_CONSTANTS.PEG_RADIUS,
        row,
        col
      });
    }
  }
  
  return pegs;
}

/**
 * 檢測球與釘子的碰撞
 */
function detectCollision(ball: BallPhysicsState, peg: Peg): boolean {
  const dx = ball.x - peg.x;
  const dy = ball.y - peg.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance <= (ball.radius + peg.radius);
}

/**
 * 處理球與釘子的碰撞
 */
function handleCollision(
  ball: BallPhysicsState, 
  peg: Peg, 
  addCollisionPoint: (point: CollisionPoint) => void
): void {
  const dx = ball.x - peg.x;
  const dy = ball.y - peg.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return;
  
  // 正規化碰撞法向量
  const nx = dx / distance;
  const ny = dy / distance;
  
  // 分離球和釘子
  const overlap = (ball.radius + peg.radius) - distance;
  ball.x += nx * overlap * 0.6;
  ball.y += ny * overlap * 0.6;
  
  // 計算相對速度
  const relativeVelX = ball.vx;
  const relativeVelY = ball.vy;
  
  // 計算沿法向量的速度分量
  const velAlongNormal = relativeVelX * nx + relativeVelY * ny;
  
  // 如果物體已經分離，則不處理
  if (velAlongNormal > 0) return;
  
  // 應用碰撞響應
  const restitution = PHYSICS_CONSTANTS.COLLISION_RESTITUTION;
  const j = -(1 + restitution) * velAlongNormal;
  
  // 更新速度
  ball.vx += j * nx * PHYSICS_CONSTANTS.COLLISION_FORCE;
  ball.vy += j * ny * PHYSICS_CONSTANTS.COLLISION_FORCE;
  
  // 添加一些隨機性讓路徑更有趣
  const randomFactor = 0.3;
  ball.vx += (Math.random() - 0.5) * randomFactor;
  ball.vy += (Math.random() - 0.5) * randomFactor * 0.5;
  
  // 記錄碰撞點
  addCollisionPoint({
    x: peg.x,
    y: peg.y,
    timestamp: Date.now(),
    id: `${peg.row}-${peg.col}-${Date.now()}`
  });
}

/**
 * 更新球的物理狀態
 */
export function updateBallPhysics(
  ball: BallPhysicsState,
  pegs: Peg[],
  deltaTime: number,
  boardWidth: number,
  boardHeight: number,
  addCollisionPoint: (point: CollisionPoint) => void
): void {
  // 應用重力
  ball.vy += PHYSICS_CONSTANTS.GRAVITY * deltaTime;
  
  // 應用摩擦
  ball.vx *= PHYSICS_CONSTANTS.FRICTION;
  ball.vy *= PHYSICS_CONSTANTS.FRICTION;
  
  // 更新位置
  ball.x += ball.vx * deltaTime;
  ball.y += ball.vy * deltaTime;
  
  // 檢測與釘子的碰撞
  for (const peg of pegs) {
    if (detectCollision(ball, peg)) {
      handleCollision(ball, peg, addCollisionPoint);
    }
  }
  
  // 邊界碰撞檢測
  if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= boardWidth) {
    ball.vx = -ball.vx * PHYSICS_CONSTANTS.BOUNCE_DAMPING;
    ball.x = Math.max(ball.radius, Math.min(boardWidth - ball.radius, ball.x));
  }
  
  // 確保球不會超出底部
  if (ball.y + ball.radius >= boardHeight) {
    ball.y = boardHeight - ball.radius;
    ball.vy = 0;
    ball.vx *= 0.8; // 著地時減速
  }
}

/**
 * 創建初始球狀態
 */
export function createInitialBallState(
  startX: number,
  startY: number
): BallPhysicsState {
  return {
    x: startX,
    y: startY,
    vx: (Math.random() - 0.5) * 0.5, // 輕微的初始水平速度
    vy: 1, // 初始向下速度
    radius: PHYSICS_CONSTANTS.BALL_RADIUS,
    bounces: []
  };
}

/**
 * 計算最終落入的槽位
 */
export function calculateFinalSlot(
  ballX: number,
  boardWidth: number,
  rows: number
): number {
  const slotWidth = boardWidth / (rows + 1);
  const slot = Math.floor(ballX / slotWidth);
  return Math.max(0, Math.min(rows, slot));
}

/**
 * 生成具有物理效果的球路徑（用於確定性結果）
 */
export function generatePhysicsBasedPath(
  rows: number,
  targetSlot: number,
  boardWidth: number,
  boardHeight: number
): { x: number; y: number }[] {
  const pegs = generatePegs(rows, boardWidth, boardHeight);
  const startX = boardWidth / 2;
  const startY = 0;
  
  const ball = createInitialBallState(startX, startY);
  const path: { x: number; y: number }[] = [];
  
  // 添加初始位置
  path.push({ x: ball.x, y: ball.y });
  
  // 為了達到目標槽位，我們需要引導球朝向正確方向
  const targetX = (targetSlot + 0.5) * (boardWidth / (rows + 1));
  const directionBias = (targetX - startX) / boardWidth;
  
  // 模擬物理運動
  const deltaTime = 16.67 / 1000; // ~60fps
  let steps = 0;
  const maxSteps = 300; // 防止無限循環
  
  while (ball.y < boardHeight - ball.radius && steps < maxSteps) {
    // 添加輕微的方向偏差來引導球
    ball.vx += directionBias * 0.02;
    
    updateBallPhysics(ball, pegs, deltaTime, boardWidth, boardHeight, () => {});
    
    // 每5步記錄一次位置（降低路徑密度）
    if (steps % 5 === 0) {
      path.push({ x: ball.x, y: ball.y });
    }
    
    steps++;
  }
  
  // 確保最終位置在底部
  path.push({ x: ball.x, y: boardHeight });
  
  return path;
}