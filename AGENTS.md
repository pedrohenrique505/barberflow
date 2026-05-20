# AGENTS.md

## Project

This repository is a mini-SaaS for barbershops.

Working name: **BarberFlow**

The product allows a barbershop owner to manage services, barbers, customers, working hours and appointments. Customers can access a public booking page, choose a service, choose a barber, select an available time slot and create an appointment.

This is a portfolio-grade project. Prioritize real-world maintainability over flashy demos.

## Main Goal

Build a clean, realistic, production-style web application using:

- React
- TypeScript
- Vite
- Tailwind CSS
- Node.js API
- PostgreSQL
- Prisma
- VPS-ready deployment

The project should look and feel like a serious SaaS product for small local businesses, not a generic AI-generated landing page.

## Product Scope

### Public area

Customers should be able to:

- View a barbershop public page.
- See business information.
- See available services.
- See available barbers.
- Select service, barber, date and time.
- Create an appointment without creating an account.
- See a confirmation page.

### Admin area

The barbershop owner should be able to:

- Register and log in.
- Configure barbershop profile.
- Manage services.
- Manage barbers.
- Manage working hours.
- View appointments.
- Update appointment status.
- View customers.
- View basic dashboard metrics.

## Preferred Stack

### Frontend

- React with Vite
- TypeScript
- React Router
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod
- date-fns
- Axios or native fetch wrapper

### Backend

- Node.js
- TypeScript
- Fastify preferred, Express acceptable
- Prisma
- PostgreSQL
- Zod for request validation
- JWT or HTTP-only cookie auth
- CORS configured explicitly
- Centralized error handling
- Request logging

### Deployment Target

The app will be deployed to a Hostinger VPS.

Expected production shape:

- Nginx serves the React build.
- Nginx reverse-proxies API requests to the Node.js backend.
- PM2 keeps the backend running.
- PostgreSQL runs on the VPS or external managed database.
- HTTPS via Certbot/Let's Encrypt.

Do not assume Vercel, Netlify, Railway or serverless deployment unless explicitly requested.

## Repository Structure

Prefer this structure unless the existing project already uses another clear structure:

```txt
barberflow/
  frontend/
    src/
      app/
      components/
      features/
      pages/
      routes/
      services/
      hooks/
      lib/
      styles/
  backend/
    src/
      modules/
      routes/
      services/
      repositories/
      middlewares/
      lib/
      config/
    prisma/
  docs/
  docker-compose.yml
  README.md
  DESIGN.md
  AGENTS.md
```

If using a monorepo tool later, keep the same mental separation between frontend and backend.

## Coding Rules

### General

- Use TypeScript strictly.
- Do not use `any` unless there is a clear reason.
- Prefer small, readable functions.
- Avoid clever abstractions.
- Do not introduce large dependencies without justification.
- Do not rewrite unrelated files.
- Do not change project architecture without explaining why.
- Keep code understandable for an intermediate developer.

### Frontend

- Use feature-based folders when a screen grows.
- Keep components small and composable.
- Use controlled forms with React Hook Form.
- Use Zod schemas for validation.
- Use TanStack Query for server state.
- Avoid global state unless necessary.
- Use semantic HTML.
- Make loading, error and empty states explicit.
- Keep forms accessible.
- Use buttons for actions and links for navigation.

### Backend

- Validate all incoming request bodies, params and query strings.
- Never trust client-side validation alone.
- Keep business logic out of route handlers.
- Use services for business rules.
- Use repositories or Prisma client access in a consistent place.
- Return predictable error responses.
- Never leak stack traces to the client.
- Never expose secrets.
- Never store passwords in plain text.
- Use password hashing for local auth.
- Protect all admin routes.

## Business Rules

These rules are part of the product and should be preserved:

- A barbershop has many services.
- A barbershop has many barbers.
- A barbershop has many customers.
- A barbershop has many appointments.
- A service has a name, duration, price and active status.
- A barber may be active or inactive.
- An inactive service cannot be booked.
- An inactive barber cannot receive new appointments.
- A customer can book without an account.
- A customer is identified mainly by phone number.
- An appointment belongs to one barbershop, one barber, one service and one customer.
- Appointment duration is based on the selected service.
- The system must not allow overlapping appointments for the same barber.
- The system must not allow appointments outside working hours.
- Cancelled appointments should remain in the database.
- Appointment status should be updated instead of deleting records.
- Admin users must only access their own barbershop data.
- Multi-tenant isolation is required.

## Appointment Statuses

Use these statuses unless there is a strong reason to change:

```ts
type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";
```

## Data Model Guidelines

Core entities:

```txt
User
Barbershop
Barber
Service
Customer
Appointment
WorkingHour
BlockedTime
```

Important fields:

```txt
Appointment:
- id
- barbershopId
- barberId
- serviceId
- customerId
- startAt
- endAt
- status
- notes
- createdAt
- updatedAt
```

Every tenant-owned table should include `barbershopId` when applicable.

## UI and Design Rules

Read `DESIGN.md` before creating or changing UI.

Important:

- Avoid generic AI SaaS visuals.
- No random gradient blobs.
- No fake glassmorphism panels.
- No excessive shadows.
- No generic hero with floating cards.
- No meaningless icons.
- No “revolutionize your workflow” copy.
- No overuse of purple/blue gradients.
- No decorative noise that harms readability.
- Prefer calm, practical, local-business design.

The product should feel like a useful scheduling tool for a real barbershop owner.

## Copywriting Rules

Use direct, concrete copy.

Good:

- “Agende seu horário”
- “Escolha um barbeiro”
- “Serviços disponíveis”
- “Horários de hoje”
- “Nenhum horário disponível para esta data”
- “Cliente não compareceu”
- “Faturamento estimado”

Bad:

- “Transforme sua experiência de beleza”
- “Revolucione sua barbearia com tecnologia”
- “A solução definitiva para elevar seu negócio”
- “Potencialize sua jornada”

Use Brazilian Portuguese for user-facing UI unless the project owner asks otherwise.

Code, commit messages and technical docs may use English.

## Accessibility

- Use semantic HTML.
- Inputs need labels.
- Buttons need clear accessible names.
- Do not rely on color alone to communicate status.
- Ensure visible focus states.
- Maintain sufficient text contrast.
- Keep keyboard navigation usable.
- Use proper heading hierarchy.

## Testing Expectations

When implementing important logic, add or update tests when possible.

Priority test targets:

- Appointment availability calculation.
- Appointment overlap prevention.
- Auth-protected routes.
- Service validation.
- Customer booking flow.
- API request validation.
- Dashboard metrics calculations.

If tests are not yet configured, do not block the task. Mention what should be tested.

## Git Rules

Use conventional commits:

```txt
feat: add public booking page
fix: prevent overlapping appointments
chore: configure prisma
docs: add deployment notes
refactor: extract appointment service
test: add availability tests
```

Do not commit generated secrets, `.env`, database dumps or local-only files.

## Environment Variables

Use `.env.example`.

Never commit real credentials.

Expected variables may include:

```txt
DATABASE_URL=
JWT_SECRET=
API_PORT=
FRONTEND_URL=
NODE_ENV=
```

## Development Commands

Prefer `pnpm` if the project is new.

Expected commands:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
```

If the actual project uses npm, yarn or another package manager, follow the existing lockfile.

## Before Making Changes

Before editing code:

1. Read the task carefully.
2. Inspect the relevant files.
3. Check `DESIGN.md` for UI decisions.
4. Make the smallest useful change.
5. Avoid unrelated refactors.
6. Run relevant checks when possible.
7. Explain what changed and why.

## When Unsure

Do not invent product requirements silently.

If a decision is small, choose the simplest maintainable option and document the assumption.

If a decision affects architecture, database schema, auth or deployment, explain the tradeoff before implementing.

## Definition of Done

A feature is not done unless:

- It works in the intended flow.
- It handles loading, empty and error states where relevant.
- It respects tenant isolation.
- It has reasonable validation.
- It does not break existing flows.
- It follows `DESIGN.md`.
- It has clear names.
- It has no obvious accessibility regressions.
- It can be explained in the README or docs.
