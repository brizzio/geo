# NKET Next

Aplicacao Next.js multi-tenant com Firebase, dashboard web administrativo e fluxo mobile PWA para pesquisadores.

## Rotas principais

- Pagina publica e autenticacao web: `/`
- Dashboard principal: `/dashboard`
- Banco de dados: `/database`
- Mapa legado: `/map`

### Modulos web

- Contas: `/accounts`
- Redes: `/networks`
- Bandeiras: `/banners`
- Lojas proprias: `/stores`
- Lojas concorrentes: `/competitors`
- Clusters: `/clusters`
- Pesquisas: `/researches`
- Produtos: `/products`
- Usuarios/Times: `/users`

### Rotas mobile do pesquisador

- Login/cadastro mobile PWA: `/mobile`
- Dashboard mobile: `/dash-mobile`
- Perfil mobile: `/profile-mobile`
- Execucao de tarefa: `/task-mobile/[eventId]`

## Scripts

Rodando localmente:

```bash
npm install
npm run dev
```

Dev com HTTPS local:

```bash
npm run dev:https
```

Tunnel rapido para testes externos:

```bash
npm run tunnel:local
```

Build de producao:

```bash
npm run build
npm start
```

## Stack

- Next.js 14
- React 18
- Firebase Auth + Firestore
- Tailwind CSS
- imgbb para upload de imagens

## Estrutura

- `app/`: rotas App Router
- `components/`: paginas e shells de alto nivel
- `features/domain/`: dominio administrativo web
- `features/dashboard/`: componentes do dashboard principal
- `features/researchers/`: hooks/componentes ligados a pesquisadores
- `features/mobile/`: hooks, estado e componentes do fluxo mobile
- `lib/`: integracoes base, incluindo Firebase client
- `public/`: service worker e icones/manifest do app web
- `mobile/`: app mobile separado legado/PWA alternativo

## Fluxo web administrativo

O dashboard principal (`/dashboard`) concentra:

- cards de totais por modulo
- quadro de pesquisadores com:
  - total de `researcher` com `status = registered`
  - quantidade ativa com sessao aberta
- secao de servicos de pesquisa com:
  - busca
  - filtros por status e periodo
  - ordenacao
  - mini-tabela por servico com tarefas abertas para pesquisadores
  - colunas `data`, `concorrente`, `nivel` e `inscritos`

Nas pesquisas:

- a tela `/researches/[id]/tasks` gera agenda do mes
- o botao `Publicar agenda mobile` publica os eventos do mes na colecao Firestore `research_events`

## Fluxo mobile PWA

O fluxo mobile ativo no Next.js foi feito para pesquisadores.

### Regras de acesso

- `/mobile`, `/dash-mobile`, `/profile-mobile` e `/task-mobile/[eventId]` usam modo PWA/standalone
- em desenvolvimento, no desktop, existe bypass para testar no navegador
- o app registra `public/sw.js` apenas para rotas mobile

### Perfil mobile

No perfil mobile o pesquisador pode atualizar:

- nome
- RG
- CPF
- endereco residencial e geocodificacao
- endereco de trabalho e geocodificacao
- localizacao atual do dispositivo em chaves separadas:
  - `present_lat`
  - `present_lon`
  - `present_display_name`
- tenants de interesse

### Dashboard mobile

O dashboard mobile lista pesquisas abertas publicadas em `research_events`, com:

- data
- tenant
- cluster
- concorrente
- nivel de concorrencia
- distancia a partir de residencia ou trabalho
- quantidade de inscritos
- inscricao do pesquisador

Quando o pesquisador se inscreve:

- a inscricao e gravada em `research_subscriptions`
- o aceite recebe:
  - `accepted_at`
  - `deadline_at`
- o prazo padrao atual e de 2 horas

Depois do aceite, o card mostra:

- prazo da tarefa
- botao `Executar tarefa`

## Execucao da tarefa mobile

A rota `/task-mobile/[eventId]` implementa o fluxo base de execucao.

### Etapa 1. Chegada ao local

- exibe dados do local e endereco
- permite tirar/enviar foto da fachada
- libera o botao `Iniciar coleta`

### Etapa 2. Coleta de dados

Para cada produto da lista existe um card com:

- primeiro preco
- segundo preco
- quantidade para segundo preco
- preco fidelidade
- promocao (`sim/nao`)
- departamento opcional
- botao `OK`

Se o item ja foi confirmado, o card mostra `Item confirmado`.
Se qualquer campo mudar depois, o item volta para pendente e precisa novo `OK`.

### Etapa 3. Revisao

- mostra tabela final com os dados coletados
- botao `Finalizar tarefa de pesquisa`

Ao finalizar:

- grava na colecao `research_tasks_done`
- associa:
  - `event_id`
  - `research_service_id`
  - `research_schedule_id`
  - `research_task_id`
  - `uid` do pesquisador
  - foto da fachada
  - itens coletados
- atualiza a inscricao para status `DONE`
- redireciona de volta para `/dash-mobile`

### Timer

A tela de execucao exibe um timer regressivo comum em todas as etapas, usando `accepted_at` e `deadline_at`.

## Persistencia e colecoes relevantes

### Dominio administrativo

- `accounts`
- `networks`
- `retail_banners`
- `stores`
- `clusters`
- `price_researches`
- `products`
- `research_schedules`
- `research_tasks`
- `events`

### Mobile pesquisador

- `researchers`
- `research_events`
- `research_subscriptions`
- `research_tasks_done`

## Variaveis de ambiente

Firebase client:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Upload de imagem:

```bash
IMGBB_KEY=
```

Opcional para proxy do Nominatim:

```bash
NOMINATIM_EMAIL=
```

## PWA e icones

- manifest: `app/manifest.jsx`
- service worker: `public/sw.js`
- icones: `public/icons/`

O app instalado usa principalmente os PNGs do manifest, e o navegador usa tambem o `favicon.ico`.

## Backup / restore

No dashboard (`/dashboard`) existe:

- `Exportar JSON`
- `Importar JSON`

O snapshot exportado por tenant inclui:

- conta
- redes
- bandeiras
- lojas
- clusters
- pesquisas
- produtos
- agendas de pesquisa
- tarefas de pesquisa
- eventos

## Observacoes

- O app mobile legado separado continua em `mobile/`, mas o fluxo mobile principal hoje esta no Next.js.
- Para testar instalacao PWA em celular real, prefira URL HTTPS publica.
- Em dev, `npm run dev:https` ajuda, mas certificados locais podem nao ser confiaveis no Android.
