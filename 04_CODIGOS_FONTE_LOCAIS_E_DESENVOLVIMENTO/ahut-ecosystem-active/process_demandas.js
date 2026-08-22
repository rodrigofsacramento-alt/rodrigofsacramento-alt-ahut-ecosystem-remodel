const fs = require('fs');

async function processDemandas() {
  console.log("Iniciando o rastreamento das tarefas executadas...");
  const docPath = "/Users/christianeracanelli/Downloads/DOCUMENTO_UNIFICADO_DEMANDAS.md";
  const content = fs.readFileSync(docPath, 'utf8');
  
  const novasDemandas = [];
  let idCounter = 300;
  
  const regex = /Demanda\s+\d+\s+[-–]?\s*(.*?)\s+Data:\s*[\d\/]+\s+Descrição:\s*(.*?)\s+(?:Detalhamento.*?)?Status:\s*(Executado.*?)\./g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const title = match[1].trim();
    const description = match[2].trim();
    const statusText = match[3].trim();
    
    if (statusText.toLowerCase().includes('executado')) {
      novasDemandas.push({
        id: "TCK-2026-1" + (idCounter++),
        title: "Demanda: " + title,
        description: description,
        main_status: 'executado',
        subcategory: 'atualizado',
        subtickets: []
      });
    }
  }
  
  const hubIndex = content.indexOf("Hub de Demandas Executadas");
  if (hubIndex !== -1) {
    const hubContent = content.substring(hubIndex);
    const hubMatches = hubContent.match(/([A-Z][^\.]+?\.)/g);
    if (hubMatches) {
      for (const sentence of hubMatches) {
        if (sentence.length > 20 && !sentence.includes("Hub de") && !sentence.includes("CRM e Backend")) {
          novasDemandas.push({
            id: "TCK-2026-1" + (idCounter++),
            title: "Atualização de Sistema",
            description: sentence.trim(),
            main_status: 'executado',
            subcategory: 'atualizado',
            subtickets: []
          });
        }
      }
    }
  }

  const htmlPath = "/Users/christianeracanelli/Desktop/Ahut Ecosystem/04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/ahut-ecosystem-active/01_FRONTEND_PRODUCAO_HOSTINGER_BKP/tecnologia/index.html";
  const htmlPathProd = "/Users/christianeracanelli/Desktop/Ahut Ecosystem/01_FRONTEND_PRODUCAO_HOSTINGER/tecnologia/index.html";
  
  const injectionScript = "<script>(function(){try{let t=JSON.parse(localStorage.getItem('ahut_tech_tickets_apexfy_v4')||'[]');const nd=" + JSON.stringify(novasDemandas) + ";let ch=false;nd.forEach(d=>{let e=t.find(e=>e.description===d.description);if(!e){t.push({id:d.id,code:d.id,title:d.title,description:d.description,main_status:'executado',subcategory:'atualizado',priority:'baixa',requesterName:'Sistema Hub',module:'Backend/CRM',delivery_forecast:new Date().toLocaleDateString('pt-BR'),created_at:new Date().toISOString(),problem_context:'Atualização de Sistema',subtickets:[]});ch=true;}});t.forEach(ti=>{if(!ti.requesterName){ti.requesterName='Sistema Hub';ch=true;}if(!ti.code){ti.code=ti.id;ch=true;}if(!ti.module){ti.module='Backend';ch=true;}if(!ti.delivery_forecast){ti.delivery_forecast=new Date().toLocaleDateString('pt-BR');ch=true;}});if(ch){localStorage.setItem('ahut_tech_tickets_apexfy_v4',JSON.stringify(t));console.log('Tickets atualizados com demandas executadas.');}}catch(e){console.error(e);}})();</script>";

  for (const p of [htmlPath, htmlPathProd]) {
    if (fs.existsSync(p)) {
      let html = fs.readFileSync(p, 'utf8');
      html = html.replace(/<script>\(function\(\)\{try\{let t=JSON\.parse\(localStorage.*?(?=<\/head>)<\/script>/s, '');
      html = html.replace('</head>', injectionScript + '</head>');
      fs.writeFileSync(p, html, 'utf8');
      console.log("Injetado script em " + p);
    }
  }
  console.log("Tarefa de importação concluída.");
}

processDemandas();
