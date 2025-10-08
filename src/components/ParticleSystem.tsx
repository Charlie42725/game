'use client';

import React, { useEffect, useRef } from 'react';

interface ParticleSystemProps {
  type: 'sakura' | 'sparkle' | 'fireworks' | 'stars';
  trigger?: boolean;
  intensity?: number;
}

export default function ParticleSystem({ 
  type, 
  trigger = false, 
  intensity = 1 
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const particlesRef = useRef<any[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設置畫布尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 粒子類
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * -2 - 1;
        this.life = 0;
        this.maxLife = 60 + Math.random() * 60;
        this.size = Math.random() * 4 + 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.color = this.getColor();
      }

      getColor(): string {
        switch (type) {
          case 'sakura':
            const colors = ['#ffb7c5', '#ffc0cb', '#ff69b4', '#ff1493'];
            return colors[Math.floor(Math.random() * colors.length)];
          case 'sparkle':
            return '#ffd93d';
          case 'fireworks':
            const fireworkColors = ['#ff6b9d', '#4ecdc4', '#ffd93d', '#6bcf7f', '#ff5757'];
            return fireworkColors[Math.floor(Math.random() * fireworkColors.length)];
          case 'stars':
            return '#ffffff';
          default:
            return '#ffb7c5';
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        
        if (type === 'sakura') {
          this.vy += 0.02; // 重力
          this.vx += Math.sin(this.life * 0.01) * 0.1; // 飄盪效果
        }
        
        this.life++;
        return this.life < this.maxLife && this.y < (canvas?.height || 0) + 50;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const alpha = Math.max(0, 1 - this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        switch (type) {
          case 'sakura':
            this.drawSakura(ctx);
            break;
          case 'sparkle':
            this.drawSparkle(ctx);
            break;
          case 'fireworks':
            this.drawFirework(ctx);
            break;
          case 'stars':
            this.drawStar(ctx);
            break;
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      drawSakura(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        // 花瓣形狀
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(0, -this.size, this.size * 0.5, this.size, (i * Math.PI * 2) / 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawSparkle(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        
        // 十字星形
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.moveTo(0, -this.size);
        ctx.lineTo(0, this.size);
        ctx.stroke();
      }

      drawFirework(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      drawStar(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * this.size;
          const y = Math.sin(angle) * this.size;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // 創建粒子
    const createParticles = () => {
      const count = Math.floor(5 * intensity);
      for (let i = 0; i < count; i++) {
        if (type === 'sakura') {
          particlesRef.current.push(new Particle(Math.random() * canvas.width, -50));
        } else if (trigger) {
          particlesRef.current.push(new Particle(
            canvas.width / 2 + (Math.random() - 0.5) * 200,
            canvas.height / 2 + (Math.random() - 0.5) * 100
          ));
        }
      }
    };

    // 動畫循環
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 更新和繪製粒子
      particlesRef.current = particlesRef.current.filter(particle => {
        const alive = particle.update();
        if (alive) {
          particle.draw(ctx);
        }
        return alive;
      });
      
      // 持續創建櫻花
      if (type === 'sakura' && Math.random() < 0.1) {
        createParticles();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [type, intensity]);

  // 當觸發時創建粒子
  useEffect(() => {
    if (trigger && type !== 'sakura') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
        maxLife: number;
        size: number;
        rotation: number;
        rotationSpeed: number;
        color: string;

        constructor(x: number, y: number) {
          this.x = x;
          this.y = y;
          this.vx = (Math.random() - 0.5) * 8;
          this.vy = (Math.random() - 0.5) * 8;
          this.life = 0;
          this.maxLife = 30 + Math.random() * 30;
          this.size = Math.random() * 6 + 3;
          this.rotation = Math.random() * Math.PI * 2;
          this.rotationSpeed = (Math.random() - 0.5) * 0.2;
          
          const colors = ['#ff6b9d', '#4ecdc4', '#ffd93d', '#6bcf7f', '#ff5757'];
          this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
          this.x += this.vx;
          this.y += this.vy;
          this.vx *= 0.98;
          this.vy *= 0.98;
          this.rotation += this.rotationSpeed;
          this.life++;
          return this.life < this.maxLife;
        }

        draw(ctx: CanvasRenderingContext2D) {
          const alpha = Math.max(0, 1 - this.life / this.maxLife);
          ctx.globalAlpha = alpha;
          
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rotation);
          
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(0, 0, this.size, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }

      // 創建煙花效果
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push(new Particle(
          canvas.width / 2,
          canvas.height / 2
        ));
      }
    }
  }, [trigger, type]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ background: 'transparent' }}
    />
  );
}