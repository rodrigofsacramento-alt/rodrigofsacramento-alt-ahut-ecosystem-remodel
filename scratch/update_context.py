import re
import shutil

file_path = "/Users/christianeracanelli/Desktop/Ahut Ecosystem/04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/ahut-ecosystem-active/01_FRONTEND_PRODUCAO_HOSTINGER_BKP/tecnologia/index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Bump version
content = re.sub(
    r"const LOCAL_STORAGE_KEY = 'ahut_tech_tickets_apexfy_v3';",
    "const LOCAL_STORAGE_KEY = 'ahut_tech_tickets_apexfy_v4';",
    content
)

# 2. Update TCK-2026-086 (Wesley incident)
# Change requesterName from 'Wesley / Equipe' to 'Denisse'
content = content.replace("requesterName: 'Wesley / Equipe'", "requesterName: 'Denisse'")

# We need to add 'problem_context' to all tickets. We can do this by regexing each ticket block or just inserting it.
# Actually, it's easier to just add it into the AiIntakeModal as a default, and to TCK-2026-086 explicitly.
wesley_ticket_target = "title: 'Resolução Contatos Duplicados (Incidente Wesley)',"
wesley_context = """title: 'Resolução Contatos Duplicados (Incidente Wesley)',
        problem_context: 'O problema que aconteceu com o Wesley foi o seguinte: uma usuária criou manualmente, dentro do sistema, um contato que já existia. Esse contato duplicado fez com que a conversa ficasse dividida em dois cadastros diferentes, causando a perda de continuidade da conversa. A solicitante foi a Denisse.',"""
content = content.replace(wesley_ticket_target, wesley_context)

# 3. Add to AiIntakeModal generated tickets
modal_ticket_target = "description: extracted.description || 'Chamado aberto via Agente Conversacional de Tecnologia.',"
modal_ticket_context = """description: extracted.description || 'Chamado aberto via Agente Conversacional de Tecnologia.',
          problem_context: extracted.problem_context || 'Nenhum contexto de problema fornecido.',"""
content = content.replace(modal_ticket_target, modal_ticket_context)

# 4. Inject into TicketDetailModal (overview tab)
detail_target = """                  <div>
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">Descrição do Chamado</h4>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                      {ticket.description}
                    </div>
                  </div>"""

context_ui = """                  <div>
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">Descrição do Chamado</h4>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                      {ticket.description}
                    </div>
                  </div>

                  {ticket.problem_context && (
                    <div>
                      <h4 className="font-bold text-red-400 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                        <i data-lucide="alert-triangle" className="w-3.5 h-3.5"></i> Contexto do Problema (Dor)
                      </h4>
                      <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 text-red-200 leading-relaxed">
                        {ticket.problem_context}
                      </div>
                    </div>
                  )}"""
content = content.replace(detail_target, context_ui)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# Sync with the other directory
shutil.copyfile(file_path, "/Users/christianeracanelli/Desktop/Ahut Ecosystem/01_FRONTEND_PRODUCAO_HOSTINGER/tecnologia/index.html")

print("Context added successfully.")
