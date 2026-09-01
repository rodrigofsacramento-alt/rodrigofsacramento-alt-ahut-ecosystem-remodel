# 📊 REGISTRO HISTÓRICO RETROATIVO E AUDITORIA DO KANBAN — SQUAD TECH
**Ecossistema:** Ahut / ApeXfy / Estate.ia CRM  
**Ambiente de Referência:** `https://dev-ahut-ecosystem.apexfyhub.com.br/tecnologia`  
**Diretriz de Rigor:** 🚨 **ZERO ALUCINAÇÃO (O Alerta Rosa)**  
> Qualquer informação técnica ou de processo sem comprovação exata no histórico do repositório/banco/código foi deixada em branco com a marcação obrigatória: `<span style="color: #ff007f; font-weight: bold;">* (Dado não documentado no histórico - Requer validação do CTO)</span>`.

---

## 🏛️ PADRÃO ESTRUTURAL DO CARD DE TECNOLOGIA (ENTERPRISE)
Cada chamado segue o padrão de preenchimento dos cartões do painel `/tecnologia`:
- **Código Único:** `TCK-2026-XXX`
- **Título Técnico**
- **Módulo do Sistema**
- **Solicitante & Departamento**
- **Responsável Técnico / Agente(s) Atribuído(s)**
- **Prioridade:** Crítica 🟣 | Alta 🔴 | Média 🟡 | Baixa 🟢
- **Impacto no Negócio / VGV**
- **Critérios de Aceite & Validação**
- **Linha do Tempo / Histórico de Auditoria**
- **Subtickets / Pré-requisitos Técnicos** (se aplicável)

---

# 1. 📋 CARDS NA COLUNA "A EXECUTAR / FAZER" (BACKLOG APROVADO)

### [TCK-2026-001] Editor simplificado de conteúdo
* **Módulo:** Frontend & CMS
* **Solicitante:** <span style="color: #ff007f; font-weight: bold;">*</span>
* **Departamento:** Marketing & Conteúdo
* **Prioridade:** 🟡 Média
* **Responsável:** Squad Ahut Tech (Ada & Atom)
* **Impacto no Negócio:** Permitir a edição ágil de textos, banners e comunicados sem necessidade de deploy direto no código-fonte.
* **Critérios de Aceite:**
  - [ ] Interface WYSIWYG minimalista integrada ao painel administrativo.
  - [ ] Persistência de alterações no Supabase.
* **Histórico / Timeline:**
  - Chamado registrado no Backlog. Aguardando alocação de Sprint.

---

### [TCK-2026-002] Cartão lateral do grupo
* **Módulo:** Central de Atendimento / WhatsApp
* **Solicitante:** Operações Ahut
* **Departamento:** Comercial & Atendimento
* **Prioridade:** 🔴 Alta
* **Responsável:** Ada (Frontend UI) & Atom (Backend)
* **Impacto no Negócio:** Visualizar dados consolidados, participantes, tags e regras de negócio do grupo na barra lateral sem fechar o chat.
* **Critérios de Aceite:**
  - [ ] Drawer/Sidebar lateral retrátil na tela de atendimento de grupos.
  - [ ] Exibição da contagem de membros, leads associados e status do atendimento.
* **Histórico / Timeline:**
  - Chamado estruturado no Backlog de Atendimento.

---

### [TCK-2026-003] Separar telas individual/grupo
* **Módulo:** Central de Atendimento / WhatsApp
* **Solicitante:** Operações Ahut
* **Departamento:** Atendimento & Operações
* **Prioridade:** 🔴 Alta
* **Responsável:** Ada (UI) & Atom (Fullstack)
* **Impacto no Negócio:** Evitar confusão mental dos corretores entre chats 1v1 privados com clientes e grupos de empreendimentos/lotes.
* **Critérios de Aceite:**
  - [ ] Divisão clara entre rotas/abas `/atendimento` (1v1) e `/atendimento/grupos` (ou toggle dedicado).
  - [ ] Filtro automático de conversas com `is_group = false` vs `is_group = true`.
* **Histórico / Timeline:**
  - Registrado no backlog consolidado de demandas.

---

### [TCK-2026-004] Corrigir áudios/docs mobile
* **Módulo:** Central de Atendimento & Mobile UI
* **Solicitante:** <span style="color: #ff007f; font-weight: bold;">*</span>
* **Departamento:** Comercial & Corretores
* **Prioridade:** 🔴 Alta
* **Responsável:** Ada & Aura (QA)
* **Impacto no Negócio:** Garantir que corretores em trânsito consigam escutar notas de voz e baixar PDFs de propostas diretamente pelo celular.
* **Critérios de Aceite:**
  - [ ] Player de áudio com suporte a codecs OGG/Opus do WhatsApp no Safari/Chrome Mobile.
  - [ ] Download e visualização de anexos sem quebrar o layout responsivo.
* **Histórico / Timeline:**
  - Falha reportada no uso mobile de campo. Aguardando execução.

---

### [TCK-2026-005] Visualização de membros do grupo
* **Módulo:** Central de Atendimento / WhatsApp
* **Solicitante:** Rodrigo Sacramento
* **Departamento:** Operações
* **Prioridade:** 🟡 Média
* **Responsável:** Atom & Atlas (DevOps/DB)
* **Impacto no Negócio:** Listar todos os participantes de grupos de captação para rápida identificação de leads e corretores parceiros.
* **Critérios de Aceite:**
  - [ ] Consulta otimizada na view `vw_group_participants`.
  - [ ] Modal ou lista expansível exibindo nome, telefone e vínculo com a tabela `leads`.
* **Histórico / Timeline:**
  - Schema de banco preparado (`vw_group_participants`). Aguardando componente de frontend.

---

### [TCK-2026-006] Teste de recebimento via grupo
* **Módulo:** Backend & WhatsApp Broker
* **Solicitante:** Squad Ahut Tech
* **Departamento:** Tecnologia
* **Prioridade:** 🟡 Média
* **Responsável:** Aura (QA) & Atlas (DevOps)
* **Impacto no Negócio:** Validar se mensagens enviadas por múltiplos participantes em grupos de alta densidade chegam em tempo real no CRM.
* **Critérios de Aceite:**
  - [ ] Bateria de testes de carga simulando mensagens concorrentes.
  - [ ] Validação de payload com `remote_jid` terminando em `@g.us`.
* **Histórico / Timeline:**
  - Homologação agendada.

---

### [TCK-2026-007] Vitrine pública de imóveis
* **Módulo:** Imóveis & Portais Públicos
* **Solicitante:** Christian Eracanelli
* **Departamento:** Diretoria & Vendas
* **Prioridade:** 🔴 Alta
* **Responsável:** Squad Ahut Tech (Next.js)
* **Impacto no Negócio:** Disponibilizar catálogo online de lotes e imóveis para compradores finais com SEO otimizado e botão de contato direto.
* **Critérios de Aceite:**
  - [ ] Aplicação Next.js consumindo dados de imóveis ativos do Supabase.
  - [ ] Filtro por tipologia, faixa de preço, metragem e localização.
* **Histórico / Timeline:**
  - Estrutura base Next.js inicializada em repositório dedicado.

---

### [TCK-2026-008] Cadastro automático de leads
* **Módulo:** Leads & CRM / Webhook
* **Solicitante:** Rodrigo Sacramento
* **Departamento:** Comercial
* **Prioridade:** 🟣 Crítica
* **Responsável:** Atom (Backend) & Aria (Monitor de Leads)
* **Impacto no Negócio:** Criar registro automático no CRM no exato milissegundo em que um número desconhecido envia mensagem no WhatsApp da imobiliária.
* **Critérios de Aceite:**
  - [ ] Trigger/Middleware no Baileys verificando se `phone` existe em `profiles`/`leads`.
  - [ ] Inserção automática com status `Novo Lead` e atribuição de fila.
* **Histórico / Timeline:**
  - Especificação alinhada.

---

### [TCK-2026-009] Correção erro schema `"net"`
* **Módulo:** Banco de Dados / Supabase
* **Solicitante:** Atlas (DevOps)
* **Departamento:** Tecnologia
* **Prioridade:** 🔴 Alta
* **Responsável:** Atlas & Atom
* **Impacto no Negócio:** Eliminar erros silenciosos de disparo de webhooks HTTP internos que geravam exceptions `column net does not exist`.
* **Critérios de Aceite:**
  - [ ] Desativação/Reconfiguração de triggers SQL que chamam extensões de rede inexistentes.
* **Histórico / Timeline:**
  - Diagnóstico mapeado no Atlas.

---

### [TCK-2026-010] Evoluir publicação automática
* **Módulo:** Marketing & Portais
* **Solicitante:** <span style="color: #ff007f; font-weight: bold;">*</span>
* **Departamento:** Marketing
* **Prioridade:** 🟢 Baixa
* **Responsável:** <span style="color: #ff007f; font-weight: bold;">*</span>
* **Impacto no Negócio:** Integração e disparo automático de feeds XML para portais imobiliários externos (ZAP, VivaReal, OLX).
* **Critérios de Aceite:**
  - [ ] <span style="color: #ff007f; font-weight: bold;">*</span>
* **Histórico / Timeline:**
  - Backlog de integrações futuras.

---

### [TCK-2026-011] Envio e recebimento de anexos
* **Módulo:** Central de Atendimento / WhatsApp
* **Solicitante:** Operações Ahut
* **Departamento:** Atendimento
* **Prioridade:** 🔴 Alta
* **Responsável:** Atom & Ada
* **Impacto no Negócio:** Permitir tráfego bidirecional de mídias (fotos de contratos, matrículas, comprovantes de PIX e áudios) pelo chat.
* **Critérios de Aceite:**
  - [ ] Upload para Supabase Storage via Baileys com geração de URL pública/assinada.
  - [ ] Renderizador visual de imagens, PDFs e player de áudio na conversa.
* **Histórico / Timeline:**
  - Em fila de priorização.

---

### [TCK-2026-012] Atualizar VPS 24/7
* **Módulo:** Infraestrutura & DevOps
* **Solicitante:** Christian Eracanelli
* **Departamento:** Tecnologia
* **Prioridade:** 🔴 Alta
* **Responsável:** Atlas & Atom
* **Impacto no Negócio:** Manter o serviço do WhatsApp Broker operando continuamente em background com auto-restart e monitoramento de memória.
* **Critérios de Aceite:**
  - [ ] Processo PM2 configurado na VPS com startup automático no boot do sistema operacional.
* **Histórico / Timeline:**
  - Configurações de PM2 e Docker ativas no host `2.24.95.98`.

---

### [TCK-2026-013] Backup geral do site e da hospedagem
* **Módulo:** Infraestrutura & Segurança
* **Solicitante:** Christian Eracanelli
* **Departamento:** Diretoria & SecOps
* **Prioridade:** 🟣 Crítica
* **Responsável:** Aegis (SecOps) & Atlas (DevOps)
* **Impacto no Negócio:** Garantir ponto de restauração completo do código, arquivos estáticos e banco de dados contra falhas de hardware ou ataques.
* **Critérios de Aceite:**
  - [ ] Snapshot dos arquivos do cPanel/Hostinger e dump do Supabase.
* **Histórico / Timeline:**
  - Backlog de segurança periódica.

---

### [TCK-2026-014] Sistema de gestão de atividades
* **Módulo:** Tarefas & Produtividade
* **Solicitante:** <span style="color: #ff007f; font-weight: bold;">*</span>
* **Departamento:** Operações & Comercial
* **Prioridade:** 🟡 Média
* **Responsável:** Ada & Atom
* **Impacto no Negócio:** Controle de tarefas diárias do corretor (ligações pendentes, envio de documentação, visitas agendadas).
* **Critérios de Aceite:**
  - [ ] Checklist e notificações de tarefas vinculadas a cada lead.
* **Histórico / Timeline:**
  - Registrado no backlog.

---

### [TCK-2026-015] Testar mensagem de grupo
* **Módulo:** QA & WhatsApp Broker
* **Solicitante:** Squad Ahut Tech
* **Departamento:** Tecnologia
* **Prioridade:** 🟡 Média
* **Responsável:** Aura (QA)
* **Impacto no Negócio:** Certificar que envios para grupos não quebrem sessões nem gerem duplicidade de disparos.
* **Critérios de Aceite:**
  - [ ] Disparo de teste para o grupo de homologação com validação de status de entrega.
* **Histórico / Timeline:**
  - Em fila.

---

### [TCK-2026-016] Implementar tags customizáveis
* **Módulo:** Leads & Atendimento
* **Solicitante:** Comercial & Marketing
* **Departamento:** Comercial
* **Prioridade:** 🟡 Média
* **Responsável:** Ada (UI) & Atom (DB)
* **Impacto no Negócio:** Segmentar leads por tags dinâmicas (ex: `Investidor`, `Alto Padrão`, `Loteamento Alpha`, `Proposta Enviada`).
* **Critérios de Aceite:**
  - [ ] Gerenciador de tags com cores personalizáveis e filtro no kanban de leads.
* **Histórico / Timeline:**
  - Registrado no backlog.

---

### [TCK-2026-017] PV direto pelo grupo
* **Módulo:** Central de Atendimento / WhatsApp
* **Solicitante:** Rodrigo Sacramento
* **Departamento:** Atendimento
* **Prioridade:** 🔴 Alta
* **Responsável:** Ada & Atom
* **Impacto no Negócio:** Permitir que o corretor clique em um participante do grupo e abra imediatamente um atendimento privado 1v1 sem sair da tela.
* **Critérios de Aceite:**
  - [ ] Ação de clique no membro redirecionando para conversa privada com criação automática de conversa 1v1.
* **Histórico / Timeline:**
  - Demanda alinhada para a próxima sprint de Atendimento.

---

### [TCK-2026-018] Sincronia de cards — Atendimento/Lead
* **Módulo:** Leads & Chat
* **Solicitante:** Comercial
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Responsável:** Atom & Apollo (Data/BI)
* **Impacto no Negócio:** Quando a etapa do lead mudar no funil de vendas, o status do card na central de atendimento deve refletir instantaneamente.
* **Critérios de Aceite:**
  - [ ] Sincronização de estado via Supabase Realtime entre as tabelas `leads` e `conversations`.
* **Histórico / Timeline:**
  - Especificação pronta.

---

### [TCK-2026-019] Organizar materiais por imóvel
* **Módulo:** Catálogo & Documentos
* **Solicitante:** Equipe de Vendas
* **Departamento:** Comercial
* **Prioridade:** 🟡 Média
* **Responsável:** Ada & Atom
* **Impacto no Negócio:** Centralizar plantas, fotos de alta resolução, tabelas de preço e vídeos em pastas por empreendimento para envio com 1 clique ao cliente.
* **Critérios de Aceite:**
  - [ ] Aba de "Materiais de Apoio" dentro da ficha técnica do imóvel.
* **Histórico / Timeline:**
  - Backlog de catálogo.

---

### [TCK-2026-020] Aba de gestão de chamados de tecnologia
* **Módulo:** Tecnologia & Governança
* **Solicitante:** Christian Eracanelli & Rodrigo Sacramento
* **Departamento:** Diretoria & Tecnologia
* **Prioridade:** 🟣 Crítica
* **Responsável:** Squad Ahut Tech (Ada, Atom, Ava, Jarvis)
* **Impacto no Negócio:** Centralizar todas as demandas de evolução do ecossistema com triagem por IA e transparência de esteira.
* **Critérios de Aceite:**
  - [ ] Página `/tecnologia` com Kanban de 4 colunas, métricas ao vivo e assistente AVA.
* **Histórico / Timeline:**
  - Código base implementado em `src/pages/Tecnologia.tsx`.

---

### [TCK-2026-021] Clone do Ambiente DEV — Projeto
* **Módulo:** DevOps & Infraestrutura
* **Solicitante:** Christian Eracanelli
* **Departamento:** Tecnologia
* **Prioridade:** 🟣 Crítica
* **Responsável:** Atlas (DevOps Lead) & Atom
* **Impacto no Negócio:** Permitir testes e refatorações de código e banco de dados sem risco de indisponibilidade ou impacto nos dados reais do cliente.
* **Critérios de Aceite:**
  - [ ] Instância clone isolada na VPS operando em porta e banco dedicados.
* **Histórico / Timeline:**
  - Plano de provisionamento estruturado.

---

### [TCK-2026-022] Reestruturar chat visualmente
* **Módulo:** Frontend UI/UX
* **Solicitante:** Ada (Frontend Lead)
* **Departamento:** Tecnologia / Design
* **Prioridade:** 🟡 Média
* **Responsável:** Ada
* **Impacto no Negócio:** Modernizar a experiência visual do chat de corretores (estilo WhatsApp Web Enterprise), melhorando a legibilidade e ergonomia.
* **Critérios de Aceite:**
  - [ ] Balões de mensagem com contraste balanceado, avatares nítidos e transições suaves.
* **Histórico / Timeline:**
  - Protótipos em avaliação.

---

### [TCK-2026-023] Painel de performance da equipe
* **Módulo:** Analytics & BI
* **Solicitante:** Diretoria & Gestão Comercial
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Responsável:** Apollo (Data/BI) & Ada
* **Impacto no Negócio:** Medir tempo médio de primeira resposta (SLA), volume de mensagens trocadas, conversões e faturamento por corretor.
* **Critérios de Aceite:**
  - [ ] Gráficos de barras e pizza com ranking de corretores e filtros de período.
* **Histórico / Timeline:**
  - Levantamento de métricas SQL em andamento.

---

### [TCK-2026-024] Regra de nomenclatura para novos leads
* **Módulo:** Leads & CRM
* **Solicitante:** Operações Ahut
* **Departamento:** Comercial
* **Prioridade:** 🟡 Média
* **Responsável:** Atom & Aria
* **Impacto no Negócio:** Padronizar nomes automáticos (ex: `Lead WhatsApp - (DD) 9XXXX-XXXX [Origem]`) evitando contatos sem identificação clara.
* **Critérios de Aceite:**
  - [ ] Função sanitizadora de strings aplicada no momento da ingestão do lead.
* **Histórico / Timeline:**
  - Regra em análise de escopo.

---

### [TCK-2026-025] Adicionar filtros de triagem
* **Módulo:** Leads & Kanban
* **Solicitante:** Supervisão de Vendas
* **Departamento:** Comercial
* **Prioridade:** 🟡 Média
* **Responsável:** Ada
* **Impacto no Negócio:** Filtrar leads por data de entrada, canal de captação, corretor atribuído e faixa de renda estimada.
* **Critérios de Aceite:**
  - [ ] Componente de filtros combinados com persistência de estado.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-026] Saneamento de banco de dados
* **Módulo:** Database & Infra
* **Solicitante:** Atlas & Aegis
* **Departamento:** Tecnologia
* **Prioridade:** 🔴 Alta
* **Responsável:** Atlas & Apollo
* **Impacto no Negócio:** Identificar e expurgar registros órfãos, contatos de teste inválidos e conversas nulas sem perder histórico auditável.
* **Critérios de Aceite:**
  - [ ] Script SQL com execução de dry-run e backup prévio obrigatório.
* **Histórico / Timeline:**
  - Mapeamento inicial de tabelas realizado.

---

### [TCK-2026-027] Criar regra de encarteiramento
* **Módulo:** Regras de Negócio / CRM
* **Solicitante:** Diretoria Comercial
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Responsável:** Atom & Apollo
* **Impacto no Negócio:** Garantir exclusividade do lead com o corretor por 30/60 dias; caso não haja interação, o lead volta para a roleta.
* **Critérios de Aceite:**
  - [ ] Campo `carteira_ate` e trigger de verificação de inatividade.
* **Histórico / Timeline:**
  - Regra em modelagem de dados.

---

### [TCK-2026-028] Identificação visual de telefone/e-mail
* **Módulo:** Frontend UI
* **Solicitante:** Comercial
* **Departamento:** Comercial
* **Prioridade:** 🟢 Baixa
* **Responsável:** Ada
* **Impacto no Negócio:** Ícones rápidos de clique para ligar e envio de e-mail direto no cabeçalho do atendimento.
* **Critérios de Aceite:**
  - [ ] Links `tel:` e `mailto:` formatados e visíveis no perfil do lead.
* **Histórico / Timeline:**
  - Backlog de UI.

---

### [TCK-2026-029] Criar sistema financeiro
* **Módulo:** Financeiro & Fluxo de Caixa
* **Solicitante:** Diretoria
* **Departamento:** Financeiro & Diretoria
* **Prioridade:** 🟣 Crítica
* **Responsável:** Squad Ahut Tech (Atom, Apollo, Ada)
* **Impacto no Negócio:** Gestão de recebíveis, parcelamento de lotes, comissões de corretores e fluxo de caixa da imobiliária.
* **Critérios de Aceite:**
  - [ ] DRE simplificado, controle de inadimplência e emissão de recibos.
* **Histórico / Timeline:**
  - Planejado para módulo futuro do ecossistema.

---

### [TCK-2026-030] Feedback visual — Toast Alert
* **Módulo:** Frontend UX
* **Solicitante:** Equipe de Corretores
* **Departamento:** Comercial
* **Prioridade:** 🟢 Baixa
* **Responsável:** Ada
* **Impacto no Negócio:** Confirmar visualmente ações como "Lead salvo", "Mensagem enviada", "Proposta gerada" com notificações modernas no canto da tela.
* **Critérios de Aceite:**
  - [ ] Biblioteca ou componente Toast nativo integrado globalmente.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-031] Transferência de leads em lote
* **Módulo:** Leads & Gestão Comercial
* **Solicitante:** Gestor Comercial
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Responsável:** Ada & Atom
* **Impacto no Negócio:** Transferir dezenas de leads de um corretor de saída/férias para outro em apenas um clique.
* **Critérios de Aceite:**
  - [ ] Seleção múltipla com checkboxes e modal de reatribuição em massa.
* **Histórico / Timeline:**
  - Em fila.

---

### [TCK-2026-032] Backup do sistema Perfex
* **Módulo:** Infra & Sistemas Legados
* **Solicitante:** Christian Eracanelli
* **Departamento:** Diretoria & TI
* **Prioridade:** 🟡 Média
* **Responsável:** Atlas & Aegis
* **Impacto no Negócio:** Preservar a integridade dos dados históricos do CRM Perfex legado.
* **Critérios de Aceite:**
  - [ ] Dump SQL completo e compactação dos arquivos de mídia em storage frio.
* **Histórico / Timeline:**
  - Backlog de infraestrutura.

---

### [TCK-2026-033] Sincronização ininterrupta — Realtime
* **Módulo:** Supabase & WebSocket
* **Solicitante:** Squad Ahut Tech
* **Departamento:** Tecnologia
* **Prioridade:** 🟣 Crítica
* **Responsável:** Atlas & Atom
* **Impacto no Negócio:** Manter ouvintes do Supabase Realtime reconectando automaticamente após instabilidades de rede.
* **Critérios de Aceite:**
  - [ ] Heartbeat e reconexão de canais WebSocket sem recarregar a página.
* **Histórico / Timeline:**
  - Em homologação.

---

### [TCK-2026-034] Finalizar sistema de comissões
* **Módulo:** Financeiro & Vendas
* **Solicitante:** Diretoria Comercial
* **Departamento:** Comercial / Financeiro
* **Prioridade:** 🔴 Alta
* **Responsável:** Atom & Apollo
* **Impacto no Negócio:** Divisão automática de comissão entre corretor captador, corretor vendedor, gestor e imobiliária com base no VGV.
* **Critérios de Aceite:**
  - [ ] Regra de rateio percentual calculada na emissão da proposta aprovada.
* **Histórico / Timeline:**
  - Especificação em validação.

---

### [TCK-2026-035] Instalação da base da Vitrine Digital — Next.js
* **Módulo:** Portais & SEO
* **Solicitante:** Christian Eracanelli
* **Departamento:** Marketing & Tecnologia
* **Prioridade:** 🔴 Alta
* **Responsável:** Atom
* **Impacto no Negócio:** Estrutura performática com Server-Side Rendering para indexação no Google dos empreendimentos.
* **Critérios de Aceite:**
  - [ ] Template Next.js configurado com Tailwind e conexão Supabase.
* **Histórico / Timeline:**
  - Projeto base criado.

---

### [TCK-2026-036] Encerramento de atendimento
* **Módulo:** Central de Atendimento / WhatsApp
* **Solicitante:** Supervisão de Atendimento
* **Departamento:** Atendimento
* **Prioridade:** 🟡 Média
* **Responsável:** Ada & Atom
* **Impacto no Negócio:** Permitir finalizar conversas concluídas, enviando pesquisa de satisfação e arquivando o chat.
* **Critérios de Aceite:**
  - [ ] Botão de arquivar/encerrar com motivo do fechamento.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-037] Cérebro Digital IA acoplado
* **Módulo:** Inteligência Artificial & Agentes
* **Solicitante:** Christian Eracanelli
* **Departamento:** Diretoria & IA
* **Prioridade:** 🟣 Crítica
* **Responsável:** Squad Ahut Tech (Jarvis & Ava)
* **Impacto no Negócio:** Agente autônomo respondendo dúvidas frequentes sobre metragem, localização e agendando visitas no WhatsApp.
* **Critérios de Aceite:**
  - [ ] Integração com LLM e base de conhecimento vetorial dos imóveis.
* **Histórico / Timeline:**
  - Em pesquisa e arquitetura.

---

### [TCK-2026-038] Aba de mensagens não lidas
* **Módulo:** Central de Atendimento
* **Solicitante:** Corretores
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Responsável:** Ada
* **Impacto no Negócio:** Filtro de 1 clique para exibir apenas conversas com mensagens pendentes de resposta.
* **Critérios de Aceite:**
  - [ ] Badge contador e aba filtrada por `unread_count > 0`.
* **Histórico / Timeline:**
  - Em backlog de UI.

---

### [TCK-2026-039] Fluxo de propostas e contratos
* **Módulo:** Propostas & Jurídico
* **Solicitante:** Comercial & Jurídico
* **Departamento:** Jurídico / Vendas
* **Prioridade:** 🔴 Alta
* **Responsável:** Atom & Ada
* **Impacto no Negócio:** Acompanhar esteira da proposta: `Enviada` ➔ `Em Análise` ➔ `Assinada` ➔ `Venda Concluída`.
* **Critérios de Aceite:**
  - [ ] Kanban de propostas integrado com valores de entrada e financiamento.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-040] Adicionar modo tela cheia
* **Módulo:** Frontend UI
* **Solicitante:** Corretores
* **Departamento:** Atendimento
* **Prioridade:** 🟢 Baixa
* **Responsável:** Ada
* **Impacto no Negócio:** Ocultar menu lateral e cabeçalhos para maximizar o espaço de digitação e histórico de chat.
* **Critérios de Aceite:**
  - [ ] Botão de Fullscreen expandindo a área de chat.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-041] Recomendação de imóveis parecidos
* **Módulo:** IA & Catálogo
* **Solicitante:** Marketing
* **Departamento:** Comercial
* **Prioridade:** 🟡 Média
* **Responsável:** Apollo (Data) & Ada
* **Impacto no Negócio:** Sugerir automaticamente lotes alternativos na mesma faixa de preço e bairro quando o lead demonstrar interesse.
* **Critérios de Aceite:**
  - [ ] Algoritmo de proximidade de características e exibição de cards relacionados.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-042] Criar módulo de RH
* **Módulo:** Recursos Humanos & Equipe
* **Solicitante:** Christian Eracanelli
* **Departamento:** Administrativo & RH
* **Prioridade:** 🟡 Média
* **Responsável:** Squad Ahut Tech
* **Impacto no Negócio:** Controle de corretores parceiros, documentação de CRECI, contratos de associação e metas.
* **Critérios de Aceite:**
  - [ ] Cadastro completo de colaboradores com upload de documentos e status de contrato.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-043] Criar visão Kanban
* **Módulo:** Leads & Oportunidades
* **Solicitante:** Comercial
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Responsável:** Ada & Atom
* **Impacto no Negócio:** Arrastar e soltar leads entre as fases do funil de vendas (Prospecção, Visita, Proposta, Fechamento).
* **Critérios de Aceite:**
  - [ ] Drag-and-drop com persistência no Supabase.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-044] Destacar ações no card
* **Módulo:** Frontend UI
* **Solicitante:** Corretores
* **Departamento:** Atendimento
* **Prioridade:** 🟢 Baixa
* **Responsável:** Ada
* **Impacto no Negócio:** Botões rápidos de ação (WhatsApp, Ligar, Ver Imóvel) diretamente no card sem precisar abri-lo.
* **Critérios de Aceite:**
  - [ ] Quick-action bar hover no card.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-045] Fluxo de desligamento de corretor
* **Módulo:** RH & Segurança
* **Solicitante:** Diretoria & RH
* **Departamento:** Administrativo / SecOps
* **Prioridade:** 🔴 Alta
* **Responsável:** Aegis (SecOps) & Atom
* **Impacto no Negócio:** Revogação imediata de acessos, desvinculação de sessões e redistribuição automática de leads do corretor desligado.
* **Critérios de Aceite:**
  - [ ] Botão de desligamento com assistente de redistribuição de carteira e revogação de tokens de login.
* **Histórico / Timeline:**
  - Em backlog de governança.

---

### [TCK-2026-046] Servidor `whatsapp-broker` operando
* **Módulo:** Infraestrutura / Node.js
* **Solicitante:** Squad Ahut Tech
* **Departamento:** Tecnologia
* **Prioridade:** 🟣 Crítica
* **Responsável:** Atlas & Atom
* **Impacto no Negócio:** Comunicação estável entre instâncias Baileys e o banco de dados.
* **Critérios de Aceite:**
  - [ ] Serviço rodando na VPS com reinicialização em caso de falha de memória.
* **Histórico / Timeline:**
  - Ativo em produção.

---

### [TCK-2026-047] Integração Realtime Baileys + Supabase
* **Módulo:** Backend / Realtime
* **Solicitante:** Squad Ahut Tech
* **Departamento:** Tecnologia
* **Prioridade:** 🟣 Crítica
* **Responsável:** Atom & Atlas
* **Impacto no Negócio:** Atualização instantânea de novas mensagens no front-end do corretor sem necessidade de polling HTTP.
* **Critérios de Aceite:**
  - [ ] Ingestão de mensagens via Postgres Trigger e broadcast via canais Realtime.
* **Histórico / Timeline:**
  - Operando no ecossistema ativo.

---

### [TCK-2026-048] Diagnóstico de leads “Agência Hut” concluído
* **Módulo:** Banco de Dados / Leads
* **Solicitante:** Comercial & Diretoria
* **Departamento:** Comercial / TI
* **Prioridade:** 🔴 Alta
* **Responsável:** Atlas & Apollo
* **Impacto no Negócio:** Diagnóstico que identificou mensagens próprias da imobiliária gravadas erroneamente com o nome "Agência Hut" no lugar do nome do cliente.
* **Critérios de Aceite:**
  - [ ] Relatório técnico identificando a falha de checagem do flag `fromMe` na ingestão.
* **Histórico / Timeline:**
  - Diagnóstico concluído.

---

### [TCK-2026-049] Criar aba de grupos
* **Módulo:** Central de Atendimento
* **Solicitante:** Rodrigo Sacramento
* **Departamento:** Operações
* **Prioridade:** 🔴 Alta
* **Responsável:** Ada & Atom
* **Impacto no Negócio:** Espaço dedicado para moderação e mensagens de grupos de loteamentos e condomínios.
* **Critérios de Aceite:**
  - [ ] Aba "Grupos" com contagem de membros e histórico específico.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-050] Landing pages por empreendimento
* **Módulo:** Portais & Marketing
* **Solicitante:** Christian Eracanelli
* **Departamento:** Marketing
* **Prioridade:** 🔴 Alta
* **Responsável:** Squad Ahut Tech (Next.js / React)
* **Impacto no Negócio:** Páginas dedicadas de alta conversão para tráfego pago (Google Ads/Meta Ads) de lançamentos imobiliários.
* **Critérios de Aceite:**
  - [ ] Template com galeria de imagens, formulário integrado ao WhatsApp e mapa de localização.
* **Histórico / Timeline:**
  - Backlog de produto.

---

### [TCK-2026-051] Auto scroll da conversa
* **Módulo:** Frontend UI
* **Solicitante:** Corretores
* **Departamento:** Atendimento
* **Prioridade:** 🟡 Média
* **Responsável:** Ada
* **Impacto no Negócio:** Rolar automaticamente para a mensagem mais recente ao abrir a conversa ou receber nova mensagem.
* **Critérios de Aceite:**
  - [ ] `scrollIntoView` suave acionado nas atualizações de mensagens.
* **Histórico / Timeline:**
  - Em backlog.

---

### [TCK-2026-052] Envio de áudios no mobile
* **Módulo:** Mobile UX / WhatsApp
* **Solicitante:** Corretores
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Responsável:** Ada & Atom
* **Impacto no Negócio:** Permitir gravação e envio de notas de voz diretamente pelo microfone do celular no CRM.
* **Critérios de Aceite:**
  - [ ] Integração com MediaRecorder API e conversão para formato aceito no WhatsApp.
* **Histórico / Timeline:**
  - Em backlog.

---

# 2. 🔄 CARDS NA COLUNA "EM EXECUÇÃO / FAZENDO"

### [TCK-2026-053] Lógica de reconexão e nova sessão do QR Code
* **Módulo:** Central de Atendimento & Baileys
* **Solicitante:** Rodrigo Sacramento
* **Departamento:** Operações & Tecnologia
* **Prioridade:** 🟣 Crítica
* **Status Atual:** 🔄 **Em Execução (Subfase: Em Aplicação)**
* **Responsável:** Atom (Backend Lead) & Atlas (DevOps)
* **Impacto no Negócio:** Restaurar instantaneamente a conexão do WhatsApp em caso de desconexão ou expiração de token sem travar o CRM.
* **Critérios de Aceite:**
  - [ ] Modal de QR Code com polling de status de autenticação.
  - [ ] Tratamento de disconnect codes (401, 515, 428) com reconexão automática e purge da pasta `auth_info_baileys` quando necessário.
* **Histórico / Timeline:**
  - Triagem realizada. Em aplicação direta no código do Broker e do Frontend.

---

### [TCK-2026-054] Criar documentação `.md` sobre a lógica de reconexão e nova sessão do QR Code
* **Módulo:** Documentação & Governança
* **Solicitante:** Argus (Scrum Master)
* **Departamento:** Tecnologia
* **Prioridade:** 🟡 Média
* **Status Atual:** 🔄 **Em Execução (Subfase: Em Aplicação)**
* **Responsável:** Argus & Atom
* **Impacto no Negócio:** Registrar para toda a equipe técnica e inteligência de IA o fluxo exato de reconexão e prevenção de loops de login.
* **Critérios de Aceite:**
  - [ ] Arquivo Markdown detalhado com fluxograma e guia de troubleshooting.
* **Histórico / Timeline:**
  - Documentação sendo redigida e acoplada ao repositório.

---

# 3. 🔍 CARDS NA COLUNA "EM ANÁLISE / TRIAGEM"

### [TCK-2026-055] Registro de auditoria para transferência e alteração de status
* **Módulo:** Auditoria & Governança
* **Solicitante:** Diretoria / Gestão
* **Departamento:** Operações
* **Prioridade:** 🔴 Alta
* **Status Atual:** 🔍 **Em Análise (Diagnóstico)**
* **Responsável:** Aegis (SecOps) & Apollo (Data)
* **Impacto no Negócio:** Rastreabilidade absoluta: saber qual corretor ou admin moveu o lead, quando moveu e qual era o status anterior.
* **Critérios de Aceite:**
  - [ ] Tabela `lead_status_logs` gravando `lead_id`, `previous_status`, `new_status`, `changed_by_user_id` e `timestamp`.
* **Histórico / Timeline:**
  - Em modelagem e análise de schema.

---

### [TCK-2026-056] Correção do bug de identificação “Agência Hut” com `isFromMe`
* **Módulo:** Backend / WhatsApp Broker
* **Solicitante:** Equipe Comercial
* **Departamento:** Atendimento
* **Prioridade:** 🟣 Crítica
* **Status Atual:** 🔍 **Em Análise (Validação de Patch)**
* **Responsável:** Atlas & Atom
* **Impacto no Negócio:** Eliminar a sobreposição onde mensagens enviadas pela imobiliária renomeavam o contato do lead para "Agência Hut".
* **Critérios de Aceite:**
  - [ ] Verificação estrita `if (!isFromMe)` antes de atualizar o nome de exibição (`pushName`) na tabela de contatos.
* **Histórico / Timeline:**
  - Patch analisado no `session-manager.ts`. Em testes de validação.

---

### [TCK-2026-057] Saneamento dos leads antigos com nome “Agência Hut”
* **Módulo:** Banco de Dados / Leads
* **Solicitante:** Operações Ahut
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Status Atual:** 🔍 **Em Análise (Query de Recuperação)**
* **Responsável:** Apollo (Data) & Atlas
* **Impacto no Negócio:** Restaurar o nome real de dezenas de leads cadastrados incorretamente com o nome "Agência Hut".
* **Critérios de Aceite:**
  - [ ] Script de recuperação cruzando mensagens recebidas para extrair o `pushName` real do cliente.
* **Histórico / Timeline:**
  - Queries de auditoria sendo estruturadas em ambiente de teste.

---

### [TCK-2026-058] Filtro case-insensitive na tela de leads
* **Módulo:** Frontend & Leads
* **Solicitante:** Equipe de Vendas
* **Departamento:** Comercial
* **Prioridade:** 🟡 Média
* **Status Atual:** 🔍 **Em Análise**
* **Responsável:** Ada & Aura (QA)
* **Impacto no Negócio:** Permitir encontrar leads digitando em maiúsculas ou minúsculas (ex: "rodrigo", "Rodrigo", "RODRIGO") sem distinção.
* **Critérios de Aceite:**
  - [ ] Busca aplicando `.toLowerCase()` no frontend ou `ILIKE` na query PostgREST.
* **Histórico / Timeline:**
  - Escopo em validação antes de classificação definitiva.

---

### [TCK-2026-059] Testes automatizados da regra de nomenclatura
* **Módulo:** QA & Automação
* **Solicitante:** Aura (QA Lead)
* **Departamento:** Tecnologia
* **Prioridade:** 🟡 Média
* **Status Atual:** 🔍 **Em Análise (Criação de Test Cases)**
* **Responsável:** Aura (QA Tester)
* **Impacto no Negócio:** Garantir que nenhuma alteração futura quebre a padronização dos nomes de novos leads.
* **Critérios de Aceite:**
  - [ ] Suite de testes unitários validando casos com DDD, sem DDD, números internacionais e caracteres especiais.
* **Histórico / Timeline:**
  - Casos de teste sendo mapeados.

---

# 4. ✅ CARDS NA COLUNA "EXECUTADO / FEITO" (HISTÓRICO RETROATIVO COMPROVADO)

### [TCK-2026-060] Correção do envio de mensagens privadas 1v1 com `resolvedRemoteJid`
* **Módulo:** Central de Atendimento & Baileys
* **Solicitante:** Operações Ahut
* **Departamento:** Atendimento
* **Prioridade:** 🟣 Crítica
* **Status Atual:** ✅ **Executado (Atualizado em Produção)**
* **Responsável:** Atom (Dev Sênior)
* **Impacto no Negócio:** Corrigiu o erro em que mensagens privadas enviadas pelo corretor não chegavam ao cliente por falha na resolução do JID.
* **Critérios de Aceite:**
  - [x] Resolução de JIDs `@s.whatsapp.net` padronizada com DDI 55 e nono dígito.
  - [x] Mensagens enviadas com entrega confirmada e gravação em `messages`.
* **Histórico / Timeline:**
  - Diagnosticado, codificado pelo Atom, testado pela Aura e publicado em produção.

---

### [TCK-2026-061] Liberação da aba de Grupos para corretores
* **Módulo:** Frontend & Permissões (RBAC)
* **Solicitante:** Rodrigo Sacramento
* **Departamento:** Operações
* **Prioridade:** 🔴 Alta
* **Status Atual:** ✅ **Executado (Atualizado em Produção)**
* **Responsável:** Ada (UI) & Aegis (SecOps)
* **Impacto no Negócio:** Permitiu que corretores autorizados visualizem e participem dos grupos de atendimento diretamente pelo CRM.
* **Critérios de Aceite:**
  - [x] Aba de grupos habilitada no menu de navegação com controle de perfil de usuário.
* **Histórico / Timeline:**
  - Implementado, aprovado e liberado aos usuários da imobiliária.

---

### [TCK-2026-062] Direcionamento livre de leads entre corretores
* **Módulo:** Leads & Distribuição
* **Solicitante:** Gestão Comercial
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Status Atual:** ✅ **Executado (Atualizado em Produção)**
* **Responsável:** Atom & Ada
* **Impacto no Negócio:** Flexibilidade para administradores e gestores transferirem leads individualmente para qualquer corretor da equipe.
* **Critérios de Aceite:**
  - [x] Dropdown de seleção de corretor no card do lead com atualização imediata de `assigned_to` no banco.
* **Histórico / Timeline:**
  - Entregue e validado em produção.

---

### [TCK-2026-063] Auditoria de duplicidade de telefones
* **Módulo:** Banco de Dados & Qualidade
* **Solicitante:** Christian Eracanelli
* **Departamento:** Diretoria & Tecnologia
* **Prioridade:** 🔴 Alta
* **Status Atual:** ✅ **Executado (Atualizado)**
* **Responsável:** Apollo (Data/BI) & Atlas
* **Impacto no Negócio:** Varredura completa no banco de dados identificando contatos com o mesmo telefone para evitar fragmentação de histórico.
* **Critérios de Aceite:**
  - [x] Relatório SQL agrupando números por telefone e identificando duplicidades para merge.
* **Histórico / Timeline:**
  - Executado e registrado na base técnica.

---

### [TCK-2026-064] Regra de nomenclatura automática de novos leads
* **Módulo:** Leads & Ingestão
* **Solicitante:** Operações Ahut
* **Departamento:** Comercial
* **Prioridade:** 🟡 Média
* **Status Atual:** ✅ **Executado (Atualizado)**
* **Responsável:** Atom
* **Impacto no Negócio:** Leads criados automaticamente agora recebem o nome de exibição informado pelo WhatsApp ou o formato de telefone padronizado.
* **Critérios de Aceite:**
  - [x] Lógica de fallback: `pushName` ➔ `Telefone Formatado` ➔ `Novo Lead WhatsApp`.
* **Histórico / Timeline:**
  - Publicado e em operação contínua.

---

### [TCK-2026-065] Exibição de telefone e e-mail no vínculo de leads
* **Módulo:** Frontend UI
* **Solicitante:** Corretores
* **Departamento:** Comercial
* **Prioridade:** 🟡 Média
* **Status Atual:** ✅ **Executado (Atualizado)**
* **Responsável:** Ada
* **Impacto no Negócio:** Facilidade de visualização rápida dos dados de contato do cliente na barra de detalhes do chat.
* **Critérios de Aceite:**
  - [x] Cards com ícones e textos nítidos de telefone e e-mail no painel lateral.
* **Histórico / Timeline:**
  - Componente componentizado e publicado no frontend.

---

### [TCK-2026-066] Toast de confirmação ao salvar alterações no lead
* **Módulo:** Frontend UX
* **Solicitante:** Equipe de Vendas
* **Departamento:** Comercial
* **Prioridade:** 🟢 Baixa
* **Status Atual:** ✅ **Executado (Atualizado)**
* **Responsável:** Ada
* **Impacto no Negócio:** Elimina a incerteza do corretor se a anotação ou troca de fase do lead foi gravada com sucesso.
* **Critérios de Aceite:**
  - [x] Toast verde flutuante informando "Lead atualizado com sucesso" disparado após resposta 200 do Supabase.
* **Histórico / Timeline:**
  - Integrado ao componente de edição de leads.

---

### [TCK-2026-067] Inicialização da infraestrutura da Vitrine Digital em Next.js
* **Módulo:** Portais & Arquitetura
* **Solicitante:** Christian Eracanelli
* **Departamento:** Tecnologia & Produto
* **Prioridade:** 🔴 Alta
* **Status Atual:** ✅ **Executado (Backup Realizado)**
* **Responsável:** Atom & Atlas
* **Impacto no Negócio:** Criação da base tecnológica moderna para a vitrine pública de imóveis da imobiliária.
* **Critérios de Aceite:**
  - [x] Repositório inicializado com Next.js, Tailwind CSS e configuração de client Supabase.
* **Histórico / Timeline:**
  - Setup concluído e salvo no repositório.

---

### [TCK-2026-068] Criação do HUB Central de Relatórios
* **Módulo:** Gestão & Documentação
* **Solicitante:** Christian Eracanelli & Rodrigo Sacramento
* **Departamento:** Diretoria & Operações
* **Prioridade:** 🔴 Alta
* **Status Atual:** ✅ **Executado (Atualizado)**
* **Responsável:** Apollo & Argus
* **Impacto no Negócio:** Centralizar toda a documentação, relatórios de sprints e atas de incidentes do ecossistema.
* **Critérios de Aceite:**
  - [x] Painel de controle e diretrizes organizados no repositório.
* **Histórico / Timeline:**
  - Estrutura consolidada em `00_SQUAD_AGENTES_IA`.

---

### [TCK-2026-069] Criação do Supabase Schema Central
* **Módulo:** Banco de Dados & Arquitetura
* **Solicitante:** Squad Ahut Tech
* **Departamento:** Tecnologia
* **Prioridade:** 🟣 Crítica
* **Status Atual:** ✅ **Executado (Backup Realizado)**
* **Responsável:** Atlas & Atom
* **Impacto no Negócio:** Definição da espinha dorsal do banco de dados (tabelas `profiles`, `conversations`, `messages`, `leads`, `properties`).
* **Critérios de Aceite:**
  - [x] Schemas, Foreign Keys, Triggers e Índices criados e ativos em produção.
* **Histórico / Timeline:**
  - Schema central modelado, deployado e auditado.

---

### [TCK-2026-070] Construção do front-end do corretor em React/Vite
* **Módulo:** Frontend & Engenharia Reversa
* **Solicitante:** Christian Eracanelli
* **Departamento:** Tecnologia
* **Prioridade:** 🟣 Crítica
* **Status Atual:** ✅ **Executado (Atualizado em Produção / BKP)**
* **Responsável:** Ada & Atom
* **Impacto no Negócio:** Reconstrução integral do código-fonte do CRM com tecnologia moderna (React + TypeScript + Vite + Tailwind).
* **Critérios de Aceite:**
  - [x] Telas principais (Dashboard, Atendimento, Leads, Imóveis, Propostas, Agenda, Tecnologia) componentizadas.
* **Histórico / Timeline:**
  - Fases 1 e 2 de engenharia reversa concluídas com build 100% validada.

---

### [TCK-2026-071] Ordenação dos leads pela data da última mensagem
* **Módulo:** Leads & Central de Atendimento
* **Solicitante:** Equipe de Corretores
* **Departamento:** Comercial
* **Prioridade:** 🔴 Alta
* **Status Atual:** ✅ **Executado (Atualizado em Produção)**
* **Responsável:** Atom & Ada
* **Impacto no Negócio:** Garante que os clientes que responderam mais recentemente apareçam sempre no topo da lista de conversas.
* **Critérios de Aceite:**
  - [x] Query com `ORDER BY last_message_date DESC NULLS LAST`.
* **Histórico / Timeline:**
  - Implementado e em produção no frontend do corretor.
