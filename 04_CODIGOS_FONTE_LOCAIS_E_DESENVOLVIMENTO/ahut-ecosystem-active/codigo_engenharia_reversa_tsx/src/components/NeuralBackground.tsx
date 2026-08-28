import { useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────
interface AtomicNode {
  id: string; color: string; angle: number;
  orbitRadius: number; orbitSpeed: number; radius: number;
}

interface LeadNode {
  id: string; name: string;
  x: number; y: number;
  startX: number; startY: number;
  targetX: number; targetY: number;
  vx: number; vy: number;
  radius: number; color: string;
  isNewborn: boolean;
  flightProgress: number;
  spawnAlpha: number;
  trail: { x: number; y: number; alpha: number }[];
  atomicNodes: AtomicNode[];
  connections: number[];
}

interface MasterNode {
  x: number; y: number; radius: number; color: string;
  pulse: number; phase: number;
}

// ── Obsidian Living Graph ──────────────────────────────
// Fundo #06080e | 200+ nós | Hierarquia 1/5
// Master: 3.8px | Leads: 2.0px | Atomics: 0.9-1.2px
export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let master: MasterNode;
    let leadNodes: LeadNode[] = [];
    let time = 0;
    const mouse = { x: null as number | null, y: null as number | null, radius: 250 };

    const init = () => {
      const w = canvas.width;
      const h = canvas.height;
      master = {
        x: w / 2, y: h / 2,
        radius: 3.8,
        color: '#00FFCC',
        pulse: 0, phase: 0,
      };

      // Generate 30-50 lead hubs (2.0px)
      const nLeads = 30 + Math.floor(Math.random() * 20);
      leadNodes = [];
      for (let i = 0; i < nLeads; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * Math.min(w, h) * 0.35;
        const scatter = dist * 0.15;
        const tx = master.x + Math.cos(angle) * dist + (Math.random() - 0.5) * scatter;
        const ty = master.y + Math.sin(angle) * dist + (Math.random() - 0.5) * scatter;

        leadNodes.push({
          id: `lead-${i}`,
          name: `Lead ${i + 1}`,
          x: master.x + (Math.random() - 0.5) * 30,
          y: master.y + (Math.random() - 0.5) * 30,
          startX: master.x, startY: master.y,
          targetX: tx, targetY: ty,
          vx: Math.cos(angle) * 3.0,
          vy: Math.sin(angle) * 3.0,
          radius: 2.0,
          color: '#FFFFFF',
          isNewborn: true,
          flightProgress: 0,
          spawnAlpha: 1.0,
          trail: [],
          connections: [],
          atomicNodes: [
            { id: 'name', color: '#00FFCC', angle: Math.random() * Math.PI * 2, orbitRadius: 8, orbitSpeed: 0.02, radius: 1.1 },
            { id: 'phone', color: '#00F5A0', angle: Math.random() * Math.PI * 2, orbitRadius: 9, orbitSpeed: -0.02, radius: 0.9 },
            { id: 'email', color: '#38BDF8', angle: Math.random() * Math.PI * 2, orbitRadius: 10, orbitSpeed: 0.015, radius: 0.9 },
            { id: 'chat', color: '#00DF9A', angle: Math.random() * Math.PI * 2, orbitRadius: 8.5, orbitSpeed: -0.018, radius: 1.0 },
          ],
        });
      }

      // Connections between nearby leads
      for (let a = 0; a < leadNodes.length; a++) {
        for (let b = a + 1; b < leadNodes.length; b++) {
          const dx = leadNodes[a].targetX - leadNodes[b].targetX;
          const dy = leadNodes[a].targetY - leadNodes[b].targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < Math.min(w, h) * 0.25) {
            leadNodes[a].connections.push(b);
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      master.pulse = 0.7 + 0.3 * Math.sin(time * 0.003);

      // ── Master Node (3.8px) ──
      // Heartbeat glow
      const masterGlow = ctx.createRadialGradient(master.x, master.y, 0, master.x, master.y, 60);
      masterGlow.addColorStop(0, `rgba(0, 255, 204, ${0.08 * master.pulse})`);
      masterGlow.addColorStop(1, 'rgba(0, 255, 204, 0)');
      ctx.fillStyle = masterGlow;
      ctx.beginPath(); ctx.arc(master.x, master.y, 60, 0, Math.PI * 2); ctx.fill();

      // Master core
      ctx.shadowColor = '#00FFCC';
      ctx.shadowBlur = 20 * master.pulse;
      ctx.beginPath(); ctx.arc(master.x, master.y, master.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#00FFCC';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Master inner white
      ctx.beginPath(); ctx.arc(master.x, master.y, master.radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * master.pulse})`;
      ctx.fill();

      // ── Lead Nodes ──
      for (const lead of leadNodes) {
        // Flight physics
        if (lead.isNewborn) {
          lead.flightProgress += 0.015;
          const t = Math.min(lead.flightProgress, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          lead.x = lead.startX + (lead.targetX - lead.startX) * ease;
          lead.y = lead.startY + (lead.targetY - lead.startY) * ease;
          lead.vx *= 0.97;
          lead.vy *= 0.97;

          // Comet trail
          lead.trail.push({ x: lead.x, y: lead.y, alpha: 1.0 });
          if (lead.trail.length > 15) lead.trail.shift();
          for (const t2 of lead.trail) t2.alpha *= 0.92;

          if (t >= 1) {
            lead.isNewborn = false;
            lead.color = '#00FFCC';
          }
        } else {
          // Breathing float
          const breathe = 0.15 * Math.sin(time * 0.002 + lead.atomicNodes[0].angle);
          lead.x += Math.cos(time * 0.001 + lead.atomicNodes[0].angle) * breathe * 0.1;
          lead.y += Math.sin(time * 0.001 + lead.atomicNodes[0].angle) * breathe * 0.1;
        }

        // Comet trail rendering
        if (lead.isNewborn && lead.trail.length > 1) {
          for (let i = 1; i < lead.trail.length; i++) {
            const alpha = (i / lead.trail.length) * 0.6;
            ctx.beginPath();
            ctx.moveTo(lead.trail[i - 1].x, lead.trail[i - 1].y);
            ctx.lineTo(lead.trail[i].x, lead.trail[i].y);
            ctx.strokeStyle = `rgba(0, 255, 204, ${alpha * lead.spawnAlpha})`;
            ctx.lineWidth = 1.5 * (i / lead.trail.length);
            ctx.stroke();
          }
        }

        // Connections to neighbors
        if (!lead.isNewborn) {
          for (const connIdx of lead.connections) {
            const neighbor = leadNodes[connIdx];
            if (!neighbor || neighbor.isNewborn) continue;
            const dx = lead.x - neighbor.x;
            const dy = lead.y - neighbor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = Math.min(w, h) * 0.25;
            if (dist < maxDist) {
              const opacity = 0.15 * (1 - dist / maxDist);
              ctx.beginPath();
              ctx.moveTo(lead.x, lead.y);
              ctx.lineTo(neighbor.x, neighbor.y);
              ctx.strokeStyle = `rgba(0, 255, 204, ${opacity})`;
              ctx.lineWidth = 0.3 + (1 - dist / maxDist) * 0.4;
              ctx.stroke();
            }
          }
        }

        // Lead node glow
        if (!lead.isNewborn) {
          const glow = ctx.createRadialGradient(lead.x, lead.y, 0, lead.x, lead.y, 15);
          glow.addColorStop(0, 'rgba(0, 255, 204, 0.06)');
          glow.addColorStop(1, 'rgba(0, 255, 204, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(lead.x, lead.y, 15, 0, Math.PI * 2); ctx.fill();
        }

        // Lead node core
        const leadPulse = lead.isNewborn ? lead.spawnAlpha : 0.7 + 0.3 * Math.sin(time * 0.003 + lead.atomicNodes[0].angle);
        ctx.shadowColor = lead.color;
        ctx.shadowBlur = lead.isNewborn ? 15 : 6;
        ctx.beginPath(); ctx.arc(lead.x, lead.y, lead.radius, 0, Math.PI * 2);
        ctx.fillStyle = lead.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // ── Atomic Nodes (0.9-1.2px) orbiting ──
        for (const atom of lead.atomicNodes) {
          atom.angle += atom.orbitSpeed;
          const ax = lead.x + Math.cos(atom.angle) * atom.orbitRadius;
          const ay = lead.y + Math.sin(atom.angle) * atom.orbitRadius;
          const aPulse = 0.6 + 0.4 * Math.sin(time * 0.004 + atom.angle);

          ctx.shadowColor = atom.color;
          ctx.shadowBlur = 4 * aPulse;
          ctx.beginPath(); ctx.arc(ax, ay, atom.radius * aPulse, 0, Math.PI * 2);
          ctx.fillStyle = atom.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // ── Mouse interaction ──
      if (mouse.x != null && mouse.y != null) {
        ctx.beginPath();
        ctx.moveTo(master.x, master.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(0, 255, 204, 0.15)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      time++;
      animId = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
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
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}