# 🍕 Pizzaria — Backend

API REST desenvolvida com **NestJS** para gerenciamento completo de uma pizzaria: pedidos em mesa, delivery, cardápio, funcionários e múltiplas filiais.

---

## Visão Geral

O sistema opera como uma plataforma multi-tenant onde um **Super Admin** pode cadastrar várias pizzarias, cada uma com seu próprio admin e funcionários. Toda a lógica de negócio é isolada por `pizzeriaId`, garantindo que os dados de uma filial nunca vazem para outra.

### Hierarquia de usuários

```
SUPER_ADMIN  →  cria pizzarias e admins
   ADMIN     →  cria funcionários, gerencia cardápio, mesas e visualiza tudo
  EMPLOYEE   →  abre mesas, cria pedidos e registra deliveries
```

---

## Funcionalidades

**Autenticação**
- Login com JWT (access token de 15 min + refresh token de 30 dias)
- Renovação de tokens via endpoint `/auth/refresh` (emite novo par de tokens a cada chamada)
- Logout gerenciado no cliente — sem blacklist server-side; a sessão expira naturalmente quando o refresh token (30 dias) vencer

**Gestão de Pizzarias**
- Cadastro com CNPJ único por plataforma
- Soft delete preserva histórico de pedidos e usuários vinculados

**Cardápio**
- Produto com múltiplos tamanhos (cada um com preço em `Decimal(10,2)`) e sabores
- Flag de disponibilidade para controle de estoque
- Soft delete para não quebrar itens de pedidos históricos

**Mesas**
- Mesa por pizzaria com número único por filial
- Ciclo de vida: `FREE → OCCUPIED → FREE`
- Fechamento registra método de pagamento e desconto

**Pedidos (dine-in)**
- Vinculados a uma mesa ocupada
- Fluxo de status: `OPEN → IN_PROGRESS → READY → DELIVERED` (ou `CANCELLED`)
- Preço do item travado no momento da criação para precisão histórica
- Funcionário vê apenas seus próprios pedidos; admin vê todos

**Delivery**
- Fluxo independente das mesas: `PREPARING → READY → DELIVERED` (ou `CANCELLED`)
- Pagamento registrado na entrega com validação de desconto máximo

---

## Arquitetura

O projeto segue a **arquitetura modular do NestJS**, com separação clara por domínio:

```
src/
├── modules/
│   ├── auth/          # Login, logout, refresh token
│   ├── users/         # CRUD de funcionários
│   ├── pizzerias/     # CRUD de filiais
│   ├── products/      # Cardápio com tamanhos e sabores
│   ├── tables/        # Gestão de mesas
│   ├── orders/        # Pedidos em mesa
│   └── delivery/      # Pedidos para entrega
├── common/
│   ├── guards/        # JwtAuthGuard + RolesGuard (aplicados globalmente)
│   └── decorators/    # @Public(), @Roles(), @CurrentUser()
├── database/          # PrismaService + Seeder do Super Admin
└── config/            # Variáveis de ambiente tipadas
```

Cada módulo segue o padrão **Controller → Service → Repository**:
- O controller cuida apenas de receber a requisição e retornar a resposta HTTP
- O service concentra toda a regra de negócio e validações
- O repository é a única camada que acessa o Prisma, facilitando futuras trocas de banco

**Guards globais:** `JwtAuthGuard` e `RolesGuard` são registrados no `AppModule`, protegendo todas as rotas por padrão. Rotas públicas usam o decorator `@Public()`.

---

## Schema do Banco de Dados

O schema do Prisma é dividido em arquivos por domínio (modular schema), todos compilados em `schema.prisma`:

| Model | Destaques |
|---|---|
| `User` | Role enum, soft delete, pertence a uma Pizzeria |
| `Pizzeria` | CNPJ único, soft delete |
| `Product` | Soft delete, cascata em Sizes e Flavors |
| `ProductSize` | Preço em `Decimal(10,2)` para precisão monetária |
| `Table` | Status enum, constraint única `(pizzeriaId, number)` |
| `Order` | Status enum, `totalPrice` em Decimal |
| `OrderItem` | Preço gravado no momento do pedido |
| `Delivery` | Fluxo e pagamento independentes das mesas |
| `DeliveryItem` | Mesma estrutura de OrderItem |

---

## Segurança

- Senhas com `bcryptjs` (10 rounds)
- Rate limiting global: 120 requisições por 60 segundos via `@nestjs/throttler`
- CORS restrito a `http://localhost:5173`
- DTOs com `class-validator` em modo whitelist (rejeita campos não declarados)
- Autorização em dois níveis: guard global de roles + verificação de `pizzeriaId` dentro dos services
- Variáveis sensíveis exclusivamente via `.env`

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| NestJS 11 + TypeScript 5.7 | Framework e tipagem |
| Prisma ORM | Acesso ao banco com schema type-safe |
| PostgreSQL (Supabase) | Banco de dados relacional |
| JWT (`@nestjs/jwt`) | Autenticação stateless |
| bcryptjs | Hash de senhas |
| class-validator | Validação de DTOs |
| @nestjs/throttler | Rate limiting |
| Swagger (`@nestjs/swagger`) | Documentação automática da API |

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
npm run dev
```

Documentação disponível em `http://localhost:3000/docs`
