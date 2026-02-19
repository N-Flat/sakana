'use client';

import { useEffect, useRef, useCallback } from 'react';

// ========================================
// 型定義
// ========================================

interface Fish {
  x: number;
  y: number;
  size: number;
  speed: number;
  type: number;
  color: string;
  direction: 1 | -1;
  wobble: number;
  wobbleSpeed: number;
  wobbleAmount: number;
  opacity: number;
}

interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
}

interface LightRay {
  x: number;
  width: number;
  opacity: number;
  speed: number;
}

interface Coral {
  x: number;
  y: number;
  type: number;
  size: number;
  color: string;
  swayOffset: number;
  bubbleSizes: number[];
}

interface Rock {
  x: number;
  y: number;
  width: number;
  height: number;
  points: { x: number; y: number }[];
  color: string;
  highlightOffset: number;
}

interface Seaweed {
  x: number;
  baseY: number;
  segments: number;
  segmentHeight: number;
  color: string;
  swayOffset: number;
  swaySpeed: number;
}

// ========================================
// 色パレット（水色〜青系、控えめ）
// ========================================

const COLORS = {
  // 背景グラデーション
  bgTop: 'rgba(230, 245, 255, 1)',      // 薄い水色
  bgBottom: 'rgba(150, 200, 230, 1)',   // 少し濃い青

  // 魚の色（薄め、透明度高め）
  fish: [
    'rgba(100, 160, 200, 0.4)',   // 水色
    'rgba(120, 180, 220, 0.35)',  // 明るい水色
    'rgba(80, 140, 190, 0.4)',    // 青み
    'rgba(90, 170, 200, 0.35)',   // シアン寄り
    'rgba(110, 150, 180, 0.4)',   // グレイッシュブルー
    'rgba(70, 130, 170, 0.35)',   // 深め
  ],

  // サンゴの色（パステル、透明度高め）
  coral: [
    'rgba(200, 180, 200, 0.4)',   // 薄紫
    'rgba(180, 200, 180, 0.4)',   // 薄緑
    'rgba(200, 190, 170, 0.4)',   // ベージュ
    'rgba(190, 200, 210, 0.4)',   // 薄青
    'rgba(210, 190, 190, 0.4)',   // 薄ピンク
  ],

  // 岩の色
  rock: [
    'rgba(120, 130, 140, 0.25)',
    'rgba(100, 115, 130, 0.25)',
    'rgba(130, 140, 150, 0.2)',
  ],

  // 海藻の色
  seaweed: [
    'rgba(100, 160, 120, 0.25)',
    'rgba(90, 150, 130, 0.25)',
    'rgba(80, 140, 110, 0.25)',
  ],

  // 気泡
  bubble: 'rgba(255, 255, 255, 0.3)',

  // 光線
  lightRay: 'rgba(255, 255, 255, 0.03)',
};

// ========================================
// ユーティリティ関数
// ========================================

const random = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1));

// ========================================
// 魚の形状を描画する関数（イラスト調シルエット）
// ========================================

const drawFish = (
  ctx: CanvasRenderingContext2D,
  fish: Fish,
  time: number
) => {
  const { x, y, size, type, color, direction, wobble, wobbleSpeed, wobbleAmount } = fish;
  
  // ゆらゆら動き
  const wobbleY = Math.sin(time * wobbleSpeed + wobble) * wobbleAmount;
  const currentY = y + wobbleY;
  
  ctx.save();
  ctx.translate(x, currentY);
  ctx.scale(direction, 1);
  ctx.fillStyle = color;
  ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.5)');
  ctx.lineWidth = 1;

  ctx.beginPath();

  switch (type) {
    case 0: // 小さな丸い魚
      // 体
      ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // 尾びれ
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, 0);
      ctx.lineTo(-size * 1.4, -size * 0.4);
      ctx.lineTo(-size * 1.4, size * 0.4);
      ctx.closePath();
      ctx.fill();
      break;

    case 1: // スリムな魚
      // 体
      ctx.ellipse(0, 0, size * 1.2, size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // 尾びれ
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(-size * 1.6, -size * 0.5);
      ctx.lineTo(-size * 1.6, size * 0.5);
      ctx.closePath();
      ctx.fill();
      // 背びれ
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.35);
      ctx.quadraticCurveTo(size * 0.2, -size * 0.8, size * 0.5, -size * 0.35);
      ctx.fill();
      break;

    case 2: // ふっくらした魚
      // 体
      ctx.ellipse(0, 0, size * 0.9, size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // 尾びれ
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, 0);
      ctx.quadraticCurveTo(-size * 1.3, -size * 0.6, -size * 1.5, -size * 0.3);
      ctx.quadraticCurveTo(-size * 1.2, 0, -size * 1.5, size * 0.3);
      ctx.quadraticCurveTo(-size * 1.3, size * 0.6, -size * 0.7, 0);
      ctx.fill();
      break;

    case 3: // エンゼルフィッシュ風
      // 体（菱形っぽく）
      ctx.moveTo(size * 0.8, 0);
      ctx.quadraticCurveTo(size * 0.3, -size * 0.8, -size * 0.3, -size * 0.5);
      ctx.quadraticCurveTo(-size * 0.6, 0, -size * 0.3, size * 0.5);
      ctx.quadraticCurveTo(size * 0.3, size * 0.8, size * 0.8, 0);
      ctx.fill();
      // 尾びれ
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, 0);
      ctx.lineTo(-size * 1.1, -size * 0.3);
      ctx.lineTo(-size * 1.1, size * 0.3);
      ctx.closePath();
      ctx.fill();
      break;

    case 4: // 小魚の群れ用（シンプル）
      ctx.ellipse(0, 0, size * 0.8, size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, 0);
      ctx.lineTo(-size * 1.1, -size * 0.25);
      ctx.lineTo(-size * 1.1, size * 0.25);
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
};

// ========================================
// サンゴを描画する関数
// ========================================

const drawCoral = (
  ctx: CanvasRenderingContext2D,
  coral: Coral,
  time: number
) => {
  const { x, y, type, size, color, swayOffset, bubbleSizes } = coral;
  const sway = Math.sin(time * 0.5 + swayOffset) * 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;

  switch (type) {
    case 0: // 枝サンゴ
      for (let i = 0; i < 5; i++) {
        const angle = (i - 2) * 0.3;
        const branchSway = sway * (1 + i * 0.1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          Math.sin(angle) * size * 0.5 + branchSway,
          -size * 0.5,
          Math.sin(angle) * size * 0.8 + branchSway * 1.5,
          -size * (0.7 + i * 0.1)
        );
        ctx.quadraticCurveTo(
          Math.sin(angle) * size * 0.8 + branchSway * 1.5 + 5,
          -size * (0.7 + i * 0.1),
          Math.sin(angle) * size * 0.5 + branchSway + 3,
          -size * 0.4
        );
        ctx.quadraticCurveTo(3, -size * 0.2, 5, 0);
        ctx.fill();
      }
      break;

    case 1: // 丸いサンゴ
      for (let i = 0; i < 7; i++) {
        const bx = (i - 3) * size * 0.25;
        const by = -Math.abs(i - 3) * size * 0.1;
        const bs = size * bubbleSizes[i];
        ctx.beginPath();
        ctx.arc(bx + sway * 0.5, by - size * 0.3, bs, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 2: // 扇形サンゴ
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-size * 0.6 + sway, -size * 0.8, -size * 0.3 + sway * 1.2, -size);
      ctx.quadraticCurveTo(sway * 1.5, -size * 1.1, size * 0.3 + sway * 1.2, -size);
      ctx.quadraticCurveTo(size * 0.6 + sway, -size * 0.8, 0, 0);
      ctx.fill();
      // 内側の模様
      ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.15)');
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const px = (i - 2) * size * 0.15;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(px + sway, -size * 0.5, px * 1.5 + sway * 1.2, -size * 0.85);
        ctx.stroke();
      }
      break;

    case 3: // チューブ状サンゴ
      for (let i = 0; i < 4; i++) {
        const tx = (i - 1.5) * size * 0.3;
        const th = size * (0.6 + i * 0.15);
        ctx.beginPath();
        ctx.ellipse(tx + sway * 0.3, -th / 2, size * 0.12, th / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // 穴
        ctx.fillStyle = color.replace(/[\d.]+\)$/, '0.15)');
        ctx.beginPath();
        ctx.ellipse(tx + sway * 0.3, -th + size * 0.1, size * 0.08, size * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
      }
      break;
  }

  ctx.restore();
};

// ========================================
// 岩を描画する関数
// ========================================

const drawRock = (ctx: CanvasRenderingContext2D, rock: Rock) => {
  const { x, y, points, color, highlightOffset } = rock;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    const cpY = Math.min(prev.y, curr.y) - highlightOffset;
    ctx.quadraticCurveTo(cpX, cpY, curr.x, curr.y);
  }
  ctx.closePath();
  ctx.fill();

  // 岩の質感（薄いハイライト）- 固定値
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  ctx.ellipse(0, -rock.height * 0.3, rock.width * 0.2, rock.height * 0.15, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

// ========================================
// 海藻を描画する関数
// ========================================

const drawSeaweed = (
  ctx: CanvasRenderingContext2D,
  seaweed: Seaweed,
  time: number
) => {
  const { x, baseY, segments, segmentHeight, color, swayOffset, swaySpeed } = seaweed;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x, baseY);

  let currentX = x;
  let currentY = baseY;

  for (let i = 0; i < segments; i++) {
    const swayAmount = (i + 1) * 3;
    const sway = Math.sin(time * swaySpeed + swayOffset + i * 0.5) * swayAmount;
    currentX = x + sway;
    currentY -= segmentHeight;
    ctx.lineTo(currentX, currentY);
  }

  ctx.stroke();

  // 葉っぱ
  ctx.fillStyle = color;
  for (let i = 1; i < segments; i += 2) {
    const leafY = baseY - i * segmentHeight;
    const sway = Math.sin(time * swaySpeed + swayOffset + i * 0.5) * (i * 3);
    const leafX = x + sway;
    
    ctx.beginPath();
    ctx.ellipse(leafX + 8, leafY, 12, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(leafX - 8, leafY - 5, 10, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

// ========================================
// 気泡を描画する関数
// ========================================

const drawBubble = (ctx: CanvasRenderingContext2D, bubble: Bubble) => {
  const { x, y, size, opacity } = bubble;

  ctx.save();
  
  // 外側
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
  ctx.fill();
  
  // ハイライト
  ctx.beginPath();
  ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
  ctx.fill();

  // 輪郭
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.4})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
};

// ========================================
// 光線を描画する関数
// ========================================

const drawLightRays = (
  ctx: CanvasRenderingContext2D,
  rays: LightRay[],
  canvasHeight: number
) => {
  rays.forEach(ray => {
    const gradient = ctx.createLinearGradient(ray.x, 0, ray.x, canvasHeight * 0.7);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${ray.opacity})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(ray.x - ray.width / 2, 0);
    ctx.lineTo(ray.x + ray.width / 2, 0);
    ctx.lineTo(ray.x + ray.width * 1.5, canvasHeight * 0.7);
    ctx.lineTo(ray.x - ray.width * 0.5, canvasHeight * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
};

// ========================================
// メインコンポーネント
// ========================================

export default function SeaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const fishRef = useRef<Fish[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const coralsRef = useRef<Coral[]>([]);
  const rocksRef = useRef<Rock[]>([]);
  const seaweedsRef = useRef<Seaweed[]>([]);
  const lightRaysRef = useRef<LightRay[]>([]);
  const timeRef = useRef(0);

  // 初期化関数
  const initializeElements = useCallback((width: number, height: number) => {
    // 魚の初期化（15〜20匹）
    fishRef.current = [];
    const fishCount = randomInt(15, 18);
    for (let i = 0; i < fishCount; i++) {
      const direction = Math.random() > 0.15 ? 1 : -1 as 1 | -1;
      fishRef.current.push({
        x: random(0, width),
        y: random(height * 0.1, height * 0.75),
        size: random(15, 45),
        speed: random(0.3, 1.2),
        type: randomInt(0, 4),
        color: COLORS.fish[randomInt(0, COLORS.fish.length - 1)],
        direction,
        wobble: random(0, Math.PI * 2),
        wobbleSpeed: random(1, 3),
        wobbleAmount: random(2, 8),
        opacity: random(0.3, 0.5),
      });
    }

    // 小魚の群れを追加（3グループ）
    for (let g = 0; g < 3; g++) {
      const groupX = random(0, width);
      const groupY = random(height * 0.2, height * 0.5);
      const groupDirection = Math.random() > 0.3 ? 1 : -1 as 1 | -1;
      const groupColor = COLORS.fish[randomInt(0, COLORS.fish.length - 1)];
      
      for (let i = 0; i < randomInt(5, 8); i++) {
        fishRef.current.push({
          x: groupX + random(-50, 50),
          y: groupY + random(-30, 30),
          size: random(8, 14),
          speed: random(0.5, 0.8),
          type: 4,
          color: groupColor,
          direction: groupDirection,
          wobble: random(0, Math.PI * 2),
          wobbleSpeed: random(2, 4),
          wobbleAmount: random(3, 6),
          opacity: random(0.25, 0.4),
        });
      }
    }

    // 気泡の初期化（20〜30個）
    bubblesRef.current = [];
    const bubbleCount = randomInt(20, 30);
    for (let i = 0; i < bubbleCount; i++) {
      bubblesRef.current.push({
        x: random(0, width),
        y: random(0, height),
        size: random(2, 8),
        speed: random(0.3, 1),
        wobble: random(0, Math.PI * 2),
        wobbleSpeed: random(1, 3),
        opacity: random(0.2, 0.5),
      });
    }

    // 岩の初期化（5〜7個）
    rocksRef.current = [];
    const rockCount = randomInt(5, 7);
    const rockSpacing = width / (rockCount + 1);
    for (let i = 0; i < rockCount; i++) {
      const rockWidth = random(80, 180);
      const rockHeight = random(40, 100);
      const rockX = rockSpacing * (i + 1) + random(-50, 50);
      const points: { x: number; y: number }[] = [];
      const pointCount = randomInt(5, 8);
      
      for (let j = 0; j <= pointCount; j++) {
        const px = -rockWidth / 2 + (rockWidth / pointCount) * j;
        const py = j === 0 || j === pointCount ? 0 : -rockHeight * random(0.5, 1);
        points.push({ x: px, y: py });
      }

      rocksRef.current.push({
        x: rockX,
        y: height,
        width: rockWidth,
        height: rockHeight,
        points,
        color: COLORS.rock[randomInt(0, COLORS.rock.length - 1)],
        highlightOffset: random(5, 15),
      });
    }

    // サンゴの初期化（8〜12個）
    coralsRef.current = [];
    const coralCount = randomInt(8, 12);
    for (let i = 0; i < coralCount; i++) {
      // 丸いサンゴ用のサイズを事前計算
      const bubbleSizes: number[] = [];
      for (let j = 0; j < 7; j++) {
        bubbleSizes.push(0.2 + Math.random() * 0.15);
      }
      
      coralsRef.current.push({
        x: random(50, width - 50),
        y: height - random(5, 30),
        type: randomInt(0, 3),
        size: random(30, 70),
        color: COLORS.coral[randomInt(0, COLORS.coral.length - 1)],
        swayOffset: random(0, Math.PI * 2),
        bubbleSizes,
      });
    }

    // 海藻の初期化（6〜10本）
    seaweedsRef.current = [];
    const seaweedCount = randomInt(6, 10);
    for (let i = 0; i < seaweedCount; i++) {
      seaweedsRef.current.push({
        x: random(30, width - 30),
        baseY: height,
        segments: randomInt(5, 10),
        segmentHeight: random(15, 25),
        color: COLORS.seaweed[randomInt(0, COLORS.seaweed.length - 1)],
        swayOffset: random(0, Math.PI * 2),
        swaySpeed: random(0.8, 1.5),
      });
    }

    // 光線の初期化（4〜6本）
    lightRaysRef.current = [];
    const rayCount = randomInt(4, 6);
    for (let i = 0; i < rayCount; i++) {
      lightRaysRef.current.push({
        x: random(0, width),
        width: random(30, 80),
        opacity: random(0.02, 0.05),
        speed: random(0.1, 0.3),
      });
    }
  }, []);

  // アニメーションループ
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    timeRef.current += 0.016; // 約60fps

    // 背景グラデーション（下が濃い）
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, COLORS.bgTop);
    bgGradient.addColorStop(1, COLORS.bgBottom);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 光線を描画
    drawLightRays(ctx, lightRaysRef.current, height);

    // 光線をゆっくり動かす
    lightRaysRef.current.forEach(ray => {
      ray.x += ray.speed;
      if (ray.x > width + ray.width) {
        ray.x = -ray.width;
      }
    });

    // 岩を描画（最背面）
    rocksRef.current.forEach(rock => {
      drawRock(ctx, rock);
    });

    // 海藻を描画
    seaweedsRef.current.forEach(seaweed => {
      drawSeaweed(ctx, seaweed, timeRef.current);
    });

    // サンゴを描画
    coralsRef.current.forEach(coral => {
      drawCoral(ctx, coral, timeRef.current);
    });

    // 魚を描画・更新
    fishRef.current.forEach(fish => {
      drawFish(ctx, fish, timeRef.current);

      // 移動
      fish.x += fish.speed * fish.direction;

      // 画面外に出たら反対側から再登場
      if (fish.direction === 1 && fish.x > width + fish.size * 2) {
        fish.x = -fish.size * 2;
        fish.y = random(height * 0.1, height * 0.75);
      } else if (fish.direction === -1 && fish.x < -fish.size * 2) {
        fish.x = width + fish.size * 2;
        fish.y = random(height * 0.1, height * 0.75);
      }
    });

    // 気泡を描画・更新
    bubblesRef.current.forEach(bubble => {
      // ゆらゆら横移動
      const wobbleX = Math.sin(timeRef.current * bubble.wobbleSpeed + bubble.wobble) * 1.5;
      
      drawBubble(ctx, {
        ...bubble,
        x: bubble.x + wobbleX,
      });

      // 上昇
      bubble.y -= bubble.speed;

      // 画面上に出たら下から再登場
      if (bubble.y < -bubble.size) {
        bubble.y = height + bubble.size;
        bubble.x = random(0, width);
        bubble.size = random(2, 8);
        bubble.speed = random(0.3, 1);
      }
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // リサイズハンドラ
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    initializeElements(canvas.width, canvas.height);
  }, [initializeElements]);

  // マウント時の初期化
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleResize, animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}