# CONTEXTO DE ORQUESTRAÇÃO — JARVIS → SQUAD (Ciclo 1)

## Ambiente materializado (caminhos REAIS — NÃO são os do Mac)
- **Fonte de verdade (SOMENTE LEITURA, congelada):** `/opt/data/ahut-ecosystem-active`
  - Build minificado autoritativo: `01_FRONTEND_PRODUCAO_HOSTINGER/assets/*.js`
  - Chunks de página (lazy): `Atendimento-*.js`, `Leads-*.js`, `Agenda-*.js`, `Corretores-*.js`, `Financeiro-*.js`, `Vendas-*.js`, `Imoveis-*.js`, `Juridico-*.js`, `Propostas-*.js`, etc.
  - ⛔ NUNCA editar/comitar neste repositório (está congelado por backup).
- **Código reverso TSX (onde IMPLEMENTAR):** `/opt/data/ahut-ecosystem/04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/ahut-ecosystem-active/codigo_engenharia_reversa_tsx`
- **Repositório de trabalho (fazer commit/push AQUI):** `/opt/data/ahut-ecosystem` (remote = `ahut-ecosystem-remodel`)
- **Squad manual + kanban:** `/opt/data/ahut-ecosystem/04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/00_SQUAD_AGENTES_IA/`
  - `PROMPT_ENGENHARIA_REVERSA_CONTINUA.md` (processo/missão)
  - `PAINEL_DE_CONTROLE.md` (kanban, log a atualizar)
  - `KNOWLEDGE_BASE.md` (memória técnica — SEMPRE ler antes de codar)

## Stack do código reverso
- React 18 + Vite + TypeScript + Tailwind + lucide-react + framer-motion + @supabase/supabase-js + @tanstack/react-query + react-router-dom.
- `src/pages/` (páginas) + `src/components/` (módulos) + `src/hooks/` + `src/lib/supabase.ts` + `src/types/supabase.ts`.
- Scripts: `npm run dev` (Vite), `npm run build` (`tsc && vite build`).
- Build validado historicamente em ~22s, 2835 modules.

## Idempotência operacional do servidor dev
- `vite.config.ts` define porta (5174). Rodar dev em background e testar nas rotas.

## Nicho: CRM IMOBILIÁRIO. NUNCA usar termos de clínica/saúde.
Departamentos oficiais: Diretoria & Tech, Operações Ahut, Comercial & Vendas, Atendimento & WhatsApp, Jurídico & Contratos, Financeiro & Comissões, Marketing & Captação, Tecnologia & Suporte.

## Regras de segurança (AEGIS) e QA (AURA)
- useAuth() em TODAS as páginas; corretor `agent`/`manager` NUNCA acessa painéis de configuração global.
- Sem tokens/senhas em console.log.
- RLS Supabase sempre respeitado.
- Zero erros `tsc` antes de entregar; build `npm run build` deve passar.
- Envolver rotas no App.tsx com `<AppLayout title=".." subtitle=".."><Pagina/></AppLayout>`.

## Camada Supabase de produção (SOMENTE LEITURA / grupo de teste)
- Projeto `ptochsyoyatsydfysacc`. Não alterar estrutura produtiva. Testar apenas com o grupo autorizado (Rodrigo Sacramento).

## Prioridade do Ciclo 1 (ordem do comandante)
1. Atendimento (reclamações em aberto) — CRÍTICO
2. Leads
3. Agenda
4. Corretores
5. Financeiro
6. Notificações
7. Dashboard
8. (Jarvis decide os demais ao longo dos ciclos)

## Canais de reporte
- Atualizar PAINEL_DE_CONTROLE.md após cada entrega documentada.
- Registrar aprendizados em KNOWLEDGE_BASE.md.