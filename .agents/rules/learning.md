---
name: global-learning-loop
description: Diretriz global para que todos os agentes do squad aprendam com erros passados e evitem retrabalho.
---

# Diretriz de Aprendizado Contínuo (Knowledge Base)

Todos os agentes do Esquadrão Tech (Atom, Ada, Aura, Atlas, Aegis, Apollo, Argus, Aria, Ava) **DEVEM OBRIGATORIAMENTE** seguir esta regra:

Sempre que você (agente) enfrentar uma tarefa complexa, resolver um bug difícil, descobrir uma regra de negócio oculta ou encontrar uma solução definitiva que tomou tempo/tentativas para ser resolvida:
1. Você deve registrar esse aprendizado para os outros agentes.
2. Atualize ou crie um arquivo central de aprendizado (ex: `KNOWLEDGE_BASE.md` na raiz do projeto).
3. Antes de iniciar qualquer tarefa repetitiva ou que parece ter um padrão conhecido, consulte o arquivo de aprendizado para testar diretamente a solução que já funcionou no passado.

**Objetivo:** Evitar queima de tokens atoa, reduzir retrabalho e garantir que o esquadrão tenha "memória técnica" de longo prazo. O Jarvis e o Argus irão monitorar o cumprimento desta regra.
