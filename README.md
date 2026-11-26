# Help Desk Lite

> **Demonstração:** em breve

## Status: concluído (CI verde, RLS testado)

![CI](https://github.com/Hey-Pablo/helpdesk-lite/actions/workflows/ci.yml/badge.svg)

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

## Funcionalidades implementadas

### Para o solicitante
- **Login** com autenticação Supabase
- **Meus chamados**: lista os chamados abertos
- **Novo chamado**: abre chamado com categoria e prioridade
- **Detalhes do chamado**: visualiza histórico, comentários e prazo

### Para o atendente
- **Fila de atendimento**: lista com ordenação por SLA (verde/amarelo/vermelho)
- **Assumir chamado**: muda status de aberto para em atendimento
- **Mudança de status**: fluxo completo (em atendimento → aguardando usuário → em atendimento → resolvido → fechado → reaberto)
- **Ver detalhes**: visualiza comentários e histórico

### Para o administrador
- **Administração**: gerencia categorias e regras de SLA
- **Painel de indicadores**: métricas de abertos, tempo médio, percentual no prazo, por categoria e atendente

### Comentários e histórico
- Comentários públicos visíveis para todos
- Comentários internos visíveis apenas para equipe
- Histórico de mudanças de status com timestamps

## Como executar

Requer Node.js 20.19+ ou 22.12+ e um projeto Supabase local configurado conforme a seção seguinte. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave pública do projeto. Nunca use a chave de serviço no navegador. Execute `npm ci` e `npm run dev`; abra o endereço exibido pelo Vite.

```bash
npm ci
npm run dev
```

Para testes e build:
```bash
npm test   # Testes com Vitest
npm run build  # Verifica compilação
```

## Integração contínua (CI)

O projeto possui pipeline de CI no GitHub Actions (`.github/workflows/ci.yml`) que executa em todo push e pull request para a branch `main`:

1. **TypeScript check** (`npx tsc --noEmit`) — verifica tipos sem emitir arquivos
2. **Testes** (`npm test`) — executa suíte Vitest (3 arquivos, 5 testes)
3. **Build** (`npm run build`) — compila para produção com Vite

O badge do CI está no topo do README e reflete o status da última execução.

## Contas de demonstração

| Papel | E-mail |Senha| Observação |
|-------|--------|-----|------------|
| Solicitante | solicitante@example.test | senha123 | Abre e acompanha chamados |
| Atendente | atendente@example.test | senha123 | Gerencia fila e atende |
| Administrador | admin@example.test | senha123 | Gerencia categorias e SLA |

> **Nota:** As senhas acima funcionam apenas em ambiente local. Para testes reais, crie usuários no Supabase Auth eassocie-os aos perfis no seed.sql.

## Banco local e testes

A migração em `supabase/migrations` requer PostgreSQL 15 ou superior e o esquema Auth do Supabase. Ela cria tabelas, políticas RLS, gatilho de cálculo de SLA e visões do painel.

Para um ambiente descartável, instale Supabase CLI e Docker:
```bash
supabase init
supabase start
supabase db reset
```

O reset apaga os dados locais, aplica migrações e seed. Nunca aplique o seed fictício em produção.

As políticas RLS já são testadas no `npm test` (ver "Testes automatizados"). Para conferir no seu próprio banco, rode `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql` se esse arquivo existir na sua cópia.

## Testes automatizados

Os testes cobrem regras de transição de status, políticas de acesso e preparação de atualização da fila:

```bash
npm test
```

```
 Test Files  5 passed (5)
      Tests  19 passed (19)
```

### Testes de Row Level Security (RLS)

`tests/rls-pglite.test.ts` sobe um PostgreSQL em memória (PGlite), cria um shim mínimo do Supabase (schema `auth`, `auth.uid()` lendo `request.jwt.claims`, papéis `authenticated` e `anon`), aplica a migração e testa as políticas por papel: o solicitante vê só os próprios chamados e não vê comentários internos, o atendente vê tudo e atualiza status, só o administrador mexe em cadastros e perfis, e visitante sem sessão não lê nada. Não precisa de conta no Supabase.

## Configurar o banco

O projeto é **offline por padrão** - não requer banco hospedado para funcionar.

### Opção 1: Usar no ambiente sem banco (recomendado para demonstração)

1. Copie `.env.example` para `.env`
2. Deixe as variáveis vazias ou preencha com valores fictícios
3. Execute `npm run dev`
4. O app mostrará: **"Banco não conectado — configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env para usar o Supabase"**

### Opção 2: Supabase local (para testes avançados)

1. Instale Supabase CLI e Docker
2. Execute `supabase start`
3. Aplique migrações: `supabase db push`
4. Carregue o seed: `supabase db reset`
5. Crie usuários no Supabase Auth e associe aos perfis no seed
6. Preencha `.env` com URL e chave do projeto local

### Contas de demonstração

| Papel | E-mail |Senha| Observação |
|-------|--------|-----|------------|
| Solicitante | solicitante@example.test | senha123 | Abre e acompanha chamados |
| Atendente | atendente@example.test | senha123 | Gerencia fila e atende |
| Administrador | admin@example.test | senha123 | Gerencia categorias e SLA |

> **Nota:** As senhas acima funcionam apenas em ambiente local. Para testes reais, crie usuários no Supabase Auth e associe-os aos perfis no seed.sql.

## Decisões técnicas

1. **SLA via trigger**: O cálculo do prazo (`prazo_em`) acontece no banco via trigger `calcular_prazo()`, garantindo consistência e evitando lógica duplicada no frontend.

2. **Políticas RLS**: A segurança é implementada no nível das linhas (Row Level Security), não apenas no frontend. Um solicitante nunca consegue ver ou modificar chamados de outro, mesmo chamando a API diretamente.

3. **Tipos TypeScript**: Todos os componentes e APIs usam tipos explícitos (`Chamado`, `Categoria`, `Comentario`, `Perfil`), facilitando manutenção e detectando erros em tempo de compilação.

4. **React Query**: O cache de queries e invalidação automática mantém a UI sempre sincronizada com o banco.

5. **Histórico automático**: Cada mudança de status é registrada automaticamente na tabela `historico`, permitindo auditoria completa.

## Limitações

- Comentários internos não podem ser editados ainda
- Filtros avançados na fila não foram implementados (busca por categoria, palavras-chave)
- Notificações em tempo real não estão ativas (precisa de Supabase Realtime)
- O painel de indicadores é uma visão SQL estática, não dinâmica em tempo real

## Próximos passos

1. Implementar filtros avançados na fila
2. Adicionar notificações por e-mail ou Telegram
3. Implementar busca full-text de chamados
4. Adicionar exportação de relatórios

## Autor

Pablo Dilio · [Portfólio](https://hey-pablo.github.io/pablo-dilio-portfolio/) · [LinkedIn](https://www.linkedin.com/in/pablo-dilio-4063991b2)