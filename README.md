# 🌿 Verde Prime — Sistema de Fichas Técnicas

Sistema web full-stack para gestão de fichas técnicas de consultoria ambiental (Cadastro Ambiental Rural — CAR), desenvolvido para uso real por uma empresa de consultoria ambiental. Multi-usuário, com controle financeiro, geração de documentos em PDF e modo offline.

**🔗 Demo ao vivo:** [verde-prime.vercel.app](https://verde-prime.vercel.app)

## 🛠️ Tecnologias

- **Frontend:** React 18, Vite, CSS puro (sem framework de UI)
- **Backend:** Supabase (PostgreSQL, Autenticação, Storage)
- **Segurança:** Row Level Security (RLS) no banco de dados — cada usuário só acessa seus próprios dados; administradores têm acesso ampliado via políticas específicas
- **PWA:** instalável, com suporte offline via Service Worker (`vite-plugin-pwa`)
- **Geração de PDF:** `html2pdf.js`, carregado sob demanda (code splitting) para não pesar o carregamento inicial
- **Ícones:** `lucide-react`

## ✨ Funcionalidades

- **Autenticação multi-usuário** com e-mail real, recuperação de senha e termos de uso (LGPD)
- **Perfis de administrador** — visualizam e gerenciam fichas e usuários de toda a equipe
- **Ficha técnica completa** com 13 seções (cadastrante, cadista, proprietário, imóvel, CAR, levantamento ambiental, documentação, notificações, protocolo, financeiro, etc.)
- **Controle financeiro por ficha** — valor do serviço, pagamentos parcelados com data, cálculo automático de saldo a receber
- **Painel financeiro consolidado** — saldo, recebido, a receber, despesas, gráfico de recebimentos por mês
- **Anexos** — fotos (com compressão automática) e documentos, armazenados de forma privada por usuário no Supabase Storage
- **Geração de PDF** — recibo de pagamento personalizado e exportação completa da ficha
- **Modo escuro / claro**
- **Modo offline (PWA)** — o app abre mesmo sem conexão; dados sincronizam quando a internet volta
- **Rascunho automático** — o formulário salva sozinho enquanto você digita
- **Logout automático por inatividade** (30 minutos)
- **Busca, filtros e ordenação** na lista de fichas

## 🔒 Segurança

O banco de dados usa **Row Level Security (RLS)** do PostgreSQL/Supabase: as regras de acesso são aplicadas diretamente no banco, não apenas na interface. Isso significa que mesmo que alguém tente acessar a API diretamente (fora da tela), as permissões continuam sendo respeitadas — usuários comuns só veem os próprios dados, administradores têm acesso ampliado via políticas específicas para cada tabela (fichas, despesas, perfis e arquivos anexados).

## 📁 Estrutura do projeto

```
src/
  api.js                 -> chamadas ao Supabase (autenticação, fichas, anexos, despesas)
  supabaseClient.js       -> conexão com o Supabase (lê as chaves do .env)
  config/sections.js      -> configuração dos campos/seções da ficha + tema de cores
  utils/                  -> máscaras, validações, compressão de imagem, cálculos financeiros, geração de PDF
  components/             -> telas e componentes (autenticação, lista, formulário, financeiro, admin)
  App.jsx                 -> roteamento de telas e estado global
```

## 🚀 Rodando localmente

1. Instale o [Node.js](https://nodejs.org) (18+)
2. Copie `.env.example` para `.env` e preencha com as suas próprias chaves do Supabase:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
3. Instale as dependências e rode:
   ```bash
   npm install
   npm run dev
   ```
   O site abre em `http://localhost:5173`.

## 📦 Deploy

```bash
npm run build
```
Gera a pasta `dist/`, pronta para qualquer hospedagem estática (Vercel, Netlify, Cloudflare Pages). Configure as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) no painel do serviço escolhido.

---

*Projeto desenvolvido e mantido de ponta a ponta — banco de dados, autenticação, regras de segurança e interface.*
