# DESIGN.md

## Design Direction

This product is a practical mini-SaaS for barbershops.

The interface should feel:

- Professional
- Calm
- Clear
- Local-business friendly
- Fast to understand
- Useful before decorative

It should not feel like a generic AI-generated SaaS landing page.

Avoid the common “AI slop site” look:

- Huge gradient backgrounds
- Purple/blue neon blobs
- Generic floating dashboard cards
- Fake glassmorphism
- Excessive rounded corners everywhere
- Meaningless illustrations
- Overused emoji
- Generic startup copy
- Too many animations
- Decorative noise
- Vague benefit sections
- Testimonial cards with fake people
- “All-in-one platform to revolutionize X” copy

The design should look like a real tool a barbershop owner would use daily.

## Product Personality

The brand should feel like:

```txt
Reliable
Organized
Direct
Modern
Grounded
```

Not:

```txt
Futuristic
Playful
Luxury-first
Corporate enterprise
Crypto/startup-like
AI-generated
```

## Visual References

Use these concepts as direction, not as direct copies:

- Scheduling tools
- Simple CRM dashboards
- Local business admin panels
- Clean booking flows
- Point-of-sale adjacent software
- Barbershop appointment tools

The interface should be closer to a practical management system than to a marketing landing page.

## Color System

Use a restrained palette.

Recommended direction:

```txt
Background: warm off-white or neutral light gray
Surface: white
Primary text: near-black
Secondary text: neutral gray
Borders: soft gray
Primary action: dark neutral, deep brown, dark green or muted amber
Danger: muted red
Success: muted green
Warning: muted amber
```

Avoid:

```txt
Neon purple
Bright blue gradients
Rainbow gradients
Over-saturated colors
Large glowing effects
```

Example palette:

```txt
--background: #F7F4EF
--surface: #FFFFFF
--surface-muted: #F1EDE7
--border: #DDD6CC
--text-primary: #1F1D1B
--text-secondary: #6F6760
--primary: #2F2A24
--primary-hover: #1F1B17
--accent: #9B6A3C
--success: #2F6B4F
--warning: #9A6A1F
--danger: #9B2F2F
```

Dark mode is optional. Do not implement it unless the base UI is stable.

## Typography

Use readable, common fonts.

Recommended:

```txt
Inter
Geist
Manrope
System UI
```

Avoid:

```txt
Overly futuristic fonts
Decorative serif fonts for body text
Too many font families
```

Rules:

- Use one main sans-serif family.
- Use strong font weight only for hierarchy.
- Body text should be easy to scan.
- Avoid huge marketing headlines.
- Avoid all-caps except for tiny labels.

Suggested type scale:

```txt
Page title: 28–32px
Section title: 20–24px
Card title: 16–18px
Body: 14–16px
Small/meta: 12–13px
```

## Layout

Use simple layouts.

Admin layout:

```txt
Sidebar + main content
or
Top nav + main content for smaller screens
```

Public booking layout:

```txt
Centered container
Step-by-step booking flow
Clear summary card
Sticky confirmation area on desktop if useful
```

Rules:

- Use a max-width container.
- Use consistent spacing.
- Prefer grids and clean sections.
- Keep dense admin screens readable.
- Avoid oversized empty hero sections.
- Avoid decorative floating objects.

Spacing scale:

```txt
4px
8px
12px
16px
24px
32px
48px
64px
```

Use 16px and 24px most often.

## Borders, Radius and Shadows

Use restraint.

Recommended:

```txt
Border radius:
- Small controls: 8px
- Cards: 12px
- Large panels: 16px

Borders:
- Prefer subtle borders over heavy shadows.

Shadows:
- Use small shadows only for elevated menus, popovers and modals.
```

Avoid:

```txt
2xl rounded corners everywhere
Huge blurry shadows
Glass panels
Layered cards floating over gradients
```

## Components

### Buttons

Primary button:

- Solid fill
- High contrast
- Short label
- Used for main action only

Examples:

```txt
Agendar horário
Salvar serviço
Adicionar barbeiro
Confirmar agendamento
```

Secondary button:

- Neutral border or subtle background
- Used for non-primary actions

Danger button:

- Reserved for destructive actions
- Requires confirmation when destructive

Avoid generic labels:

```txt
Começar agora
Explorar
Descobrir
Impulsionar
```

### Cards

Cards should represent real information.

Good card examples:

```txt
Agendamentos de hoje
Faturamento estimado
Serviços ativos
Próximo horário
Cliente recorrente
```

Bad card examples:

```txt
Productivity boosted
AI powered
Growth engine
Seamless experience
```

Card rules:

- Clear title
- One main value or purpose
- Optional secondary detail
- No decorative icons unless useful

### Forms

Forms are central to this product.

Rules:

- Every input must have a visible label.
- Use helper text where useful.
- Show validation errors close to fields.
- Keep forms in logical groups.
- Use masks for phone and currency if practical.
- Avoid placeholder-only labels.

Important forms:

```txt
Login
Register
Barbershop settings
Service form
Barber form
Working hours form
Booking form
Appointment status form
```

### Tables

Use tables for admin lists:

```txt
Appointments
Customers
Services
Barbers
```

Rules:

- Keep columns relevant.
- Use status badges.
- Include empty states.
- Include search/filter when list grows.
- Avoid horizontal overflow when possible.
- On mobile, consider stacked cards instead of cramped tables.

### Status Badges

Appointment statuses:

```txt
scheduled: neutral
confirmed: blue or primary muted
completed: green
cancelled: red/gray
no_show: amber/red
```

Do not communicate status by color alone. Include text.

### Empty States

Empty states should be practical.

Good:

```txt
Nenhum serviço cadastrado.
Cadastre o primeiro serviço para liberar o agendamento público.
[Adicionar serviço]
```

Bad:

```txt
Nada por aqui ainda ✨
Sua jornada começa agora!
```

### Loading States

Use:

- Skeletons for cards and tables.
- Button loading states for form submission.
- Small spinners only when appropriate.

Do not block the entire screen unnecessarily.

### Error States

Errors should explain the problem and next action.

Examples:

```txt
Não foi possível carregar os horários.
Tente novamente em alguns segundos.

Este horário acabou de ser reservado.
Escolha outro horário disponível.

Você não tem permissão para acessar esta barbearia.
```

## Public Booking Flow

The booking flow should be clear and low-friction.

Recommended steps:

```txt
1. Escolher serviço
2. Escolher barbeiro
3. Escolher data e horário
4. Informar dados
5. Confirmar
```

Always show a booking summary:

```txt
Serviço
Barbeiro
Data
Horário
Duração
Preço
```

The customer should always know:

- What they selected.
- How long it takes.
- How much it costs.
- When the appointment starts.
- Who will provide the service.

## Admin Dashboard

The dashboard should be useful, not decorative.

Recommended first dashboard widgets:

```txt
Agendamentos hoje
Próximos horários
Faturamento estimado do dia
Serviços mais agendados
Clientes recentes
No-shows do mês
```

Do not create fake analytics unless the data exists.

If a metric is estimated, label it clearly:

```txt
Faturamento estimado
```

Not:

```txt
Revenue
```

## Navigation

Admin navigation should be obvious:

```txt
Visão geral
Agenda
Agendamentos
Clientes
Serviços
Barbeiros
Configurações
```

Avoid creative navigation names.

Bad:

```txt
Central
Experiências
Crescimento
Jornada
```

## Icons

Icons are optional.

If used:

- Use simple outline icons.
- Use them to support scanning.
- Do not use icons as decoration only.
- Keep icon style consistent.

Avoid:

- 3D icons
- Emoji as core UI
- Random sparkles
- AI-style magic wand icons

## Animation

Use minimal animation.

Allowed:

- Small hover transitions.
- Modal fade/scale.
- Toast entrance.
- Loading skeletons.

Avoid:

- Scroll-driven theatrics.
- Floating cards.
- Constant background movement.
- Excessive microinteractions.
- Animations that slow down admin work.

## Landing Page

The landing page should be simple and believable.

Recommended sections:

```txt
Hero
Problem
How it works
Features
Example booking flow
Pricing placeholder
FAQ
CTA
```

Hero copy example:

```txt
Agendamentos online para barbearias pequenas

Organize serviços, barbeiros e horários em um painel simples. Seus clientes escolhem o horário disponível e você acompanha tudo pela agenda.
```

Avoid:

```txt
Revolucione sua barbearia com a plataforma definitiva de gestão inteligente
```

Feature examples:

```txt
Agenda online
Cadastro de serviços
Horários por barbeiro
Página pública de agendamento
Histórico de clientes
Controle de status
```

Do not use fake testimonials unless the project explicitly marks them as fictional demo content.

## Admin Visual Example

A good admin screen should look like this conceptually:

```txt
Header:
Agenda

Subheader:
Veja os agendamentos por data, barbeiro e status.

Filters:
[Data] [Barbeiro] [Status]

Main:
Table or calendar list

Side:
Resumo do dia
- 8 agendamentos
- 5 confirmados
- 2 concluídos
- 1 cancelado
```

## Public Booking Visual Example

A good booking page should look like this conceptually:

```txt
Left:
Step content

Right:
Resumo do agendamento

Bottom:
Back / Continue actions
```

Mobile:

```txt
Step content first
Summary collapsible or shown before final confirmation
```

## Content Language

Use Brazilian Portuguese for UI.

Tone:

```txt
Direct
Useful
Polite
Plain
```

Avoid:

```txt
Startup jargon
English marketing words
Overpromising
Excessive enthusiasm
```

Good UI copy:

```txt
Escolha um serviço
Escolha o barbeiro
Selecione um horário disponível
Informe seus dados
Confirmar agendamento
Agendamento criado com sucesso
```

Bad UI copy:

```txt
Vamos turbinar sua experiência
Desbloqueie o poder da sua agenda
Sua transformação começa aqui
```

## Accessibility Rules

Follow these baseline rules:

- Every input has a visible label.
- Use semantic HTML.
- Use real buttons for actions.
- Use links for navigation.
- Maintain visible focus states.
- Do not remove outlines without replacing them.
- Use sufficient contrast.
- Do not rely only on color for status.
- Modals should be keyboard usable.
- Error messages should be associated with fields.
- Page title and main heading should match the screen purpose.

## Responsive Rules

The app must work well on:

```txt
Mobile: customer booking flow
Tablet: admin quick checks
Desktop: full admin dashboard
```

Priority:

1. Booking flow must be excellent on mobile.
2. Admin dashboard must be efficient on desktop.
3. Admin should remain usable on mobile, even if less dense.

## Design Checklist Before Shipping UI

Before considering a screen done, check:

- Is the main action obvious?
- Is the page title clear?
- Is the layout aligned to a grid?
- Are spacing and borders consistent?
- Are loading states handled?
- Are empty states handled?
- Are error states handled?
- Are form labels visible?
- Is text concrete and non-generic?
- Does it avoid AI slop visuals?
- Does it look like real software for a barbershop?
- Can a user complete the task without explanation?

## Final Rule

When in doubt, choose the simpler, more useful interface.

This product should look like it was designed for daily use, not for a Dribbble shot.
