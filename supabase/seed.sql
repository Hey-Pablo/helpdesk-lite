-- Dados fictícios para banco local descartável. Usuários sem senha não permitem login.
insert into auth.users (id, email) values
 ('10000000-0000-0000-0000-000000000001', 'solicitante@example.test'),
 ('10000000-0000-0000-0000-000000000002', 'atendente@example.test'),
 ('10000000-0000-0000-0000-000000000003', 'admin@example.test');
insert into public.filiais (id, nome) values (1, 'Matriz fictícia'), (2, 'Filial fictícia');
insert into public.categorias (id, nome) values (1, 'Acesso'), (2, 'Equipamento'), (3, 'ERP');
insert into public.sla_regras (prioridade, horas) values ('baixa', 72), ('media', 24), ('alta', 8), ('critica', 2);
insert into public.perfis (id, nome, papel, filial_id) values
 ('10000000-0000-0000-0000-000000000001', 'Solicitante fictício', 'solicitante', 1),
 ('10000000-0000-0000-0000-000000000002', 'Atendente fictício', 'atendente', 1),
 ('10000000-0000-0000-0000-000000000003', 'Administrador fictício', 'admin', 2);
insert into public.chamados (titulo, descricao, categoria_id, prioridade, solicitante_id) values
 ('Acesso ao ERP', 'Usuário fictício precisa de acesso ao ambiente de testes.', 3, 'alta', '10000000-0000-0000-0000-000000000001');
-- Ajusta sequências após os IDs explícitos de referência.
select setval(pg_get_serial_sequence('public.filiais', 'id'), (select max(id) from public.filiais));
select setval(pg_get_serial_sequence('public.categorias', 'id'), (select max(id) from public.categorias));
