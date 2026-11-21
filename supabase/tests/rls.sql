-- Executar após migrações em banco descartável. A transação é revertida.
begin;
insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-000000000001', 'a@example.test'),
 ('00000000-0000-0000-0000-000000000002', 'b@example.test'),
 ('00000000-0000-0000-0000-000000000003', 'staff@example.test'),
 ('00000000-0000-0000-0000-000000000004', 'admin@example.test');
insert into public.filiais (id, nome) values (900001, 'Teste exclusivo do teste');
insert into public.categorias (id, nome) values (900001, 'Teste exclusivo do teste');
insert into public.sla_regras (prioridade, horas) values ('critica', 4) on conflict (prioridade) do update set horas = 4;
insert into public.perfis (id, nome, papel, filial_id) values
 ('00000000-0000-0000-0000-000000000001', 'A', 'solicitante', 900001),
 ('00000000-0000-0000-0000-000000000002', 'B', 'solicitante', 900001),
 ('00000000-0000-0000-0000-000000000003', 'Staff', 'atendente', 900001),
 ('00000000-0000-0000-0000-000000000004', 'Admin', 'admin', 900001);
insert into public.chamados (id, titulo, descricao, categoria_id, prioridade, solicitante_id, criado_em) values
 (900001, 'A', 'A', 900001, 'critica', '00000000-0000-0000-0000-000000000001', '2025-01-01 00:00:00+00'),
 (900002, 'B', 'B', 900001, 'critica', '00000000-0000-0000-0000-000000000002', '2025-01-01 00:00:00+00');
insert into public.comentarios (chamado_id, autor_id, texto, interno) values
 (900001, '00000000-0000-0000-0000-000000000003', 'interno', true),
 (900001, '00000000-0000-0000-0000-000000000003', 'publico', false);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
do $$ begin
 if (select count(*) from public.chamados) <> 1 then raise exception 'solicitante vê chamado alheio'; end if;
 if (select prazo_em from public.chamados where id = 900001) <> '2025-01-01 04:00:00+00'::timestamptz then raise exception 'SLA incorreto'; end if;
 if (select count(*) from public.comentarios) <> 1 then raise exception 'comentário interno exposto'; end if;
 if (select count(*) from public.painel_por_categoria) <> 1 then raise exception 'visão não respeita RLS'; end if;
 begin
  insert into public.chamados (titulo, descricao, categoria_id, prioridade, solicitante_id) values ('fraude', 'x', 900001, 'critica', '00000000-0000-0000-0000-000000000002');
  raise exception 'criação em nome de outro foi permitida';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.comentarios (chamado_id, autor_id, texto, interno) values (900001, '00000000-0000-0000-0000-000000000001', 'x', true);
  raise exception 'comentário interno permitido ao solicitante';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
do $$ begin if (select count(*) from public.chamados) <> 1 or exists (select 1 from public.chamados where id = 900001) then raise exception 'isolamento do segundo solicitante falhou'; end if; end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
do $$ begin
 if (select count(*) from public.chamados where id in (900001, 900002)) <> 2 then raise exception 'atendente não vê fila'; end if;
 if (select count(*) from public.comentarios) <> 2 then raise exception 'atendente não vê comentários'; end if;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);
do $$ begin
 if (select count(*) from public.chamados where id in (900001, 900002)) <> 2 then raise exception 'admin não vê fila'; end if;
end $$;
rollback;
