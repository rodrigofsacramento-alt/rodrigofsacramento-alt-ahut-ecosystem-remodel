# 📦 Fila de Chamados Triados por AVA para Execução do ATOM

Aqui ficam registrados os chamados que a **AVA** já refinou através da entrevista com o colaborador e empacotou com especificações prontas para o **ATOM** codificar.

---

### 🏷️ [TCK-2026-085] - Distribuição Automática de Leads por Performance (15min timeout)
* **Prioridade:** 🔴 Alta / Crítica
* **Módulo:** `Leads & CRM`
* **Solicitante:** João Martins (Comercial & Vendas)
* **Problema:** Leads ficam parados na fila sem atendimento caso o administrador não faça a distribuição manual nos primeiros 15 minutos.
* **Regra Técnica:** 
  1. Cron a cada 1 minuto checa leads com status `novo` e `created_at < now() - 15min`.
  2. Distribui proporcionalmente com base na taxa de conversão dos corretores ativos (ex: 70% líder, 30% vice-líder).
  3. Dispara webhook via WhatsApp Broker avisando o corretor.
* **Critérios de Aceite:**
  - [ ] Timeout de 15 minutos verificado automaticamente.
  - [ ] Proporção matemática de distribuição aplicada.
  - [ ] Notificação instantânea no WhatsApp do corretor.
* **Status Kanban:** `A Analisar`
