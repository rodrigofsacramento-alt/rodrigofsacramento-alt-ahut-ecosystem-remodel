# 🚀 SPRINT 1 — QUBITS: NO MORE MANUAL STEPS

**Período:** 26/08/2026 a 02/09/2026 (7 dias)
**Objetivo:** Eliminar gargalos que exigem humano no meio do fluxo
**Meta de Autonomia:** 40% → 100% deploys automáticos

---

## 📋 Backlog da Sprint

| Prioridade | Item | Responsável | Prazo | Status |
|---|---|---|---|---|
| 🔴 P1.1 | **Message Bus Interno** — Fila de eventos (NATS/RabbitMQ) | JARVIS + ATOM | 7 dias | 🔜 Planejado |
| 🔴 P1.2 | **CI/CD Pipeline** — GitHub Actions: lint → test → build → deploy | ATOM + ATLAS | 5 dias | 🔜 Planejado |
| 🔴 P1.3 | **Auto-Contexto AJAX** — Banco vetorial p/ memória de conversas | AJAX + ATOM | 5 dias | 🔜 Planejado |
| 🔴 P1.4 | **Auto-Report Consolidado** — Dashboard diário de métricas | APOLLO | 4 dias | 🔜 Planejado |

---

## 🔴 P1.2 — CI/CD Pipeline (Iniciado)

### O que está sendo feito
Pipeline GitHub Actions para o repositório `ahut-ecosystem-remodel` (dev):
1. **Lint**: `npx tsc --noEmit` + `eslint`
2. **Test**: `npm test` (quando existirem)
3. **Build**: `npm run build`
4. **Deploy**: SFTP automático para hostinger dev

### Arquivos criados
- `.github/workflows/ci-dev.yml` — CI para dev
- `.github/workflows/deploy-dev.yml` — Deploy automático dev

### Status: ⏳ Em andamento