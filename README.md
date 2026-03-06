# VAR da Sorte

O VAR da Sorte e um site estatico em Eleventy focado em conteudo diario de apostas desportivas: publica "Apostas do Dia", tres tipos de desafios (Odd do Dia, Favorito Seguro e Ambas Marcam/+2.5), mostra historico por data e integra componentes de distribuicao/monetizacao como pagina de oferta, redes sociais e widgets de jogos do dia.

## Script disponivel: `daily.mjs`

O script [`scripts/daily.mjs`](scripts/daily.mjs) automatiza a criacao dos ficheiros diarios em `src/apostas` e `src/desafios/*`, com suporte a simulacao, data especifica, sobrescrita e controlo da copia da linha de balanco dos desafios.

### Comandos npm do script daily

`npm run daily`  
Cria os 4 ficheiros do dia atual (timezone `Europe/Lisbon`) sem sobrescrever ficheiros existentes.

`npm run daily:dry`  
Executa simulacao (dry-run): mostra o que seria criado/atualizado, sem escrever nada.

`npm run daily:nocopy`  
Cria os ficheiros do dia, mas sem copiar a linha de balanco do dia anterior nos desafios (usa fallback padrao de balanco).

`npm run daily:dry:nocopy`  
Simulacao sem copia de balanco.

### Comandos diretos (node)

`node scripts/daily.mjs --date YYYY-MM-DD`  
Gera os ficheiros para uma data especifica.

`node scripts/daily.mjs --date YYYY-MM-DD --dry-run`  
Simula para uma data especifica.

`node scripts/daily.mjs --date YYYY-MM-DD --force`  
Sobrescreve os ficheiros da data alvo, se ja existirem.

`node scripts/daily.mjs --date YYYY-MM-DD --no-copy-balance`  
Gera para a data alvo sem copiar a linha de balanco de ontem nos desafios.

## Fluxo rapido recomendado

1. `npm run daily:dry`
2. `npm run daily`
3. Editar os 4 ficheiros gerados com os picks reais do dia.

## Script disponivel: `check-encoding.mjs`

O script [`scripts/check-encoding.mjs`](scripts/check-encoding.mjs) verifica caracteres corrompidos (ex.: U+FFFD e mojibake comum) e pode corrigir automaticamente os casos seguros.

### Comandos npm do script de encoding

`npm run check:encoding`  
Modo auditoria: apenas reporta problemas de encoding. Falha com exit code `1` se encontrar problemas.

`npm run check:encoding:fix`  
Corrige automaticamente os padroes conhecidos de mojibake e volta a validar no final.

`npm run check:encoding:fix:dry`  
Simula as correcoes (nao escreve ficheiros), mostrando o que seria alterado.

## QA pre-publicacao (Fase 5)

Scripts de verificacao automatica para qualidade tecnica antes de publicar.

`npm run check:links`  
Valida links internos no output `_site` e falha se existir destino em falta.

`npm run check:assets`  
Valida assets referenciados em HTML/CSS no `_site` e falha se faltar ficheiro.
Tambem emite warning para assets de imagem acima do threshold de peso.

`npm run check:prepublish`  
Pipeline completo (ordem fixa):
1. `npm run check:encoding`
2. `npm run build`
3. `npm run check:links`
4. `npm run check:assets`

Politica atual:
- Falha: encoding invalido, build com erro, link interno quebrado, asset inexistente.
- Warning: asset pesado acima do budget inicial.

## Script disponivel: `social-snippets.mjs`

O script [`scripts/social-snippets.mjs`](scripts/social-snippets.mjs) gera snippets prontos para Telegram/Instagram a partir dos ficheiros diarios em `src/apostas` e `src/desafios/*`, com links UTM da campanha `daily_post`.
Inclui automaticamente linguagem sem promessa de lucro, linha de transparencia e referencia de jogo responsavel (+18).

### Comandos npm do script social

`npm run social:daily`  
Gera snippets para o dia atual (timezone `Europe/Lisbon`) e imprime no terminal para os dois canais (`telegram` e `instagram`).
Nao grava ficheiro.

`npm run social:daily -- --date YYYY-MM-DD`  
Gera snippets para uma data especifica e imprime no terminal para os dois canais.
Usa quando queres publicar retroativamente ou preparar um dia futuro.

`npm run social:daily -- --source telegram`  
Gera snippets apenas para um canal.
Valores aceites em `--source`: `telegram`, `instagram`, `all`.

`npm run social:daily:write`  
Gera snippets do dia atual, imprime no terminal e grava ficheiro em `templates/social-output/YYYY-MM-DD.md`.

`npm run social:daily:write -- --date YYYY-MM-DD`  
Mesmo comportamento do comando anterior, mas para uma data especifica.

### Comandos diretos (node)

`node scripts/social-snippets.mjs --date YYYY-MM-DD --source telegram`  
Executa o script sem npm, para uma data e canal especificos, com output no terminal.

`node scripts/social-snippets.mjs --write --date YYYY-MM-DD`  
Imprime snippets e grava ficheiro em `templates/social-output/YYYY-MM-DD.md`.

`node scripts/social-snippets.mjs --write --date YYYY-MM-DD --out-dir templates/social-output-custom`  
Permite gravar os snippets noutra pasta de destino.

### Parametros suportados

- `--date YYYY-MM-DD`: define a data alvo.
- `--source telegram|instagram|all`: define o canal alvo (`all` por defeito).
- `--write`: ativa escrita em ficheiro.
- `--out-dir caminho`: muda a pasta de output quando usas `--write`.

### Integracao com o fluxo diario existente

`npm run daily` mantem exatamente o comportamento atual: criar os 4 ficheiros `.md` do dia.
Nao foi alterada a logica de criacao dos ficheiros diarios.

Novo fluxo recomendado (simples e repetivel):

1. `npm run daily`
2. Preencher os picks reais nos ficheiros `.md` do dia.
3. `npm run social:daily`
4. Publicar os textos gerados em Telegram/Instagram.

Opcional:

- Se quiseres guardar uma copia dos snippets em ficheiro, usa `npm run social:daily:write`.

## Variaveis de ambiente (API)

Estas variaveis sao lidas em `src/data/jogosDoDia.js` e `.eleventy.js` para controlar os dados da API Football na home.

`FOOTBALL_API_KEY`  
Chave da API (`api-sports`) usada para buscar fixtures e odds do dia.

`USE_FOOTBALL_API`  
Liga/desliga o uso da API no build do site.
- `true` (default): tenta buscar jogos/odds.
- `false`: nao chama a API e devolve lista vazia de jogos.

Exemplo de `.env`:

```env
FOOTBALL_API_KEY=coloca_a_tua_chave_aqui
USE_FOOTBALL_API=true
```

Se quiseres desativar temporariamente a API:

```env
USE_FOOTBALL_API=false
```

## Social Templates e UTM

- `templates/daily-social-template.md` (template unico diario para Telegram/Instagram)
- `templates/links-for-social.md` (convencao UTM oficial + links prontos)
- `templates/editorial-checklist.md` (rotina operacional: post diario, reminder noturno e resumo semanal)
- `templates/weekly-growth-log.md` (registo semanal de metricas: utm_source, utm_content e CTR por tipo de post)
