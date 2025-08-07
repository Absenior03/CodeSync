// src/DynamicBackground.jsx
import React, { useRef, useEffect } from 'react';

const DynamicBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    const mouse = {
      x: null,
      y: null,
      radius: 150
    };

    window.addEventListener('mousemove', (event) => {
      mouse.x = event.x;
      mouse.y = event.y;
    });

    const codeChars = ['{', '}', '[', ']', ';', ':', '"', '<', '>', '/', '=', '+', '-', '*', '(', ')'];

    class Particle {
      constructor(x, y, directionX, directionY, size, char, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.char = char;
        this.color = color;
      }

      draw() {
        ctx.beginPath();
        ctx.font = `${this.size}px monospace`;
        ctx.fillStyle = this.color;
        ctx.fillText(this.char, this.x, this.y);
      }

      update() {
        if (this.x > canvas.width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > canvas.height) {
            this.y = 0 - this.size;
            this.x = Math.random() * canvas.width;
        }
        
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius + this.size) {
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
                this.x += 5;
            }
            if (mouse.x > this.x && this.x > this.size * 10) {
                this.x -= 5;
            }
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
                this.y += 5;
            }
            if (mouse.y > this.y && this.y > this.size * 10) {
                this.y -= 5;
            }
        }

        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      particlesArray = [];
      let numberOfParticles = (canvas.height * canvas.width) / 9000;
      for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 10) + 5;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * innerHeight);
        let directionY = (Math.random() * 0.8) + 0.2;
        let char = codeChars[Math.floor(Math.random() * codeChars.length)];
        let color = 'rgba(0, 255, 255, 0.3)';
        particlesArray.push(new Particle(x, y, 0, directionY, size, char, color));
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
    }
    
    init();
    animate();

    window.addEventListener('resize', () => {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        init();
    });

    return () => {
        window.removeEventListener('mousemove', null);
        window.removeEventListener('resize', null);
    }

  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 animate-fade-in" />;
};

export default DynamicBackground;