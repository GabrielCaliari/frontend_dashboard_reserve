# Motor v2 — Frentes futuras: Promoções e Marketing (NÃO implementar agora)

Data: 2026-08-19 · Decisão: Gabriel adiou estas frentes no design macro do Motor v2 (`docs/superpowers/specs/2026-08-19-motor-v2-macro-design.md`). Este arquivo preserva o raciocínio para quando forem priorizadas.

## Frente 4 — Promoções (ofertas, códigos promocionais, pacotes)

Referência HBook: Promoções → Ofertas (ex.: "Reserva Abandonada", desconto 10% em todas as noites, condição de aplicabilidade) · Códigos Promocionais (código, vigência, estadia mínima, contador de uso) · Propriedade → Pacotes (estadia mín/máx, janela de reserva, last minute, extras, pensão, canal vinculado).

Por que foi adiada:

- A spec master (seção 0.6) fechou **"sem cupons na v1"** — precificação por temporada + dia da semana cobre o caso atual. Implementar promoções antecipa a Fase 4 do faseamento.
- Criar a tela antes da API de disponibilidade aceitar cupom/oferta gera tela morta: o bot vende sem cupom hoje.

O que exigirá quando for priorizada:

- Modelo: tabela de ofertas/cupons por tenant (código, vigência, % ou valor, condições: estadia mínima, janela, tipos de quarto, rate plans), contador de uso.
- API: `GET /availability` aceitar `codigo_promocional` e devolver preço com desconto discriminado; validação no `POST /holds` (o bot NUNCA calcula desconto — mesmo princípio do rate plan Marina).
- Conceito "oferta de reserva abandonada" do HBook: no nosso caso o gatilho é o funil do bot (hold expirado / conversa parada), não cookie de site — casa com a Frente 5.
- Pacotes: na filosofia da spec master (seção 0.7), pacote é camada de marketing na memória do bot + minStay/preço no calendário. Reavaliar se vira entidade própria no motor ou permanece narrativa.

## Frente 5 — Marketing / recuperação (e-mails automáticos, pré/pós-estadia, aniversário)

Referência HBook: Marketing → E-mail automático, Recuperação de reservas, E-mail pré/pós-estadia, E-mail de aniversário.

Por que foi adiada:

- É um subsistema inteiro novo (templates, fila de envio, provedor SMTP, triggers por evento de reserva) — a frente mais cara e a menos conectada ao que existe.

Tese registrada para quando for priorizada:

- **Nosso canal de recuperação é WhatsApp via bot, não e-mail** — é onde somos mais fortes que a HSystem. "Reserva a recuperar" = hold expirado (a home unificada do v2 já mostra o número); o passo seguinte natural é o follow-up de pagamento do bot, que já existe, ganhar visão/controle no painel.
- E-mail pré-estadia/pós-estadia/aniversário: avaliar como mensagens do bot (templates WhatsApp) antes de construir infraestrutura de e-mail. E-mail entra se/quando houver demanda de cliente que não opera por WhatsApp.
- Dados necessários já existem no motor: `reservation` (datas, hóspede, e-mail/telefone) e `reservation_event`.

## Gatilhos de repriorização

- Cliente pedindo cupom/código em campanha → Frente 4.
- Widget/site de reservas próprio (Fase 4 da spec master) → Frente 4 (ofertas de site) + integrações GA4/Pixel.
- Volume de holds expirados alto na home unificada → Frente 5 (recuperação ativa).
