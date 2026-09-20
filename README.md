# Verde Prime — Fichas Técnicas

Front-end em **React** (Vite), back-end em **Supabase** (banco de dados PostgreSQL + login + armazenamento de arquivos).

## Estrutura do projeto

```
verde-prime-app/
  src/
    api.js                    -> todas as chamadas ao Supabase (login, fichas, anexos, despesas)
    supabaseClient.js         -> conexão com o Supabase (lê as chaves do .env)
    config/sections.js        -> configuração dos campos e seções da ficha + tema de cores
    utils/                    -> máscaras de campo, validação de CPF/CNPJ, compressão de imagem, financeiro, gerador de recibo em PDF
    components/               -> telas (Login, Lista, Formulário, Financeiro, Usuários, Impressão de recibo)
    assets/                   -> logo e imagens usadas no recibo em PDF
    App.jsx                   -> tela principal, controla navegação e estado
```

## Passo 1 — Configurar o Supabase

O projeto já está ligado a um banco no Supabase (as chaves ficam no arquivo `.env`, que **não é enviado ao GitHub**).

Se quiser criar um projeto Supabase novo do zero:

1. Acesse **https://supabase.com**, crie uma conta gratuita e um novo projeto.
2. Crie as tabelas `profiles`, `fichas` e `despesas`, e um bucket de Storage privado chamado `anexos`.
3. Em **Authentication → URL Configuration**, adicione `http://localhost:5173` (e depois a URL do site publicado) em **Redirect URLs**.
4. Copie a **Project URL** e a **anon public key** em **Project Settings → API**.

> **Sobre a chave "anon key":** ela é feita para ser pública (o navegador precisa dela para falar com o Supabase). Quem realmente protege os dados são as políticas de **Row Level Security (RLS)** nas tabelas. Confirme no painel do Supabase, em **Authentication → Policies**, que RLS está ativado e que cada usuário só acessa suas próprias fichas.

## Passo 2 — Configurar o projeto localmente

1. Instale o [Node.js](https://nodejs.org) (versão 18 ou mais recente).
2. Copie `.env.example` para `.env` e preencha com as suas chaves do Supabase:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
3. Instale as dependências e rode localmente:
   ```bash
   npm install
   npm run dev
   ```
   Isso abre o site em `http://localhost:5173`.

## Passo 3 — Subir para o GitHub

Este projeto já está pronto para ir para um repositório Git:

```bash
git init
git add .
git commit -m "Versão inicial modular do Verde Prime"
```

O `.gitignore` já exclui `node_modules`, `dist` e o arquivo `.env` (para as chaves não irem para o repositório).

## Passo 4 — Colocar no ar (hospedagem)

Depois de `npm run build`, a pasta `dist/` contém o site pronto para qualquer hospedagem estática:

- **Vercel** ou **Netlify** — conecte o repositório do GitHub, configure as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) no painel deles, e cada push publica automaticamente.
- **Hospedagem tradicional (cPanel, Hostinger, etc.)** — rode `npm run build` e suba o conteúdo da pasta `dist/` via FTP.

## Primeiro acesso

O **primeiro usuário que criar uma conta** no site vira automaticamente **administrador** (pode ver os cadastros de todos os outros usuários).

## Funcionalidades

- Login e criação de conta com e-mail real, multi-usuário
- Recuperação de senha por e-mail
- Termos de uso / aviso de privacidade (LGPD) no primeiro acesso
- Ficha completa com 12 seções + dados do cadista
- Anexo de fotos e documentos (Supabase Storage, por usuário)
- Geração de recibo em PDF com dados da empresa
- Filtros por situação, prazo vencido e busca por nome/CPF/CAR/protocolo
- Rascunho automático (salvo no navegador)
- Duplicar, arquivar/desarquivar, excluir fichas
- Histórico de alterações por ficha
- Painel financeiro: saldo, recebido, a receber, despesas extras, gráfico dos últimos 6 meses, cadista
- Painel de administração de usuários (promover a admin, ativar/desativar conta)
- Dashboard com resumo de situação das fichas
- Indicador de status online/offline
- Validação de CPF/CNPJ e máscaras de telefone
