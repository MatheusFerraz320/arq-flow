# ArqFlow — Guia de Estudo

Este documento explica **tudo o que foi implementado** no backend do ArqFlow, com o objetivo de servir como material de estudo para desenvolvedores iniciando com NestJS, Prisma e APIs REST.

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [NestJS — Estrutura de Módulos](#2-nestjs--estrutura-de-módulos)
3. [Prisma ORM](#3-prisma-orm)
4. [Autenticação com JWT](#4-autenticação-com-jwt)
5. [Controle de Acesso (Roles)](#5-controle-de-acesso-roles)
6. [CRUD Completo — Clients, Projects, Updates](#6-crud-completo)
7. [Fluxo Completo de uma Requisição](#7-fluxo-completo-de-uma-requisição)
8. [Glossário de Conceitos](#8-glossário-de-conceitos)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────┐     HTTP      ┌──────────────────┐     SQL      ┌────────────┐
│   Frontend   │ ──────────▶  │   NestJS (API)   │ ──────────▶ │ PostgreSQL │
│  (Next.js)   │ ◀────────── │   localhost:3001  │ ◀────────── │            │
└─────────────┘     JSON      └──────────────────┘     Prisma   └────────────┘
```

### Fluxo de dados

1. Frontend envia requisição HTTP para o NestJS
2. NestJS valida autenticação (JWT) e autorização (Roles)
3. Controller recebe a requisição e chama o Service
4. Service usa o PrismaService para consultar/escrever no PostgreSQL
5. Resposta volta pelo mesmo caminho

### Stack

| Camada | Tecnologia | Função |
|---|---|---|
| Runtime | Node.js 20 | Executa JavaScript no servidor |
| Framework | NestJS 10 | Estrutura MVC com injeção de dependência |
| ORM | Prisma 6 | Mapeia tabelas do banco para objetos TypeScript |
| Banco | PostgreSQL 16 | Banco relacional |
| Autenticação | Passport + JWT | Login stateless via tokens |
| Validação | class-validator + class-transformer | Valida DTOs automaticamente |

---

## 2. NestJS — Estrutura de Módulos

### O que é um módulo?

No NestJS, **tudo é organizado em módulos**. Um módulo agrupa funcionalidades relacionadas. Pense no módulo como uma "gaveta" que contém:

- **Controllers** — lidam com as rotas HTTP (ex: `GET /clients`)
- **Services** — contêm a lógica de negócio
- **Providers** — qualquer classe injetável (serviços, repositórios, etc.)

### Estrutura de diretórios

```
src/
├── main.ts                  # Ponto de entrada da aplicação
├── app.module.ts            # Módulo raiz (importa todos os outros)
├── prisma/
│   ├── prisma.module.ts     # Módulo global do Prisma
│   └── prisma.service.ts    # Serviço que expõe o PrismaClient
├── auth/                    # Módulo de autenticação
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   └── dto/login.dto.ts
├── users/                   # Módulo de usuários
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/create-user.dto.ts
├── clients/                 # Módulo de clientes
├── projects/                # Módulo de projetos
├── project-updates/         # Módulo de atualizações
└── common/                  # Compartilhado (guards, decorators)
    ├── roles.decorator.ts
    └── roles.guard.ts
```

### Por que módulos?

- **Separação de responsabilidades** — cada módulo cuida de uma coisa
- **Reusabilidade** — um módulo pode importar outro e usar seus serviços
- **Testabilidade** — módulos podem ser testados isoladamente
- **Organização** — conforme o projeto cresce, fica fácil navegar

### Exemplo: ClientsModule

```typescript
// clients.module.ts
@Module({
  controllers: [ClientsController],  // Quem lida com as rotas
  providers: [ClientsService],       // Quem tem a lógica
})
export class ClientsModule {}
```

O `AppModule` importa `ClientsModule`, que registra automaticamente o `ClientsController` e o `ClientsService`.

---

## 3. Prisma ORM

### O que é ORM?

ORM (Object-Relational Mapping) é uma técnica que permite **trabalhar com banco de dados usando objetos da linguagem de programação**, em vez de escrever SQL puro.

### Prisma schema

O arquivo `prisma/schema.prisma` é a **fonte da verdade** do banco de dados. Ele define:

1. **Fonte de dados** — qual banco (PostgreSQL) e onde conectar
2. **Modelos** — quais tabelas existem e seus relacionamentos
3. **Enums** — valores fixos (como status do projeto)

```prisma
model User {
  id       String   @id @default(cuid())   // ID único gerado automaticamente
  name     String                           // Campo obrigatório
  email    String   @unique                 // Campo único (não pode repetir)
  password String
  role     Role     @default(ARCHITECT)    // Enum com valor padrão
  clients  Client[]                         // Relacionamento 1:N
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Comandos Prisma

```bash
npx prisma generate   # Gera o Prisma Client (código TypeScript para acessar o banco)
npx prisma migrate dev  # Cria/atualiza as tabelas no banco
npx prisma studio     # Abre uma interface gráfica para ver os dados
```

### Como o PrismaClient é usado

No `PrismaService`, estendemos o `PrismaClient` e o tornamos um provider do NestJS:

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();  // Conecta ao banco quando o servidor inicia
  }
}
```

Qualquer service pode usar o Prisma injetando o `PrismaService`:

```typescript
@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.client.findMany({
      where: { userId },
      include: { projects: true },  // JOIN com a tabela de projetos
    });
  }
}
```

O Prisma traduz `findMany`, `create`, `findUnique` para SQL automaticamente.

---

## 4. Autenticação com JWT

### O que é JWT?

JWT (JSON Web Token) é um formato de token que contém informações do usuário (payload) assinadas digitalmente. O servidor gera o token no login, e o cliente envia esse token em toda requisição.

### Fluxo do JWT

```
1. Cliente envia email + senha → POST /auth/login
2. Servidor valida as credenciais (bcrypt.compare)
3. Servidor gera um JWT com { sub: userId, email, role }
4. Cliente recebe { access_token, user }
5. Cliente envia o token no header: Authorization: Bearer <token>
6. Servidor valida o token a cada requisição (JwtStrategy)
```

### JwtStrategy (validação do token)

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // De onde extrair
      secretOrKey: process.env.JWT_SECRET,                      // Chave para verificar
    });
  }

  async validate(payload: JwtPayload) {
    // Toda rota protegida terá req.user com { id, email, role }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Por que JWT e não sessão?

- **Stateless** — o servidor não precisa armazenar sessão em banco ou memória
- **Escalável** — qualquer servidor pode validar o token sem compartilhar estado
- **Mobile-friendly** — funciona com apps nativos, web, etc.

---

## 5. Controle de Acesso (Roles)

### Como funciona

Usamos dois mecanismos juntos:

1. **JwtAuthGuard** — verifica se o usuário está autenticado (tem token válido)
2. **RolesGuard** — verifica se o usuário tem a role necessária

### Roles decorator

```typescript
@Roles(Role.ARCHITECT)  // Metadata: ["ARCHITECT"]
@Post()
create(@Body() dto: CreateClientDto) { ... }
```

### RolesGuard

O `RolesGuard` lê a metadata definida pelo `@Roles()` e compara com `req.user.role`:

```typescript
canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());
  if (!requiredRoles) return true;

  const { user } = context.switchToHttp().getRequest();
  return requiredRoles.includes(user.role);
}
```

### Regras de acesso do ArqFlow

| Role | Pode fazer |
|---|---|
| ARCHITECT | CRUD clientes, projetos, atualizações |
| CLIENT | Apenas visualizar seus projetos e atualizações |

---

## 6. CRUD Completo

### Endpoints implementados

| Método | Rota | Quem | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Todos | Login, retorna JWT |
| POST | `/users` | Todos | Cadastro de usuário |
| GET | `/clients` | ARCHITECT+CLIENT | Listar clientes |
| POST | `/clients` | ARCHITECT | Criar cliente |
| GET | `/clients/:id` | ARCHITECT+CLIENT | Detalhe do cliente |
| GET | `/projects` | ARCHITECT+CLIENT | Listar projetos |
| POST | `/projects` | ARCHITECT | Criar projeto |
| GET | `/projects/:id` | ARCHITECT+CLIENT | Detalhe do projeto |
| PATCH | `/projects/:id` | ARCHITECT | Atualizar status |
| POST | `/projects/:id/updates` | ARCHITECT | Adicionar atualização |
| GET | `/projects/:id/updates` | ARCHITECT+CLIENT | Listar atualizações |

### Estrutura de um Service

Cada service segue o mesmo padrão:

```typescript
@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    // 1. Validação (ex: verificar se o cliente pertence ao arquiteto)
    // 2. Operação no banco via Prisma
    // 3. Retorno do resultado
  }
}
```

### DTOs (Data Transfer Objects)

DTOs definem **o formato esperado dos dados de entrada**. Eles usam decorators do `class-validator` para validação automática:

```typescript
export class CreateClientDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
```

O `ValidationPipe` global aplica essas validações automaticamente antes do controller receber os dados. Se a validação falhar, o NestJS retorna `400 Bad Request` com a lista de erros.

---

## 7. Fluxo Completo de uma Requisição

Quando o frontend faz `GET /projects`:

```
1. Requisição chega no servidor (porta 3001)
2. NestJS aplica os guards na ordem:
   a. JwtAuthGuard → extrai token do header, valida assinatura, decodifica payload
   b. RolesGuard → verifica se a role do usuário tem permissão
3. Roteador encaminha para ProjectsController.findAll()
4. Controller chama ProjectsService.findAll(userId, role)
5. Service usa PrismaService para consultar o banco
   → SELECT * FROM projects JOIN clients ...
6. Dados voltam: Prisma → Service → Controller → HTTP Response (JSON)
```

### Exemplo com POST /clients

```
Frontend → POST /clients (Authorization: Bearer <token>, Body: { name, email, phone })

1. JwtAuthGuard → req.user = { id, email, role: "ARCHITECT" }
2. RolesGuard → ["ARCHITECT"] inclui "ARCHITECT"? Sim → permite
3. ValidationPipe → valida body com CreateClientDto
4. ClientsController.create(req.user.id, body)
5. ClientsService.create(userId, dto)
6. prisma.client.create({ data: { userId, name, email, phone } })
7. Prisma gera INSERT INTO clients ... RETURNING *
8. Resposta → 201 Created + JSON do cliente criado
```

---

## 8. Glossário de Conceitos

### NestJS

| Termo | Explicação |
|---|---|
| **Module** | Agrupador de funcionalidades. Tudo começa no `AppModule`. |

| **Controller** | Lida com requisições HTTP. Define rotas com `@Get`, `@Post`, etc. |

| **Service** | Contém a lógica de negócio. Chamado pelo controller. |

| **Provider** | Qualquer classe marcada com `@Injectable()`. Pode ser injetada em outras classes. |

| **Guard** | Executa antes do controller. Usado para autenticação/autorização. |

| **Decorator** | Função que adiciona metadados e/ou comportamento a um elemento do código (classe, método, propriedade, parâmetro), sinalizando como ele deve ser tratado por uma linguagem, biblioteca ou framework. framework  também existe em outras linguagens classes/métodos. Ex: `@Controller`, `@Get`, `@Injectable`. |

| **DTO** | Objeto que define a forma dos dados de entrada/saída da aplicação também definido como Modelagem de dados entre camadas da aplicação. |

| **Pipe** | Transforma ou valida dados antes de chegar ao controller. |

| **Injeção de Dependência** | Padrão onde o NestJS fornece automaticamente as dependências de uma
  classe via construtor exemplo , tenho uma Classe ClientService , ela tem metodos de localizar clients o findOne por exemplo
  se na minha outra classe ProjectServices necessitar verificar um client eu posso injetar a ClientService , e utilizar o findOne ali.

### Prisma

| Termo | Explicação |
|---|---|
| **Schema** | Arquivo que define a estrutura do banco (tabelas, relações, enums). |
| **Model** | Representa uma tabela no banco. |
| **Migration** | Arquivo SQL gerado automaticamente que altera a estrutura do banco. |
| **Prisma Client** | Biblioteca gerada a partir do schema, com métodos tipados para CRUD. |
| **`findMany`** | SELECT com filtros (where, include, orderBy). |
| **`findUnique`** | SELECT por chave única (ex: findById). |
| **`include`** | Faz JOIN com tabelas relacionadas. |

### Autenticação

| Termo | Explicação |
|---|---|
| **JWT** | Token JSON assinado que carrega informações do usuário. |
| **Payload** | Corpo do JWT com os dados (sub, email, role). |
| **Bearer Token** | Formato de envio do token no header: `Authorization: Bearer <token>`. |
| **bcrypt** | Biblioteca que faz hash de senhas (não armazenamos senha em texto puro). |
| **Salt** | Valor aleatório adicionado ao hash para evitar ataques de dicionário. |
| **Strategy (Passport)** | Define como validar um token/provedor de autenticação. |

### Banco de Dados

| Termo | Explicação |
|---|---|
| **Relacionamento 1:N** | Um usuário tem muitos clientes. Modelado com `clients Client[]` no User e `userId` + `@relation` no Client. |
| **Chave primária (PK)** | Identificador único de cada registro (`@id`). |

| **Chave estrangeira (FK)** | Campo que referencia a PK de outra tabela (`userId` → `User.id`).
  é vinculada a alguma entidade , necessita dela para existir
|
| **Enum** | Tipo que só aceita valores pré-definidos (`BRIEFING`, `PROJETO`, etc.). |

| **CUID** | Identificador único gerado pelo Prisma (similar a UUID, mas mais curto). |

---

## Como estudar este projeto

### Ornamentalha sugerida

1. **Leia este documento** — entenda o panorama geral
2. **Explore o Prisma schema** — veja como as tabelas se relacionam
3. **Abra o Prisma Studio** — `npx prisma studio` para ver os dados no banco
4. **Siga o fluxo de uma requisição** — comece pelo controller, vá para o service, termine no prisma
5. **Quebre e conserte** — tente adicionar um campo novo, uma rota nova, um módulo novo
6. **Leia a documentação oficial**:
   - [NestJS Docs](https://docs.nestjs.com/)
   - [Prisma Docs](https://www.prisma.io/docs/)
   - [class-validator](https://github.com/typestack/class-validator)

### Perguntas para testar seu entendimento

- Por que o PrismaModule é `@Global()`?
- O que acontece se eu remover o `@UseGuards(JwtAuthGuard)` de um controller?
- Qual a diferença entre `@Body()` e `@Param()`?
- Por que a senha nunca volta no JSON da resposta?
- O que o `ValidationPipe({ whitelist: true })` faz?
- Como o NestJS sabe qual service injetar em qual controller?

---

> Este projeto foi intencionalmente simplificado para aprendizado. Conforme você avança, pode adicionar: upload de arquivos, notificações por email, comentários, aprovação de etapas, etc.
