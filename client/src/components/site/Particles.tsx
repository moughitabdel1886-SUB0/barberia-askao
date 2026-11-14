import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  star: boolean;
  phase: number;
};

const COLORS = ["214,59,42", "36,71,201", "27,26,23", "255,255,255"];

export function Particles({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let particles: Particle[] = [];

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 640 ? 14 : 26;
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.1 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.08 - Math.random() * 0.22,
        alpha: 0.18 + Math.random() * 0.3,
        color: COLORS[index % COLORS.length],
        star: index % 5 === 0,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const drawStar = (x: number, y: number, radius: number) => {
      context.beginPath();
      for (let point = 0; point < 8; point += 1) {
        const angle = (Math.PI / 4) * point - Math.PI / 2;
        const r = point % 2 === 0 ? radius * 2.4 : radius * 0.8;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (point === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.closePath();
      context.fill();
    };

    const render = (time: number) => {
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        if (!reduce) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.y < -12) particle.y = height + 12;
          if (particle.x < -12) particle.x = width + 12;
          if (particle.x > width + 12) particle.x = -12;
        }
        const twinkle = 0.75 + Math.sin(time / 900 + particle.phase) * 0.25;
        context.fillStyle = `rgba(${particle.color},${particle.alpha * twinkle})`;
        if (particle.star) drawStar(particle.x, particle.y, particle.radius);
        else {
          context.beginPath();
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.fill();
        }
      }
      if (!reduce) frame = window.requestAnimationFrame(render);
    };

    build();
    render(0);

    const resize = () => {
      window.cancelAnimationFrame(frame);
      build();
      render(0);
    };
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
