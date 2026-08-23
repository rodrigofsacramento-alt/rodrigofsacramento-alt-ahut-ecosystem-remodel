#!/bin/bash
set -e

echo "=== VERIFICANDO STATUS DO BROKER (PM2) ==="
pm2 status || echo "PM2 não encontrado no path, mas continuaremos isolados em /opt"

echo "=== PREPARANDO DIRETORIO ISOLADO ==="
mkdir -p /opt/hermes-os
cd /opt/hermes-os

if [ ! -d .git ]; then
  echo "=== CLONANDO REPOSITORIO HERMES ==="
  git clone https://github.com/NousResearch/hermes-agent.git .
else
  echo "=== ATUALIZANDO REPOSITORIO HERMES ==="
  git pull origin main
fi

echo "=== CONFIGURANDO VARIAVEIS DE AMBIENTE ==="
cat << 'EOF' > .env
NVIDIA_API_KEY_DEEPSEEK="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"
NVIDIA_API_KEY_MINIMAX="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"
NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"
# Para permitir acesso publico ao Dashboard na VPS (solicitado pelo usuario)
DASHBOARD_HOST=0.0.0.0
EOF

echo "=== ABRINDO PORTA NO FIREWALL (Se existir UFW) ==="
ufw allow 9119/tcp || true

echo "=== CONSTRUINDO E SUBINDO O DOCKER ==="
HERMES_UID=0 HERMES_GID=0 docker compose up -d --build

echo "=== INSTALACAO CONCLUIDA COM SUCESSO ==="
docker ps
