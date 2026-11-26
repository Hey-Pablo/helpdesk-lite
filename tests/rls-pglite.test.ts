import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const sol = '10000000-0000-0000-0000-000000000001';
const sol2 = '10000000-0000-0000-0000-000000000002';
const aten = '10000000-0000-0000-0000-000000000003';
const adm = '10000000-0000-0000-0000-000000000004';

let db: PGlite;
const como = (uid: string) => db.exec(`reset role; select set_config('request.jwt.claims', '{"sub":"${uid}"}', false); set role authenticated;`);
const dono = () => db.exec('reset role;');

beforeAll(async () => {
  db = new PGlite();
  // Shim mínimo do Supabase: schema auth, auth.uid() e papéis.
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
  `);
  await db.exec(readFileSync('supabase/migrations/20261121000000_base.sql', 'utf8'));
  await db.exec(`
    insert into auth.users values ('${sol}'),('${sol2}'),('${aten}'),('${adm}');
    insert into public.filiais(nome) values ('Matriz');
    insert into public.categorias(nome) values ('Rede');
    insert into public.sla_regras values ('baixa',72),('media',24),('alta',8),('critica',4);
    insert into public.perfis values ('${sol}','Sol 1','solicitante',1),('${sol2}','Sol 2','solicitante',1),('${aten}','Atendente','atendente',1),('${adm}','Admin','admin',1);
    insert into public.chamados(titulo,descricao,categoria_id,prioridade,solicitante_id,prazo_em) values ('Chamado do Sol 1','desc',1,'media','${sol}',now()),('Chamado do Sol 2','desc',1,'media','${sol2}',now());
    insert into public.comentarios(chamado_id,autor_id,texto,interno) values (1,'${aten}','nota interna',true),(1,'${aten}','resposta pública',false);
  `);
}, 30000);

afterAll(async () => { await db.close(); });

describe('RLS por papel (PGlite)', () => {
  it('solicitante vê só os próprios chamados', async () => {
    await como(sol);
    const r = await db.query<{ titulo: string }>('select titulo from public.chamados');
    expect(r.rows.map((x) => x.titulo)).toEqual(['Chamado do Sol 1']);
  });

  it('solicitante não vê comentário interno', async () => {
    await como(sol);
    const r = await db.query<{ texto: string }>('select texto from public.comentarios order by id');
    expect(r.rows.map((x) => x.texto)).toEqual(['resposta pública']);
  });

  it('solicitante não cria chamado em nome de outro nem altera status', async () => {
    await como(sol);
    await expect(db.exec(`insert into public.chamados(titulo,descricao,categoria_id,prioridade,solicitante_id) values ('x','y',1,'baixa','${sol2}')`)).rejects.toThrow();
    // UPDATE bloqueado por RLS não dá erro: simplesmente não atinge nenhuma linha.
    const upd = await db.query(`update public.chamados set status='fechado' where id=1`);
    expect(upd.affectedRows).toBe(0);
  });

  it('solicitante cria o próprio chamado e o prazo é calculado', async () => {
    await como(sol);
    await db.exec(`insert into public.chamados(titulo,descricao,categoria_id,prioridade,solicitante_id) values ('Novo','y',1,'critica','${sol}')`);
    const r = await db.query<{ ok: boolean }>(`select prazo_em is not null as ok from public.chamados where titulo='Novo'`);
    expect(r.rows[0].ok).toBe(true);
  });

  it('atendente vê todos os chamados e comentários internos e atualiza status', async () => {
    await como(aten);
    expect((await db.query('select 1 from public.chamados')).rows.length).toBeGreaterThanOrEqual(2);
    expect((await db.query('select 1 from public.comentarios')).rows.length).toBe(2);
    await db.exec(`update public.chamados set status='em_atendimento', atendente_id='${aten}' where id=2`);
    await dono();
    expect((await db.query<{ status: string }>('select status from public.chamados where id=2')).rows[0].status).toBe('em_atendimento');
  });

  it('atendente não administra cadastros nem perfis', async () => {
    await como(aten);
    await expect(db.exec(`insert into public.filiais(nome) values ('Nova')`)).rejects.toThrow();
    await expect(db.exec(`update public.perfis set papel='admin' where id='${aten}'`)).resolves.toBeDefined();
    await dono();
    expect((await db.query<{ papel: string }>(`select papel from public.perfis where id='${aten}'`)).rows[0].papel).toBe('atendente');
  });

  it('admin administra filiais e perfis', async () => {
    await como(adm);
    await db.exec(`insert into public.filiais(nome) values ('Filial Nova')`);
    await db.exec(`update public.perfis set papel='atendente' where id='${sol2}'`);
    await dono();
    expect((await db.query<{ papel: string }>(`select papel from public.perfis where id='${sol2}'`)).rows[0].papel).toBe('atendente');
  });

  it('usuário sem sessão (anon) não lê chamados', async () => {
    await db.exec(`reset role; select set_config('request.jwt.claims', '', false); set role anon;`);
    await expect(db.query('select * from public.chamados')).rejects.toThrow();
  });
});
