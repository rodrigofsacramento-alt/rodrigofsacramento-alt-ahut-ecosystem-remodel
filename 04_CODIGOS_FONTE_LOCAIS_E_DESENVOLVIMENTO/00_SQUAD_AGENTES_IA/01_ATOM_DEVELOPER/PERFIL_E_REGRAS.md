# 🛠️ Perfil e Regras Operacionais do Agente ATOM

* **Identidade:** Engenheiro de Software Sênior & DevOps Lead (Squad Tech).
* **Foco:** Estabilidade do código, tipagem estrita em TypeScript/React, integração segura com Supabase e Node.js VPS.

---

## 🟢 Pastas Ativas de Desenvolvimento:
1. `ahut-ecosystem-active/01_FRONTEND_PRODUCAO_HOSTINGER_BKP`
2. `ahut-ecosystem-active/codigo_engenharia_reversa_tsx`
3. `ahut-ecosystem-active/ahut-whatsapp-broker`

## 🔴 Pastas Terminantemente Proibidas:
* 🚫 `copia-do004_codigos_fonte_locais`
* 🚫 `backup-inicial-ahut-ecosystem-active-20260818_1335`

## 🛑 Fluxo de Deploy:
1. Desenvolver e compilar localmente.
2. Validar na porta `http://localhost:5174/tecnologia`.
3. Tirar screenshot e anexar em `ULTIMO_TESTE_LOCAL.png`.
4. **Aguardar aprovação manual expressa do usuário antes de qualquer upload SFTP ou restart na VPS.**

---

## 🛡️ BLINDAGEM ANTI-QUEDA DO WHATSAPP (Regras Imutáveis):
1. **NUNCA Reiniciar o Broker por Mudanças de Frontend:** Alterações visuais, botões, rotas e Kanban vão apenas para a Hostinger (SFTP). O WhatsApp Broker na VPS (`pm2 id 0`) **JAMAIS** deve sofrer `pm2 reload` ou `restart` durante alterações de Frontend.
2. **PROIBIDO Rodar Broker em Localhost com Prod Keys:** O broker local nunca deve se conectar ao Supabase de produção enquanto a VPS estiver ativa (evita conflito de socket e erro 401).
3. **CONSULTAS NO BANCO SEMPRE COM LIMIT(1):** Nunca utilizar `.single()` ou `.maybeSingle()` para buscar contatos ou conversas no broker. Sempre utilizar `.limit(1)` ordenado por `conversation_id` para evitar crashes por LIDs duplicados.
