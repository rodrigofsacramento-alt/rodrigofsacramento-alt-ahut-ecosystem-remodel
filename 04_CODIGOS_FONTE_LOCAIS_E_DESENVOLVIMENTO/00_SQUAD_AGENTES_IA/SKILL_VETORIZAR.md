---
name: vetorizador-logo
description: Habilidade para converter imagens raster (PNG/JPG) em vetores (SVG) com precisão.
version: 1.0.0
---

# ✒️ Vetorizador de Logos (Auto-Trace)

**OBJETIVO:**
Quando o usuário (como o Chris) pedir para "vetorizar" um logo ou imagem, você não deve tentar adivinhar o código SVG visualmente usando o LLM (pois o resultado será ruim). Você deve usar ferramentas de sistema reais para fazer o rastreio (auto-trace).

## Passos para Vetorização:

1. **Receber a Imagem:** Obtenha o caminho da imagem enviada pelo usuário.
2. **Preparar o Ambiente (se necessário):**
   - Para vetorização real e precisa, a ferramenta recomendada no Linux é o `potrace`.
   - Se você tiver acesso a execução de código/terminal, verifique se o `potrace` e o `imagemagick` estão instalados: `command -v potrace`. Se não, instale: `apt-get install potrace imagemagick -y`.
3. **Conversão (Raster para SVG):**
   - Converta a imagem (PNG/JPG) para o formato BMP ou PNM (necessário para o potrace): 
     `convert imagem.png imagem.bmp`
   - Execute o potrace para gerar o SVG:
     `potrace imagem.bmp -s -o logo_vetorizado.svg`
4. **Entrega:**
   - Leia o conteúdo do arquivo `logo_vetorizado.svg` e envie para o usuário, ou faça o upload do arquivo diretamente no chat.

**ATENÇÃO:** Se você não tiver permissão para rodar comandos de terminal no momento do pedido, avise o Chris que a melhor forma de vetorizar é usando a biblioteca Potrace, e peça para ele autorizar a execução do script Python/Shell de conversão.
