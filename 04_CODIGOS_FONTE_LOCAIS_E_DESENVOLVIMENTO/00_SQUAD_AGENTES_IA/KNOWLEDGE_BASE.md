# Base de Conhecimento do Esquadrão Tech (KNOWLEDGE BASE)

Este arquivo é a memória de longo prazo de todos os agentes (Atom, Ada, Aura, Atlas, Aegis, Apollo, Argus, Aria, Ava).
**REGRA:** Sempre que um agente resolver um problema complexo, descobrir uma regra de negócio ou configurar uma arquitetura crítica, ele DEVE registrar o aprendizado aqui. Antes de gastar tokens tentando adivinhar como resolver um erro comum, LEIA este arquivo.

## 📝 Aprendizados Registrados

### 1. Problema de CSS/Layout em Rotas Locais (Vendas)
- **Autor:** Atom / Ada / Aura
- **Data:** 22/08/2026
- **Contexto:** Ao injetar a página `Vendas.tsx` no `App.tsx`, o layout carregou quebrado, como HTML puro, sem o Tailwind CSS e sem o menu lateral.
- **Solução (Não esquecer):** 
  1. Componentes de página **não devem** importar o `<Layout>` internamente se o `App.tsx` já usa o `<AppLayout>` no envolucro da rota.
  2. Sempre embrulhar rotas no `App.tsx` com: 
     `<Route path="/rota" element={<AppLayout title="Título" subtitle="Sub"><Pagina /></AppLayout>} />`
  3. Para o Tailwind funcionar localmente, os arquivos `tailwind.config.js` e `postcss.config.js` DEVEM estar na raiz do projeto (eles foram recuperados do backup original `crm-dr-gustavo-original`).

### 2. Tipagens Ausentes no Supabase
- **Autor:** Atom
- **Contexto:** Ao tentar rodar `npm run build`, o TypeScript bloqueia a build se imports como `../types/supabase` não existirem.
- **Solução:** Na ausência das tipagens originais, criar um arquivo base em `src/types/supabase.ts` declarando a interface `Database` provisória para contornar o erro do `tsc` e permitir a compilação.

### 3. Gap crítico do Atendimento reverso — RPCs de operação de fila NÃO usadas
- **Autor:** Jarvis / ATOM
- **Data:** 23/08/2026
- **Contexto:** A Central de Atendimento de produção (`Atendimento-DcqAjCvf.js`) usa 6 RPCs: `accept_conversation`, `create_client_profile`, `ignore_conversation`, `mark_conversation_read`, `transfer_conversation`, `update_client_contact`. O código TSX reverso (`src/pages/Atendimento.tsx` + hooks) **não chama 5 deles** (só `create_client_profile`).
- **Impacto:** sem esses RPCs o painel não tem aceite de atendimento, marcar como lido, transferir entre corretores, ignorar, nem atualizar contato p/ chamada no privado.
- **Solução (ATOM/ADA):** criar hooks `useAcceptConversation`, `useMarkConversationRead`, `useTransferConversation`, `useIgnoreConversation`, `useUpdateClientContact` no `src/hooks/useWhatsapp.ts` espelhando os RPCs de produção, e ligá-los na UI do Atendimento (botões de aceitar/transferir, contador de lidas, chamada no privado).

### 4. Reclamação em Produção (Denisse) — falhas que afetam PRODUÇÃO
- **Data:** 23/08/2026
- **Relato:** (1) não vê quem responde no grupo; (2) "arquivo indisponível" em muitas msgs; (3) não vê todos contatos; (4) não chama no privado. **Comandante confirmou que isto atinge a PRODUÇÃO**, não só o protótipo.
- **Diagnóstico hipótese (ATLAS em análise):** provável causa raiz em mapeamento `remote_jid`/`sender_id` no broker (mensagens de grupo levam `client_id` do grupo, não o participante real), `vw_group_participants` não populada, mídia sem `media_url`/`thumbnail` persistidos, e `whatsapp_contacts` incompleta impedindo chamada no privado.
- **Lição:** quando relatos de UI vierem do cliente, SEMPRE considerar falha de produção (broker/banco), não só do protótipo reverso.

### 5. Caminhos REAIS do ambiente (diferente do Mac do manual)
- **Fonte de verdade (congelada, somente leitura):** `/opt/data/ahut-ecosystem-active`
- **Código reverso TSX (implementar aqui):** `/opt/data/ahut-ecosystem/04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/ahut-ecosystem-active/codigo_engenharia_reversa_tsx`
- **Repo de trabalho (commit/push):** `/opt/data/ahut-ecosystem` (= remote `ahut-ecosystem-remodel`)
- **Supabase dev do protótipo:** `ldfcqxeehgaftxsgxkag.supabase.co` (projeto de TESTE, NÃO é o produtivo). Banco produtivo real: `ptochsyoyatsydfysacc`.
- **Dev server:** porta 5173 (não 5174). `tsc --noEmit` e `npm run build` PASSAM (build ~6s, 2807 modules). Bundle ~1.3MB (acima de 500KB — pendente code-split).

### 6. LEMBRETES DE AGENDA — como as funções se conectam
- **Autor:** Jarvis / ATOM
- **Data:** 23/08/2026
- **Fluxo completo de lembrete:**
  1. **`useAgendaEvents` / `useCreateAgendaEvent`** (`src/hooks/useAgendaEvents.ts`) — insere evento na tabela **`agenda_events`** com `status='pending'`, `user_id`, `scheduled_at`, `type`, `sub_type`. Obrigatório `status='pending'` e `user_id` para o lembrete disparar.
  2. **`useReminders`** (`src/hooks/useReminders.ts`, chamado globalmente no `App.tsx`) — varre `agenda_events` (status `pending`, janela -15min/+130min a cada 30s) e, quando cruza os triggers (2h, 1h, 30min, 5min antes; no horário; atrasado), dispara: **som (Web Audio) + notificação do browser (permite/perto do horário) + insert na tabela `notifications`** (para o painel).
- **Regras:**
  - Para o lembrete tocar, o evento precisa de `scheduled_at` e `status='pending'` e o `user_id` do usuário logado (agents veem só os seus, admin/manager veem todos).
  - Se o evento for salvo como `status != 'pending'` ou sem `user_id`, o lembrete NÃO dispara.
  - A Agenda (modal "Novo Evento" → "Salvar Evento") agora insere via `useCreateAgendaEvent` → conecta ao lembrete end-to-end.
- **Pitfall:** usar `supabase.from('agenda_events').insert({...})` com `status:'pending'` + `user_id` (ex: igual Atendimento.tsx) — requisito para o `.notification` e alarme.

### 7. Refinamentos Ciclo 2 (paridade com produção)
- **Atendimento:** hooks `useAcceptConversation`, `useMarkConversationRead`, `useTransferConversation`, `useIgnoreConversation`, `useUpdateClientContact` adicionados em `src/hooks/useWhatsapp.ts` (RPCs de produção), com botões Aceitar/Transferir/Ignorar no header do chat.
- **Corretores:** aba "Performance" com ranking por score (leads + visitas + vendas*3) + barras realizado vs melhor.
- **Agenda:** conectada a `useVisits` (fonte real) + `useCreateAgendaEvent` (lembrete).
