# 🍕 Pizzaria — Backend

API REST desenvolvida com **NestJS** para um sistema de pizzaria, como projeto de estudo dos fundamentos do framework.

---

## Tecnologias

- NestJS + TypeScript
- Prisma ORM + PostgreSQL (Supabase)

---

## Como rodar

**Pré-requisitos:** Node.js 18+ e uma instância PostgreSQL (Supabase ou local)

```bash
npm install
```

Crie um `.env` na raiz:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="sua-chave-secreta"
SUPER_ADMIN_NAME="Administrador"
SUPER_ADMIN_EMAIL="email"
SUPER_ADMIN_PASSWORD="senha"
```

```bash
npx prisma migrate dev
npm run run dev
```

Documentação disponível em `http://localhost:3000/docs`