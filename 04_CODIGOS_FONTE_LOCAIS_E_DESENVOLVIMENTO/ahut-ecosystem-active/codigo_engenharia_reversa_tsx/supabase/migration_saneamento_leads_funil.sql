-- ============================================================
-- SANEAMENTO DE LEADS LEGADOS + AJUSTE DE CHECK CONSTRAINT
-- Funil de Qualificação QUBITS — MISSÃO 1 (Saneamento)
-- Supabase PROD: https://ptochsyoyatsydfysacc.supabase.co
-- Data execução: 2026-09-04
-- Status: EXECUTADO em PROD (9.313 leads migrados p/ 'A Selecionar')
-- Autor: Squad Ahut Tech (JARVIS orquestrou / APOLLO executou / AURA validou)
-- ============================================================

-- [1] BACKUP da coluna stage (rollback rápido)
DROP TABLE IF EXISTS public._backup_leads_stage_2026;
CREATE TABLE public._backup_leads_stage_2026 AS
SELECT id, stage, updated_at FROM public.leads;
-- -> 9.313 linhas salvas

-- [2] DRY-RUN (contagem real antes do UPDATE)
-- SELECT stage, count(*) FROM leads
-- WHERE stage IN ('Primeiro Atendimento','Lead Cadastrado')
-- GROUP BY stage ORDER BY 2 DESC;
-- -> Primeiro Atendimento: 5.336 | Lead Cadastrado: 3.977 | TOTAL: 9.313

-- [3] AJUSTE DA CHECK CONSTRAINT leads_stage_check
--    Adiciona 'A Selecionar' à lista permitida (preserva os 10 estágios avançados).
--    Necessário porque o banco PROD VALIDA o valor de stage por CHECK CONSTRAINT.
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_stage_check CHECK (
  stage = ANY (ARRAY[
    'Lead Cadastrado','Primeiro Atendimento','Follow-up','Agendamento de Visita',
    'Visita Agendada','Imóvel Escolhido','Em Aprovação de Correspondência',
    'Proposta Solicitada','Convertido','Perdido','A Selecionar']::text[])
);

-- [4] EXECUÇÃO DO UPDATE (MISSÃO 1)
--    Alvo: todos os leads em estágio ANTERIOR a 'Qualificado' (iniciais legados).
--    Resultado: 9.313 linhas migradas para 'A Selecionar'.
--    Preserva: leads em estágios avançados (nenhum estágio avançado tocado).
UPDATE public.leads
SET stage = 'A Selecionar'
WHERE stage IN ('Primeiro Atendimento','Lead Cadastrado')
  AND stage <> 'A Selecionar';
-- -> UPDATE 9313

-- [5] VERIFICAÇÃO PÓS-MIGRAÇÃO
-- SELECT stage, count(*) FROM leads GROUP BY stage ORDER BY count(*) DESC;
-- -> A Selecionar: 9.313 (100%)

-- ============================================================
-- NOTA DE OBSERVAÇÃO (COMMIT SEGURO)
-- Migração idempotente e com backup. O novo funil único de 12 estágios
-- (1 Contato Cadastrado → 12 Vendido, com 'Qualificado' como gatilho de injeção)
-- será implementado na FASE SEGUINTE: atualizar a constraint para os 12 nomes
-- novos + gatilho "Qualificado" de injeção concatenada + current_stage invisível.
-- Esta migração NÃO criou colunas novas; apenas saneou `leads.stage`.
-- ============================================================