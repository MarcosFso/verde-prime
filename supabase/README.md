# Banco de dados (Supabase)

Esta pasta guarda o que antes só existia dentro do painel do Supabase: a estrutura do banco e as regras de acesso, versionadas no git.

```
supabase/
  migrations/
    0001_estado_atual.sql                    -> retrato do banco como está em produção (só documentação)
    0002_corrige_escalada_de_privilegio.sql  -> correção de segurança em public.profiles
  testes/
    permissoes.sql                           -> teste de permissões que NÃO grava nada
```

## Regra de ouro

- **`0001` nunca deve ser executado em produção.** Tudo o que ele descreve já existe. Ele serve para auditar, para acompanhar mudanças no git e para recriar o banco num projeto novo.
- Mudanças futuras entram como novos arquivos numerados (`0003_...`), nunca editando os antigos.
- Nenhum arquivo aqui contém dados de clientes, só estrutura.

## Como as regras de acesso funcionam

| Tabela | Usuário comum | Administrador |
| --- | --- | --- |
| `fichas` | lê, cria, edita e apaga só as próprias | tudo, de todos |
| `despesas` | lê, cria e apaga só as próprias | tudo, de todos |
| `profiles` | lê o próprio; só aceita os termos | lê todos; promove e desativa **outros** |
| bucket `anexos` (privado) | só a própria pasta (`<id>/...`) | todas as pastas |
| visitante sem login | nada | — |

## Teste de permissões

Cole `testes/permissoes.sql` no **SQL Editor** e execute. Ele simula usuários comuns, um administrador e um visitante tentando o que não podem, e confere se o uso normal continua funcionando.

Tudo é desfeito no fim, e o script termina em erro **de propósito**: o texto do erro é o relatório. Cada linha começa com:

- `BLOQUEADO-ok`: o ataque falhou (bom)
- `FUNCIONA-ok`: o uso normal funciona (bom)
- `FALHA`: algo está errado e precisa de correção

Rode depois de qualquer mudança nas regras de acesso.

## Aplicando a correção 0002

A `0002` não apaga nem altera dados. Ela foi validada em transação desfeita, no banco real: os 5 ataques testados passaram a falhar e os 7 usos normais do app continuaram funcionando. Para aplicar, cole o conteúdo no SQL Editor e execute, depois rode `testes/permissoes.sql` e confira que todas as linhas estão em `ok`.

## Pontos que dependem do painel (não dá para fazer por SQL)

- **Proteção contra senhas vazadas** (Authentication → Policies): hoje desligada. No plano gratuito costuma não estar disponível.
- **Cadastro aberto:** qualquer pessoa pode criar conta. Se a equipe é fechada, desative em Authentication → Sign In / Providers → "Allow new users to sign up" (e crie as contas pelo painel).
- **Primeiro usuário vira admin:** a função `handle_new_user` torna administrador quem se cadastra com a tabela `profiles` vazia. Em produção isso não é um risco, só em um projeto novo e vazio.
