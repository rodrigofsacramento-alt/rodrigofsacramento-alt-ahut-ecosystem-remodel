
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
- **Próxima fase (aguardando aceite):** funil único de **12 estágios** (`1 Contato Cadastrado → 12 Vendido`, com **"Qualificado"** como gatilho de injeção concatenada) + data-binding bidirecional + `current_stage` invisível na UI.
- **Autor:** Squad Ahut Tech (JARVIS orquestra / APOLLO executa / AURA valida).
  