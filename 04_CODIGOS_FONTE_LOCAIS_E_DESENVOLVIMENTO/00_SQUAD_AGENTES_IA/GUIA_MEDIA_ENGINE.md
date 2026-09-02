# 📘 GUIA: QUBITS MEDIA ENGINE (Free Image & Video Generation)

## 🎯 O que é
Pipeline gratuito de geração de imagens e vídeos com IA usando:
- **Higgsfield AI** (`platform.higgsfield.ai`) — imagens/vídeos via API key
- **Minimax m3** (`minimax/minimax-m3:free`) — via OpenRouter (já configurado)
- **Google AI Studio** — 500 imagens/dia grátis (sem cartão de crédito)

---

## 1️⃣ HIGGSFIELD (Media Inference Worker)

### Repositório
```
https://github.com/framepipe-dev/media-inference-worker
```

### Setup
```bash
# Clonar
git clone https://github.com/framepipe-dev/media-inference-worker.git
cd media-inference-worker

# Instalar dependências
pip install -r requirements.txt

# Configurar API Key
# 1. Acessar: https://platform.higgsfield.ai
# 2. Criar conta → Gerar API Key
# 3. Criar arquivo .env:
echo "HF_API_KEY_ID=seu_key_id_aqui" > .env
echo "HF_API_KEY_SECRET=seu_key_secret_aqui" >> .env
```

### Modelos Disponíveis

| Modelo | Tipo | Comando |
|--------|------|---------|
| `qwen-image-3` | Imagem | `python generate.py qwen-image-3 "seu prompt"` |
| `nano-banana-2-lite` | Imagem | `python generate.py nano-banana-2-lite "prompt"` |
| `gpt-image-2` | Imagem | `python generate.py gpt-image-2 "prompt"` |
| `minimax-h3` | **Vídeo** | `python generate.py minimax-h3 "prompt"` |
| `ltx-2.5-pro` | Vídeo | `python generate.py ltx-2.5-pro "prompt"` |
| `kling-3.0` | Vídeo | `python generate.py kling-3.0 "prompt"` |
| `veo-3.1-fast` | Vídeo | `python generate.py veo-3.1-fast "prompt"` |

### Exemplo
```bash
python generate.py qwen-image-3 "Editorial portrait, hard flash, 35mm grain"
# Saída: Gera imagem, salva URL do resultado
```

---

## 2️⃣ MINIMAX VIA OPENROUTER (JÁ FUNCIONANDO)

### Pode usar AGORA sem custo
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...5172",  # Mesma chave do DeepSeek
)

response = client.chat.completions.create(
    model="minimax/minimax-m3:free",  # ✅ Grátis
    messages=[{"role": "user", "content": "Crie uma imagem de..."}]
)
```

### Testado ✅ (respondeu corretamente)
```
Prompt: "How many r's are in strawberry?"
Resposta: 3 ✅
Tokens: 225
```

---

## 3️⃣ GOOGLE AI STUDIO (500 IMAGENS/DIA GRÁTIS)

Melhor alternativa gratuita para imagens:
- **500 requisições/dia** grátis
- **Gemini 2.5 Flash Image** (modelo de imagem)
- Sem cartão de crédito
- API key em: `https://aistudio.google.com`

---

## 4️⃣ ALTERNATIVA: CLOUDFLARE WORKERS (100k/dia)

Deploy próprio:
```
https://github.com/saurav-z/free-image-generation-api
```
- **100.000 chamadas/dia** grátis
- Stable Diffusion XL
- Deploy em 5 minutos

---

## 5️⃣ INTEGRAÇÃO COM O QUBITS CRM

O Editor de Imagens já está no DEV:
```
https://dev-ahut-ecosystem.apexfyhub.com.br/editor
```

Para conectar a geração de imagens AI no editor, siga:

### Backend (VPS): Criar API proxy
```bash
# Em /root/crmahut/media-engine/
git clone https://github.com/framepipe-dev/media-inference-worker.git
python generate.py qwen-image-3 "prompt do usuario"
```

### Frontend: Adicionar no ImageEditor.tsx
- Botão "Gerar com IA"
- Input de prompt
- Exibir resultado

---

## 📊 COMPARATIVO: Opções Grátis vs Pagas

| Serviço | Grátis | Limite/dia | Qualidade | Requer Cartão |
|---------|--------|------------|-----------|---------------|
| **Minimax m3** (OpenRouter) | ✅ | 50/dia | Alta | ❌ |
| **Google AI Studio** | ✅ | 500/dia | Muito Alta | ❌ |
| **Higgsfield** | ✅ | Variável | Alta | ❌ |
| **Cloudflare Workers** | ✅ | 100k/dia | Média | ❌ |
| **OpenAI GPT Image** | ❌ | Pago | Máxima | ✅ |
| **Midjourney** | ❌ | $10/mês | Máxima | ✅ |

---

## 🔧 Para Chris e Rodrigo (Telegram)

### Configurar o Hermes para usar Minimax:
```bash
hermes config set model.provider openrouter
hermes config set model.default minimax/minimax-m3:free
```

Ou alternativamente via ambiente:
```bash
export HERMES_MODEL=minimax/minimax-m3:free
echo "HERMES_MODEL=minimax/minimax-m3:free" >> ~/.hermes/config.yaml
```

### Testar via API:
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer sk-or-v1-...5172" \
  -H "Content-Type: application/json" \
  -d '{"model":"minimax/minimax-m3:free","messages":[{"role":"user","content":"teste"}]}'
```