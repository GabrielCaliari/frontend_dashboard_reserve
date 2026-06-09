# Design System: RÉSERVE — Painel Administrativo

**Project:** `frontend_dashboard_reserve`
**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · HeroUI · Radix UI (atoms shadcn-ui) · Framer Motion
**Design reference:** admin denso derivado da identidade de marca RÉSERVE (logomark em verde-sálvia)

---

## 1. Tema Visual e Atmosfera

A estética é **calma, confiável e densa** — um painel administrativo que prioriza clareza sobre decoração. A base é um tema claro: fundo parchment quase branco, tinta quase preta para tipografia, e verde-sálvia opaco (extraído do próprio logotipo RÉSERVE) como único acento de marca dominante. O verde-sálvia é mais contido que o lima elétrico usado na landing page da Zarp — a marca RÉSERVE se posiciona como madura e discreta, não energética.

**Distinção admin vs. marketing:** este documento cobre a superfície de admin (`frontend_dashboard_reserve`). Uma eventual landing page RÉSERVE teria liberdade visual maior (glow, gradientes largos); a superfície de admin não.

---

## 2. Paleta de Cores e Papéis

### Tema Claro (padrão)

| Nome descritivo | Hex aprox. | Token CSS | Papel |
|---|---|---|---|
| Parchment quase-branco | `#FFFCF6` | `--background` | Fundo de página |
| Verde-Sálvia RÉSERVE | `#8B9B75` | `--primary` / `--brand-green` | Acento primário de marca; botões de ação, destaques de link, preenchimento de badge |
| Tinta-Sálvia Profunda | `#1E2A16` | `--primary-foreground` / `--brand-green-deep` | Texto sobre o verde-sálvia |
| Névoa de Sálvia Pálida | `#E4E8DC` | `--secondary` / `--brand-mint` | Fundos suaves de seção alternada, variantes de superfície de card |
| Pedra Fria | `#EBEDE8` | `--muted` | Fundos de container discretos, cabeçalhos de tabela |
| Névoa Grafite | `#868685` | `--muted-foreground` | Labels secundários, metadados |
| Tinta Quase-Preta | `#0E1009` | `--foreground` / `--brand-ink` | Texto primário de corpo e título |
| Branco Puro | `#FFFFFF` | `--card` / `--popover` | Superfície de card e container |
| Vermelho de Alerta | `#D03238` | `--destructive` | Ações destrutivas, estados de erro |

### Tema Escuro (`.dark`)

Mantém o esquema navy-escuro herdado (não deriva do verde-sálvia — segue a mesma lógica da Zarp de um dark mode desacoplado da paleta clara), com `--primary`/`--ring` ajustados para `#8B9B75` numa luminosidade maior (`85 20% 62%`) para manter contraste sobre o fundo navy.

### Nota de Superfície de Admin

O painel administrativo **nunca** introduz azul como cor informativa, de link ou de série de gráfico. Onde um design pediria azul (badge de informação, link, série secundária de gráfico), usa-se uma variante da família verde-sálvia:

| Papel | Token/Hex | Notas |
|---|---|---|
| Acento informativo | `hsl(var(--brand-green))` / `#8B9B75` | Substitui qualquer badge "info" ou cor de link azul |
| Série secundária de gráfico | `#65A30D`, `#059669`, `#0D9488` | Família verde já em uso para tematização de módulo; nunca azul |
| Neutro/desabilitado | `hsl(var(--muted-foreground))` | Substitui tons neutros cinza-azulados |

---

## 3. Tipografia

Sistema de duas fontes com separação estrita de papel:

- **Display:** `Bricolage Grotesque` (`--font-display`) — títulos (`h1`–`h4`), peso 700, tracking apertado.
- **Corpo:** `Inter`/Nunito (`--font-sans`) — parágrafos, navegação, labels, texto de UI.

---

## 4. Componentes

### Header e Sidebar

- Header: altura fixa em `var(--header-height)` (`80px`), fundo `bg-background/88` com `backdrop-blur-md`, borda inferior hairline.
- Sidebar desktop: largura fixa em `var(--sidebar-width)` (`310px`), altura `calc(100svh - var(--header-height))`.

### Botões

`.btn-pill` — totalmente arredondado (`border-radius: 9999px`), peso 600, com spring sutil no hover/active (`scale(1.05)`/`scale(0.95)`).

- `.btn-primary`: fundo verde-sálvia (`--brand-green`), texto tinta-sálvia (`--brand-green-deep`).
- `.btn-ghost`: tint quase invisível de verde-sálvia sobre fundo.
- `.btn-dark`: fundo tinta, texto parchment.

### Cards (`.card-reserve` / `.card-flat`)

- **Raio: `16px`** — densidade de admin, não os `30px` de uma landing page.
- Fundo `--card` (branco puro), borda hairline tingida de tinta, sombra dupla sutil (`0 1px 0` + anel `0 0 0 1px`).
- Padding fluido `clamp(1.2rem, 2.3vw, 2rem)`.

### Inputs de Hora

`input[type="time"]` força exibição 24h escondendo o campo AM/PM nativo do WebKit (`::-webkit-datetime-edit-ampm-field { display: none }`) — consistência com o resto do painel, que não usa formato 12h em nenhum outro lugar.

---

## 5. Regras de Superfície de Admin (obrigatórias)

1. **Admin não usa azul** como cor informativa, de link ou de série de gráfico — usa a família verde-sálvia.
2. **Admin não usa decoração `blur-3xl` glow** — esse padrão (glow-circle com borda visível) é de landing page; superfícies densas usam cor sólida ou, no máximo, um gradiente de dois tons sem borda desenhada por cima.

---

## 6. Princípio de Copy (Todas as Superfícies)

Todo texto voltado ao usuário diz o que aconteceu ou o que fazer a seguir, em linguagem simples — nunca um label técnico bruto, valor de enum ou placeholder não traduzido. "Não foi possível carregar os dados" vence "Error loading". "Arquivar lead" vence um ícone sem label. Vale igualmente para estados de carregando, vazio, erro e proibido, não só para o conteúdo primário.
