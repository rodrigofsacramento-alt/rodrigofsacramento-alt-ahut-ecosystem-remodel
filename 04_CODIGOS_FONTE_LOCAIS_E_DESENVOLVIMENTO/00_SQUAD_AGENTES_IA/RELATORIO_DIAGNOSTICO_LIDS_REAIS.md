# 📋 DIAGNÓSTICO — LEADS LID + REAL DUPLICADOS COM MENSAGENS

**Data:** 26/08/2026  
**Filtro:** Nomes reais (excluídos grupos, nomes genéricos, "Agência Hut")  
**Base:** 5.620 perfis totais | 3.110 LIDs

---

## 📊 RESUMO DAS CATEGORIAS

| Cat | Situação | Qtd | Ação recomendada |
|---|---|---|---|
| **A** | 🔴 **Ambos têm mensagens** (LID + REAL) | **12** | Unificação manual — risco de perda de histórico |
| **B** | 🟡 **Só LID tem mensagens** (REAL zerado) | **0** | N/A — não há casos |
| **C** | ✅ **Só REAL tem mensagens** (LID zerado) | **218** | **Unificação automática segura** |
| **D** | ⚪ **Nenhum tem mensagens** | ~2.880 | Pode limpar |

---

## 🔴 CATEGORIA A — AMBOS COM MENSAGENS (12 leads)

> ⚠️ **Mensagens divididas entre LID e REAL** — unificar manual com cuidado

| # | Nome | Tel REAL | Msgs REAL | Tel LID | Msgs LID |
|---|---|---|---|---|---|
| 1 | Claudio | 55 14 981300100 | 40 | 266880845664365 | 3 |
| 2 | Eduardo | 55 46 884591799 | 3 | 147253104787496 | 2 |
| 3 | Eduardo | 55 55 99132774 | 6 | 147253104787496 | 2 |
| 4 | Henrique Bettencourt | 55 14 997227745 | 35 | 21509313720446 | 1 |
| 5 | Joyce Garay | 55 87 81350019 | 11 | 141562709336101 | 3 |
| 6 | Jᴏᴀᴄɪʀ Dɪᴀs | 55 18 991412175 | 7 | 61207595757623 | 3 |
| 7 | Luciene | 55 67 98780058 | 3 | 13164242567256 | 2 |
| 8 | Marcelo | 55 11 988220776 | 20 | 24447071342592 | 2 |
| 9 | Marcelo | 55 43 84740777 | 2 | 24447071342592 | 2 |
| 10 | Valdir | 55 51 89435665 | 19 | 278275259674736 | 2 |

**Ação:** Transferir msgs do LID para REAL → deletar LID via lixeira

---

## ✅ CATEGORIA C — SÓ REAL TEM MENSAGENS (218 leads)

> 🟢 **Unificação automática segura** — LID nunca foi usado

### TOP 30 POR VOLUME DE MENSAGENS

| # | Nome | Tel REAL | Msgs REAL | Última msg |
|---|---|---|---|---|
| 1 | Rafael | 55 11 6476544073 | 133 | Jul |
| 2 | Cleber | 55 11 983943004 | 123 | 21/08 |
| 3 | Maurício de Souza | 55 47 99923457 | 119 | 24/08 |
| 4 | Norberto Tardochi | 55 11 933392345 | 95 | Jun |
| 5 | David | 55 16 996451227 | 83 | 20/08 |
| 6 | Andre | 55 11 986704480 | 82 | Jul |
| 7 | Júnior | 55 11 940632902 | 77 | Jun |
| 8 | Marcos Cardoso | 55 48 96828397 | 73 | 03/08 |
| 9 | Caio Vinícios | 55 21 966051607 | 73 | Jul |
| 10 | Milena | 55 53 91532082 | 73 | 22/08 |
| 11 | Rafael | 55 46 891869086 | 72 | 25/08 |
| 12 | Felipe | 55 13 981671951 | 70 | 25/08 |
| 13 | Marcos | 55 28 992542892 | 52 | 25/08 |
| 14 | Gilson | 55 55 97139073 | 51 | 21/08 |
| 15 | Daniel | 55 11 965960241 | 50 | Jul |
| 16 | Edvaldo Santos | 55 15 981325889 | 46 | 24/08 |
| 17 | Adriano da Mata | 55 65 99087898 | 45 | 25/08 |
| 18 | Fabiano | 55 11 914620289 | 45 | 11/08 |
| 19 | Thiago | 55 11 974038781 | 43 | Jul |
| 20 | Alex Jeld | 55 11 982896661 | 42 | 25/08 |
| 21 | Claudio | 55 14 981300100 | 40 | Jul |
| 22 | Ana Carla | 55 71 88437050 | 40 | Ago |
| 23 | Japa | 55 11 934308989 | 37 | 25/08 |
| 24 | Márcio Vieira | 55 15 996273748 | 38 | Jul |
| 25 | Josi | 55 95 81043430 | 35 | 11/08 |
| 26 | Fabio | 55 12 992563030 | 35 | Jul |
| 27 | D'Paula | 55 19 998360448 | 34 | 22/08 |
| 28 | Vanessa | 55 61 93696571 | 34 | 17/08 |
| 29 | Henrique Bettencourt | 55 14 997227745 | 35 | Jul |
| 30 | Larissa | 55 62 94005083 | 31 | Jul |

### LISTA COMPLETA (218 leads)

Arquivo: `/opt/data/cat_C_somente_real_com_msgs.csv`

---

## 🛠️ AÇÃO RECOMENDADA

| Fila | Qtd | Ação | Usar lixeira? |
|---|---|---|---|
| **Categoria C** | 218 | Unificação automática → `move_profile_to_trash()` | ✅ SIM |
| **Categoria A** | 12 | Unificação manual (transferir msgs LID→REAL) | ✅ SIM |
| **Total** | **230** | | |

**CSVs salvos:**
- `/opt/data/cat_A_ambos_com_msgs.csv` (12 leads)
- `/opt/data/cat_C_somente_real_com_msgs.csv` (218 leads)
