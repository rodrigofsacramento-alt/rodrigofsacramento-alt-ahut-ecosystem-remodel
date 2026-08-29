import { useEffect, useRef } from 'react';

// ── HIERARQUIA ATÔMICA DO GRAFO OBSIDIAN VIVO ──────────────
// 1. Neurônio Central (Escala 1/5 = ~3.8px): Página / Epicentro de Leads
// 2. Neurônios Médios (Escala 1/5 = ~2.0px): Cadastros de Leads Individuais
// 3. Neurônios Menores Atômicos (Escala 1/5 = ~0.9px - 1.2px):
//    - Nó Telefone (#00F5A0)
//    - Nó Nome (#00FFCC)
//    - Nó Email (#38BDF8)
//    - Nó Conversa (#00DF9A)

interface AtomicDataNode {
  id: string;
  type: 'name' | 'phone' | 'email' | 'chat';
  label: string;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  radius: number; // 0.8 - 1.2px
  color: string;
  phase: number;
}

interface LeadNode {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number; // ~2.0px
  baseRadius: number;
  color: string;
  isNewborn?: boolean;
  flightProgress?: number;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
  spawnAlpha: number; // Aumenta transparência / fading conforme surge
  trail?: { x: number; y: number; alpha: number }[];
  atomicNodes: AtomicDataNode[];
  pulsePhase: number;
}

interface MasterNode {
  x: number;
  y: number;
  radius: number; // ~3.8px
  baseRadius: number;
  color: string;
  pulsePhase: number;
  label: string;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  opacity: number;
  label?: string;
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let master: MasterNode = {
      x: 0,
      y: 0,
      radius: 3.8,
      baseRadius: 3.8,
      color: '#00FFCC',
      pulsePhase: 0,
      label: 'LEADS ENGINE'
    };
    let leadNodes: LeadNode[] = [];
    let shockwaves: Shockwave[] = [];
    let time = 0;

    const mouse = { x: null as number | null, y: null as number | null, radius: 180 };
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // ── Inicialização dos Clusters de Leads e Dados Atômicos ──
    const init = () => {
      leadNodes = [];
      shockwaves = [];

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const w = canvas.width;
      const h = canvas.height;
      const centerX = isMobile ? w / 2 : w * 0.58;
      const centerY = h * 0.50;

      master.x = centerX;
      master.y = centerY;
      master.radius = 3.8;
      master.baseRadius = 3.8;

      const sampleNames = [
        'Roberto Alencar', 'Camila Duarte', 'Lucas Mendonça', 'Beatriz Fontes',
        'Guilherme Siqueira', 'Mariana Prado', 'Fernando Dias', 'Juliana Rios',
        'Carlos Eduardo', 'Larissa Mendes', 'Rodrigo Costa', 'Patrícia Moura',
        'Gustavo Lima', 'Fernanda Souza', 'Thiago Ramos', 'Vanessa Toledo',
        'Marcelo Antunes', 'Renata Vasconcelos', 'Bruno Farias', 'Aline Castro'
      ];

      const initialCount = isMobile ? 12 : 24;

      for (let i = 0; i < initialCount; i++) {
        const angle = (i / initialCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist = 30 + Math.random() * (isMobile ? 120 : 190);
        const lx = centerX + Math.cos(angle) * dist;
        const ly = centerY + Math.sin(angle) * dist;

        // Cada Lead possui exatamente 4 dados atômicos em órbita
        const atomicNodes: AtomicDataNode[] = [
          { id: `name-${i}`, type: 'name', label: 'Nome', angle: 0, orbitRadius: 7 + Math.random() * 4, orbitSpeed: 0.015, radius: 1.1, color: '#00FFCC', phase: Math.random() * Math.PI * 2 },
          { id: `phone-${i}`, type: 'phone', label: 'Tel', angle: Math.PI * 0.5, orbitRadius: 8 + Math.random() * 4, orbitSpeed: -0.018, radius: 0.9, color: '#00F5A0', phase: Math.random() * Math.PI * 2 },
          { id: `email-${i}`, type: 'email', label: 'Email', angle: Math.PI, orbitRadius: 9 + Math.random() * 4, orbitSpeed: 0.012, radius: 0.9, color: '#38BDF8', phase: Math.random() * Math.PI * 2 },
          { id: `chat-${i}`, type: 'chat', label: 'Chat', angle: Math.PI * 1.5, orbitRadius: 7.5 + Math.random() * 4, orbitSpeed: -0.014, radius: 1.0, color: '#00DF9A', phase: Math.random() * Math.PI * 2 },
        ];

        leadNodes.push({
          id: `lead-${i}`,
          name: sampleNames[i % sampleNames.length],
          x: lx,
          y: ly,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          radius: 2.0,
          baseRadius: 2.0,
          color: '#00FFCC',
          spawnAlpha: 0.85,
          atomicNodes,
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
    };

    // ── Gatilho de Novo Lead com Transparência Progressiva ────
    const spawnLeadParticle = (leadName: string) => {
      const targetAngle = Math.random() * Math.PI * 2;
      const targetDist = 40 + Math.random() * (isMobile ? 110 : 180);
      const targetX = master.x + Math.cos(targetAngle) * targetDist;
      const targetY = master.y + Math.sin(targetAngle) * targetDist;

      // 1. Onda de choque delicada
      shockwaves.push({
        x: master.x,
        y: master.y,
        radius: master.radius * 2,
        maxRadius: 130,
        color: '#00FFCC',
        opacity: 0.8,
        label: leadName
      });

      // 2. Os 4 nós atômicos de dados do novo lead
      const newAtomicNodes: AtomicDataNode[] = [
        { id: `name-spawn-${Date.now()}`, type: 'name', label: 'Nome', angle: 0, orbitRadius: 7 + Math.random() * 4, orbitSpeed: 0.02, radius: 1.2, color: '#00FFCC', phase: Math.random() * Math.PI * 2 },
        { id: `phone-spawn-${Date.now()}`, type: 'phone', label: 'Tel', angle: Math.PI * 0.5, orbitRadius: 8 + Math.random() * 4, orbitSpeed: -0.022, radius: 1.0, color: '#00F5A0', phase: Math.random() * Math.PI * 2 },
        { id: `email-spawn-${Date.now()}`, type: 'email', label: 'Email', angle: Math.PI, orbitRadius: 9 + Math.random() * 4, orbitSpeed: 0.018, radius: 1.0, color: '#38BDF8', phase: Math.random() * Math.PI * 2 },
        { id: `chat-spawn-${Date.now()}`, type: 'chat', label: 'Chat', angle: Math.PI * 1.5, orbitRadius: 7.5 + Math.random() * 4, orbitSpeed: -0.016, radius: 1.1, color: '#00DF9A', phase: Math.random() * Math.PI * 2 },
      ];

      // 3. Criar Nó Médio de Lead nascendo do centro exato
      const newLead: LeadNode = {
        id: `lead-spawn-${Date.now()}`,
        name: leadName,
        x: master.x,
        y: master.y,
        startX: master.x,
        startY: master.y,
        targetX,
        targetY,
        vx: Math.cos(targetAngle) * 4.0,
        vy: Math.sin(targetAngle) * 4.0,
        radius: 2.4,
        baseRadius: 2.0,
        color: '#FFFFFF', // Branco incandescente ao nascer
        isNewborn: true,
        flightProgress: 0,
        spawnAlpha: 1.0, // Brilho total inicial
        trail: [],
        atomicNodes: newAtomicNodes,
        pulsePhase: 0
      };

      leadNodes.push(newLead);
      master.radius = master.baseRadius * 1.5;
    };

    const handleSpawnEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ label?: string; color?: string }>;
      const label = customEvent.detail?.label || 'Novo Lead';
      spawnLeadParticle(label);
    };

    window.addEventListener('spawn-neural-node', handleSpawnEvent);
    (window as any).spawnObsidianLead = spawnLeadParticle;

    // ── Física Viva Contínua (Movimento Perpétuo dos Nós) ────
    const physics = () => {
      const w = canvas.width;
      const h = canvas.height;
      const centerX = isMobile ? w / 2 : w * 0.58;
      const centerY = h * 0.50;

      // Movimento do Nó-Mestre
      master.x += (centerX - master.x) * 0.02;
      master.y += (centerY - master.y) * 0.02;
      if (master.radius > master.baseRadius) {
        master.radius -= 0.04;
      }

      // Física de cada Nó Médio de Lead
      for (let i = 0; i < leadNodes.length; i++) {
        const lead = leadNodes[i];

        if (lead.isNewborn && lead.flightProgress !== undefined && lead.startX !== undefined && lead.targetX !== undefined) {
          lead.flightProgress += 0.022;

          if (!lead.trail) lead.trail = [];
          lead.trail.unshift({ x: lead.x, y: lead.y, alpha: lead.spawnAlpha });
          if (lead.trail.length > 14) lead.trail.pop();

          const t = Math.min(1, lead.flightProgress);
          const ease = 1 - Math.pow(1 - t, 3);

          lead.x = lead.startX + (lead.targetX - lead.startX) * ease;
          lead.y = lead.startY! + (lead.targetY! - lead.startY!) * ease;

          if (t >= 1) {
            lead.isNewborn = false;
            lead.color = '#00FFCC';
          }
        } else {
          // Aumenta transparência gradual (suaviza brilho)
          if (lead.spawnAlpha > 0.75) {
            lead.spawnAlpha -= 0.002;
          }

          if (lead.trail && lead.trail.length > 0) {
            lead.trail.forEach(p => p.alpha *= 0.85);
            lead.trail = lead.trail.filter(p => p.alpha > 0.05);
          }

          // Movimento orgânico perpétuo contínuo (os nós estão sempre vivos)
          const floatX = 0.12 * Math.sin(time * 0.003 + lead.pulsePhase);
          const floatY = 0.12 * Math.cos(time * 0.0035 + lead.pulsePhase);
          lead.x += lead.vx + floatX;
          lead.y += lead.vy + floatY;

          lead.vx *= 0.98;
          lead.vy *= 0.98;
        }

        // Rodopiar continuamente os 4 nós de dados atômicos em volta do Nó Médio
        for (const atomic of lead.atomicNodes) {
          atomic.angle += atomic.orbitSpeed;
          // Flutuação orgânica da distância de órbita
          const dynamicDist = atomic.orbitRadius + 0.8 * Math.sin(time * 0.004 + atomic.phase);
          const ax = lead.x + Math.cos(atomic.angle) * dynamicDist;
          const ay = lead.y + Math.sin(atomic.angle) * dynamicDist;
          (atomic as any).x = ax;
          (atomic as any).y = ay;
        }

        // Interação suave do mouse
        if (mouse.x !== null && mouse.y !== null) {
          const dx = lead.x - mouse.x;
          const dy = lead.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius && dist > 1) {
            const force = (1 - dist / mouse.radius) * 0.4;
            lead.x += (dx / dist) * force;
            lead.y += (dy / dist) * force;
          }
        }
      }

      // Ondas de choque
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += 2.8;
        sw.opacity *= 0.95;
        if (sw.opacity <= 0.01) {
          shockwaves.splice(s, 1);
        }
      }
    };

    // ── Renderização Fina e Elegante no Canvas ───────────────
    const draw = () => {
      ctx.fillStyle = '#06080e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Filamentos do Nó-Mestre para cada Nó Médio de Lead
      for (const lead of leadNodes) {
        ctx.beginPath();
        ctx.moveTo(master.x, master.y);
        ctx.lineTo(lead.x, lead.y);
        ctx.strokeStyle = `rgba(0, 255, 204, ${0.16 * lead.spawnAlpha})`;
        ctx.lineWidth = 0.35;
        ctx.stroke();

        // Conectar Nó Médio aos seus 4 Nós de Dados Atômicos
        for (const atomic of lead.atomicNodes) {
          const ax = (atomic as any).x || lead.x;
          const ay = (atomic as any).y || lead.y;
          ctx.beginPath();
          ctx.moveTo(lead.x, lead.y);
          ctx.lineTo(ax, ay);
          ctx.strokeStyle = `rgba(0, 245, 160, ${0.22 * lead.spawnAlpha})`;
          ctx.lineWidth = 0.25;
          ctx.stroke();
        }
      }

      // 2. Interconexões entre Nós Vizinhos (Teia Orgânica)
      for (let i = 0; i < leadNodes.length; i++) {
        for (let j = i + 1; j < leadNodes.length; j++) {
          const dx = leadNodes[i].x - leadNodes[j].x;
          const dy = leadNodes[i].y - leadNodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 45) {
            ctx.beginPath();
            ctx.moveTo(leadNodes[i].x, leadNodes[i].y);
            ctx.lineTo(leadNodes[j].x, leadNodes[j].y);
            ctx.strokeStyle = `rgba(200, 225, 245, ${0.12 * (1 - d / 45)})`;
            ctx.lineWidth = 0.25;
            ctx.stroke();
          }
        }
      }

      // 3. Ondas de Choque
      for (const sw of shockwaves) {
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 1.2 * sw.opacity;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 4. Desenhar Nós Médios de Leads e seus Nós de Dados Atômicos
      for (const lead of leadNodes) {
        // Rastro de cometa ao nascer
        if (lead.trail && lead.trail.length > 0) {
          for (let t = 0; t < lead.trail.length; t++) {
            const pt = lead.trail[t];
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, lead.radius * (1 - t / lead.trail.length) * 1.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 204, ${pt.alpha * 0.4})`;
            ctx.fill();
          }
        }

        // Corpo do Nó Médio (Cadastro do Lead)
        ctx.beginPath();
        ctx.arc(lead.x, lead.y, lead.radius, 0, Math.PI * 2);
        ctx.fillStyle = lead.color;
        ctx.shadowColor = lead.color;
        ctx.shadowBlur = 6 * lead.spawnAlpha;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Desenhar os 4 Nós de Dados Atômicos (Nome, Tel, Email, Chat)
        for (const atomic of lead.atomicNodes) {
          const ax = (atomic as any).x || lead.x;
          const ay = (atomic as any).y || lead.y;

          ctx.beginPath();
          ctx.arc(ax, ay, atomic.radius, 0, Math.PI * 2);
          ctx.fillStyle = atomic.color;
          ctx.shadowColor = atomic.color;
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // 5. Desenhar o Nó-Mestre Central (Página de Leads)
      const heartbeat = 1 + 0.15 * Math.sin(time * 0.05);
      const masterR = master.radius * heartbeat;

      // Aura delicada
      ctx.beginPath();
      ctx.arc(master.x, master.y, masterR * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 204, 0.25)';
      ctx.fill();

      // Centro denso
      ctx.beginPath();
      ctx.arc(master.x, master.y, masterR, 0, Math.PI * 2);
      ctx.fillStyle = '#00FFCC';
      ctx.shadowColor = '#00FFCC';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      physics();
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
      window.removeEventListener('spawn-neural-node', handleSpawnEvent);
      delete (window as any).spawnObsidianLead;
    };
  }, []);

  return (
    <canvas
      id="qubits-living-graph"
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}
