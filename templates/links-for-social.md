# Links UTM para Posts Sociais (Telegram/Instagram)

Este ficheiro define a convencao oficial de UTM para aquisicao social na Fase 4.

## Convencao UTM oficial

- `utm_source`: origem do trafego (`telegram` ou `instagram`)
- `utm_medium`: manter sempre `social`
- `utm_campaign`: objetivo da publicacao
- `utm_content`: formato/slot do post

Campanhas recomendadas:
- `daily_post` para publicacao diaria
- `weekly_summary` para resumo semanal
- `offer_post` para posts da pagina de oferta

Conteudos recomendados:
- `aposta_dia`
- `desafio_dia`
- `reminder_noite`
- `resumo_semanal`
- `story`
- `reel`
- `post_feed`
- `canal`
- `grupo`
- `bio`

## Links prontos (daily_post)

`Telegram -> /aposta/`  
`https://www.vardasorte.com/aposta/?utm_source=telegram&utm_medium=social&utm_campaign=daily_post&utm_content=aposta_dia`

`Telegram -> /desafio/`  
`https://www.vardasorte.com/desafio/?utm_source=telegram&utm_medium=social&utm_campaign=daily_post&utm_content=desafio_dia`

`Telegram reminder noturno`  
`https://www.vardasorte.com/desafio/?utm_source=telegram&utm_medium=social&utm_campaign=daily_post&utm_content=reminder_noite`

`Instagram -> /aposta/`  
`https://www.vardasorte.com/aposta/?utm_source=instagram&utm_medium=social&utm_campaign=daily_post&utm_content=aposta_dia`

`Instagram -> /desafio/`  
`https://www.vardasorte.com/desafio/?utm_source=instagram&utm_medium=social&utm_campaign=daily_post&utm_content=desafio_dia`

`Instagram story`  
`https://www.vardasorte.com/desafio/?utm_source=instagram&utm_medium=social&utm_campaign=daily_post&utm_content=story`

## Links prontos (weekly_summary)

`Telegram resumo semanal`  
`https://www.vardasorte.com/aposta/?utm_source=telegram&utm_medium=social&utm_campaign=weekly_summary&utm_content=resumo_semanal`

`Instagram resumo semanal`  
`https://www.vardasorte.com/aposta/?utm_source=instagram&utm_medium=social&utm_campaign=weekly_summary&utm_content=resumo_semanal`

## Links prontos (offer_post)

`Telegram oferta`  
`https://www.vardasorte.com/oferta/?utm_source=telegram&utm_medium=social&utm_campaign=offer_post&utm_content=canal`

`Instagram oferta`  
`https://www.vardasorte.com/oferta/?utm_source=instagram&utm_medium=social&utm_campaign=offer_post&utm_content=bio`

## Gerador manual

Base:

```text
https://www.vardasorte.com/<rota>/?utm_source=<source>&utm_medium=social&utm_campaign=<campaign>&utm_content=<content>
```

Checklist rapida:
1. Definir rota (`aposta`, `desafio`, `oferta`).
2. Definir source (`telegram` ou `instagram`).
3. Definir campaign (`daily_post`, `weekly_summary`, `offer_post`).
4. Definir content conforme formato real do post.
