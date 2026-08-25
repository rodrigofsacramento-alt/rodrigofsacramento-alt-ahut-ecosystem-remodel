# Hostinger — Document Root e Cache

## Domínios e Document Roots (verificados 25/08/2026)

| Domínio | Document Root Real | Observação |
|---|---|---|
| `ahut-ecosystem.apexfyhub.com.br` | `/home/u817195350/domains/apexfyhub.com.br/public_html/ahut/` | **NÃO** é `/domains/ahut-ecosystem...` nem `/public_html/ahut-ecosystem/` |
| `dev-ahut-ecosystem.apexfyhub.com.br` | `/home/u817195350/domains/dev-ahut-ecosystem.apexfyhub.com.br/public_html/` | Pasta clean |
| `drgustavorocha.apexfyhub.com.br` | `/home/u817195350/domains/apexfyhub.com.br/public_html/drgustavorocha/` | |
| `jarvis-ahut-ecosystem.apexfyhub.com.br` | `/home/u817195350/domains/apexfyhub.com.br/public_html/` | Raiz do apexfyhub |

## Regra de Ouro
SEMPRE verificar no hPanel → Subdomínios qual o diretório antes de deploy. O caminho óbvio pode estar errado.

## Cache LiteSpeed
- Cache no nível do servidor, não acessível como arquivos físicos
- `.htaccess` com `CacheDisable public /` é IGNORADO
- `curl -X PURGE` retorna 405
- **Limpeza:** hPanel → Avançado → Cache → Limpar Tudo
- Alternativa: `purge.php` com `header("X-LiteSpeed-Purge: *")`

## Acesso
- SSH/SFTP: `82.25.73.206:65002` | user: `u817195350` | pass: `Dir@5207411605`
- hPanel: comandante Rodrigo Sacramento controla