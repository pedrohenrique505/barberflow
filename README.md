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

## Serviços

As rotas autenticadas de serviços usam a barbearia vinculada ao usuário logado. Não é possível informar outro `barbershopId` pelo payload.

### Criar serviço

```bash
curl -X POST http://localhost:3333/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "Corte masculino",
    "description": "Corte tradicional ou moderno",
    "priceInCents": 3500,
    "durationInMinutes": 40
  }'
```

Resposta esperada:

```json
{
  "id": "cl...",
  "barbershopId": "cl...",
  "name": "Corte masculino",
  "description": "Corte tradicional ou moderno",
  "priceInCents": 3500,
  "durationInMinutes": 40,
  "isActive": true,
  "createdAt": "2026-05-20T02:25:00.000Z",
  "updatedAt": "2026-05-20T02:25:00.000Z"
}
```

### Listar meus serviços

```bash
curl http://localhost:3333/services \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada:

```json
[
  {
    "id": "cl...",
    "barbershopId": "cl...",
    "name": "Corte masculino",
    "description": "Corte tradicional ou moderno",
    "priceInCents": 3500,
    "durationInMinutes": 40,
    "isActive": true,
    "createdAt": "2026-05-20T02:25:00.000Z",
    "updatedAt": "2026-05-20T02:25:00.000Z"
  }
]
```

### Atualizar serviço

```bash
curl -X PUT http://localhost:3333/services/SERVICE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "Corte completo",
    "description": "Corte + acabamento",
    "priceInCents": 4500,
    "durationInMinutes": 50,
    "isActive": true
  }'
```

### Inativar serviço

O delete é lógico: o serviço permanece no banco e recebe `isActive: false`.

```bash
curl -X DELETE http://localhost:3333/services/SERVICE_ID \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada:

```json
{
  "id": "cl...",
  "barbershopId": "cl...",
  "name": "Corte completo",
  "description": "Corte + acabamento",
  "priceInCents": 4500,
  "durationInMinutes": 50,
  "isActive": false,
  "createdAt": "2026-05-20T02:25:00.000Z",
  "updatedAt": "2026-05-20T02:30:00.000Z"
}
```

### Listar serviços públicos por slug

Esta rota não exige autenticação e retorna apenas serviços ativos.

```bash
curl http://localhost:3333/barbershops/barbearia-do-ze/services
```

Resposta esperada:

```json
[
  {
    "id": "cl...",
    "barbershopId": "cl...",
    "name": "Corte masculino",
    "description": "Corte tradicional ou moderno",
    "priceInCents": 3500,
    "durationInMinutes": 40,
    "isActive": true,
    "createdAt": "2026-05-20T02:25:00.000Z",
    "updatedAt": "2026-05-20T02:25:00.000Z"
  }
]
```

## Barbeiros

As rotas autenticadas de barbeiros usam a barbearia vinculada ao usuário logado. Não é possível informar outro `barbershopId` pelo payload.

### Criar barbeiro

```bash
curl -X POST http://localhost:3333/barbers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "João Silva",
    "phone": "88999999999"
  }'
```

Resposta esperada:

```json
{
  "id": "cl...",
  "barbershopId": "cl...",
  "name": "João Silva",
  "phone": "88999999999",
  "isActive": true,
  "createdAt": "2026-05-20T02:25:00.000Z",
  "updatedAt": "2026-05-20T02:25:00.000Z"
}
```

### Listar meus barbeiros

```bash
curl http://localhost:3333/barbers \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada:

```json
[
  {
    "id": "cl...",
    "barbershopId": "cl...",
    "name": "João Silva",
    "phone": "88999999999",
    "isActive": true,
    "createdAt": "2026-05-20T02:25:00.000Z",
    "updatedAt": "2026-05-20T02:25:00.000Z"
  }
]
```

### Buscar barbeiro por id

```bash
curl http://localhost:3333/barbers/BARBER_ID \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada:

```json
{
  "id": "cl...",
  "barbershopId": "cl...",
  "name": "João Silva",
  "phone": "88999999999",
  "isActive": true,
  "createdAt": "2026-05-20T02:25:00.000Z",
  "updatedAt": "2026-05-20T02:25:00.000Z"
}
```

### Atualizar barbeiro

```bash
curl -X PUT http://localhost:3333/barbers/BARBER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "João Silva",
    "phone": "88999999999",
    "isActive": true
  }'
```

### Inativar barbeiro

O delete é lógico: o barbeiro permanece no banco e recebe `isActive: false`.

```bash
curl -X DELETE http://localhost:3333/barbers/BARBER_ID \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada:

```json
{
  "id": "cl...",
  "barbershopId": "cl...",
  "name": "João Silva",
  "phone": "88999999999",
  "isActive": false,
  "createdAt": "2026-05-20T02:25:00.000Z",
  "updatedAt": "2026-05-20T02:30:00.000Z"
}
```

### Listar barbeiros públicos por slug

Esta rota não exige autenticação e retorna apenas barbeiros ativos.

```bash
curl http://localhost:3333/barbershops/barbearia-do-ze/barbers
```

Resposta esperada:

```json
[
  {
    "id": "cl...",
    "barbershopId": "cl...",
    "name": "João Silva",
    "phone": "88999999999",
    "isActive": true,
    "createdAt": "2026-05-20T02:25:00.000Z",
    "updatedAt": "2026-05-20T02:25:00.000Z"
  }
]
```

## Disponibilidade de horários

A rota de disponibilidade é pública e não exige autenticação. Ela calcula os horários disponíveis usando a barbearia, serviço, barbeiro, data, horários de funcionamento, bloqueios e agendamentos já existentes.

```bash
curl "http://localhost:3333/availability?barbershopSlug=barbearia-do-ze&serviceId=SERVICE_ID&barberId=BARBER_ID&date=2026-05-22"
```

Regras aplicadas:

- `barbershopSlug`, `serviceId`, `barberId` e `date` são obrigatórios.
- `date` deve estar no formato `YYYY-MM-DD`.
- O serviço precisa pertencer à barbearia e estar ativo.
- O barbeiro precisa pertencer à barbearia e estar ativo.
- Se a barbearia estiver fechada no dia informado, `slots` retorna vazio.
- Agendamentos `scheduled` e `confirmed` bloqueiam horários do barbeiro.
- Agendamentos `cancelled`, `completed` e `no_show` não bloqueiam horários.
- Bloqueios gerais da barbearia e bloqueios específicos do barbeiro removem horários disponíveis.

Resposta esperada:

```json
{
  "date": "2026-05-22",
  "service": {
    "id": "SERVICE_ID",
    "durationInMinutes": 40
  },
  "barber": {
    "id": "BARBER_ID",
    "name": "João Silva"
  },
  "slots": [
    {
      "startAt": "2026-05-22T08:00:00.000Z",
      "endAt": "2026-05-22T08:40:00.000Z",
      "label": "08:00"
    }
  ]
}
```

## Agendamentos

### Criar agendamento público

Esta rota não exige autenticação. O cliente informa a barbearia pelo slug, escolhe serviço, barbeiro e horário, e o sistema cria ou reutiliza o cliente pelo telefone.

```bash
curl -X POST http://localhost:3333/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "barbershopSlug": "barbearia-do-ze",
    "serviceId": "SERVICE_ID",
    "barberId": "BARBER_ID",
    "startAt": "2026-05-22T08:00:00.000Z",
    "customerName": "Maria Souza",
    "customerPhone": "88999999999"
  }'
```

O horário precisa estar disponível conforme as mesmas regras da rota `/availability`: expediente da barbearia, duração do serviço, bloqueios e agendamentos `scheduled` ou `confirmed`.

Resposta esperada:

```json
{
  "appointment": {
    "id": "cl...",
    "status": "scheduled",
    "startAt": "2026-05-22T08:00:00.000Z",
    "endAt": "2026-05-22T08:40:00.000Z",
    "service": {
      "id": "SERVICE_ID",
      "name": "Corte masculino",
      "durationInMinutes": 40,
      "priceInCents": 3500
    },
    "barber": {
      "id": "BARBER_ID",
      "name": "João Silva"
    },
    "customer": {
      "id": "CUSTOMER_ID",
      "name": "Maria Souza",
      "phone": "88999999999"
    },
    "barbershop": {
      "id": "BARBERSHOP_ID",
      "name": "Barbearia do Zé",
      "slug": "barbearia-do-ze"
    }
  }
}
```

### Listar agendamentos

Esta rota exige autenticação e retorna apenas agendamentos da barbearia do usuário logado.

```bash
curl "http://localhost:3333/appointments?startDate=2026-05-22T00:00:00.000Z&endDate=2026-05-23T00:00:00.000Z&status=scheduled&barberId=BARBER_ID" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Os filtros `status`, `startDate`, `endDate` e `barberId` são opcionais. Os status aceitos são `scheduled`, `confirmed`, `completed`, `cancelled` e `no_show`.

Resposta esperada:

```json
[
  {
    "id": "cl...",
    "status": "scheduled",
    "startAt": "2026-05-22T08:00:00.000Z",
    "endAt": "2026-05-22T08:40:00.000Z",
    "service": {
      "id": "SERVICE_ID",
      "name": "Corte masculino",
      "durationInMinutes": 40,
      "priceInCents": 3500
    },
    "barber": {
      "id": "BARBER_ID",
      "name": "João Silva"
    },
    "customer": {
      "id": "CUSTOMER_ID",
      "name": "Maria Souza",
      "phone": "88999999999"
    },
    "barbershop": {
      "id": "BARBERSHOP_ID",
      "name": "Barbearia do Zé",
      "slug": "barbearia-do-ze"
    }
  }
]
```

### Alterar status do agendamento

Esta rota exige autenticação. O agendamento precisa pertencer à barbearia do usuário logado. Cancelamentos mudam o status para `cancelled`; o registro não é deletado.

```bash
curl -X PATCH http://localhost:3333/appointments/APPOINTMENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "status": "confirmed"
  }'
```

Resposta esperada:

```json
{
  "id": "cl...",
  "status": "confirmed",
  "startAt": "2026-05-22T08:00:00.000Z",
  "endAt": "2026-05-22T08:40:00.000Z",
  "service": {
    "id": "SERVICE_ID",
    "name": "Corte masculino",
    "durationInMinutes": 40,
    "priceInCents": 3500
  },
  "barber": {
    "id": "BARBER_ID",
    "name": "João Silva"
  },
  "customer": {
    "id": "CUSTOMER_ID",
    "name": "Maria Souza",
    "phone": "88999999999"
  },
  "barbershop": {
    "id": "BARBERSHOP_ID",
    "name": "Barbearia do Zé",
    "slug": "barbearia-do-ze"
  }
}
```

## Horários de funcionamento

As rotas de horários de funcionamento são autenticadas e sempre usam a barbearia vinculada ao usuário logado. Não é possível alterar horários de outra barbearia pelo payload.

Use `dayOfWeek` com `0` para domingo, `1` para segunda-feira, até `6` para sábado.

### Listar horários

```bash
curl http://localhost:3333/working-hours \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada:

```json
[
  {
    "id": "cl...",
    "barbershopId": "cl...",
    "dayOfWeek": 0,
    "opensAt": null,
    "closesAt": null,
    "isOpen": false,
    "createdAt": "2026-05-20T02:25:00.000Z",
    "updatedAt": "2026-05-20T02:25:00.000Z"
  },
  {
    "id": "cl...",
    "barbershopId": "cl...",
    "dayOfWeek": 1,
    "opensAt": "08:00",
    "closesAt": "18:00",
    "isOpen": true,
    "createdAt": "2026-05-20T02:25:00.000Z",
    "updatedAt": "2026-05-20T02:25:00.000Z"
  }
]
```

### Atualizar horários

Se `isOpen` for `true`, `opensAt` e `closesAt` são obrigatórios no formato `HH:mm`, e `closesAt` precisa ser maior que `opensAt`. Se `isOpen` for `false`, os horários podem ser `null`.

```bash
curl -X PUT http://localhost:3333/working-hours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "workingHours": [
      {
        "dayOfWeek": 1,
        "opensAt": "08:00",
        "closesAt": "18:00",
        "isOpen": true
      },
      {
        "dayOfWeek": 2,
        "opensAt": "08:00",
        "closesAt": "18:00",
        "isOpen": true
      },
      {
        "dayOfWeek": 0,
        "opensAt": null,
        "closesAt": null,
        "isOpen": false
      }
    ]
  }'
```

A resposta retorna a lista atualizada, ordenada por dia da semana.

## Horários bloqueados

As rotas de horários bloqueados são autenticadas e sempre usam a barbearia vinculada ao usuário logado. Quando `barberId` for `null`, o bloqueio vale para a barbearia inteira. Quando `barberId` for informado, ele precisa pertencer à barbearia do usuário.

### Criar bloqueio geral

```bash
curl -X POST http://localhost:3333/blocked-times \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "barberId": null,
    "startAt": "2026-05-22T12:00:00.000Z",
    "endAt": "2026-05-22T14:00:00.000Z",
    "reason": "Almoço"
  }'
```

Resposta esperada:

```json
{
  "id": "cl...",
  "barbershopId": "cl...",
  "barberId": null,
  "startAt": "2026-05-22T12:00:00.000Z",
  "endAt": "2026-05-22T14:00:00.000Z",
  "reason": "Almoço",
  "createdAt": "2026-05-20T02:25:00.000Z",
  "updatedAt": "2026-05-20T02:25:00.000Z"
}
```

### Criar bloqueio para barbeiro

```bash
curl -X POST http://localhost:3333/blocked-times \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "barberId": "BARBER_ID",
    "startAt": "2026-05-22T16:00:00.000Z",
    "endAt": "2026-05-22T18:00:00.000Z",
    "reason": "Compromisso externo"
  }'
```

### Listar bloqueios

```bash
curl "http://localhost:3333/blocked-times?startDate=2026-05-22T00:00:00.000Z&endDate=2026-05-23T00:00:00.000Z" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Também é possível filtrar por barbeiro:

```bash
curl "http://localhost:3333/blocked-times?barberId=BARBER_ID&startDate=2026-05-22T00:00:00.000Z&endDate=2026-05-23T00:00:00.000Z" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada:

```json
[
  {
    "id": "cl...",
    "barbershopId": "cl...",
    "barberId": null,
    "startAt": "2026-05-22T12:00:00.000Z",
    "endAt": "2026-05-22T14:00:00.000Z",
    "reason": "Almoço",
    "createdAt": "2026-05-20T02:25:00.000Z",
    "updatedAt": "2026-05-20T02:25:00.000Z"
  }
]
```

### Buscar bloqueio por id

```bash
curl http://localhost:3333/blocked-times/BLOCKED_TIME_ID \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Atualizar bloqueio

```bash
curl -X PUT http://localhost:3333/blocked-times/BLOCKED_TIME_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "barberId": "BARBER_ID",
    "startAt": "2026-05-22T13:00:00.000Z",
    "endAt": "2026-05-22T15:00:00.000Z",
    "reason": "Compromisso externo"
  }'
```

### Remover bloqueio

```bash
curl -X DELETE http://localhost:3333/blocked-times/BLOCKED_TIME_ID \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta esperada: `204 No Content`.
