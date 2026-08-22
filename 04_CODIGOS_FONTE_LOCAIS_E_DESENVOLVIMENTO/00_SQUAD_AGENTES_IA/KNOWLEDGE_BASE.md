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
