# 📋 GUIA DO COMANDANTE — Como usar o Jarvis e o Squad

## 🎯 Comandos Rápidos (Telegram)

| Comando | O que faz | Quando usar |
|---|---|---|
| **`/executar`** | Fluxo COMPLETO: diagnose → escala agentes → executa → QA → performance → lacuna → aprendizado → TCK | **Sempre** que pedir uma tarefa técnica |
| **`/performance`** | Calcula o score da última entrega + análise de lacuna | Após cada entrega concluída |
| **`/criar-agente`** | Inicia o fluxo de criar um novo agente para o squad | Quando identificar um gap |
| **`/evolucao`** | Mostra o histórico de scores e agentes criados | Para acompanhar evolução do squad |
| **`/resumo`** | Status do squad hoje: agentes, skills, pendências | Qualquer momento |

## 📝 Formato ideal das suas mensagens

```
[Contexto rápido] + /executar
```

**Exemplo bom:**
> "O áudio está falhando no cliente. Diagnostique e corrija. /executar"

**Exemplo ruim:**
> "Faz ai o áudio"

## 🔄 O que acontece quando você usa /executar

1. ✅ Eu analiso e escalo os agentes certos
2. ✅ Agentes executam em paralelo
3. ✅ Eu reviso, ensino e corrijo se necessário
4. ✅ AURA faz QA (tsc, build)
5. ✅ ARGUS registra aprendizado
6. ✅ Deploy + commit
7. ✅ **Calculo o Score de Performance** (6 indicadores)
8. ✅ **Análise de Lacuna** — "Um agente novo teria ajudado?"
9. ✅ Se SIM → crio o agente com SKILL.md
10. ✅ Se o agente atingir 7/10 tarefas >80pts → **ASIMOV nasce**

## 🧠 Como o squad evolui sozinho

```
CADA ENTREGA → Score de Performance
    │
    ▼
Análise de Lacuna (SEMPRE)
    │
    ├── SIM → Crio agente novo
    │         │
    │         ▼
    │         Agente executa 10 tarefas
    │         │
    │         ├── 7/10 >80pts → 🎉 ASIMOV nasce!
    │         │                  ELE passa a criar agentes
    │         │                  Eu só valido
    │         │
    │         └── <7/10 >80pts → Continua treinando
    │
    └── NÃO → Só registro aprendizado
```

## 🚫 O que NÃO fazer

- **Não peça permissão para eu executar** — o diagnóstico claro é suficiente
- **Não me explique coisas óbvias** — eu tenho o contexto do sistema
- **Não aceite "vou fazer"** — cobra o resultado feito

## ✅ O que você vai ver de diferente AGORA

- Toda entrega terá um **Score de Performance** no final
- Toda entrega terá uma **Análise de Lacuna**
- Se criar um agente novo, ele terá **SKILL.md + PAINEL_DE_CONTROLE**
- Quando o ASIMOV nascer, **aviso na hora**