"use client";

import { useEffect, useRef, type FC } from "react";

interface AuroraLayer {
  offset: number;
  speed: number;
  amplitude: number;
  frequency: number;
  color: string;
  alpha: number;
  yBase: number;
}

const AuroraBackground: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const auroraColors: string[] = [
      "rgba(30, 80, 200",
      "rgba(60, 20, 180",
      "rgba(100, 50, 220",
      "rgba(20, 150, 220",
      "rgba(80, 180, 240",
      "rgba(120, 60, 200",
      "rgba(40, 200, 220",
      "rgba(160, 80, 240",
      "rgba(10, 120, 200",
      "rgba(70, 130, 240",
    ];

    const layers: AuroraLayer[] = [
      { offset: 0.0, speed: 0.00003, amplitude: 0.14, frequency: 2.1, color: auroraColors[0], alpha: 0.30, yBase: 0.42 },
      { offset: 1.2, speed: 0.00004, amplitude: 0.12, frequency: 1.8, color: auroraColors[1], alpha: 0.25, yBase: 0.52 },
      { offset: 2.4, speed: 0.000025, amplitude: 0.16, frequency: 2.5, color: auroraColors[2], alpha: 0.22, yBase: 0.38 },
      { offset: 0.7, speed: 0.000035, amplitude: 0.10, frequency: 3.0, color: auroraColors[3], alpha: 0.28, yBase: 0.60 },
      { offset: 3.1, speed: 0.000028, amplitude: 0.13, frequency: 1.5, color: auroraColors[4], alpha: 0.20, yBase: 0.46 },
      { offset: 1.8, speed: 0.000045, amplitude: 0.09, frequency: 2.8, color: auroraColors[5], alpha: 0.18, yBase: 0.56 },
      { offset: 0.4, speed: 0.000022, amplitude: 0.15, frequency: 2.2, color: auroraColors[6], alpha: 0.16, yBase: 0.35 },
      { offset: 2.9, speed: 0.000038, amplitude: 0.11, frequency: 1.9, color: auroraColors[7], alpha: 0.20, yBase: 0.64 },
    ];

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      alpha: number;
      color: string;
      pulse: number;
      pulseSpeed: number;
    }

    const particleColors = [
      "rgba(100, 160, 255",
      "rgba(160, 100, 255",
      "rgba(80, 200, 255",
      "rgba(200, 130, 255",
      "rgba(60, 180, 240",
    ];

    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.0002,
      speedY: (Math.random() - 0.5) * 0.0001,
      alpha: Math.random() * 0.6 + 0.2,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const drawAuroraLayer = (layer: AuroraLayer, t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const yBase = h * layer.yBase;
      const amp = h * layer.amplitude;
      const curtainHeight = h * 0.28;

      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let x = 0; x <= w; x += 4) {
        const ratio = x / w;
        const wave1 = Math.sin(ratio * Math.PI * layer.frequency + t * layer.speed * 1000 + layer.offset);
        const wave2 = Math.sin(ratio * Math.PI * layer.frequency * 0.6 + t * layer.speed * 700 + layer.offset * 1.3);
        const wave3 = Math.sin(ratio * Math.PI * layer.frequency * 1.4 + t * layer.speed * 1300 + layer.offset * 0.7);
        const combined = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
        const y = yBase + combined * amp;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, h);
      ctx.closePath();

      const gradY = yBase - amp;
      const gradient = ctx.createLinearGradient(0, gradY, 0, gradY + curtainHeight + amp * 2);
      gradient.addColorStop(0, `${layer.color}, 0)`);
      gradient.addColorStop(0.2, `${layer.color}, ${layer.alpha * 0.8})`);
      gradient.addColorStop(0.5, `${layer.color}, ${layer.alpha})`);
      gradient.addColorStop(0.8, `${layer.color}, ${layer.alpha * 0.4})`);
      gradient.addColorStop(1, `${layer.color}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw luminous top edge
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const ratio = x / w;
        const wave1 = Math.sin(ratio * Math.PI * layer.frequency + t * layer.speed * 1000 + layer.offset);
        const wave2 = Math.sin(ratio * Math.PI * layer.frequency * 0.6 + t * layer.speed * 700 + layer.offset * 1.3);
        const wave3 = Math.sin(ratio * Math.PI * layer.frequency * 1.4 + t * layer.speed * 1300 + layer.offset * 0.7);
        const combined = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
        const y = yBase + combined * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = `${layer.color}, ${layer.alpha * 1.5})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = `${layer.color}, 0.8)`;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawParticles = (t: number) => {
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += p.pulseSpeed;

        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const pulseFactor = 0.5 + 0.5 * Math.sin(p.pulse + t * 0.001);
        const currentAlpha = p.alpha * (0.4 + 0.6 * pulseFactor);
        const currentSize = p.size * (0.7 + 0.3 * pulseFactor);

        const px = p.x * canvas.width;
        const py = p.y * canvas.height;

        const grd = ctx.createRadialGradient(px, py, 0, px, py, currentSize * 4);
        grd.addColorStop(0, `${p.color}, ${currentAlpha})`);
        grd.addColorStop(0.4, `${p.color}, ${currentAlpha * 0.4})`);
        grd.addColorStop(1, `${p.color}, 0)`);

        ctx.beginPath();
        ctx.arc(px, py, currentSize * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}, ${currentAlpha})`;
        ctx.fill();
      });
    };

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;
      const w = canvas.width;
      const h = canvas.height;

      // Night sky background
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "rgb(2, 2, 12)");
      bg.addColorStop(0.4, "rgb(5, 5, 20)");
      bg.addColorStop(0.7, "rgb(8, 6, 25)");
      bg.addColorStop(1, "rgb(3, 3, 15)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Draw star field
      ctx.fillStyle = "rgba(220, 230, 255, 0.7)";
      for (let i = 0; i < 120; i++) {
        const sx = ((i * 137.508 + 42) % 1) * w;
        const sy = ((i * 97.31 + 17) % 1) * h * 0.6;
        const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(timestamp * 0.0005 + i * 0.7));
        const starSize = (i % 3 === 0 ? 1.5 : 0.8) * twinkle;
        ctx.globalAlpha = twinkle * 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, starSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw aurora layers
      layers.forEach((layer) => drawAuroraLayer(layer, timestamp));

      // Draw particles
      drawParticles(timestamp);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
      }}
    />
  );
};

export default AuroraBackground;
