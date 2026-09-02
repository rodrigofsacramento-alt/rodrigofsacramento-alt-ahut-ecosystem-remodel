# 🚀 PLANO DE MELHORIAS QUBITS
**Elaborado por:** JARVIS Orchestrator (consenso do squad — ATOM, ADA, ATLAS, AURA, AJAX, ARGUS)
**Data:** 01/09/2026 · **Status:** 💡 PLANEJAMENTO (não executado — aguarda priorização)
**Objetivo:** escalar QUBITS para ~90% de autonomia + velocidade, mantendo produção estável.

---

## 🧭 VISÃO
Loop autodirigido: pedido → orquestração paralela multiagente → entrega autovalidade → lições → melhoria contínua, com humano fora do caminho crítico.

---

## 📌 FASE 1 — FUNDAÇÃO DE AUTONOMIA (prioridade máxima)
Responsável principal: ATOM (backend) + AJAX (mensageria) + AURA (QA)

| # | Melhoria | Agente | Benefício |
|---|---|---|---|
| 1.1 | **Fila durável** p/ mensagens (DB-backed: `pending→sending→sent/failed`) | AJAX/ATOM | Não perde envio em sessão/erro |
| 1.2 | **Retry exponencial + DLQ** (1s→2s→5s→15s, máx 5) | AJAX/ATOM | Auto-recuperação sem perder áudio/mídia |
| 1.3 | **Idempotency** nas mensagens (id único) | ATOM | Reprocessa sem duplicar |
| 1.4 | **Auto-rollback/canary** p/ deploy (5%→50%→100%) | AURA/ATLAS | Não quebra prod com mudança ruim |
| 1.5 | **Eventos de domínio + log de intenção** | ATOM | Rastrear/desfazer decisões autônomas |

## 📌 FASE 2 — VELOCIDADE (quick win)
Responsável: ATLAS (deploy) + ADA (front)

| # | Melhoria | Agente | Benefício |
| 2.1 | **CI/CD (GitHub Actions + self-hosted runner)** | ATLAS | Entrega rápida/segura |
| 2.2 | **Busca global ⌘K** (cliente, imóvel, contrato, processo) | ADA | -40% cliques, 1ª resp ≤2 cliques |
| 2.3 | **Dashboard executivo glassmorphism + ações 1-clique** | ADA | Acesso rápido à informação |

## 📌 FASE 3 — 90% AUTÓNOMO
- **Agente validador (contratos + gate)** — AURA
- **Self-service guiado** (fluxos passo a passo) — ADA
- **Compensações/rollback automáticos** (1º caso financeriro) — ATOM
- **Broker WhatsApp isolado** do tráfico de app — ATLAS

## 📌 FASE 4 — ESCALA
- **Cloudflare CDN + failover dual-hosting** — ATLAS
- **Multi-conta WhatsApp** — apenas após fila+retry estáveis — AJAX
- **Métricas/SLOs** (lead time, throughput, taxa auto-validação) — APOLO/ARGUS

---

## 🎯 RECOMENDAÇÃO EXECUTIVA (JARVIS)
**Começar pela FASE 1** (fila + retry + DLQ + canary/rollback) — é a base para o sistema se
autocorrigir sem humano e não quebrar prod. Em seguida FASE 2 (CI/CD + busca ⌘K) para velocidade.

**Métricas de sucesso:** taxa "zero-touch" → 90%; defeitos em prod → 0 P0/P1; lead time → horas não dias.

---
*Documento de planejamento — nenhuma mudança de código foi feita. Aguarda validação/priorização do Comandante.*