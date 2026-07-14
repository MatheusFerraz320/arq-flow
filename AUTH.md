# Autenticação, Tokens e Cookies — Guia de Estudo

Este documento existe por causa de um incidente real em produção (13/07/2026): depois de um
refactor no frontend, **todo login passou a resultar em 401** em qualquer rota subsequente.
O objetivo aqui não é só explicar o que aconteceu, mas ensinar os conceitos por trás — sessão,
token, cookie, CORS, first-party vs third-party — pra que o próximo bug desse tipo seja
reconhecido em segundos, não em horas.

Complementa o [`LEARNING.md`](./LEARNING.md) (seção 4, Autenticação com JWT), que fica mais na
superfície. Aqui vamos fundo no "por quê".

---

## Índice

1. [O incidente, resumido](#1-o-incidente-resumido)
2. [Autenticação vs Autorização](#2-autenticação-vs-autorização)
3. [Sessão vs Token — dois modelos de autenticação](#3-sessão-vs-token--dois-modelos-de-autenticação)
4. [JWT por dentro](#4-jwt-por-dentro)
5. [Onde guardar o token no cliente?](#5-onde-guardar-o-token-no-cliente)
6. [Cookies — anatomia completa](#6-cookies--anatomia-completa)
7. [Same-origin, same-site e cross-site](#7-same-origin-same-site-e-cross-site)
8. [Cookies de terceiro (third-party) e por que os browsers os bloqueiam](#8-cookies-de-terceiro-third-party-e-por-que-os-browsers-os-bloqueiam)
9. [CORS — o que é e o que não é](#9-cors--o-que-é-e-o-que-não-é)
10. [O padrão BFF / API Proxy](#10-o-padrão-bff--api-proxy)
11. [Anatomia do bug: reconstruindo o incidente passo a passo](#11-anatomia-do-bug-reconstruindo-o-incidente-passo-a-passo)
12. [O fix e por que ele resolve](#12-o-fix-e-por-que-ele-resolve)
13. [Checklist para a próxima vez que mexer em auth](#13-checklist-para-a-próxima-vez-que-mexer-em-auth)
14. [Glossário](#14-glossário)
15. [Perguntas para testar seu entendimento](#15-perguntas-para-testar-seu-entendimento)

---

## 1. O incidente, resumido

**Setup do ArqFlow:**

- Frontend (`arq-flow-web`) → Next.js, hospedado na Vercel (`arqflow.vercel.app`, por exemplo)
- Backend (`arq-flow`) → NestJS, hospedado no Render (`arqflow-api.onrender.com`, por exemplo)

São **domínios diferentes**. Isso importa — guarda essa frase, ela é a raiz de tudo que vem
a seguir.

**O que mudou:** o frontend passou a fazer login através de uma Route Handler própria
(`/app/api/auth/login/route.ts`), que roda no **servidor** do Next.js e chama o backend via
`fetch` servidor-a-servidor, em vez do browser chamar o backend diretamente.

**O bug:** o backend, numa versão anterior da arquitetura (browser → backend direto), tinha
o hábito de remover o `accessToken` do corpo da resposta JSON, porque ele mesmo já setava um
cookie via `Set-Cookie`. Isso fazia sentido *naquele* modelo. Só que no modelo novo, o
`Set-Cookie` do backend é recebido pelo **servidor Next.js**, não pelo browser — e o Next
precisa do `accessToken` no corpo da resposta pra criar o cookie dele mesmo, no domínio da
Vercel. Sem o campo, o Next criava um cookie de sessão inválido (`undefined`), e toda
requisição autenticada subsequente tomava `401 Unauthorized`.

O resto deste documento existe pra explicar cada peça desse quebra-cabeça em detalhe.

---

## 2. Autenticação vs Autorização

Dois conceitos que sempre aparecem juntos e são frequentemente confundidos:

| Conceito | Pergunta que responde | No ArqFlow |
|---|---|---|
| **Autenticação (AuthN)** | Quem é você? | `JwtAuthGuard` — valida o token e descobre `req.user` |
| **Autorização (AuthZ)** | Você pode fazer isso? | `RolesGuard` — verifica se `req.user.role` tem permissão |

Um 401 (`Unauthorized`) é sempre sobre **quem você é** — token ausente, inválido ou expirado.
Um 403 (`Forbidden`) é sobre **o que você pode fazer** — você é conhecido, mas não tem
permissão pra essa ação específica. O incidente de hoje foi 401: o backend nem conseguia
identificar quem estava fazendo a requisição.

---

## 3. Sessão vs Token — dois modelos de autenticação

Stateful = mantém estado (memória sobre interações anteriores).
Stateless = não mantém estado; cada requisição é independente.

### Modelo 1: Sessão (stateful)

```
1. Login → servidor cria uma sessão em memória/banco/Redis, gera um ID aleatório
2. Servidor manda esse ID pro cliente via cookie (Set-Cookie: sessionId=abc123)
3. Cada requisição seguinte manda o cookie de volta
4. Servidor consulta a sessão pelo ID pra saber quem é o usuário
```

O cookie aqui é **só uma chave** — os dados reais (usuário, permissões) ficam guardados no
servidor. Por isso é "stateful": o servidor precisa lembrar de algo.

### Modelo 2: Token (stateless — o que o ArqFlow usa)

```
1. Login → servidor gera um JWT contendo os dados relevantes, assinado com uma chave secreta
2. Servidor manda o token pro cliente (no corpo da resposta, num cookie, ou os dois)
3. Cada requisição seguinte manda o token de volta
4. Servidor valida a ASSINATURA do token — não precisa consultar nada, os dados já estão dentro
```

Nenhuma sessão é guardada no servidor. Qualquer instância do backend consegue validar
qualquer token, contanto que conheça o segredo (`JWT_SECRET`). É por isso que o `LEARNING.md`
descreve JWT como "stateless" e "escalável" — não tem estado compartilhado entre instâncias.

**Trade-off importante:** como o servidor não guarda nada, ele também não consegue "revogar"
um token individual facilmente (não existe um `sessionId` pra apagar). Por isso tokens JWT
geralmente têm vida curta (`tokenExpiresIn` no ArqFlow é `7d` — relativamente longo pra esse
tipo de token, vale reconsiderar no futuro) e, quando precisa de revogação real, se usa uma
blocklist ou um refresh token com rotação.

---

## 4. JWT por dentro

Um JWT é três blocos em Base64URL separados por ponto:

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6ImFAYi5jb20iLCJyb2xlIjoiQVJDSElURUNUIn0.4f8a...
└────────header────────┘└──────────────payload───────────────┘└──signature──┘
```

- **Header** — algoritmo de assinatura (`{"alg":"HS256"}`)
- **Payload** — os dados (`{ sub, email, role, iat, exp }`) — **não é criptografado, só
  codificado**. Qualquer um consegue decodificar e ler um JWT (dá pra colar em jwt.io e ver).
  Nunca coloque senha ou dado sensível no payload.
- **Signature** — `HMAC-SHA256(header + "." + payload, JWT_SECRET)`. É isso que impede
  alguém de forjar um token — sem o segredo, não dá pra gerar uma assinatura válida pra um
  payload arbitrário.

No ArqFlow, o payload é definido em `jwt.strategy.ts`:

```typescript
interface JwtPayload {
  sub: string;   // ID do usuário (convenção JWT: "subject")
  email: string;
  role: string;
}
```

E a validação acontece assim, a cada requisição protegida:

```typescript
super({
  jwtFromRequest: ExtractJwt.fromExtractors([
    (request: Request) => request?.cookies?.[authConfig.cookieName] ?? null,
    ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]),
  ignoreExpiration: false,
  secretOrKey: authConfig.jwtSecret,
});
```

Repare: o `JwtStrategy` aceita o token de **duas fontes possíveis** — primeiro tenta o cookie
`arqflow_token`, depois tenta o header `Authorization: Bearer <token>`. Isso é flexibilidade
proposital: funciona tanto se o cookie chegar (cenário antigo, browser↔backend direto) quanto
se só o header chegar (cenário novo, proxy do Next manda `Authorization`). O bug não estava
aqui — estava em como o token *saía* do backend no login, não em como ele *entrava* depois.

---

## 5. Onde guardar o token no cliente?

Três opções, cada uma com um risco diferente:

| Onde | Acessível via JS? | Vulnerável a | Enviado automaticamente? |
|---|---|---|---|
| `localStorage` / `sessionStorage` | Sim | **XSS** — qualquer script malicioso injetado na página lê o token | Não — você tem que anexar manualmente em cada fetch |
| Cookie **sem** `httpOnly` | Sim | XSS também | Sim, automaticamente pelo browser |
| Cookie **com** `httpOnly` | **Não** | Reduz XSS drasticamente | Sim, automaticamente pelo browser |

O ArqFlow usa cookie `httpOnly` (ver `auth.config.ts` e o `route.ts` do Next) — a escolha
certa pra uma aplicação web tradicional. Um script malicioso rodando na página (XSS) não
consegue ler `document.cookie` pra um cookie `httpOnly`, então mesmo que um XSS aconteça, o
token de sessão não vaza diretamente por ali.

O preço dessa escolha é que cookies têm sua própria categoria de problemas — que é
exatamente onde o incidente de hoje mora: **SameSite, domínio, first vs third-party**.
(Se o token estivesse em `localStorage`, o bug de hoje simplesmente não existiria — mas
XSS seria um risco maior. Segurança é sempre um trade-off, não um "jeito certo" universal.)

---

## 6. Cookies — anatomia completa

Um `Set-Cookie` no ArqFlow (via `auth.config.ts`):

```typescript
get cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
```

| Atributo | O que faz |
|---|---|
| `httpOnly` | JavaScript no browser não consegue ler esse cookie (`document.cookie` não mostra). Mitiga XSS. |
| `secure` | Cookie só é enviado em conexões HTTPS. Sempre `true` em produção. |
| `sameSite` | Controla se o cookie é enviado em requisições **cross-site** (ver seção 7). Valores: `Strict`, `Lax`, `None`. |
| `path` | Em quais rotas do domínio o cookie é enviado. `/` = todas. |
| `domain` | Em quais (sub)domínios o cookie é válido. Se omitido, é só o domínio exato que setou. |
| `maxAge` / `expires` | Quanto tempo o cookie vive antes do browser apagar sozinho. |

### Os três valores de `SameSite`

- **`Strict`** — o cookie só é enviado se a navegação começou *no próprio site*. Nem clicar
  num link vindo de outro site manda o cookie na primeira requisição. Muito restritivo pra
  a maioria dos casos de login.
- **`Lax`** (padrão do Next.js login route no ArqFlow) — o cookie é enviado em navegação
  de nível superior (clicar num link, digitar a URL) mas **não** em requisições de
  subrecurso cross-site (`<img>`, `fetch` de outro domínio, iframe). Bom equilíbrio pra
  cookies de sessão em same-site.
- **`None`** — o cookie é enviado em **qualquer** contexto, inclusive cross-site, **desde
  que `secure: true` também esteja presente**. É o que o backend do ArqFlow usa — porque,
  na arquitetura antiga, o cookie precisava atravessar de `onrender.com` pra
  `vercel.app`, ou seja, cross-site.

---

## 7. Same-origin, same-site e cross-site

Esses três termos parecem sinônimos e não são — a confusão entre eles é uma fonte clássica
de bug de auth.

**Origin** = protocolo + domínio + porta. `https://arqflow.vercel.app` e
`https://arqflow.vercel.app:8080` são origins diferentes (porta diferente).

**Site** = basicamente o "domínio registrável" (eTLD+1) — ignora subdomínio, protocolo e
porta. `app.arqflow.com` e `api.arqflow.com` são origins diferentes, mas **same-site**
(mesmo domínio registrável `arqflow.com`).

| Comparação | `vercel.app` (frontend) vs `onrender.com` (backend) |
|---|---|
| Same-origin? | Não (domínios completamente diferentes) |
| Same-site? | Não (domínios registráveis diferentes: `vercel.app` ≠ `onrender.com`) |
| → Cross-site | **Sim** |

Esse é o cerne do problema: **Vercel e Render nunca serão same-site entre si**, a não ser
que se configure domínios customizados sob o mesmo domínio raiz (ex: `app.arqflow.com` e
`api.arqflow.com` — aí sim seriam same-site, e `SameSite=Lax` já bastaria).

---

## 8. Cookies de terceiro (third-party) e por que os browsers os bloqueiam

Um cookie é **first-party** quando é setado por (e enviado para) o mesmo site que o usuário
está visitando na barra de endereço. É **third-party** quando é setado por um domínio
diferente daquele que o usuário está visitando — o exemplo clássico histórico é uma rede de
anúncios que planta um cookie em toda página que carrega o script dela, pra rastrear o
usuário através de sites diferentes.

**No cenário antigo do ArqFlow:** o usuário está em `arqflow.vercel.app`, o browser faz uma
chamada `fetch` (com `credentials: 'include'`) direto pra `arqflow-api.onrender.com`. Do
ponto de vista do browser, o cookie que `onrender.com` tenta setar nessa resposta é um
**cookie de terceiro** — porque o site que o usuário está visitando é `vercel.app`, não
`onrender.com`.

Por causa do abuso de rastreamento entre sites com cookies de terceiro, os browsers vêm
bloqueando isso progressivamente:

- **Safari (ITP)** bloqueia cookies de terceiro por padrão há anos.
- **Firefox** (Enhanced Tracking Protection) também bloqueia por padrão.
- **Chrome** vinha eliminando gradualmente o suporte a cookies de terceiro (Privacy
  Sandbox), tornando esse comportamento cada vez mais universal entre browsers.

Ou seja: mesmo com `SameSite=None; Secure` configurado certinho (que é o jeito "correto" de
pedir pra um cookie funcionar cross-site), **o browser pode simplesmente descartar o
cookie**, porque cross-site com finalidade de terceiro é exatamente o padrão que essas
proteções miram derrubar. Isso não é um erro de configuração — é uma política de privacidade
deliberada do browser, e não tem flag no seu backend que a contorne.

**Consequência prática:** qualquer arquitetura que dependa de "o backend seta um cookie que
o browser aceita cross-domain" é frágil por design em 2026. Funciona no Chrome sem proteção
ativada, quebra no Safari, quebra ainda mais dependendo da configuração do usuário. É
provavelmente por isso que esse projeto migrou pro padrão descrito na seção 10.

---

## 9. CORS — o que é e o que não é

CORS (Cross-Origin Resource Sharing) é frequentemente confundido com "a coisa que bloqueia
cookies de terceiro". Não é a mesma coisa, mas os dois interagem.

CORS é o mecanismo que decide **se o browser deixa o JavaScript de uma página ler a
resposta** de uma requisição pra outro domínio. Sem headers CORS corretos do servidor
(`Access-Control-Allow-Origin`), o browser bloqueia o `fetch` cross-origin no lado do
cliente.

Duas regras de CORS que mordem especificamente quando se mistura com cookies:

1. `Access-Control-Allow-Origin: *` (curinga) **não funciona** junto com
   `credentials: 'include'` — o servidor precisa ecoar a origem exata do requisitante
   (`Access-Control-Allow-Origin: https://arqflow.vercel.app`, nunca `*`).
2. É preciso também `Access-Control-Allow-Credentials: true` no servidor, e
   `credentials: 'include'` no fetch do cliente — dos dois lados, ou o cookie não vai/volta.

Vale revisar `src/main.ts` do backend (mencionado no commit `68c2433 fix: exigir
FRONTEND_URL no boot para evitar CORS quebrado silenciosamente`) pra ver como isso está
configurado hoje.

**Por que isso importa menos agora:** no padrão novo (seção 10), o browser só fala com o
próprio domínio do frontend — o Next.js server é quem fala com o backend. Chamada
servidor-a-servidor **não passa por CORS** (CORS é uma política de browser, não existe em
`fetch` rodando em Node). É uma categoria inteira de dor de cabeça que desaparece.

---

## 10. O padrão BFF / API Proxy

BFF = *Backend for Frontend*. É o nome do padrão onde o próprio servidor do frontend expõe
uma API fina que internamente conversa com o backend "de verdade", em vez do browser falar
direto com ele.

```
ANTES (browser → backend direto):

┌──────────┐   fetch cross-site    ┌──────────────┐
│  Browser │ ─────────────────────▶│  NestJS API  │
│          │◀───Set-Cookie(3rd───  │ (onrender.com)│
└──────────┘   party, pode ser     └──────────────┘
                bloqueado)


DEPOIS (BFF / proxy servidor-a-servidor):

┌──────────┐  fetch same-origin   ┌────────────────┐   fetch servidor-servidor   ┌──────────────┐
│  Browser │ ────────────────────▶│  Next.js server │ ───────────────────────────▶│  NestJS API  │
│          │◀──Set-Cookie(1st-────│  (vercel.app)   │◀──────accessToken no JSON───│ (onrender.com)│
└──────────┘   party, sempre      └────────────────┘                             └──────────────┘
               aceito)
```

No ArqFlow, essa mudança está em `src/app/api/[...proxy]/route.ts` e
`src/app/api/auth/login/route.ts`. O ponto chave:

- O browser só conversa com `vercel.app` — o próprio domínio da página. O cookie que ele
  recebe (`Set-Cookie` do `NextResponse` no route handler) é **first-party**, sempre aceito
  por qualquer browser, sem exceção.
- A chamada Next → NestJS é servidor-a-servidor. Não existe conceito de "cookie de
  terceiro" nem CORS aqui — é só uma requisição HTTP de um processo Node pra outro. O Next
  usa `Authorization: Bearer <token>` pra se autenticar contra o backend
  (`buildAuthHeader` em `src/lib/server/auth-cookie.ts`).
- Só que, pra isso funcionar, o Next **precisa receber o token de algum lugar** depois do
  login pra poder guardá-lo no cookie que ele mesmo vai emitir. A única forma de o token
  chegar até o Next é **no corpo JSON da resposta do backend**. Dado esse desenho, o
  `accessToken` no body deixa de ser opcional — é a única via de transporte do token entre
  os dois servidores.

Esse último parágrafo é exatamente onde o bug vivia.

---

## 11. Anatomia do bug: reconstruindo o incidente passo a passo

**O código do backend antes do fix**, em `auth-cookie.interceptor.ts`:

```typescript
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const response: Response = context.switchToHttp().getResponse();

  return next.handle().pipe(
    map((body) => {
      if (body?.accessToken) {
        response.cookie(
          this.authConfig.cookieName,
          body.accessToken,
          this.authConfig.cookieOptions,   // sameSite: 'none' — pensado pro cenário antigo
        );
      }
      const { accessToken, ...user } = body;
      return user;   // <- accessToken descartado do JSON de resposta
    }),
  );
}
```

E o `route.ts` do Next, do lado do frontend:

```typescript
const res = await fetch(`${API_URL}/auth/login`, { ... });
const data = await res.json();   // data.accessToken === undefined, porque o backend removeu

const response = NextResponse.json({ user: data.user });
response.cookies.set(AUTH_COOKIE_NAME, data.accessToken, { ... });
// cookie setado com valor undefined/"undefined" — token inválido desde o nascimento
```

Passo a passo do que acontecia:

1. Usuário submete login → `POST /api/auth/login` (Next, mesmo domínio do browser)
2. Next Route Handler chama `POST /auth/login` no NestJS (servidor-a-servidor)
3. NestJS autentica, gera o JWT, o interceptor tenta setar um cookie **no domínio do
   Render** (inútil aqui — quem recebe essa resposta é o servidor Next, não o browser; esse
   `Set-Cookie` nunca chega em lugar nenhum que importe) e devolve `{ id, name, email, role }`
   — **sem** `accessToken`
4. Next lê `data.accessToken` → `undefined` → seta cookie `arqflow_token` inválido no
   domínio da Vercel
5. Browser recebe `200 OK` do login, mostra tela de sucesso, redireciona pro dashboard —
   **nada aqui indicava erro**, porque o passo 3 tecnicamente "funcionou" (200, usuário
   retornado)
6. Dashboard monta, chama `GET /api/auth/me`
7. Next Route Handler lê o cookie inválido, manda `Authorization: Bearer undefined` pro
   NestJS
8. `JwtStrategy` tenta verificar a assinatura de `"undefined"` como JWT → falha →
   `UnauthorizedException` → **401**
9. Frontend interpreta 401 como "não autenticado" → redireciona de volta pro `/login`

Do ponto de vista do usuário: "faço login, ele parece funcionar, mas não consigo acessar
nada" — exatamente porque o login *de fato* funcionava no backend (credenciais corretas,
token gerado), só que o transporte do token até o cookie certo estava quebrado.

**Por que isso não apareceu em teste local antes do deploy:** bem provavelmente porque em
`localhost`, ambos os serviços podem ter rodado sob a mesma origem/configuração de proxy, ou
porque esse pedaço específico não foi exercitado manualmente (login → navegar → ver se
carrega dados) depois do refactor, só testado build/lint. É um lembrete de por que o skill
`verify` deste projeto pede pra *exercitar o fluxo de verdade no browser*, não só rodar
testes automatizados, antes de considerar uma mudança de auth como pronta.

---

## 12. O fix e por que ele resolve

```diff
-        const { accessToken, ...user } = body;
-        return user;
+        return body;
```

Agora o corpo da resposta de `POST /auth/login` inclui `accessToken`. O Next consegue ler
`data.accessToken`, setar um cookie **válido**, first-party, no domínio da Vercel — e a partir
daí todo o resto da cadeia (proxy, `serverFetch`, `JwtStrategy` aceitando `Authorization:
Bearer`) já funcionava corretamente, porque nunca foi ali que o bug estava.

**Dívida técnica que sobrou (não quebra nada, mas vale limpar):**

- `response.cookie(...)` dentro do interceptor ainda seta um cookie no domínio do Render.
  Ele é código morto agora — nenhum client relevante fala direto com o Render pra
  aproveitá-lo — mas continua rodando a cada login sem necessidade.
- `sameSite: 'none'` em `auth.config.ts` só faz sentido se algum client ainda depender de
  cookie cross-site direto no backend. Hoje, não depende.

Ambos podem ser removidos numa limpeza futura, mas não são urgentes — não causam bug, só
carregam intenção de um desenho que não existe mais.

---

## 13. Checklist para a próxima vez que mexer em auth

- [ ] O token/cookie muda de domínio em algum ponto do fluxo? Se sim, é cross-site — pense em
      `SameSite`, `secure`, e se algum browser vai simplesmente recusar o cookie.
- [ ] Alguma camada intermediária (proxy, BFF, gateway) precisa **ler** o token pra repassar
      ou re-emitir? Se sim, confirme que ele realmente chega até ali — não assuma que um
      `Set-Cookie` "vai aparecer sozinho" do outro lado de uma chamada servidor-a-servidor.
- [ ] Depois de qualquer mudança em login/cookie/proxy: **testar manualmente** — login,
      F5 na página protegida, fechar e abrir de novo, checar aba Network pro status real
      (não só "a tela carregou").
- [ ] Um 401 inesperado em produção: primeiro pergunte "o token está chegando no header/
      cookie que o backend espera?" antes de suspeitar de `JWT_SECRET` ou expiração.
- [ ] Nunca deixar um `console.log`/comentário TODO no lugar de decidir: se um campo (como
      `accessToken`) é removido do corpo de uma resposta, documente **por que**, porque seis
      meses depois ninguém vai lembrar que aquilo dependia de uma arquitetura antiga.

---

## 14. Glossário

| Termo | Explicação |
|---|---|
| **AuthN / AuthZ** | Abreviações comuns pra Autenticação / Autorização. |
| **JWT** | JSON Web Token — header.payload.signature em Base64URL, assinado, não criptografado. |
| **Stateless** | O servidor não guarda nada sobre a sessão; tudo que precisa está no próprio token. |
| **Bearer Token** | Convenção de enviar o token no header `Authorization: Bearer <token>`. Qualquer um que "carregue" (bear) o token é tratado como autenticado — daí o nome, e daí a importância de nunca vazá-lo. |
| **httpOnly** | Atributo de cookie que o impede de ser lido via `document.cookie` no JavaScript do browser. |
| **SameSite** | Atributo de cookie (`Strict`/`Lax`/`None`) que controla envio em contexto cross-site. |
| **Origin** | protocolo + domínio + porta. |
| **Site** | domínio registrável (eTLD+1), ignora subdomínio/porta/protocolo. |
| **Same-site** | Mesmo domínio registrável (`app.x.com` e `api.x.com` são same-site). |
| **Cross-site** | Domínios registráveis diferentes (`vercel.app` e `onrender.com`). |
| **First-party cookie** | Cookie setado pelo domínio que está na barra de endereço do usuário. |
| **Third-party cookie** | Cookie setado por um domínio diferente daquele que o usuário está visitando — cada vez mais bloqueado por padrão nos browsers. |
| **CORS** | Mecanismo do browser que decide se JS de um domínio pode ler resposta de outro domínio. |
| **BFF (Backend for Frontend)** | Padrão onde o servidor do próprio frontend expõe uma API fina que fala com o backend real por trás, evitando o browser falar direto com serviços externos. |
| **Refresh Token** | Token de vida longa, trocado por um novo access token quando este expira — não implementado ainda no ArqFlow (`tokenExpiresIn` fixo de 7 dias). |
| **XSS** | Cross-Site Scripting — injeção de script malicioso numa página; motivador principal de usar `httpOnly` em cookies de sessão. |
| **CSRF** | Cross-Site Request Forgery — outro site induz o browser a mandar uma requisição pro seu domínio usando cookies já autenticados; motivador principal de `SameSite=Lax/Strict`. |

---

## 15. Perguntas para testar seu entendimento

1. Por que um cookie `SameSite=None; Secure` ainda pode ser bloqueado por um browser, mesmo
   estando "configurado certo"?
2. Qual a diferença prática entre um 401 e um 403? Qual dos dois esse incidente gerou, e por
   quê?
3. Se o ArqFlow guardasse o token em `localStorage` em vez de cookie `httpOnly`, o bug de
   hoje teria acontecido? Que outro problema apareceria no lugar?
4. Por que a chamada Next.js → NestJS (servidor-a-servidor) não é afetada por CORS nem por
   bloqueio de cookie de terceiro?
5. `vercel.app` e `onrender.com` — são same-origin? Same-site? Cross-site? Justifique cada
   resposta.
6. No `JwtStrategy`, por que faz sentido aceitar o token tanto via cookie quanto via header
   `Authorization`, em vez de só uma fonte?
7. Se amanhã alguém quisesse fazer o ArqFlow funcionar com um app mobile nativo (sem
   cookies), o que precisaria mudar no fluxo de auth atual?
8. Por que remover `accessToken` do corpo de uma resposta é uma decisão de segurança
   legítima *em algum contexto*, mas foi um bug *neste* contexto?

---

> Este documento nasceu de um post-mortem real. Se você (ou o Claude, numa sessão futura)
> encontrar outro incidente de auth, o ideal é expandir este arquivo em vez de criar um novo
> — mantém o histórico de "erros que já cometemos" num lugar só.
