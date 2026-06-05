# Next.js + Better Auth + GitHub + SQLite Demo

Demo extremamente simples de autenticação com Next.js (App Router), Better Auth, GitHub OAuth e SQLite local.

## 🚀 Tecnologias

- **Next.js 14** (App Router + TypeScript)
- **Better Auth** (autenticação framework-agnostic)
- **GitHub OAuth** (login social)
- **SQLite** (banco local com `better-sqlite3`)
- **Tailwind CSS** (estilização)
- **npm** (gerenciador de pacotes)

## 📋 Pré-requisitos

- Node.js 18+
- npm
- Conta no GitHub para criar OAuth App

## ⚙️ Configuração

### 1. Clone e instale dependências

```bash
cd exemplo-08-context7
npm install
```

### 2. Configure variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais do GitHub:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
GITHUB_CLIENT_ID=seu_client_id_aqui
GITHUB_CLIENT_SECRET=seu_client_secret_aqui
```

**Como obter credenciais GitHub OAuth:**
1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em "New OAuth App"
3. Preencha:
   - **Application name**: Next.js Better Auth Demo
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copie o **Client ID** e gere um **Client Secret**

### 3. Execute a migração do banco de dados

```bash
npm run auth:migrate
```

Isso criará o arquivo `better-auth.sqlite` com as tabelas necessárias.

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
exemplo-08-context7/
├── app/
│   ├── api/auth/[...all]/route.ts  # Route handler Better Auth
│   ├── globals.css                  # Tailwind imports
│   ├── layout.tsx                   # Layout raiz
│   └── page.tsx                     # Página Home (client component)
├── lib/
│   ├── auth.ts                      # Configuração Better Auth (server)
│   └── auth-client.ts               # Cliente Better Auth (React)
├── .env.example                     # Template de variáveis de ambiente
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🔑 Fluxo de Autenticação

1. Usuário acessa `/` → vê "Você não está logado" + botão "Entrar com GitHub"
2. Clica no botão → redirecionado para GitHub OAuth
3. Autoriza a aplicação → redirecionado de volta para `/`
4. Home mostra "Logado como <nome/email>" + botão "Sair"
5. Clica em "Sair" → sessão encerrada → volta ao estado inicial

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run auth:generate` | Gera schema do banco (Better Auth CLI) |
| `npm run auth:migrate` | Aplica migrações no banco SQLite |

## 🛠️ Detalhes Técnicos

### Better Auth Server (`lib/auth.ts`)
```typescript
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./better-auth.sqlite"),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

### Route Handler (`app/api/auth/[...all]/route.ts`)
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Cliente React (`lib/auth-client.ts`)
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});

export const { signIn, signOut, useSession } = authClient;
```

## 📄 Licença

MIT