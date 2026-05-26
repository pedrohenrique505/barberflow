# Repository Guidelines

## Project Structure & Module Organization

BarberFlow is a pnpm workspace with two apps under `apps/`. `apps/api` contains the Fastify API, Prisma schema, migrations, and domain modules in `src/modules`. Shared API utilities live in `src/lib`, `src/env`, and `src/plugins`. `apps/web` contains the Vite React admin frontend, with routes in `src/app`, reusable UI in `src/components`, feature code in `src/features`, pages in `src/pages`, API helpers in `src/lib`, and Tailwind globals in `src/styles`. Deployment notes live in `docs/`.

## Build, Test, and Development Commands

Use pnpm 9+ and Node 20.11+.

```bash
pnpm install              # install workspace dependencies
pnpm dev                  # run all app dev servers
pnpm build                # build every workspace app
pnpm typecheck            # run TypeScript checks everywhere
pnpm --filter api dev     # run Fastify API
pnpm --filter web dev     # run Vite frontend
pnpm --filter api prisma:migrate
pnpm --filter api prisma:generate
```

Copy environment templates before local development: `apps/api/.env.example` and `apps/web/.env.example`.

## Coding Style & Naming Conventions

Use strict TypeScript and ESM. Prefer small functions, explicit types at module boundaries, and no `any` unless justified. Backend code should keep validation in Zod schemas, route handlers thin, and business logic in service modules. Frontend code should use React Hook Form + Zod for forms, TanStack Query for server state, semantic HTML, and Brazilian Portuguese UI copy. Use PascalCase for React components, camelCase for functions and variables, and kebab-case for route paths.

## Testing Guidelines

Automated tests are not fully configured yet. Until a test runner is added, run `pnpm typecheck` and relevant builds before submitting changes. Prioritize future tests for appointment availability, overlap prevention, auth-protected routes, request validation, booking flow, and dashboard metrics. Name tests after the behavior being protected, for example `appointment-availability.spec.ts`.

## Commit & Pull Request Guidelines

Follow Conventional Commits, as in `feat: base do frontend administrativo implementada` or `fix: prevent overlapping appointments`. Pull requests should include a short summary, validation commands run, linked issue when applicable, and screenshots for UI changes. Note schema, environment, or deployment changes explicitly.

## Security & Configuration Tips

Never commit real `.env` files, credentials, database dumps, or generated secrets. Admin routes must preserve tenant isolation by scoping data to the authenticated barbershop owner. Validate all incoming API input server-side, hash passwords, and avoid leaking stack traces to clients.

## Uso de skills

Use skills somente quando forem claramente necessárias para a tarefa atual.

Skills de interface/design, como `emilkowalski/skill` e `jakubkrehel/make-interfaces-feel-better`, devem ser usadas apenas em tarefas que envolvam:

- criação ou refinamento de UI;
- layout;
- design system;
- componentes visuais;
- animações;
- microinterações;
- responsividade;
- acessibilidade visual;
- melhoria de experiência do usuário.

Não use skills de interface/design em tarefas puramente backend, banco de dados, Prisma, autenticação, Docker, documentação operacional, scripts, correções simples de API ou refactors sem impacto visual.

Quando uma skill for usada, explique brevemente no plano por que ela é relevante para a tarefa.
