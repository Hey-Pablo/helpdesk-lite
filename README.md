# Help Desk Lite

> **Demonstração:** em breve

> **Status: em desenvolvimento.** O código entra aos poucos; abaixo está o planejamento do projeto.

## O que é

Sistema de chamados com três papéis (solicitante, atendente e administrador), fluxo de status, comentários públicos e internos, prazo por prioridade (SLA) e painel de indicadores.

## O que prova

Aplicação completa com autenticação, regras de acesso no banco, modelagem e front-end tipado. É o projeto central para as vagas de Suporte e de Desenvolvedor.

## Stack

React, TypeScript, Vite, Tailwind CSS, React Router e TanStack Query. Supabase (Auth, PostgreSQL e RLS). Vitest e Testing Library. Vercel.

## Estrutura

```
helpdesk-lite/
├─ src/
│  ├─ pages/               # Login, MeusChamados, NovoChamado, Fila,
│  │                       # ChamadoDetalhe, Painel, Admin
│  ├─ features/chamados/   # api.ts, hooks.ts, tipos.ts, regras.ts
│  ├─ components/
│  ├─ lib/supabase.ts
│  └─ rotas.tsx            # rotas protegidas por papel
├─ supabase/
│  ├─ migrations/          # tabelas, políticas RLS, gatilhos
│  └─ seed.sql             # filiais, categorias, usuários de demonstração
├─ tests/
└─ README.md
```

## Modelo de dados

`perfis` (papel, filial), `filiais`, `categorias`, `sla_regras` (prioridade, horas), `chamados` (título, descrição, categoria, prioridade, status, solicitante, atendente, criado_em, prazo_em, resolvido_em), `comentarios` (texto, interno) e `historico` (mudanças de status).

## Plano

1. Modelo, migrações e carga de demonstração.
2. Políticas RLS: o solicitante lê e cria só os próprios chamados; atendente e administrador leem todos; comentário interno fica oculto para o solicitante.
3. Login e rotas por papel.
4. Abertura de chamado e lista "meus chamados".
5. Fila do atendente com filtros, botão assumir e mudança de status (aberto, em atendimento, aguardando usuário, resolvido, fechado, reaberto).
6. Comentários e histórico.
7. SLA: um gatilho calcula `prazo_em` na criação; a lista ordena por prazo e mostra verde, amarelo ou vermelho.
8. Painel com visões SQL: abertos, tempo médio, percentual no prazo, por categoria e por atendente.
9. Testes das regras de status e teste das políticas com dois usuários.
10. Publicação com três contas de demonstração descritas no README.

## Como deve funcionar

- O solicitante abre um chamado em menos de 1 minuto e acompanha o andamento.
- O atendente vê a fila por prazo, assume, comenta e resolve.
- Chamado fora do prazo aparece em vermelho no topo da fila.
- Um solicitante nunca enxerga chamado de outro, nem chamando a API direto.
- O administrador altera categorias e prazos sem mexer no código.

## Prazo

2 a 3 semanas.

## Executar a interface

Requer Node.js 20.19+ ou 22.12+ e um projeto Supabase local configurado conforme a seção seguinte. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave pública do projeto. Nunca use a chave de serviço no navegador. Execute `npm ci` e `npm run dev`; abra o endereço exibido pelo Vite. Execute `npm test` para os testes e `npm run build` para verificar a compilação.

Entre com um usuário Auth que tenha perfil correspondente na tabela `perfis`. O app consulta categorias e cria chamados com o usuário autenticado; o prazo é calculado pelo banco. As rotas de fila e administração estão reservadas para as próximas etapas. A proteção no cliente orienta a navegação; a autorização efetiva depende das políticas RLS no banco. As regras de transição nesta etapa são auxiliares de interface e ainda não são impostas pelo banco.

## Banco local e testes

A migração em `supabase/migrations` requer PostgreSQL 15 ou superior e o esquema Auth do Supabase. Ela cria tabelas, políticas RLS, prazo em horas corridas na criação e visões que respeitam o acesso do usuário. O prazo não muda quando a regra ou prioridade muda. O percentual no prazo considera chamados com `resolvido_em`, e o tempo médio mede da criação à resolução. O gerenciamento de status e registro automático de histórico pertencem às próximas etapas.

Para um ambiente descartável, instale Supabase CLI e Docker, execute `supabase init` se necessário, seguido de `supabase start` e `supabase db reset`. O reset apaga os dados locais e aplica migração e seed. Nunca aplique o seed fictício em produção. Copie `.env.example` para `.env` e preencha apenas os valores públicos do ambiente local; não coloque chave de serviço no cliente.

O seed contém perfis fictícios `solicitante@example.test`, `atendente@example.test` e `admin@example.test`. As linhas de Auth são referências sem senha nem identidade de login; não autenticam. Para testar login, crie usuários locais com Auth Admin API ou Studio e associe seus IDs aos perfis, sem registrar senhas no repositório. A interface permite entrar, abrir chamados e listar os próprios chamados. Fila, administração e demais funções continuam em desenvolvimento.

Em um banco Supabase descartável, execute o teste isolado com `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql`. O teste cria seus próprios dados e reverte a transação. Ele cobre dois solicitantes, atendente, isolamento de comentários, criação indevida, visão e SLA. Execute também com o ambiente Supabase real: a simulação local de Auth não substitui testes de login e API. Referências: [RLS no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) e [seed local](https://supabase.com/docs/guides/local-development/seeding-your-database).

## Autor

Pablo Dilio · [Portfólio](https://hey-pablo.github.io/pablo-dilio-portfolio/) · [LinkedIn](https://www.linkedin.com/in/pablo-dilio-4063991b2)
