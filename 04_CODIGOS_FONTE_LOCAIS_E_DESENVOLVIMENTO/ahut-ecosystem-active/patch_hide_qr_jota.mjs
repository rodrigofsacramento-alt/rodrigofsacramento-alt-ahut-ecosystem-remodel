import fs from "fs";

const files = [
  "/Users/christianeracanelli/Desktop/Ahut Ecosystem/01_FRONTEND_PRODUCAO_HOSTINGER/assets/Atendimento-live-v10.js",
  "/Users/christianeracanelli/Desktop/Ahut Ecosystem/04_CODIGOS_FONTE_LOCAIS_E_DESENVOLVIMENTO/ahut-ecosystem-active/01_FRONTEND_PRODUCAO_HOSTINGER_BKP/assets/Atendimento-live-v10.js"
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");

    const regex = /\(\(([a-zA-Z_0-9$]+)==null\?void 0:\1\.role\)==="admin"\)&&e\.jsxs\(([a-zA-Z_0-9$]+),\{variant:"outline",size:"icon",className:"relative",onClick:\(\)=>([a-zA-Z_0-9$]+)\(!0\),title:"Configurações WhatsApp"/g;
    
    const initialMatchCount = (content.match(regex) || []).length;
    
    content = content.replace(regex, '((($1==null?void 0:$1.role)==="admin")&&($1==null?void 0:$1.email)!=="jota@imobiliaria.com")&&e.jsxs($2,{variant:"outline",size:"icon",className:"relative",onClick:()=>$3(!0),title:"Configurações WhatsApp"');

    fs.writeFileSync(file, content, "utf8");
    console.log(`Patched ${file} - replaced regex: ${initialMatchCount} times.`);
  } else {
    console.log(`File not found: ${file}`);
  }
}
