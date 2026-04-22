// src/DynamicBackground.jsx
import React, { useRef, useEffect } from 'react';

const DynamicBackground = ({ isInputActive = false }) => {
  const canvasRef = useRef(null);
  const targetSpeedRef = useRef(1);
  const currentSpeedRef = useRef(1);

  useEffect(() => {
    targetSpeedRef.current = isInputActive ? 0.35 : 1;
  }, [isInputActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const matrixChars =
      '01{}[]()<>/*+-=;:.#@$%^&|!?abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const stackLength = 16;
    let animationFrameId = 0;
    let lastTimestamp = 0;
    let drops = [];
    let columnCount = 0;
    let fontSize = 16;

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fontSize = Math.max(12, Math.floor(width / 110));
      columnCount = Math.ceil(width / fontSize);
      drops = new Array(columnCount)
        .fill(0)
        .map(() => Math.floor(Math.random() * Math.floor(height / fontSize)) * -1);
    };

    const draw = (timestamp) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Smoothly transition matrix speed in ~1-2 seconds instead of snapping.
      const deltaTime = lastTimestamp ? timestamp - lastTimestamp : 16;
      lastTimestamp = timestamp;
      const transitionMs = 400;
      const interpolation = Math.min(1, deltaTime / transitionMs);
      currentSpeedRef.current +=
        (targetSpeedRef.current - currentSpeedRef.current) * interpolation;

      ctx.fillStyle = 'rgba(2, 6, 13, 0.24)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const speedMultiplier = currentSpeedRef.current;

      for (let column = 0; column < drops.length; column += 1) {
        const x = column * fontSize;
        const y = drops[column] * fontSize;

        for (let i = 0; i < stackLength; i += 1) {
          const character = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const trailY = y - i * fontSize;
          if (trailY < -fontSize || trailY > height + fontSize) continue;

          if (i === 0) {
            ctx.fillStyle = 'rgba(153, 246, 228, 0.62)';
          } else {
            const alpha = Math.max(0.04, 0.28 - i * 0.018);
            ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          }
          ctx.fillText(character, x, trailY);
        }

        const baseStep = Math.random() > 0.85 ? 2 : 1;
        drops[column] += baseStep * speedMultiplier;

        if (y > height + Math.random() * 1000) {
          drops[column] = -Math.floor(Math.random() * 60);
        }
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };

    const handleResize = () => {
      init();
    };

    init();
    animationFrameId = window.requestAnimationFrame(draw);
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };

  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 h-full w-full z-0 animate-fade-in"
      aria-hidden="true"
    />
  );
};

export default DynamicBackground;