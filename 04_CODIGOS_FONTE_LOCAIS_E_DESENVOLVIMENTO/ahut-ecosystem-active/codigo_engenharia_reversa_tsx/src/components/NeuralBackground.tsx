import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  phase: number;
}

// ── Obsidian Brain Ecosystem ─────────────────────────────
// Rede neural de partículas conectadas (#00FFCC neon cyan)
// Fundo #050505 | opacity 40% | mix-blend-screen
export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    // Interação magnética do mouse
    const mouse = { x: null as number | null, y: null as number | null, radius: 150 };
    // Otimização: reduz trabalho em mobile (menos partículas + menor raio)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const init = () => {
      particles = [];
      // Densidade responsiva: mobile /16000 (menos nós), desktop /10000
      const density = isMobile ? 16000 : 10000;
      const count = Math.floor((canvas.height * canvas.width) / density);
      const maxCount = isMobile ? 50 : 120;
      const n = Math.min(count, maxCount);
      for (let i = 0; i < n; i++) {
        const size = Math.random() * 2 + 0.5; // 0.5–2.5px
        const x = Math.random() * (canvas.width - size * 2) + size;
        const y = Math.random() * (canvas.height - size * 2) + size;
        const vx = (Math.random() * 0.4 - 0.2) * (isMobile ? 0.7 : 1); // + lento mobile
        const vy = (Math.random() * 0.4 - 0.2) * (isMobile ? 0.7 : 1);
        particles.push({ x, y, vx, vy, size, phase: Math.random() * Math.PI * 2 });
      }
    };

    const connect = () => {
      const connDist = (canvas.width / 10) * (canvas.height / 10);
      const linkThreshold = Math.sqrt(connDist); // distância de conexão (O(n²) bound)

      for (let a = 0; a < particles.length; a++) {
        const pa = particles[a];

        for (let b = a + 1; b < particles.length; b++) {
          const pb = particles[b];
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < connDist) {
            const opacity = 1 - dSq / 15000;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.strokeStyle = `rgba(0, 255, 204, ${opacity * 0.4})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Efeito magnético com o mouse
        if (mouse.x != null && mouse.y != null) {
          const dx = pa.x - mouse.x;
          const dy = pa.y - mouse.y;
          const mouseDist = Math.sqrt(dx * dx + dy * dy);
          if (mouseDist < mouse.radius) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 - mouseDist / mouse.radius})`;
            ctx.lineWidth = 1;
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Colisão com bordas (bate e volta)
        if (p.x > canvas.width || p.x < 0) p.vx = -p.vx;
        if (p.y > canvas.height || p.y < 0) p.vy = -p.vy;
        p.x += p.vx;
        p.y += p.vy;

        // Pulso sutil no brilho do nó (Obsidian vibração)
        const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.002 + p.phase);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2, false);
        ctx.fillStyle = `rgba(0, 255, 204, ${0.7 * pulse})`;
        ctx.fill();

        // Núcleo brilhante (branco)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2, false);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * pulse})`;
        ctx.fill();
      }

      connect();
      animId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const handleMouseOut = () => { mouse.x = null; mouse.y = null; };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('resize', resize);

    resize();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
    <div className="fixed inset-0 w-full h-full bg-[#050505] -z-30" aria-hidden="true" />
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 opacity-40 pointer-events-none mix-blend-screen"
      aria-hidden="true"
    />
    </>
  );
}