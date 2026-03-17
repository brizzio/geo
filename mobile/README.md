# Mobile PWA (offline-first)

Aplicacao mobile em `mobile/` para pesquisadores, com:

- cadastro/login Firebase Auth
- acesso permitido apenas para usuarios com `users.type = "researcher"`
- perfil do pesquisador (nome, RG, CPF, endereco residencial e de trabalho)
- listagem de pesquisas em aberto
- inscricao em pesquisa (maximo 20 inscritos por evento)
- cache local offline com PouchDB
- sincronizacao com Firebase quando online

## Importante sobre PouchDB + Firebase

PouchDB nao possui replicacao nativa com Firestore.
Nesta implementacao, o app usa:

- cache local em PouchDB
- fila de mutacoes pendentes (outbox)
- sincronizador custom para push/pull com Firestore

## Estrutura Firestore esperada

- `researchers/{uid}`
- `users/{uid}` com `type: "researcher"` para acesso ao app mobile
- `research_events/{eventId}` com campos:
  - `name`
  - `date`
  - `cluster_name`
  - `competitor_name`
  - `competition_level`
  - `status` = `OPEN` para aparecer no mobile
  - `subscriptions_count`
  - `max_subscriptions` (default recomendado: 20)
- `research_events/{eventId}/subscribers/{uid}`
- `research_subscriptions/{eventId_uid}`

A regra de limite (20 inscritos) e aplicada em `runTransaction`.

## Setup

1. Entre na pasta mobile:

```bash
cd mobile
```

2. Instale dependencias:

```bash
npm install
```

3. Crie `mobile/.env` com base no `.env.example`.

4. Rode em desenvolvimento:

```bash
npm run dev
```

5. Build:

```bash
npm run build
```

## Fluxo offline-first

- Perfil salvo sempre no PouchDB.
- Inscricao salva localmente e registrada na fila de mutacoes.
- Quando online, o sincronizador:
  1. publica perfil local no Firestore
  2. baixa pesquisas em aberto
  3. processa fila de inscricoes pendentes

## Arquivos principais

- `src/App.jsx`: fluxo principal (auth, abas, sync)
- `src/lib/local-db.js`: cache local + outbox
- `src/lib/research-sync.js`: sincronizacao com Firestore
- `src/pages/profile-page.jsx`: pagina de perfil
- `src/pages/open-researches-page.jsx`: pagina de pesquisas em aberto
