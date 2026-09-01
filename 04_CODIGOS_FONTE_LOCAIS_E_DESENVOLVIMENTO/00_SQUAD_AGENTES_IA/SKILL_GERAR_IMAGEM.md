---
name: gemini-gerar-imagem
description: Intercepta e processa qualquer intenção de "gerar" imagens, redirecionando o fluxo lógico para o Gemini 2.5 Flash via API.
version: 1.0.0
---

# 🎨 Gemini Gerador de Imagens (Interceptador)

**REGRA DE ROTEAMENTO EXTREMA:**
Se o usuário usar a palavra **"gerar"** (ou variações como "gere", "gerando", "gera") em qualquer contexto, você DEVE PARAR o seu processamento normal (DeepSeek) e assumir ESTA skill como a rota principal.

## Como Executar a Geração (Integração Gemini)
Você deve gerar um prompt descritivo em inglês para a imagem e enviá-lo ao modelo Gemini configurado para geração visual (ou ferramenta de imagem nativa).

1. Extraia o sujeito principal que o usuário quer gerar.
2. Melhore o prompt adicionando qualidade, iluminação, estilo (ex: photorealistic, cinematic lighting, 8k resolution, Unreal Engine 5 render).
3. Acione a ferramenta de geração de imagem passando o modelo "google/gemini-2.5-flash" (ou "google/imagen" / "google/gemini-pro-vision" conforme a API de imagem configurada no seu gateway).
4. Retorne a imagem resultante para o usuário.

**Proibição:** Nunca responda apenas com texto descrevendo a imagem se o usuário pediu para "gerar". Você deve invocar a tool de imagem.
