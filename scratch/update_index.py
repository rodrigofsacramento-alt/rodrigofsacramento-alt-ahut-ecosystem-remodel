import re
import json

file_path = "/Users/christianeracanelli/Desktop/Ahut Ecosystem/04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/ahut-ecosystem-active/01_FRONTEND_PRODUCAO_HOSTINGER_BKP/tecnologia/index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update LOCAL_STORAGE_KEY
content = re.sub(
    r"const LOCAL_STORAGE_KEY = 'ahut_tech_tickets_apexfy_v1';",
    "const LOCAL_STORAGE_KEY = 'ahut_tech_tickets_apexfy_v2';",
    content
)

# 2. Update INITIAL_TICKETS
# We will use regex to find the whole INITIAL_TICKETS array and replace it.
new_tickets = """const INITIAL_TICKETS = [
      {
        id: 'tck-1',
        code: 'TCK-2026-081',
        title: 'Módulo Tecnologia & Kanban Inteligente com Agentes de IA',
        description: 'Implementar tela de gestão de chamados do ecossistema com pipeline de 4 estágios e agente de triagem conversacional para colaboradores.',
        module: 'Frontend & UI',
        requesterName: 'Rodrigo Sacramento',
        requesterRole: 'Gestão de Operações',
        requesterDepartment: 'Operações Ahut',
        priority: 'critica',
        main_status: 'executando',
        subcategory: 'em_validacao',
        delivery_forecast: '2026-08-22',
        created_at: new Date().toISOString(),
        assigned_to: 'Squad Ahut Tech (CTO)',
        impact_level: 'Alto',
        is_ai_triaged: true,
        business_impact: 'Centraliza todas as requisições de melhoria do ecossistema e elimina ruídos entre operações e desenvolvimento.',
        acceptance_criteria: [
          'Coluna "A Analisar" integrada ao fluxo de entrada',
          'Assistente IA com suporte a texto, prints e gravação de áudio',
          'Card padrão multinacional com badges de SLA e anexos'
        ],
        attachments: [
          { id: 'att-1', name: 'arquitetura_squad_ia.png', type: 'image', size: '1.4 MB' },
          { id: 'att-2', name: 'audio_explicacao_rodrigo.mp3', type: 'audio', duration: '0:42' }
        ],
        timeline: [
          { status: 'Triado por Agente IA', date: '20/08 08:30', user: 'Agente Triagem IA' },
          { status: 'Aprovado pelo CTO', date: '20/08 09:00', user: 'Squad Ahut Tech' },
          { status: 'Em Validação (QA)', date: '20/08 10:15', user: 'Squad Ahut Tech' }
        ]
      },
      {
        id: 'tck-2',
        code: 'TCK-2026-082',
        title: 'Refatoração da Arquitetura do Webhook WhatsApp Broker',
        description: 'Otimizar rotina de conciliação de mensagens com fila assíncrona para suportar picos de 500 msgs/min sem atraso no chat.',
        module: 'Backend & WhatsApp Broker',
        requesterName: 'Rodrigo Sacramento',
        requesterRole: 'Gestão de Operações',
        requesterDepartment: 'Operações Ahut',
        priority: 'alta',
        main_status: 'executando',
        subcategory: 'em_aplicacao',
        delivery_forecast: '2026-08-23',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        assigned_to: 'Squad Ahut Tech (Backend)',
        impact_level: 'Alto',
        is_ai_triaged: true,
        business_impact: 'Evita perda de mensagens de leads em horários de pico comercial no corretor dashboard.',
        acceptance_criteria: [
          'Processamento concorrente de webhooks',
          'Auto-recovery para desconexões do Baileys'
        ],
        attachments: [
          { id: 'att-3', name: 'logs_latencia_broker.pdf', type: 'doc', size: '320 KB' }
        ],
        timeline: [
          { status: 'Triado por IA', date: '19/08 14:00', user: 'Agente Triagem IA' },
          { status: 'Em Aplicação', date: '20/08 07:45', user: 'Squad Ahut Tech' }
        ]
      },
      {
        id: 'tck-5',
        code: 'TCK-2026-085',
        title: 'Atualização de Dependências e Auditoria de Segurança',
        description: 'Revisão das bibliotecas do broker, patch de segurança e validação do pipeline de CI/CD.',
        module: 'DevOps & Segurança',
        requesterName: 'Rodrigo Sacramento',
        requesterRole: 'Gestão de Operações',
        requesterDepartment: 'Operações Ahut',
        priority: 'alta',
        main_status: 'executado',
        subcategory: 'backup_realizado',
        delivery_forecast: '2026-08-19',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        assigned_to: 'Squad Ahut Tech (DevOps)',
        impact_level: 'Alto',
        is_ai_triaged: false,
        business_impact: 'Garante integridade e estabilidade dos serviços em produção.',
        acceptance_criteria: [
          'Build testado e aprovado',
          'Backup do repositório versionado no GitHub'
        ],
        timeline: [
          { status: 'Entregue em Produção', date: '19/08 18:00', user: 'Squad Ahut Tech' },
          { status: 'Backup Realizado (GitHub)', date: '19/08 18:30', user: 'DevOps Bot' }
        ]
      },
      {
        id: 'tck-wesley-1',
        code: 'TCK-2026-086',
        title: 'Resolução Contatos Duplicados (Incidente Wesley)',
        description: 'Implementar bloqueios e notificações para impedir criação manual de contatos duplicados e garantir fluxo unificado de mensagens. (Alinhado via AVA/ATOM/ORQUESTRADOR)',
        module: 'Atendimento & WhatsApp',
        requesterName: 'Wesley / Equipe',
        requesterRole: 'Atendimento',
        requesterDepartment: 'Comercial',
        priority: 'critica',
        main_status: 'a_executar',
        subcategory: 'nao_especificado',
        delivery_forecast: '2026-08-27',
        created_at: new Date().toISOString(),
        assigned_to: 'Squad Ahut Tech (Fullstack)',
        impact_level: 'Alto',
        is_ai_triaged: true,
        business_impact: 'Evita a divisão de conversas, perdas de histórico e confusão nos atendimentos.',
        subtickets: [
          { id: 'sub-1', title: 'Bloqueio de contatos duplicados', done: false },
          { id: 'sub-2', title: 'Aviso ao detectar contato existente', done: false },
          { id: 'sub-3', title: 'Solicitação de permissão ao administrador', done: false },
          { id: 'sub-4', title: 'Notificação para administradores', done: false },
          { id: 'sub-5', title: 'Exibição de dados do lead/contato para adm', done: false },
          { id: 'sub-6', title: 'Correção do fluxo de mensagens (unificar contato correto)', done: false },
          { id: 'sub-7', title: 'Controle de acesso por permissões (limitar visitas/ações)', done: false },
          { id: 'sub-8', title: 'Validação antes de adicionar contato (indicar se já tem atendente)', done: false },
          { id: 'sub-9', title: 'Ajuste no fluxo de grupos (evitar duplicar acessos)', done: false },
          { id: 'sub-10', title: 'Teste de atualização do sistema (QA do Rodrigo)', done: false }
        ],
        timeline: [
          { status: 'Alinhamento AVA x ATOM', date: new Date().toLocaleDateString('pt-BR'), user: 'Orquestrador Chief' },
          { status: 'Sprint Backlog Aprovado', date: new Date().toLocaleDateString('pt-BR'), user: 'Fila A Executar' }
        ]
      }
    ];"""

content = re.sub(
    r"const INITIAL_TICKETS = \[\s*\{.*?\}\s*\];",
    new_tickets,
    content,
    flags=re.DOTALL
)

# 3. Add Subtickets UI to TicketCard
# We need to insert a piece of code inside the TicketCard JSX, right after the description block.
subtickets_jsx = """
            </p>
          </div>

          {/* Subtickets Area */}
          {ticket.subtickets && ticket.subtickets.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                <span className="font-bold flex items-center gap-1"><i data-lucide="git-merge" className="w-3 h-3 text-sky-400"></i> Sub-tarefas / Pré-requisitos</span>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">{ticket.subtickets.filter(s => s.done).length}/{ticket.subtickets.length}</span>
              </div>
              <div className="space-y-1.5">
                {ticket.subtickets.slice(0, 3).map((sub, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] bg-slate-900/50 p-1.5 rounded border border-slate-800/50">
                    <input type="checkbox" checked={sub.done} readOnly className="mt-0.5 w-3 h-3 accent-sky-500 rounded bg-slate-800 border-slate-700" />
                    <span className={sub.done ? 'line-through text-slate-500' : 'text-slate-300'}>{sub.title}</span>
                  </div>
                ))}
                {ticket.subtickets.length > 3 && (
                  <div className="text-[9px] text-sky-400 text-center py-1 cursor-pointer hover:bg-slate-800/50 rounded">
                    + {ticket.subtickets.length - 3} subtickets ocultos
                  </div>
                )}
              </div>
            </div>
          )}
"""

content = content.replace(
    "            </p>\n          </div>",
    subtickets_jsx
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# Also copy to the 01_FRONTEND_PRODUCAO_HOSTINGER to sync
import shutil
shutil.copyfile(file_path, "/Users/christianeracanelli/Desktop/Ahut Ecosystem/01_FRONTEND_PRODUCAO_HOSTINGER/tecnologia/index.html")

print("Updated index.html successfully.")
