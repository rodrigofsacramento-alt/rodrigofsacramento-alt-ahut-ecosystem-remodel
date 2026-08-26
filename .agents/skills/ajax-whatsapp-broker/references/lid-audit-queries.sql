-- 🔍 Consultas SQL para auditoria de leads com @lid
-- Uso: PGPASSWORD='...' psql -h db.ptochsyoyatsydfysacc.supabase.co -p 5432 -U postgres -d postgres -c "query"

-- 1. TOTAL: leads com LID (número > 14 dígitos)
SELECT COUNT(*) FROM profiles WHERE role='client' 
  AND phone ~ '^[0-9]+$' AND LENGTH(phone) > 14;

-- 2. DUPLICATAS: mesmo nome com LID + telefone real
SELECT l.full_name, l.phone as lid_phone, r.phone as real_phone,
       l.created_at::text as lid_created, r.created_at::text as real_created
FROM profiles l JOIN profiles r ON r.full_name = l.full_name AND r.id != l.id
WHERE l.phone ~ '^[0-9]+$' AND LENGTH(l.phone) > 14
  AND r.phone ~ '^[0-9]+$' AND LENGTH(r.phone) <= 14 AND r.role='client'
ORDER BY l.created_at DESC;

-- 3. LIDs COM MENSAGENS (individuais, excluindo grupos)
SELECT p.full_name, p.phone, COUNT(DISTINCT c.id) as convs, 
       COUNT(m.id) as msgs, MAX(m.created_at)::text as ultimo_contato
FROM profiles p JOIN conversations c ON c.client_id = p.id
  JOIN messages m ON m.conversation_id = c.id
WHERE p.phone ~ '^[0-9]+$' AND LENGTH(p.phone) > 14
  AND p.role = 'client' AND NOT p.phone LIKE '120363%'
  AND LENGTH(p.full_name) > 2
GROUP BY p.full_name, p.phone HAVING COUNT(m.id) > 0
ORDER BY MAX(m.created_at) DESC;

-- 4. CSV copia e cola: todos os leads duplicados com LID vs real
SELECT DISTINCT ON (l.id) l.full_name, l.phone, 
  CASE WHEN LENGTH(l.phone) > 14 THEN 'LID' ELSE 'REAL' END as tipo
FROM profiles l JOIN profiles r ON r.full_name = l.full_name AND r.id != l.id
WHERE l.role='client' AND l.phone ~ '^[0-9]+$'
ORDER BY l.id;

-- 5. Fix broker: findOrCreateParticipantProfile aceita realPhone (commit 6553d37)
-- Script automático: /opt/data/scripts/leads-audit.py
-- Cron: leads-audit-diario (6h diárias)