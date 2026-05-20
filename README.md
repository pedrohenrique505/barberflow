# BarberFlow

BarberFlow é um mini-SaaS para barbearias, criado como projeto de portfólio com foco em manutenção, organização e uma base próxima de produção.

O produto permitirá que o dono da barbearia gerencie serviços, barbeiros, clientes, horários de funcionamento e agendamentos. Clientes poderão acessar uma página pública, escolher serviço, barbeiro, data e horário, e criar um agendamento sem precisar criar conta.

## Stack

- Frontend: React, Vite, TypeScript e Tailwind CSS
- Backend: Node.js, TypeScript e Fastify
- Banco de dados: PostgreSQL
- ORM: Prisma
- Gerenciador de pacotes: pnpm workspaces
- Deploy futuro: VPS Hostinger com Nginx, PM2 e SSL via Let's Encrypt

## Estrutura

```txt
barberflow/
  apps/
    web/      Frontend React + Vite
    api/      API Fastify e schema Prisma
  docs/       Documentação do projeto e deploy
```

## Comandos

Instalar dependências:

```bash
pnpm install
```

Rodar frontend e backend em desenvolvimento:

```bash
pnpm dev
```

Rodar checagem de tipos:

```bash
pnpm typecheck
```

Gerar build das aplicações:

```bash
pnpm build
```

Gerar o Prisma Client:

```bash
pnpm prisma:generate
```

## Variáveis de ambiente

As variáveis de ambiente do backend ficam em `apps/api/.env`.

Use `apps/api/.env.example` como modelo. Arquivos reais `.env` não devem ser commitados.

```bash
cp apps/api/.env.example apps/api/.env
```
