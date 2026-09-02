# 🤝 CHAT INTERNO DE SINCRONIA — Hermes ⇄ Antigravity

**Este arquivo é o canal de comunicação entre os dois agentes.**
- Cada agente adiciona entradas aqui com sua última atualização + commit feito.
- O GITHUB é o checkpoint de versão — sempre commitar e avisar o outro.
- Regra: NUNCA sobrescrever o trabalho do outro; sempre `git pull` antes e alinhar em cima do último commit.

---

## LOG DE SINCRONIA (adicionar sempre que fizer commit)

### [2026-09-01] Hermes — Módulo Financeiro completo (backend PROD + frontend)
- **Feito:** estrutura financeira no Supabase PROD (financial_transactions[20 col], financial_banks, financial_cards, financial_transfers, financial_categories + view financial_saldo). Seed 9 categorias + 2 bancos (tenant Ahut).
- **Frontend:** módulo Financeiro novo (Dashboard, Lançamentos, Bancos, Cartões, Transferências, Categorias). **Rotas agora em code-split (React.lazy + Suspense)** — padrão PROD, gera chunks separados por página (DashboardFinanceiro-*.js, Lancamentos-*.js, etc).
- **schema:** financial_transactions usa `category_id` (FK→financial_categories), NÃO tem coluna `category`. Colunas: name, type(income/expense), amount, category_id, bank_id, card_id, client_id, description, due_date, paid_date, is_realized, date, source, reference_id, reference_type, agent_id.
- **⚠️ ATENÇÃO PROD:** o PROD ativo (`detail-ecosystem`) usa code-split legítimo (index-C9-68P_N.js + CSS rUI5cL83 + polyfill). **NUNCA subir o bundle DEV (index-CU2gxHM8/1.4MB) no PROD.** O financeiro deve entrar no PROD APÓS validação e de forma code-split, sem as telas de dev (Editor/Imagens).
- **Para ti, Antigravity:** se mexer em transações financeiras use `category_id` (NÃO `category`). Cuidado com `App.tsx`/`Layout.tsx`. Rotas financeiras lazy em App.tsx.

### [PENDENTE] — Próximo
- Integração de comissões de agentes → despesas automáticas (plano em /opt/data/PLANO_COMISSOES_CUSTO.md).

---

## REGRAS DE SINCRONIA

1. **Antes de começar qualquer trabalho:** `git pull origin main` (ou a branch comum) — garante que você começa em cima do último trabalho.
2. **Quando terminar uma entrega:** commit + push **AVISANDO o outro aqui neste arquivo** (data, módulo, o que fez, arquivos tocados).
3. **NUNCA force push** na main sem avisar.
4. **App.tsx e Layout.tsx** colidem muito (rotas+menu) — se ambos precisarem, coordenar.
5. **GitHub = checkpoint de versão.** Todo trabalho relevante = commit. O outro agente SEMPRE analisa o commit mais recente antes de continuar.
6. Se detectar que o outro sobrescreveu algo (build sumiu, arquivo reverteu), avisar aqui imediatamente.

---

## CHECKPOINT GITHUB (estado atual)
- **Repo:** a definir (ver instruções) — provavelmente `rodrigofsacramento-alt/newdevtest` (prod ativo do cliente) ou `...-remodel`.
- **Último commit do Hermes neste fluxo:** `[a preencher no primeiro commit deste arquivo]`