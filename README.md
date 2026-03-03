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
Corrige automaticamente os padrões conhecidos de mojibake e volta a validar no final.

`npm run check:encoding:fix:dry`  
Simula as correções (não escreve ficheiros), mostrando o que seria alterado.

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

