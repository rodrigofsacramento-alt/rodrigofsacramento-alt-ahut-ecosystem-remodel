import { useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────
interface TableNode {
  x: number; y: number;
  vx: number; vy: number;
  radius: number; // 4-6px
  phase: number;
  label: string;
  color: string;
  brightness: number; // 0..1 comet trail decay
  dataNodes: DataNode[];
}

interface DataNode {
  x: number; y: number;
  radius: number; // 1-2px
  phase: number;
  color: string;
  parentIdx: number;
  brightness: number;
}

interface Connection {
  a: number; b: number;
  opacity: number;
  lineWidth: number;
}

// ── Force-Directed Graph (Galaxy) ─────────────────────
// Fundo #030303 | Nós de tabelas + dados | Física orgânica
export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tableNodes: TableNode[] = [];
    let connections: Connection[] = [];
    let time = 0;

    // Mouse interaction
    const mouse = { x: null as number | null, y: null as number | null, radius: 200 };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // ── Table labels ──────────────────────────
    const tableLabels = [
      'leads', 'properties', 'proposals', 'contracts',
      'visits', 'conversations', 'notifications', 'profiles',
      'gestao_tasks', 'financeiro', 'comissoes', 'marketing'
    ];
    const neonColors = [
      '#00FFCC', '#00E5FF', '#00BFFF', '#00A3FF',
      '#7B61FF', '#B026FF', '#FF26B0', '#FF4D6D',
      '#FF6B35', '#FFB020', '#A8E600', '#00F5A0'
    ];

    // ── Initialize ────────────────────────────
    const init = () => {
      tableNodes = [];
      connections = [];

      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;
      const nTables = isMobile ? 5 : tableLabels.length;

      // Galaxy: asymmetric spiral clusters
      for (let i = 0; i < nTables; i++) {
        const angle = (i / nTables) * Math.PI * 2 + (Math.random() - 0.5) * 1.2;
        const armOffset = (Math.random() - 0.5) * 0.6;
        const dist = Math.min(w, h) * 0.28 + Math.random() * Math.min(w, h) * 0.15;
        const spiralX = Math.cos(angle + armOffset) * dist;
        const spiralY = Math.sin(angle + armOffset) * dist;
        // Add cluster scatter (galaxy arms aren't perfect)
        const scatter = dist * 0.18;
        const x = centerX + spiralX + (Math.random() - 0.5) * scatter;
        const y = centerY + spiralY + (Math.random() - 0.5) * scatter;

        const radius = 4 + Math.random() * 2; // 4-6px
        const color = neonColors[i % neonColors.length];
        const nData = 4 + Math.floor(Math.random() * 6);
        const dataNodes: DataNode[] = [];

        // Data nodes orbiting the table node
        for (let d = 0; d < nData; d++) {
          const dAngle = (d / nData) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
          const dDist = radius * 1.5 + Math.random() * 8;
          dataNodes.push({
            x: x + Math.cos(dAngle) * dDist,
            y: y + Math.sin(dAngle) * dDist,
            radius: 1 + Math.random() * 1, // 1-2px
            phase: Math.random() * Math.PI * 2,
            color,
            parentIdx: i,
            brightness: 1,
          });
        }

        tableNodes.push({
          x, y,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          radius,
          phase: Math.random() * Math.PI * 2,
          label: tableLabels[i % tableLabels.length],
          color,
          brightness: 0.7 + Math.random() * 0.3,
          dataNodes,
        });
      }

      // Connections between nearby table nodes
      for (let a = 0; a < tableNodes.length; a++) {
        for (let b = a + 1; b < tableNodes.length; b++) {
          const dx = tableNodes[a].x - tableNodes[b].x;
          const dy = tableNodes[a].y - tableNodes[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.min(w, h) * 0.5;
          if (dist < maxDist) {
            const opacity = 0.15 + (1 - dist / maxDist) * 0.15; // 0.15-0.3
            const lineWidth = 0.3 + (1 - dist / maxDist) * 0.4; // 0.3-0.7
            connections.push({ a, b, opacity, lineWidth });
          }
        }
      }
    };

    // ── Physics step ───────────────────────────
    const physics = () => {
      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;

      for (const tn of tableNodes) {
        // Gravitational pull toward center (galaxy core)
        const dxc = centerX - tn.x;
        const dyc = centerY - tn.y;
        const distC = Math.sqrt(dxc * dxc + dyc * dyc) + 0.1;
        tn.vx += (dxc / distC) * 0.002;
        tn.vy += (dyc / distC) * 0.002;

        // Repulsion between table nodes (keep clusters separated)
        for (const other of tableNodes) {
          if (other === tn) continue;
          const dx = tn.x - other.x;
          const dy = tn.y - other.y;
          const d = Math.sqrt(dx * dx + dy * dy) + 0.1;
          if (d < 80) {
            const force = 0.8 / (d + 1);
            tn.vx += (dx / d) * force;
            tn.vy += (dy / d) * force;
          }
        }

        // Damping
        tn.vx *= 0.98;
        tn.vy *= 0.98;

        // Breathing: microscopic constant float
        const breathe = 0.08 * Math.sin(time * 0.003 + tn.phase);
        tn.x += tn.vx + breathe * Math.cos(time * 0.002 + tn.phase);
        tn.y += tn.vy + breathe * Math.sin(time * 0.002 + tn.phase * 1.3);

        // Bounce off edges with soft damping
        const margin = 40;
        if (tn.x < margin) { tn.x = margin; tn.vx *= -0.5; }
        if (tn.x > w - margin) { tn.x = w - margin; tn.vy *= -0.5; }
        if (tn.y < margin) { tn.y = margin; tn.vx *= -0.5; }
        if (tn.y > h - margin) { tn.y = h - margin; tn.vy *= -0.5; }

        // Update data nodes (orbit around parent)
        for (const dn of tn.dataNodes) {
          const orbitSpeed = 0.008 + Math.random() * 0.005;
          const orbitAngle = time * orbitSpeed + dn.phase;
          const dxp = dn.x - tn.x;
          const dyp = dn.y - tn.y;
          const orbitDist = Math.sqrt(dxp * dxp + dyp * dyp) || 3;
          dn.x = tn.x + Math.cos(orbitAngle) * orbitDist;
          dn.y = tn.y + Math.sin(orbitAngle) * orbitDist;

          // Comet trail brightness decay
          if (dn.brightness > 0.6) {
            dn.brightness -= 0.001; // stabilize over time
          }
        }
      }

      // Update connections (recalculate as nodes move)
      for (const conn of connections) {
        const a = tableNodes[conn.a];
        const b = tableNodes[conn.b];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.min(w, h) * 0.5;
        if (dist < maxDist) {
          conn.opacity = 0.15 + (1 - dist / maxDist) * 0.15;
          conn.lineWidth = 0.3 + (1 - dist / maxDist) * 0.4;
        } else {
          conn.opacity = 0;
        }
      }
    };

    // ── Draw ───────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections first (below nodes)
      for (const conn of connections) {
        if (conn.opacity <= 0) continue;
        const a = tableNodes[conn.a];
        const b = tableNodes[conn.b];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(0, 255, 204, ${conn.opacity})`;
        ctx.lineWidth = conn.lineWidth;
        ctx.stroke();
      }

      // Draw table nodes
      for (const tn of tableNodes) {
        // Outer glow aura
        const glowSize = tn.radius * 4;
        const glow = ctx.createRadialGradient(tn.x, tn.y, 0, tn.x, tn.y, glowSize);
        glow.addColorStop(0, `rgba(0, 255, 204, 0.08)`);
        glow.addColorStop(1, `rgba(0, 255, 204, 0)`);
        ctx.beginPath();
        ctx.arc(tn.x, tn.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core solid node (table)
        const pulse = 0.8 + 0.2 * Math.sin(time * 0.003 + tn.phase);
        ctx.beginPath();
        ctx.arc(tn.x, tn.y, tn.radius, 0, Math.PI * 2);
        ctx.fillStyle = tn.color;
        ctx.shadowColor = tn.color;
        ctx.shadowBlur = 12 * pulse;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Bright inner core
        ctx.beginPath();
        ctx.arc(tn.x, tn.y, tn.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * pulse})`;
        ctx.fill();

        // Draw data nodes
        for (const dn of tn.dataNodes) {
          // Comet trail gradient for newborn nodes
          if (dn.brightness > 0.7) {
            const trail = ctx.createRadialGradient(dn.x, dn.y, 0, dn.x, dn.y, dn.radius * 4);
            trail.addColorStop(0, `rgba(0, 255, 204, ${0.4 * dn.brightness})`);
            trail.addColorStop(1, `rgba(0, 255, 204, 0)`);
            ctx.beginPath();
            ctx.arc(dn.x, dn.y, dn.radius * 4, 0, Math.PI * 2);
            ctx.fillStyle = trail;
            ctx.fill();
          }

          const dPulse = 0.7 + 0.3 * Math.sin(time * 0.004 + dn.phase);
          ctx.beginPath();
          ctx.arc(dn.x, dn.y, dn.radius, 0, Math.PI * 2);
          ctx.fillStyle = dn.color;
          ctx.shadowColor = dn.color;
          ctx.shadowBlur = 4 * dPulse;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Mouse interaction: draw connections to mouse
        if (mouse.x != null && mouse.y != null) {
          const dx = tn.x - mouse.x;
          const dy = tn.y - mouse.y;
          const mouseDist = Math.sqrt(dx * dx + dy * dy);
          if (mouseDist < mouse.radius) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 - mouseDist / mouse.radius * 0.4})`;
            ctx.lineWidth = 1;
            ctx.moveTo(tn.x, tn.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
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
    <>
      <div className="fixed inset-0 w-full h-full bg-[#030303] -z-30" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full -z-20 opacity-40 pointer-events-none mix-blend-screen"
        aria-hidden="true"
      />
    </>
  );
}