# 🔧 CORREÇÃO PRODUÇÃO — CORRETORES DUPLICADOS (24/08/2026)

## Contexto
Desenvolvedor anterior criou **USUÁRIOS NOVOS** em vez de atualizar emails existentes.

## O que foi feito no banco PRODUÇÃO (ptochsyoyatsydfysacc)

### Angel
- Email: `angel@imobiliaria.com` → `angel@ahut.com.br` ✅
- 1 agent_commission transferida da duplicata
- Duplicata `angel@ahut.com.br` (inativa) removida

### Denisse
- Email: `denisse@imobiliaria.com` → `denisse@ahut.com.br` ✅
- 2 conversas (client_id), 1 conversa (agent_id), 53 msgs (sender), 64 msgs (receiver) transferidos
- Duplicatas `denisse@ahut.com.br` e `denisse@apexfy.com` removidas

### Luciana
- Nome: `agente7` → `Luciana` ✅
- Email: `agente7@imobiliaria.com` → `luciana@ahut.com.br` ✅
- 15 conversas, 6 msgs (receiver), 4 leads transferidos da duplicata

## O que foi feito no código (dev → produção futura)

### `src/hooks/useAgents.ts`
- Filtro que remove nomes inválidos (emoji, símbolos, números, vazios)
- Filtro que remove emails `@estateia.com` (auto-gerados por WhatsApp)
- Deduplicação por email (mantém registro mais completo)
- Commit: `54b841b`

### `src/pages/Atendimento.tsx`
- Dropdown de transferência mostra "Nome — email" para diferenciar homônimos

## SQL de correção aplicado
```sql
-- Angel
UPDATE agent_commissions SET agent_id = 'ORIGINAL_ID' WHERE agent_id = 'DUP_ID';
UPDATE profiles SET email = 'angel@ahut.com.br' WHERE id = 'ORIGINAL_ID';
DELETE FROM profiles WHERE id = 'DUP_ID';

-- Denisse
UPDATE agent_commissions SET agent_id = 'ORIGINAL_ID' WHERE agent_id IN ('DUP1','DUP2');
UPDATE conversations SET client_id = 'ORIGINAL_ID' WHERE client_id = 'DUP1';
UPDATE conversations SET agent_id = 'ORIGINAL_ID' WHERE agent_id = 'DUP1';
UPDATE messages SET sender_id = 'ORIGINAL_ID' WHERE sender_id = 'DUP1';
UPDATE messages SET receiver_id = 'ORIGINAL_ID' WHERE receiver_id = 'DUP1';
UPDATE profiles SET email = 'denisse@ahut.com.br' WHERE id = 'ORIGINAL_ID';
DELETE FROM profiles WHERE id IN ('DUP1','DUP2');

-- Luciana
UPDATE conversations SET agent_id = 'ORIGINAL_ID' WHERE agent_id = 'DUP_ID';
UPDATE messages SET receiver_id = 'ORIGINAL_ID' WHERE receiver_id = 'DUP_ID';
UPDATE leads SET responsible_id = 'ORIGINAL_ID' WHERE responsible_id = 'DUP_ID';
UPDATE profiles SET full_name = 'Luciana', email = 'luciana@ahut.com.br' WHERE id = 'ORIGINAL_ID';
DELETE FROM profiles WHERE id = 'DUP_ID';
```

## Corretores ativos (pós-correção): 8
1. Angel — angel@ahut.com.br — 47 leads, 160 convs, 629 msgs
2. Ángel Cardozo — kokolinorlo223@gmail.com — 0 atividade
3. Denisse — denisse@ahut.com.br — 33 leads, 203 convs, 998 msgs
4. Emilio — emilio@ahut.com.br — 42 leads, 54 convs, 65 msgs
5. Joyce — joyce@ahut.com.br — 462 leads, 205 convs, 327 msgs
6. Karina — karina@imobiliaria.com — 0 leads, 2 convs
7. Luciana — luciana@ahut.com.br — 13 leads, 96 convs, 235 msgs
8. test — test1234567@example.com — 0 atividade (teste)