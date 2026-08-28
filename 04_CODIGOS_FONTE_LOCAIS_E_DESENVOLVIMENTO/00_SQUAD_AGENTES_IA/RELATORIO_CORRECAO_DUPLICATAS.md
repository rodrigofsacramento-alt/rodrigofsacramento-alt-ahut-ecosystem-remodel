# 📊 RELATÓRIO DE CORREÇÃO DE DUPLICATAS (PRODUÇÃO)
**Data:** 28/08/2026 | **Sistema:** ahut-ecosystem.apexfyhub.com.br (produção)

---

## 🔍 O PROBLEMA
O broker WhatsApp (Baileys) cria **2 perfis** para o mesmo lead quando recebe a mensagem via **LID** (identificador temporário do WhatsApp) e depois pelo **número real**. O `remote_jid_alt` estava vazio, fazendo o `.single()` do banco falhar e mensagens serem perdidas.

## ✅ CORREÇÕES MANUAIS (3 casos críticos)

| Lead | Problema | Ações | Status |
|---|---|---|---|
| **Patricia** (556292660595) | Duplicata LID + histórico vazio | `remote_jid_alt` adicionado, 7 msgs transferidas, 6 msgs de hoje inseridas | ✅ |
| **Deborah** (554199467604) | Duplicata LID, msgs iam para conv errada | `remote_jid_alt` adicionado, contato órfão deletado, perfil duplicado deletado, 10 msgs reatribuídas | ✅ |
| **Delson Kratos** (5521964936201) | Duplicata LID, msgs iam para outra conv | `remote_jid_alt` adicionado, contato órfão deletado, perfil duplicado deletado, 4 msgs reatribuídas | ✅ |
| **Jota (admin)** (595994857156) | Telefone vazio no perfil + WhatsApp contact vinculado a cliente | `profiles.phone` corrigido, whatsapp_contact vinculado a Jota admin | ✅ |

## 🤖 CORREÇÕES AUTOMATIZADAS (35 leads)

| # | Lead | LID Phone | Real Phone | Ações |
|---|---|---|---|---|
| 1 | mateus | `120363403955830334` | `555599264149` | remote_jid_alt + deleção duplicata |
| 2 | Carlos Zanin | `232654251270272` | `556799862048` | remote_jid_alt + deleção duplicata |
| 3 | Marcos | `213713428709518` | `554797399910` | remote_jid_alt + deleção duplicata |
| 4 | Paulo | `95545926361160` | `555496164670` | remote_jid_alt + deleção duplicata |
| 5 | ok | `67281082142921` | `554784181245` | remote_jid_alt + deleção duplicata |
| 6 | Norberto Tardochi | `113327090970756` | `5511933392345` | remote_jid_alt + deleção duplicata |
| 7 | Normando | `199784715542766` | `5511959383083` | remote_jid_alt + deleção duplicata |
| 8 | Silvana | `150869484007566` | `5518997473050` | remote_jid_alt + deleção duplicata |
| 9 | Fred | `100485642068048` | `5522998993376` | remote_jid_alt + deleção duplicata |
| 10 | Fabio | `18958119878705` | `5512992563030` | remote_jid_alt + deleção duplicata |
| 11 | rafautida84 | `99815341969562` | `554391727228` | remote_jid_alt + deleção duplicata |
| 12 | Gilson | `252935036481572` | `555597139073` | remote_jid_alt + deleção duplicata |
| 13 | Josi | `205913751310482` | `554499061160` | remote_jid_alt + deleção duplicata |
| 14 | Alessandro | `142945269375147` | `553798081089` | remote_jid_alt + deleção duplicata |
| 15 | Paulo Saúde Animal | `233684909215926` | `554499161041` | remote_jid_alt + deleção duplicata |
| 16 | Mizuno Estética Automotiv | `56934841487477` | `595985357819` | remote_jid_alt + deleção duplicata |
| 17 | Silas | `277429151133837` | `554899309993` | remote_jid_alt + deleção duplicata |
| 18 | Marcos | `66627878047930` | `554797399910` | remote_jid_alt + deleção duplicata |
| 19 | Marcio | `15543553789989` | `554491721036` | remote_jid_alt + deleção duplicata |
| 20 | Andre | `261937355059398` | `5511986704480` | remote_jid_alt + deleção duplicata |
| 21 | Ricardo | `19159916269749` | `5511912020041` | remote_jid_alt + deleção duplicata |
| 22 | rafael.inovelar@yahoo.com | `138963801112757` | `5513982236215` | remote_jid_alt + deleção duplicata |
| 23 | Marco | `235823920357528` | `554291297855` | remote_jid_alt + deleção duplicata |
| 24 | Daniel NSS & DDS | `123845465927791` | `5511981739902` | remote_jid_alt + deleção duplicata |
| 25 | José Carlos | `265618041368763` | `5521967754871` | remote_jid_alt + deleção duplicata |
| 26 | Denis | `124184734744687` | `5511968729304` | remote_jid_alt + deleção duplicata |
| 27 | Mateus | `131748507693285` | `555599264149` | remote_jid_alt + deleção duplicata |
| 28 | Graziela Lemes | `88622422347870` | `5512988239053` | remote_jid_alt + deleção duplicata |
| 29 | Marcos Gilberto | `70081031717007` | `555484442150` | remote_jid_alt + deleção duplicata |
| 30 | Ricardo | `41872273702976` | `5511912020041` | remote_jid_alt + deleção duplicata |
| 31 | Fabio | `101180990566650` | `5512992563030` | remote_jid_alt + deleção duplicata |
| 32 | Jerusa | `82588026826972` | `554991428022` | remote_jid_alt + deleção duplicata |
| 33 | Emerson Martinelli | `242451038105799` | `554598318832` | remote_jid_alt + deleção duplicata |
| 34 | Amanda | `218390681624740` | `554991720094` | remote_jid_alt + deleção duplicata |
| 35 | Marcos | `160125474091063` | `554797399910` | remote_jid_alt + deleção duplicata |

## ⚠️ NÃO CORRIGIDOS (2)

| Lead | Motivo |
|---|---|
| RGR MATERIAIS PARA CONSTR | Ainda referenciado por outras tabelas (mais investigação necessária) |
| Igor Junker | Ainda referenciado por outras tabelas (mais investigação necessária) |

## 📊 RESUMO

| Métrica | Valor |
|---|---|
| Total duplicatas identificadas | ~646 |
| Corrigidas manualmente (casos críticos) | 3 + 1 admin |
| Corrigidas automaticamente | 35 |
| Não corrigidas (referências externas) | 2 |
| **Total leads normalizados** | **39** |