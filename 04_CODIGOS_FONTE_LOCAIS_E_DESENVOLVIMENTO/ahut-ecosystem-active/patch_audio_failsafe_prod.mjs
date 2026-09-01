import fs from "fs";
import { execSync } from "child_process";

const files = [
  "./01_FRONTEND_PRODUCAO_HOSTINGER_BKP/assets/Atendimento-DcqAjCvf.js",
  "./crm-imobiliaria-producao-BKP/assets/Atendimento-DcqAjCvf.js"
];

const audioModalComponent = `
function AudioFailSafeModal(){
  const [incident, setIncident] = i.useState(null);

  i.useEffect(()=>{
    const handler = (ev) => {
      setIncident(ev.detail || { active: true });
    };
    window.addEventListener("openAudioFailSafe", handler);
    return () => window.removeEventListener("openAudioFailSafe", handler);
  }, []);

  if (!incident) return null;

  return e.jsx("div",{
    style:{position:"fixed",bottom:"80px",right:"24px",zIndex:99999},
    children: e.jsxs("div",{
      className:"bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl max-w-sm flex items-center gap-3 text-white",
      children:[
        e.jsx("div",{
          className:"w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 text-base font-bold",
          children: "⚠️"
        }),
        e.jsxs("div",{
          className:"flex-1 min-w-0 text-left",
          children:[
            e.jsx("p",{className:"text-xs font-bold text-white truncate",children:"Contingência de Áudio Ativa"}),
            e.jsx("p",{className:"text-[11px] text-slate-300 truncate",children:"Status: Investigando & Auto-Recovery"})
          ]
        }),
        e.jsxs("button",{
          onClick:()=>setIncident(null),
          className:"flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg transition-all shrink-0 cursor-pointer",
          children:[
            e.jsx("span",{children:"✓"}),
            " Sim, Resolvido"
          ]
        })
      ]
    })
  });
}
`;

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");

    // 1. Insert AudioFailSafeModal if not present
    if (!content.includes("function AudioFailSafeModal()")) {
      const lastImportIdx = content.lastIndexOf("import");
      const lastImportEnd = content.indexOf(";", lastImportIdx) + 1;
      content = content.substring(0, lastImportEnd) + "\n" + audioModalComponent + "\n" + content.substring(lastImportEnd);

      // Render AudioFailSafeModal at root
      content = content.replace(
        `return e.jsxs("div",{className:"h-[100dvh] bg-background overflow-hidden flex flex-col",children:[`,
        `return e.jsxs("div",{className:"h-[100dvh] bg-background overflow-hidden flex flex-col",children:[e.jsx(AudioFailSafeModal,{}),`
      );
    }

    // 2. Audio bubble with "⚠️ Falhou Áudio?" button
    const oldAudio = `if(a==="audio"||s.startsWith("[Audio]")||s.startsWith("[Áudio]")){const n=xo(s);if(n)return e.jsx("div",{className:"space-y-2 py-1 w-[min(280px,70vw)] max-w-full",children:e.jsxs("audio",{controls:!0,preload:"metadata",className:"w-full h-10 accent-accent",children:[e.jsx("source",{src:n,type:"audio/ogg; codecs=opus"}),e.jsx("source",{src:n,type:"audio/ogg"}),e.jsx("source",{src:n,type:"audio/mpeg"}),e.jsx("source",{src:n,type:"audio/mp4"})]})})}`;
    
    const newAudio = `if(a==="audio"||s.startsWith("[Audio]")||s.startsWith("[Áudio]")){const n=xo(s);if(n)return e.jsxs("div",{className:"space-y-1.5 py-1 w-[min(280px,70vw)] max-w-full",children:[e.jsxs("audio",{controls:!0,preload:"metadata",className:"w-full h-10 accent-accent",children:[e.jsx("source",{src:n,type:"audio/ogg; codecs=opus"}),e.jsx("source",{src:n,type:"audio/ogg"}),e.jsx("source",{src:n,type:"audio/mpeg"}),e.jsx("source",{src:n,type:"audio/mp4"})]}),e.jsxs("div",{className:"flex items-center justify-between pt-1 border-t border-border/40",children:[e.jsx("span",{className:"text-[10px] text-muted-foreground",children:"Áudio PTT"}),e.jsxs("button",{type:"button",onClick:()=>window.dispatchEvent(new CustomEvent("openAudioFailSafe",{detail:{audioUrl:n,content:s}})),className:"inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 transition-all cursor-pointer",title:"Acionar contingência de áudio",children:[e.jsx("span",{children:"⚠️"}),"Falhou Áudio?"]})]})]})}`;

    if (content.includes(oldAudio)) {
      content = content.replace(oldAudio, newAudio);
      console.log("Replaced audio player in:", file);
    }

    fs.writeFileSync(file, content, "utf8");
    console.log("Saved patched:", file);

    // Validate syntax
    execSync(`node --input-type=module --check < "${file}"`);
    console.log("✅ Syntax 100% VALID for:", file);
  }
}
