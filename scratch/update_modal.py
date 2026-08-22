import re
import json

file_path = "/Users/christianeracanelli/Desktop/Ahut Ecosystem/04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/ahut-ecosystem-active/01_FRONTEND_PRODUCAO_HOSTINGER_BKP/tecnologia/index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Bump version
content = re.sub(
    r"const LOCAL_STORAGE_KEY = 'ahut_tech_tickets_apexfy_v2';",
    "const LOCAL_STORAGE_KEY = 'ahut_tech_tickets_apexfy_v3';",
    content
)

# 2. Update the subtickets structure to use 'stage'
content = content.replace("done: false", "stage: 'a_executar'")
content = content.replace("s => s.done", "s => s.stage === 'executado'")
content = content.replace("sub.done ?", "sub.stage === 'executado' ?")

# 3. Inject Subtickets rendering in TicketDetailModal (overview tab)
# Find where acceptance criteria is rendered in TicketDetailModal
target_str = """                  {ticket.acceptance_criteria && (
                    <div>
                      <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">Critérios de Aceite</h4>
                      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                        {ticket.acceptance_criteria.map((crit, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-300">
                            <i data-lucide="check-circle-2" className="w-4 h-4 text-emerald-400 shrink-0"></i>
                            <span>{crit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}"""

subtickets_modal_jsx = """
                  {ticket.subtickets && (
                    <div className="mt-4">
                      <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                        <i data-lucide="git-merge" className="w-4 h-4"></i> Pré-requisitos & Subtickets
                      </h4>
                      <div className="bg-slate-900/80 p-4 rounded-xl border border-sky-500/20 space-y-3">
                        {ticket.subtickets.map((sub, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300 border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <i data-lucide={sub.stage === 'executado' ? "check-circle-2" : "circle"} className={`w-4 h-4 ${sub.stage === 'executado' ? 'text-emerald-400' : 'text-slate-500'} shrink-0`}></i>
                              <span className={sub.stage === 'executado' ? 'line-through text-slate-500' : ''}>{sub.title}</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border 
                                ${sub.stage === 'a_analisar' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : ''}
                                ${sub.stage === 'a_executar' ? 'bg-slate-800 text-slate-400 border-slate-700' : ''}
                                ${sub.stage === 'executando' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : ''}
                                ${sub.stage === 'em_validacao' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : ''}
                                ${sub.stage === 'executado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : ''}
                              `}>
                                {sub.stage.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
"""

content = content.replace(target_str, target_str + subtickets_modal_jsx)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

import shutil
shutil.copyfile(file_path, "/Users/christianeracanelli/Desktop/Ahut Ecosystem/01_FRONTEND_PRODUCAO_HOSTINGER/tecnologia/index.html")
print("Done")
