# Publicar o Resgata online

Objetivo: um link publico (ex: `resgata.vercel.app`) que a banca acessa do
proprio celular, sem instalar nada.

Custo: **zero** (planos gratuitos da Vercel e do Neon).

---

## Por que precisa trocar o banco

Hoje o projeto usa **SQLite**, que e um arquivo (`prisma/dev.db`) dentro da
pasta. Isso e otimo para desenvolver, mas nao funciona em hospedagem como a
Vercel: la o servidor e recriado a cada acesso e o sistema de arquivos e
descartavel — os dados sumiriam.

A troca e para **PostgreSQL**, que roda como servico separado. O codigo da
aplicacao **nao muda**: quem conversa com o banco e o Prisma, e so o
`provider` do schema e a variavel `DATABASE_URL` precisam mudar.

---

## Passo 1 — Criar o banco (Neon)

1. Entre em <https://neon.tech> e crie a conta (pode usar login do GitHub).
2. Crie um projeto — nome sugerido: `resgata`. Regiao: escolha a mais
   proxima (ex: `AWS us-east-1`).
3. Na tela do projeto, copie a **connection string**. Ela tem este formato:

   ```
   postgresql://USUARIO:SENHA@ep-algo-123.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

4. Guarde essa string — ela e usada nos passos 2 e 4.

## Passo 2 — Apontar o projeto para o Postgres

Com a connection string em maos, me avise que eu faco esta parte, ou siga:

1. Em `prisma/schema.prisma`, troque o provider:

   ```prisma
   datasource db {
     provider = "postgresql"   // era "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Em `.env`, troque a `DATABASE_URL` pela string do Neon.

3. Apague a pasta `prisma/migrations` (as migracoes atuais foram geradas com
   SQL do SQLite e nao servem no Postgres) e gere de novo:

   ```bash
   rm -rf prisma/migrations
   npx prisma migrate dev --name init
   ```

4. Popule com os dados de demonstracao:

   ```bash
   npm run db:seed
   ```

5. Teste local apontando para o banco novo:

   ```bash
   npm run dev
   ```

   A partir daqui o desenvolvimento local usa o mesmo banco da nuvem — nao ha
   mais dois bancos diferentes para manter em sincronia.

## Passo 3 — Subir o codigo para o GitHub

A Vercel publica a partir de um repositorio. Se o projeto ainda nao esta no
GitHub:

```bash
git init
git add .
git commit -m "Resgata - sistema de achados e perdidos"
```

Depois crie um repositorio em <https://github.com/new> e siga as instrucoes
de "push an existing repository".

> O arquivo `.gitignore` ja impede que `.env` e `prisma/dev.db` subam —
> confira com `git status` antes do commit que **nenhum dos dois** aparece na
> lista. A `DATABASE_URL` e o `JWT_SECRET` nunca devem ir para o GitHub.

## Passo 4 — Publicar na Vercel

1. Entre em <https://vercel.com> e crie a conta com o **mesmo GitHub**.
2. **Add New... > Project** e escolha o repositorio do Resgata.
3. Antes de clicar em Deploy, abra **Environment Variables** e cadastre:

   | Nome | Valor |
   |---|---|
   | `DATABASE_URL` | a connection string do Neon (passo 1) |
   | `JWT_SECRET` | uma frase longa e aleatoria, diferente da local |
   | `MATCH_MIN_SCORE` | `50` |
   | `MAX_VERIFICATION_ATTEMPTS` | `3` |

   Para gerar um `JWT_SECRET` forte:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Clique em **Deploy** e aguarde (~2 minutos).
5. A Vercel entrega a URL, algo como `https://resgata.vercel.app`.

Em **Settings > Domains** da para trocar o subdominio para algo mais bonito,
se `resgata` estiver livre.

---

## Depois de publicado

- **Atualizar o site:** basta dar `git push`. A Vercel publica sozinha.
- **Restaurar os dados de demonstracao** (util antes da apresentacao, para
  limpar contas de teste):

  ```bash
  npm run db:seed
  ```

  O seed apaga tudo e recria o cenario — 8 itens no feed publico, um match
  pronto para verificar e um caso resolvido no historico.

## Voltando ao projeto depois de semanas parado

A Vercel nao derruba o site por inatividade. O ponto de atencao e o **Neon**:
no plano gratuito, o banco entra em suspensao quando fica ocioso (isso apenas
deixa o primeiro acesso mais lento, nao apaga dados), e projetos parados por
muito tempo podem ser removidos.

Para reduzir o risco, abra `https://resgata.vercel.app` a cada duas ou tres
semanas — dez segundos bastam. Enquanto voce estiver desenvolvendo, cada
`git push` ja cumpre esse papel.

**Diagnostico rapido**, na ordem:

1. Abra `https://resgata.vercel.app/login`.
   - Nao carrega -> problema na Vercel: veja o ultimo deploy no painel.
   - Carrega -> siga para o passo 2.
2. Abra `https://resgata.vercel.app/api/found-items`.
   - Responde com a lista de itens -> **esta tudo certo**.
   - Da erro -> problema no banco: siga para o passo 3.
3. Entre em <https://neon.tech> e veja se o projeto ainda existe.
   - Existe -> confira se a connection string mudou e atualize
     `DATABASE_URL` / `DIRECT_URL` no `.env` e na Vercel.
   - Nao existe -> refaca os passos 1, 2 e 4 deste guia. Leva ~15 minutos e
     nada se perde: o codigo esta no GitHub e o `npm run db:seed` recria os
     dados de demonstracao.

## Checklist antes da apresentacao

Faca isso **uma semana antes**, nao na vespera — se algo tiver quebrado, ha
tempo de resolver com calma.

- [ ] Abrir a URL publica no proprio celular e fazer o fluxo completo
- [ ] Rodar `npm run db:seed` para deixar os dados limpos
- [ ] Confirmar que `alice@campus.edu` / `123456` entra e tem match pendente
- [ ] Testar criar uma conta nova (o caminho que a banca vai fazer)
- [ ] Testar o tema claro e escuro
- [ ] Rodar `npm test` (os 10 testes devem passar)
- [ ] Levar a URL escrita/QR code no slide
- [ ] Abrir o site alguns minutos antes de comecar, para o banco "acordar"
