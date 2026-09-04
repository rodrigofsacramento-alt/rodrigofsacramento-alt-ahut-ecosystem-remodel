
# AHUT ECOSYSTEM — MASTER BACKUP COMPLETO DE PRODUÇÃO

**Data de Geração**: 05/08/2026, 11:37:57
**Domínio em Produção**: https://ahut-ecosystem.apexfyhub.com.br/
**Servidor VPS**: 2.24.95.98
**Servidor Hostinger**: 82.25.73.206

---

## 📂 Estrutura do Pacote Master:

1. **`01_FRONTEND_PRODUCAO_HOSTINGER/`**
   - Build exato da aplicação web de produção hospedada na Hostinger.
   - Contém `index.html`, bundles de JavaScript, CSS, imagens e assets.

2. **`02_BACKEND_E_SERVICOS_VPS/`**
   - Todo o diretório `/var/www/` da VPS contendo:
     - `ahut-rh/` (Frontend e Backend da plataforma comportamental)
     - `api.rh/` (API FastAPI Python, modelos cognitivos digital-brain)
     - `wpp-drgustavorocha/` (Serviço de automação WhatsApp)
     - `indavent-whatsapp-broker/` (Broker WhatsApp Indavent)
     - `crm-imobiliaria/` & `html/` (Sistemas e landings)
   - Arquivos `.env` completos com todas as chaves de API do Supabase, Google Gemini AI, JWT Secrets.
   - Configurações do Nginx (`/etc/nginx/sites-enabled/default`).

3. **`03_BANCOS_DE_DADOS_E_SCHEMAS/`**
   - Scripts SQL de tabelas, migrações, RLS e backups do Supabase.

4. **`04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/`**
   - Código-fonte em desenvolvimento do projeto (`crm-dr-gustavo` e `v8Nova-Indavent-Local-Backup`).

5. **`05_DOCUMENTACAO_E_PROMPTS_IA/`**
   - Prompts de IA, regras do sistema, guias de sincronização e histórico de conversas do Antigravity IDE.

---

## 📝 NOTA DE OBSERVAÇÃO — COMMIT SEGURO (04/09/2026)

### SANEAMENTO DE LEADS LEGADOS — Funil de Qualificação QUBITS (MISSÃO 1)
- **Objetivo:** com a nova regra de injeção relacional, `leads` só receberá novos cadastros via gatilho de status **"Qualificado"**. Leads antigos (regra velha) em estágios iniciais foram padronizados.
- **Migração aplicada em PROD (`ptochsyoyatsydfysacc`):**
  - **Backup:** `_backup_leads_stage_2026` criado (9.313 linhas: id+stage+updated_at).
  - **UPDATE:** 9.313 leads migrados de `Primeiro Atendimento` (5.336) + `Lead Cadastrado` (3.977) → **`A Selecionar`**.
  - **Check constraint `leads_stage_check`:** adicionado `'A Selecionar'` à lista permitida (preservados os 10 estágios avançados).
  - **Preservação:** nenhum lead em estágio avançado (Agendamento/Proposta/Convertido) foi tocado.
  - **Idempotência:** cláusula `AND stage <> 'A Selecionar'` evita reprocessamento.
- **Arquivo de migração:** `04_.../ahut-ecosystem-active/codigo_engenharia_reversa_tsx/supabase/migration_saneamento_leads_funil.sql`
### FASE 2 — FUNIL ÚNICO QUBITS: DATA-BINDING + GATILHO "QUALIFICADO" (aceite GO 4/4)
- **Régua nova (12 estágios exatos):** `1 Contato Cadastrado → 2 Primeiro Atendimento / Qualificação → 3 Qualificado ⭐ (gatilho) → 4 Follow Up → 5 Buscar Imóveis → 6 Agendamento Visita/Reunião → 7 Visita/Reunião Agendada → 8 Match Pronto → 9 Apresentar Imóveis → 10 Imóvel Escolhido → 11 Proposta Solicitada → 12 Vendido` (+`A Selecionar` legados).
- **Arquitetura (fonte única, "nunca diverge"):** `conversations.stage` espelha `leads.stage` na MESMA transação via trigger `trg_sync_conv_stage`. Gatilho `trg_lead_qualificado` (BEFORE INSERT OR UPDATE OF stage em conversations) cria/carreia o cartão de lead concatenado (nome+telefone+conversation_id) quando a conversa vira "Qualificado"; `conversations.lead_id` + `leads.conversation_id` = binding bidirecional. `current_stage` (IA) preservado como 'INTRO', invisível na UI.
- **Migração aplicada PROD (`ptochsyoyatsydfysacc`):** check constraint nova (12 + A Selecionar), `conversations.stage` (default Contato Cadastrado), `conversations.lead_id` FK, `leads.conversation_id` FK, 4 índices, 2 functions + 2 triggers.
- **Testes transacionais (ROLLBACK):** Qualificado→lead criado concatenado (`Samir Jorge`); espelho lead→convers `Follow Up`/`Follow Up` (`nao_divergem=t`); `current_stage` INTRO preservado.
- **Código:** dropdown 12 estágios no header do Atendimento (`handleStageChange`) + `ESTAGIOS` 12 no Leads.tsx; tsc + vite build OK.
- **Arquivo migração:** `supabase/migration_funil_data_binding.sql`.
- **Autor:** Squad Ahut Tech (JARVIS/APOLLO/ADA/ATOM/AURA).

### NOTA GERAL (MISSÃO 1 + FASE 2)
- **Autores:** Squad Ahut Tech (JARVIS orquestra / APOLLO executa / AURA valida / ADA+ATOM frontend).
  