# 🌐 GUIA — Publicar o ambiente de DEV em `dev.ahut-ecosystem.apexfyhub.com.br`

Fluxo de trabalho do squad: **DEV (visualização) → validação → COMMIT no GitHub (remodel)**.

## 🎯 Objetivo
- Visualizar todas as atualizações do app no link `https://dev.ahut-ecosystem.apexfyhub.com.br`.
- Após **validação do comandante**, fazer commit no repositório `ahut-ecosystem-remodel`.

---

## ✅ O que JÁ está pronto (feito pela Squad Tech)
- App de dev rodando na **VPS 2.24.95.98**, porta **5173** (Vite com hot reload).
- Acessível hoje por IP: `http://2.24.95.98:5173` (páginas: `/`, `/gestao`, `/treinamentos`, `/tecnologia`, etc.).
- Build estático gerado em `dist/` (para servir como site estático, se preferir).
- Proxy Caddy configurado e pronto em `/opt/data/caddy_Dev_Caddyfile`.

## 📋 Passo a passo (exige acesso à Hostinger + root na VPS)

### Passo 1 — Criar o Registro DNS (na Hostinger)
1. Entre no painel da Hostinger → **Domínios** → `apexfyhub.com.br` cronômetro.
2. Abra a **Zona DNS** (DNS Zone Editor).
3. Adicione um novo registro:
   - **Tipo:** `A`
   - **Nome:** `dev` (resulta em `dev.ahut-ecosystem.apexfyhub.com.br`)
   - **Conteúdo/IP:** `2.24.95.98`
   - **TTL:** `3600`
4. Salvar. (Propagação de minutos a algumas horas.)

### Passo 2 — Instalar o proxy web na VPS (precisa de ROOT/SSH)
Acesso a VPS 2.24.95.98 (SSH, usuário root) e rode:
```bash
sudo apt update && sudo apt install -y caddy
```
Se for servir o **dev com hot reload** (recomendado para validação), use o proxy para a porta 5173:
```bash
sudo cp /opt/data/caddy_Dev_Caddyfile /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
```
O Caddy obtém **SSL automático (HTTPS)** para o domínio.

### Passo 3 — Acessar e validar
- Abra `https://dev.ahut-ecosystem.apexfyhub.com.br`.
- Navegue: `/gestao` (Painel da Christiane), `/treinamentos` (Neurovendas), `/tecnologia` (Chamados), etc.
- As mudanças que a Squad fizer **aparecem em tempo real** (hot reload).

---

## 🔄 Fluxo de validação → COMMIT
1. Comandante visualiza no `dev.ahut-ecosystem...` e **aprova**.
2. A Squad Tech faz **`git add` + `git commit`** no repositório **`ahut-ecosystem-remodel`** (repote: `https://github.com/rodrigofsacramento-alt/rodrigofsacramento-alt-ahut-ecosystem-remodel.git`).
3. Se necessário, `git push origin main`.

## ⚠️ Notas
- **Quem aplica o Passo 1 e 2 precisa de acesso**: Hostinger (para o DNS) e SSH root (para o Caddy). O agente/container roda como usuário `hermes` (não-root), então **não pode** instalar Caddy nem editar DNS — os comandos acima são para serem executados por você no shell da VPS.
- Por segurança, mantenha o acesso público ao `dev` restrito (idealmente liberado durante a validação).