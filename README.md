# VAR da Sorte

O VAR da Sorte e um site estatico em Eleventy focado em conteudo diario de apostas desportivas: publica "Apostas do Dia", tres tipos de desafios (Odd do Dia, Favorito Seguro e Ambas Marcam/+2.5), mostra historico por data e integra componentes de distribuicao/monetizacao como pagina de oferta, redes sociais e widgets de jogos do dia.

## Script disponivel: `daily.mjs`

O script [`scripts/daily.mjs`](scripts/daily.mjs) automatiza a criacao dos ficheiros diarios em `src/apostas` e `src/desafios/*`, com suporte a simulacao, data especifica, sobrescrita e controlo da copia da linha de balanco dos desafios.

### Comandos npm

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
