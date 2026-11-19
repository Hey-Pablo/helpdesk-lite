# Help Desk Lite

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

## Autor

Pablo Dilio · [Portfólio](https://hey-pablo.github.io/pablo-dilio-portfolio/) · [LinkedIn](https://www.linkedin.com/in/pablo-dilio-4063991b2)
