# 📋 RELATÓRIO DE QUALIDADE DE DADOS — LEADS E CONTATOS

**Data:** 26/08/2026
**Banco:** Produção (ptochsyoyatsydfysacc.supabase.co)
**Total de Perfis:** 5.619 (clientes)
**Gerado por:** ARGUS (Scrum Master) + ATOM (Tech Lead)

---

## Sumário Executivo

| Categoria | Quantidade | % do Total |
|---|---|---|
| ✅ Perfis com telefone válido | 3.562 | 63,4% |
| ❌ Perfis com LID (telefone oculto) | 2.055 | 36,6% |
| ❌ Perfis sem telefone | 2 | 0,04% |

**Conclusão:** **36,6%** dos leads do WhatsApp têm o telefone oculto (números `@lid`). O fix aplicado hoje no broker corrige a criação de NOVOS contatos, mas os 2.055 existentes precisam de limpeza.

---

## 🔴 1. LEADS COM @lid NO TELEFONE (2.055 registros)

O WhatsApp retorna `@lid` quando o contato tem privacidade de número ativada. Cada lead aparece com um número de 15 dígitos (LID) no lugar do telefone real.

### Últimos 50 leads com LID:

| Nome | Telefone (LID) | Email (sintético) | Criado em |
|---|---|---|---|
| Wosley Caribé | 119928539623636 | ...@estateia.com | 26/08 14:46 |
| Niely Rocha Corretora De Imoveis | 124927848013911 | ...@estateia.com | 26/08 12:56 |
| Liliana Martínez | 251375980134492 | ...@estateia.com | 25/08 23:05 |
| Alexia Deggeller | 257504999129177 | ...@estateia.com | 25/08 22:19 |
| Ariel Maidana Inversiones | 261056802902270 | ...@estateia.com | 25/08 22:18 |
| Nathalia Garay | 222114351165471 | ...@estateia.com | 25/08 22:12 |
| Adriana | 222243200221363 | ...@estateia.com | 25/08 21:44 |
| Fabrica de Escada Pré moldado | 203572876677271 | ...@estateia.com | 25/08 19:57 |
| fabríciooficial | 105021211455695 | ...@estateia.com | 25/08 19:56 |
| Charlles | 247571226316989 | ...@estateia.com | 25/08 19:56 |
| Zuba Comercial | 250778962903095 | ...@estateia.com | 25/08 17:23 |
| JC Bienes Raices | 226632623210635 | ...@estateia.com | 25/08 17:19 |
| Daniel Gerardi | 184297650696356 | ...@estateia.com | 25/08 17:03 |
| Viagill Vetro inmobiliaria | 237967377440911 | ...@estateia.com | 25/08 17:03 |
| Victor | 129742556659912 | ...@estateia.com | 25/08 14:54 |
| Carmen Mendez | 202881437282340 | ...@estateia.com | 25/08 13:52 |
| JON DON | 183395707568246 | ...@estateia.com | 25/08 13:01 |
| Caio Filipe | 134144797446310 | ...@estateia.com | 25/08 12:51 |
| Diogo | 147789875028021 | ...@estateia.com | 25/08 12:25 |
| Jesualdo Fagundes | 275836104089647 | ...@estateia.com | 25/08 12:04 |
| Glebes | 239616946917551 | ...@estateia.com | 25/08 12:03 |
| JORLA | 165747267489830 | ...@estateia.com | 25/08 12:03 |
| Jhonatan | 150650440695951 | ...@estateia.com | 25/08 11:54 |
| ~ Henrique Leão | 243413110808748 | ...@estateia.com | 25/08 11:52 |
| Dvs entregas | 133531170783262 | ...@estateia.com | 25/08 11:49 |
| Maycon D Peres | 254700184191086 | ...@estateia.com | 25/08 11:49 |
| Dirce Ivone Orth | 255812681367740 | ...@estateia.com | 25/08 11:49 |
| Cris | 264651791200425 | ...@estateia.com | 25/08 11:49 |
| Israel😉 | 199591525916707 | ...@estateia.com | 25/08 11:49 |
| JK CALHAS E COBERTURAS | 199763274235938 | ...@estateia.com | 25/08 11:48 |
| ... e mais 2.005 registros | | | |

---

## 🟡 2. PERFIS SEM TELEFONE (2 registros)

| Nome | Telefone | Email | Observação |
|---|---|---|---|
| Denisse | (vazio) | denisse@hut.com | Usuária do sistema (corretora) — não precisa de phone |
| Alexssandro Silva | 258874925953116 | ...@estateia.com | **DUPLICATA** — perfil duplicado com LID |

---

## 🟠 3. PERFIS DUPLICADOS

A query agrupa por nome (exato) e encontra múltiplos perfis:

| Nome | Telefones | Contagem | Observação |
|---|---|---|---|
| Vários nomes com "." | LIDs + números válidos | 52 registros | Nomes definidos como "." (provavelmente WhatsApp sem nome) |
| Vários nomes com ".." | LIDs + números válidos | 5 registros | Nomes definidos como ".." |
| ~ | LIDs + números válidos | 4 registros | Nome "~" |
| 🇧🇷 | 17773010894890 / 4312415649992 / 5512991932490 | 3 registros | Apenas emoji como nome |
| 🇮🇹🇮🇹Rogerio 🇮🇹🇮🇹 | 107288299864182 / 554187762938 | 2 registros | Nome com emoji + texto |
| 🐧 | 554797438987 / 110145107439740 | 2 registros | Apenas emoji |
| 👊 | 213034874179664 / 234573984215270 | 2 registros | Apenas emoji |

---

## 🔵 4. CASO ESPECÍFICO: ALEXSSANDRO SILVA

| Perfil | Telefone | Email | Criado em | whatsapp_contact |
|---|---|---|---|---|
| **Original** ✅ | **55 41 96615614** (válido!) | ...@estateia.com | 26/06 12:31 | remote_jid: 554196615614@s.whatsapp.net |
| **Duplicata** ❌ | 258874925953116 (**LID**) | ...@estateia.com | 23/07 17:22 | remote_jid: 258874925953116@lid (sem alt) |

O WhatsApp retornou o Alexssandro com `@lid` em 23/07, e o broker criou um **NOVO perfil** com o LID como telefone. O perfil original (com telefone real) ficou órfão.

**No CRM aparece:** Telefone "Não informado" porque a conversa recente (26/08) está associada ao perfil DUPLICADO (com LID).

---

## 🛠️ Ações Recomendadas

| Prioridade | Ação | Responsável | Prazo |
|---|---|---|---|
| 🔴 **P1** | **Script de limpeza:** unificar perfis duplicados (LID + telefone real) | ATOM | 1 dia |
| 🔴 **P2** | **Correção do broker** (já aplicada) — `findOrCreateParticipantProfile` agora aceita `realPhone` e cria `remote_jid_alt` | ✅ **FEITO** | — |
| 🟡 **P3** | **Recriar contatos LID com número real** do `whatsapp_messages` (quando o broker detectou realPhone no log) | ATOM | 2 dias |
| 🟢 **P4** | **Limpeza manual de Alexssandro:** unificar os 2 perfis e apontar conversa para o perfil correto | AJAX | 1 hora |
