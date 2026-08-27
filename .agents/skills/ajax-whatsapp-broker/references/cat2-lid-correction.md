# CAT 2 — Correção em Massa de LIDs (remote_jid_alt)

**Data:** 27/08/2026  
**Contexto:** 134 leads CAT 2 + 964 no total corrigidos  
**Método:** 3 passagens de UPDATE no Supabase produção

## Passo 1: Via canonical_remote_jid (mais preciso)

Recupera o número real do WhatsApp a partir de mensagens já enviadas (from_me = true) que têm o `canonical_remote_jid` preenchido — este campo contém o JID real `@s.whatsapp.net` mesmo quando o `remote_jid` original é `@lid`.

```sql
UPDATE whatsapp_contacts wc
SET remote_jid_alt = u.real_jid
FROM (
    SELECT DISTINCT ON (wc.id)
        wc.id as wc_id,
        wm.canonical_remote_jid as real_jid
    FROM whatsapp_contacts wc
    JOIN conversations c ON c.id = wc.conversation_id 
        AND c.status NOT IN ('closed', 'deleted')
    JOIN whatsapp_messages wm ON wm.remote_jid = wc.remote_jid
    WHERE wc.remote_jid LIKE '%@lid%'
      AND (wc.remote_jid_alt IS NULL OR wc.remote_jid_alt = '')
      AND wm.canonical_remote_jid IS NOT NULL
      AND wm.canonical_remote_jid LIKE '%@s.whatsapp.net%'
      AND wm.from_me = true
    ORDER BY wc.id, wm.created_at DESC
) u
WHERE wc.id = u.wc_id;
```

**Resultado:** 745 LIDs corrigidos

## Passo 2: Fallback via profiles.phone

Para LIDs que têm um perfil duplicado com telefone real (mesmo `full_name`, telefone válido de 10-13 dígitos).

```sql
UPDATE whatsapp_contacts wc
SET remote_jid_alt = CONCAT(REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g'), '@s.whatsapp.net')
FROM profiles p
WHERE wc.profile_id = p.id
  AND wc.remote_jid LIKE '%@lid%'
  AND (wc.remote_jid_alt IS NULL OR wc.remote_jid_alt = '')
  AND p.phone ~ '^[0-9]+$'
  AND LENGTH(p.phone) > 10 AND LENGTH(p.phone) <= 13
  AND p.full_name !~ '^[0-9]+$';
```

**Resultado:** 219 LIDs corrigidos

## Passo 3: Fallback via whatsapp_contacts.phone_number

Último recurso para LIDs anônimos.

```sql
UPDATE whatsapp_contacts wc
SET remote_jid_alt = CONCAT(wc.phone_number, '@s.whatsapp.net')
FROM conversations c
WHERE wc.conversation_id = c.id
  AND wc.remote_jid LIKE '%@lid%'
  AND (wc.remote_jid_alt IS NULL OR wc.remote_jid_alt = '')
  AND c.status NOT IN ('closed', 'deleted');
```

## Verificação Final

```sql
SELECT COUNT(*) as total_restantes
FROM whatsapp_contacts wc
JOIN conversations c ON c.id = wc.conversation_id 
    AND c.status NOT IN ('closed', 'deleted')
WHERE wc.remote_jid LIKE '%@lid%'
  AND (wc.remote_jid_alt IS NULL OR wc.remote_jid_alt = '');
```

**Resultado 27/08:** 964 corrigidos, 0 restantes ✅