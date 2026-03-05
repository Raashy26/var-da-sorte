# Checklist Editorial (Operacional)

Objetivo: manter consistencia diaria visivel para audiencia e parceiros.

## Rotina fixa

### 1) Post diario principal (manha/tarde)

- Janela recomendada: 10:00-14:00 (hora de Lisboa).
- Conteudo: `Aposta do dia` + `Desafio do dia`.
- CTA: link para `/aposta/` e/ou `/desafio/` com `utm_campaign=daily_post`.
- UTM content recomendado:
  - `aposta_dia`
  - `desafio_dia`

Checklist rapido:
1. Correr `npm run daily` e preencher os picks reais.
2. Correr `npm run social:daily`.
3. Copiar os blocos para Telegram e Instagram.
4. Confirmar que os links usam UTM correto.
5. Publicar.

### 2) Reminder noturno

- Janela recomendada: 20:00-23:00 (hora de Lisboa).
- Conteudo: reforco curto para o mesmo dia.
- CTA: manter link para `/desafio/` com `utm_content=reminder_noite`.

Checklist rapido:
1. Reutilizar o bloco `Reminder noturno` gerado.
2. Validar que o link contem `utm_content=reminder_noite`.
3. Publicar em Telegram e Instagram.

### 3) Resumo semanal (domingo)

- Dia fixo: domingo.
- Conteudo: resumo curto da semana + chamada para seguir rotina diaria.
- CTA: link com `utm_campaign=weekly_summary` e `utm_content=resumo_semanal`.

Checklist rapido:
1. Preparar 3 pontos principais da semana.
2. Usar link de resumo semanal definido em `templates/links-for-social.md`.
3. Publicar em Telegram e Instagram.

## Regra de consistencia

- Frequencia minima:
  - 1 post principal por dia.
  - 1 reminder noturno por dia.
  - 1 resumo semanal ao domingo.
- Linguagem:
  - Sem promessas de lucro.
  - Com linha de transparencia e +18.
