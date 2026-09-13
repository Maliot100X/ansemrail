"use client";

import { useEffect, useRef } from "react";

type RingParticle = {
  ring: number;
  angle: number;
  speed: number;
  size: number;
  gold: boolean;
};

function createParticles(): RingParticle[] {
  const particles: RingParticle[] = [];
  for (let ring = 0; ring < 4; ring += 1) {
    const count = ring === 0 ? 36 : 26 - ring * 4;
    for (let i = 0; i < count; i += 1) {
      particles.push({
        ring,
        angle: (Math.PI * 2 * i) / count,
        speed: 0.18 + ring * 0.07 + (i % 5) * 0.015,
        size: 1 + Math.random() * 1.8,
        gold: ring % 2 === 0,
      });
    }
  }
  return particles;
}

function project(x: number, y: number, z: number, fov: number) {
  const perspective = fov / (fov + z);
  return { x: x * perspective, y: y * perspective, z, scale: perspective };
}

export function AnsemOrb({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const parent = canvas.parentElement;
    let width = parent?.clientWidth ?? 640;
    let height = parent?.clientHeight ?? 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles = createParticles();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let frame = 0;
    let running = true;

    const resize = () => {
      width = parent?.clientWidth ?? 640;
      height = parent?.clientHeight ?? 640;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
    };
    resize();

    const observer = new ResizeObserver(resize);
    if (parent) observer.observe(parent);

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    canvas.addEventListener("pointermove", onPointerMove, { passive: true });

    const draw = (timeSeconds: number) => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.36;
      const fov = 420;
      const pulse = Math.sin(timeSeconds * 1.5) * 0.02;

      context.save();
      context.translate(centerX + pointer.x * 8, centerY + pointer.y * 8);

      const ringColors = [
        "rgba(245, 179, 1, 0.28)",
        "rgba(65, 224, 255, 0.2)",
        "rgba(255, 138, 0, 0.24)",
        "rgba(82, 255, 168, 0.16)",
      ];

      for (let ring = 0; ring < 4; ring += 1) {
        const ringRadius = radius * (0.34 + ring * 0.21);
        const tilt = 0.42 + ring * 0.06;
        const rotation = timeSeconds * (0.12 + ring * 0.045) + ring * 0.9;
        const wobble = Math.sin(timeSeconds * 0.9 + ring) * 0.02 + pointer.x * 0.05;

        context.save();
        context.rotate(wobble);
        context.strokeStyle = ringColors[ring];
        context.lineWidth = ring === 0 ? 1.6 : 1;
        context.beginPath();
        context.ellipse(0, 0, ringRadius, ringRadius * 0.42, 0, 0, Math.PI * 2);
        context.stroke();

        for (const particle of particles) {
          if (particle.ring !== ring) continue;
          const angle = particle.angle + timeSeconds * particle.speed;
          const x = Math.cos(angle) * ringRadius;
          const z = Math.sin(angle) * ringRadius;
          const y = Math.sin(angle * 1.7) * ringRadius * 0.3;
          const rotatedX = x * Math.cos(rotation) - z * Math.sin(rotation);
          const rotatedZ = x * Math.sin(rotation) + z * Math.cos(rotation);
          const point = project(rotatedX, y * tilt + (1 - tilt) * 0, rotatedZ, fov);
          const alpha = 0.25 + point.scale * 0.75;
          const color = particle.gold
            ? `rgba(255, 208, 80, ${alpha})`
            : `rgba(140, 235, 255, ${alpha * 0.8})`;
          context.fillStyle = color;
          context.shadowColor = particle.gold ? "rgba(245, 179, 1, 0.8)" : "rgba(65, 224, 255, 0.6)";
          context.shadowBlur = 8;
          context.beginPath();
          context.arc(point.x, point.y, particle.size * point.scale, 0, Math.PI * 2);
          context.fill();
          context.shadowBlur = 0;
        }
        context.restore();
      }

      const coreRadius = radius * (0.2 + pulse);
      const coreGradient = context.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 2.1);
      coreGradient.addColorStop(0, "rgba(255, 210, 90, 0.96)");
      coreGradient.addColorStop(0.4, "rgba(245, 179, 1, 0.55)");
      coreGradient.addColorStop(0.72, "rgba(255, 74, 64, 0.18)");
      coreGradient.addColorStop(1, "rgba(255, 74, 64, 0)");
      context.fillStyle = coreGradient;
      context.beginPath();
      context.arc(0, 0, coreRadius * 2.1, 0, Math.PI * 2);
      context.fill();

      context.save();
      const scale = coreRadius / 56;
      context.translate(0, 2);
      context.scale(scale, scale);
      context.lineCap = "round";
      context.lineJoin = "round";

      context.strokeStyle = "rgba(255, 255, 255, 0.92)";
      context.fillStyle = "rgba(26, 20, 4, 0.9)";
      context.lineWidth = 6;
      context.beginPath();
      context.moveTo(-30, -22);
      context.quadraticCurveTo(-32, -52, -12, -46);
      context.quadraticCurveTo(-12, -36, -20, -30);
      context.moveTo(30, -22);
      context.quadraticCurveTo(32, -52, 12, -46);
      context.quadraticCurveTo(12, -36, 20, -30);
      context.stroke();

      context.beginPath();
      context.moveTo(-18, -26);
      context.quadraticCurveTo(-26, 2, -14, 24);
      context.quadraticCurveTo(0, 34, 14, 24);
      context.quadraticCurveTo(26, 2, 18, -26);
      context.quadraticCurveTo(0, -34, -18, -26);
      context.closePath();
      context.fill();
      context.strokeStyle = "rgba(245, 179, 1, 0.95)";
      context.lineWidth = 2.4;
      context.stroke();

      context.fillStyle = "rgba(255, 179, 71, 0.95)";
      context.beginPath();
      context.arc(-7, 8, 2.4, 0, Math.PI * 2);
      context.arc(7, 8, 2.4, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.restore();
    };

    if (reduced) {
      draw(0);
    } else {
      const start = performance.now();
      const step = () => {
        if (!running) return;
        frame = requestAnimationFrame(step);
        draw((performance.now() - start) / 1000);
      };
      frame = requestAnimationFrame(step);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Animated AnsemRail orbital profile"
      role="img"
      className={`h-full w-full select-none ${className}`}
    />
  );
}
