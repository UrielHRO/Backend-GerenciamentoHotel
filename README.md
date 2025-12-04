# Backend - Sistema de Gerenciamento de Hotel

Backend de um sistema de gerenciamento de hotel construído com TypeScript, Node.js, Express, PostgreSQL e Prisma.

## 📋 Requisitos

- Node.js (v14+)
- npm ou yarn
- PostgreSQL (v12+)

## 🚀 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/UrielHRO/Backend-GerenciamentoHotel.git
cd Backend-GerenciamentoHotel
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto (use `.env.example` como base):

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/hotel_db"
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRE="24h"
PORT=3000
NODE_ENV="development"
```

4. Execute as migrações do Prisma:

```bash
npm run prisma:migrate
```

5. Inicie o servidor em modo de desenvolvimento:

```bash
npm run dev
```

O servidor rodará em `http://localhost:3000`

## 📚 Estrutura do Projeto

```
src/
├── controllers/       # Controladores (lógica de requisição/resposta)
├── services/          # Serviços (lógica de negócio)
├── middlewares/       # Middlewares (autenticação, validação, etc)
├── routes/            # Rotas da API
├── database/          # Configuração do Prisma
└── server.ts          # Arquivo principal
```

## 🔑 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação. Todos os endpoints protegidos requerem um token válido no header `Authorization: Bearer <token>`.

### Criar Admin (Registro)

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@hotel.com",
  "password": "senha123",
  "name": "Administrador"
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@hotel.com",
  "password": "senha123"
}
```

Resposta:
```json
{
  "admin": {
    "id": 1,
    "email": "admin@hotel.com",
    "name": "Administrador"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 🛏️ Endpoints da API

### Quartos (Rooms)

#### Criar Quarto
```bash
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "number": "101",
  "floor": 1,
  "capacity": 2,
  "dailyRate": 150.00
}
```

#### Listar Quartos
```bash
GET /api/rooms?status=AVAILABLE
Authorization: Bearer <token>
```

#### Obter Quarto por ID
```bash
GET /api/rooms/:id
Authorization: Bearer <token>
```

#### Atualizar Quarto
```bash
PUT /api/rooms/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "number": "102",
  "floor": 1,
  "capacity": 3,
  "dailyRate": 180.00
}
```

#### Atualizar Status do Quarto
```bash
PATCH /api/rooms/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "CLEANING"
}
```

Status disponíveis: `AVAILABLE`, `RESERVED`, `OCCUPIED`, `CLEANING`, `MAINTENANCE`

#### Deletar Quarto
```bash
DELETE /api/rooms/:id
Authorization: Bearer <token>
```

### Ocupações (Occupations)

#### Criar Check-in
```bash
POST /api/occupations
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": 1,
  "guestName": "João Silva",
  "guestEmail": "joao@email.com",
  "guestPhone": "11999999999",
  "checkInDate": "2024-12-04T10:00:00Z",
  "expectedCheckOut": "2024-12-06T10:00:00Z",
  "roomRate": 150.00,
  "initialConsumption": 0
}
```

**Comportamento automático:**
- Se `checkInDate` é hoje ou no passado: quarto muda para `OCCUPIED`
- Se `checkInDate` é no futuro: quarto muda para `RESERVED`

#### Listar Ocupações
```bash
GET /api/occupations?status=ACTIVE&roomId=1
Authorization: Bearer <token>
```

#### Obter Ocupação por ID
```bash
GET /api/occupations/:id
Authorization: Bearer <token>
```

#### Obter Ocupação Ativa de um Quarto
```bash
GET /api/occupations/room/:roomId
Authorization: Bearer <token>
```

#### Adicionar Consumo
```bash
POST /api/occupations/:occupationId/consumptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2,
  "unitPrice": 25.00
}
```

#### Realizar Check-out
```bash
POST /api/occupations/:occupationId/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceChargePercentage": 10
}
```

Resposta:
```json
{
  "occupation": {
    "id": 1,
    "status": "COMPLETED",
    "checkOutDate": "2024-12-06T10:00:00Z",
    "finalPrice": 385.00,
    ...
  },
  "summary": {
    "roomRate": 150.00,
    "totalConsumption": 50.00,
    "subtotal": 200.00,
    "serviceCharge": 20.00,
    "finalPrice": 220.00
  }
}
```

**Comportamento automático:**
- Calcula subtotal (tarifa do quarto + consumos)
- Aplica taxa de serviço (padrão 10%)
- Calcula preço final
- Altera status do quarto para `CLEANING`

#### Deletar Ocupação
```bash
DELETE /api/occupations/:id
Authorization: Bearer <token>
```

### Produtos (Products)

#### Criar Produto
```bash
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Água Mineral",
  "price": 5.00,
  "description": "Água mineral 500ml",
  "category": "Bebidas"
}
```

#### Listar Produtos
```bash
GET /api/products?category=Bebidas
Authorization: Bearer <token>
```

#### Obter Produto por ID
```bash
GET /api/products/:id
Authorization: Bearer <token>
```

#### Atualizar Produto
```bash
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Água Mineral Premium",
  "price": 6.00
}
```

#### Deletar Produto
```bash
DELETE /api/products/:id
Authorization: Bearer <token>
```

## 🗄️ Modelos de Dados

### Admin
- `id`: número único
- `email`: email único
- `password`: senha criptografada
- `name`: nome do administrador
- `createdAt`: data de criação
- `updatedAt`: data de atualização

### Room
- `id`: número único
- `number`: número do quarto (único)
- `floor`: andar
- `capacity`: capacidade de hóspedes
- `dailyRate`: tarifa diária
- `status`: estado do quarto
- `createdAt`: data de criação
- `updatedAt`: data de atualização

### Occupation
- `id`: número único
- `roomId`: referência ao quarto
- `guestName`: nome do hóspede
- `guestEmail`: email do hóspede
- `guestPhone`: telefone do hóspede
- `checkInDate`: data/hora de entrada
- `checkOutDate`: data/hora de saída
- `expectedCheckOut`: saída prevista
- `roomRate`: tarifa do quarto
- `initialConsumption`: consumo inicial
- `totalConsumption`: total de consumos
- `serviceCharge`: taxa de serviço
- `finalPrice`: preço final
- `status`: estado da ocupação
- `createdAt`: data de criação

### Product
- `id`: número único
- `name`: nome do produto
- `description`: descrição
- `price`: preço
- `category`: categoria
- `createdAt`: data de criação
- `updatedAt`: data de atualização

### Consumption
- `id`: número único
- `occupationId`: referência à ocupação
- `productId`: referência ao produto
- `quantity`: quantidade
- `unitPrice`: preço unitário
- `totalPrice`: preço total
- `createdAt`: data de criação

## 📝 Scripts Disponíveis

```bash
# Modo desenvolvimento com hot reload
npm run dev

# Compilar TypeScript para JavaScript
npm run build

# Iniciar servidor compilado
npm start

# Executar migrações do Prisma
npm run prisma:migrate

# Gerar cliente do Prisma
npm run prisma:generate

# Abrir Prisma Studio (GUI para banco de dados)
npm run prisma:studio
```

## 🔒 Segurança

- Senhas são criptografadas com bcryptjs
- Autenticação JWT com expiração configurável
- CORS habilitado
- Validação de entrada em todos os endpoints
- Tratamento de erros centralizado

## 📖 Documentação Adicional

### Estados dos Quartos

- **AVAILABLE**: Quarto disponível para reserva
- **RESERVED**: Quarto reservado para data futura
- **OCCUPIED**: Quarto ocupado (hospedado está presente)
- **CLEANING**: Quarto em limpeza (após checkout)
- **MAINTENANCE**: Quarto em manutenção

### Estados das Ocupações

- **ACTIVE**: Ocupação ativa (hospedado está hospedado)
- **COMPLETED**: Ocupação finalizada (checkout realizado)
- **CANCELLED**: Ocupação cancelada

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença ISC.

## 👤 Autor

Desenvolvido como parte de um projeto de gerenciamento de hotel.
