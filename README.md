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

Variáveis esperadas neste momento:

```env
DATABASE_URL="postgresql://barberflow:barberflow@localhost:5432/barberflow?schema=public"
JWT_SECRET="troque-esta-chave-em-producao"
PORT=3333
NODE_ENV=development
```

## Ambiente local

1. Instale as dependências:

```bash
pnpm install
```

2. Suba o PostgreSQL local com Docker:

```bash
docker compose up -d
```

O banco local usa as seguintes credenciais:

```txt
Database: barberflow
User: barberflow
Password: barberflow
Porta: 5432
```

3. Copie o arquivo de ambiente do backend:

```bash
cp apps/api/.env.example apps/api/.env
```

4. Gere o Prisma Client:

```bash
pnpm --filter api prisma:generate
```

5. Rode migrations do Prisma quando houver modelos no schema:

```bash
pnpm --filter api prisma:migrate
```

6. Inicie a API em desenvolvimento:

```bash
pnpm --filter api dev
```

7. Teste o health check da API:

```bash
curl http://localhost:3333/health
```

Resposta esperada:

```json
{
  "status": "ok"
}
```

8. Teste o health check do banco:

```bash
curl http://localhost:3333/health/db
```

Resposta esperada:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## Autenticação da API

A autenticação inicial usa JWT em Bearer token. As rotas abaixo assumem a API rodando em `http://localhost:3333`.

### Cadastro

```bash
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pedro Henrique",
    "email": "pedro@email.com",
    "password": "12345678"
  }'
```

Resposta esperada:

```json
{
  "user": {
    "id": "cl...",
    "name": "Pedro Henrique",
    "email": "pedro@email.com"
  },
  "token": "..."
}
```

### Login

```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pedro@email.com",
    "password": "12345678"
  }'
```

Resposta esperada:

```json
{
  "user": {
    "id": "cl...",
    "name": "Pedro Henrique",
    "email": "pedro@email.com"
  },
  "token": "..."
}
```

### Usuário autenticado

Use o token retornado no cadastro ou login:

```bash
curl http://localhost:3333/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada antes de cadastrar uma barbearia:

```json
{
  "user": {
    "id": "cl...",
    "name": "Pedro Henrique",
    "email": "pedro@email.com"
  },
  "barbershop": null
}
```

## Barbearias

### Criar minha barbearia

Use o token retornado no cadastro ou login:

```bash
curl -X POST http://localhost:3333/barbershops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "Barbearia do Zé",
    "slug": "barbearia-do-ze",
    "phone": "88999999999",
    "address": "Rua Exemplo, 123"
  }'
```

Resposta esperada:

```json
{
  "id": "cl...",
  "name": "Barbearia do Zé",
  "slug": "barbearia-do-ze",
  "phone": "88999999999",
  "address": "Rua Exemplo, 123"
}
```

Cada usuário pode ter apenas uma barbearia neste MVP.

### Buscar barbearia pública por slug

Esta rota não exige autenticação.

```bash
curl http://localhost:3333/barbershops/barbearia-do-ze
```

Resposta esperada:

```json
{
  "id": "cl...",
  "name": "Barbearia do Zé",
  "slug": "barbearia-do-ze",
  "phone": "88999999999",
  "address": "Rua Exemplo, 123"
}
```

### Buscar minha barbearia

```bash
curl http://localhost:3333/me/barbershop \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada quando a barbearia existe:

```json
{
  "id": "cl...",
  "name": "Barbearia do Zé",
  "slug": "barbearia-do-ze",
  "phone": "88999999999",
  "address": "Rua Exemplo, 123"
}
```

Resposta esperada quando o usuário ainda não cadastrou uma barbearia:

```json
null
```
