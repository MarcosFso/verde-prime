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

## Backups (criptografados)

O plano gratuito do Supabase não faz backup. Por isso há dois workflows, ambos guardando cada cópia por **30 dias** na aba *Actions → Artifacts*:

| Workflow | O que copia | Quando (Brasília) |
| --- | --- | --- |
| [`backup-diario.yml`](../.github/workflows/backup-diario.yml) | o **banco**: usuários, fichas e financeiro | todo dia, 03:00 |
| [`backup-anexos.yml`](../.github/workflows/backup-anexos.yml) | os **arquivos enviados** (fotos e documentos) | dias 1, 11 e 21 de cada mês, 03:00 (cerca de 10 em 10 dias) |

Os arquivos mudam pouco e ocupam bem mais espaço que o banco, por isso a cópia deles é espaçada.

- **O que entra:** as tabelas do sistema (`public`, com estrutura e dados) e as contas dos usuários (`auth.users` e `auth.identities`), para que uma restauração não obrigue todos a se cadastrarem de novo.
- **Por que criptografado:** este repositório é público, e arquivos da aba *Actions* de repositório público podem ser baixados por qualquer pessoa com conta no GitHub. O arquivo é cifrado com AES-256 antes de ser guardado; sem a senha ele é ilegível. O arquivo sem senha nunca é salvo e o conteúdo nunca aparece no log.
- **O que ele confere sozinho:** que a cópia não saiu vazia, que tem a tabela `fichas` e as contas, e que o arquivo cifrado abre de volta com a senha. Se algo falhar, o workflow fica vermelho e o GitHub avisa por e-mail.
- **Os arquivos enviados** ficam no Storage (não no banco) e por isso têm o seu próprio workflow. O banco guarda o caminho de cada arquivo, então os dois backups se completam: ao restaurar, cada arquivo volta ao caminho que a ficha espera.

### Segredos necessários

Em *Settings → Secrets and variables → Actions → New repository secret*:

| Segredo | O que é |
| --- | --- |
| `DATABASE_URL_BACKUP` | conexão **Session pooler** do Supabase (porta 5432), com a senha do banco |
| `BACKUP_SENHA` | senha que criptografa os backups (a mesma nos dois), com **no mínimo 16 caracteres** |
| `SUPABASE_S3_KEY_ID` | chave de acesso S3 do Storage (*Storage → S3 → New access key*) |
| `SUPABASE_S3_SECRET` | segredo dessa chave S3 |

A chave S3 só dá acesso ao Storage, e não ao banco. Não use a chave `service_role` para isso.

**Guarde a `BACKUP_SENHA` em dois lugares** (por exemplo, no gerenciador de senhas e anotada num local seguro). Se ela for perdida, os backups não abrem.

### Como abrir um backup

1. Na aba *Actions*, abra a execução do dia, baixe o arquivo em *Artifacts* e extraia o `.zip`.
2. Descriptografe (vai pedir a senha):
   ```bash
   # banco
   gpg --decrypt backup-AAAA-MM-DD.sql.gz.gpg | gunzip > backup.sql
   # arquivos enviados
   gpg --decrypt anexos-AAAA-MM-DD.tar.gz.gpg | tar -xz
   ```
3. O `backup.sql` é um script SQL comum, e o segundo comando cria a pasta `anexos/` com a mesma estrutura do Storage.

### Como restaurar

Restaure num projeto **novo e vazio** (nunca por cima da produção sem antes conferir o conteúdo): crie o projeto, aplique `migrations/0001_estado_atual.sql` e `0002`, e depois carregue o `backup.sql` com `psql`. Para os arquivos, envie o conteúdo da pasta `anexos/` de volta ao bucket `anexos`, mantendo os caminhos. Teste a restauração de tempos em tempos: um backup que nunca foi restaurado é só uma esperança.

## Pontos que dependem do painel (não dá para fazer por SQL)

- **Proteção contra senhas vazadas** (Authentication → Policies): hoje desligada. No plano gratuito costuma não estar disponível.
- **Cadastro aberto:** qualquer pessoa pode criar conta. Se a equipe é fechada, desative em Authentication → Sign In / Providers → "Allow new users to sign up" (e crie as contas pelo painel).
- **Primeiro usuário vira admin:** a função `handle_new_user` torna administrador quem se cadastra com a tabela `profiles` vazia. Em produção isso não é um risco, só em um projeto novo e vazio.
