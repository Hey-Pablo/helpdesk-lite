import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { criarChamado } from './features/chamados/api';
import { useCategorias, useMeusChamados } from './features/chamados/hooks';
import type { Perfil } from './features/chamados/tipos';
import { podeAcessar, type Nivel } from './components/acesso';
import { Fila } from './pages/Fila';
import { ChamadoDetalhe } from './pages/ChamadoDetalhe';
import { Painel } from './pages/Painel';
import { Admin } from './pages/Admin';

function Login() {
  const [erro, setErro] = useState(''); const [ocupado, setOcupado] = useState(false);
  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const dados = new FormData(e.currentTarget); setErro(''); setOcupado(true);
    const { error } = await supabase!.auth.signInWithPassword({ email: String(dados.get('email')), password: String(dados.get('senha')) });
    setOcupado(false); if (error) setErro('Não foi possível entrar. Confira o e-mail e a senha.');
  }
  return (
    <main className="card">
      <h1>Help Desk Lite</h1>
      <h2>Entrar</h2>
      <form onSubmit={entrar}>
        <label>E-mail<input name="email" type="email" required /></label>
        <label>Senha<input name="senha" type="password" required /></label>
        <button disabled={ocupado}>Entrar</button>
        {erro && <p role="alert">{erro}</p>}
      </form>
    </main>
  );
}

function Protegida({ perfil, nivel }: { perfil: Perfil; nivel: Nivel }) {
  return podeAcessar(perfil.papel, nivel) ? <Outlet /> : <Navigate to="/meus-chamados" replace />;
}

function MeusChamados({ perfil }: { perfil: Perfil }) {
  const { data, isLoading, error } = useMeusChamados(perfil.id);
  return (
    <section>
      <h1>Meus chamados</h1>
      <Link to="/novo-chamado">Abrir chamado</Link>
      {isLoading && <p>Carregando chamados...</p>}
      {error && <p role="alert">Não foi possível carregar os chamados.</p>}
      {data?.length === 0 && <p>Você ainda não abriu chamados.</p>}
      {data?.map(c => (
        <article className="card" key={c.id}>
          <h2>#{c.id} · {c.titulo}</h2>
          <p>{c.descricao}</p>
          <p>Status: {c.status.replaceAll('_', ' ')} · Prioridade: {c.prioridade}</p>
          <p>Prazo: {new Date(c.prazo_em).toLocaleString('pt-BR')}</p>
        </article>
      ))}
    </section>
  );
}

function NovoChamado({ perfil }: { perfil: Perfil }) {
  const categorias = useCategorias();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const mutation = useMutation({
    mutationFn: criarChamado,
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ['meus-chamados', perfil.id] });
      navigate('/meus-chamados');
    }
  });
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const titulo = String(dados.get('titulo')).trim();
    const descricao = String(dados.get('descricao')).trim();
    if (!titulo || !descricao) return;
    mutation.mutate({ titulo, descricao, categoria_id: Number(dados.get('categoria')), prioridade: String(dados.get('prioridade')), solicitante_id: perfil.id });
  }
  return (
    <section className="card">
      <h1>Abrir chamado</h1>
      <form onSubmit={enviar}>
        <label>Título<input name="titulo" required maxLength={200} /></label>
        <label>Descrição<textarea name="descricao" required rows={5} /></label>
        <label>Categoria<select name="categoria" required defaultValue="">
          <option value="" disabled>Selecione</option>
          {categorias.data?.map(c => <option value={c.id} key={c.id}>{c.nome}</option>)}
        </select></label>
        <label>Prioridade<select name="prioridade" defaultValue="media">
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select></label>
        {categorias.isLoading && <p>Carregando categorias...</p>}
        {categorias.error && <p role="alert">Não foi possível carregar as categorias.</p>}
        {mutation.error && <p role="alert">Não foi possível abrir o chamado. Tente novamente.</p>}
        <button disabled={mutation.isPending || !categorias.data?.length}>Enviar chamado</button>
      </form>
    </section>
  );
}

function Layout({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  return (
    <>
      <header>
        <strong>Help Desk Lite</strong>
        <nav>
          <Link to="/meus-chamados">Meus chamados</Link>
          <Link to="/novo-chamado">Novo chamado</Link>
          {perfil.papel === 'atendente' && <Link to="/fila">Fila</Link>}
          {perfil.papel !== 'admin' && <Link to="/painel">Painel</Link>}
          {perfil.papel === 'admin' && <Link to="/admin">Admin</Link>}
          <span>{perfil.nome}</span>
          <button onClick={() => void supabase!.auth.signOut()}>Sair</button>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!supabase) {
      setCarregando(false);
      setErro('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
      return;
    }
    let ativo = true;
    let versao = 0;

    async function atualizar(s: Session | null) {
      const atual = ++versao;
      setSession(s);
      setPerfil(null);
      setErro('');

      if (!s) {
        setCarregando(false);
        return;
      }

      setCarregando(true);
      const { data, error } = await supabase!.from('perfis').select('id,nome,papel').eq('id', s.user.id).maybeSingle();

      if (!ativo || atual !== versao) return;

      if (error || !data) {
        setErro('Perfil não encontrado ou indisponível. Entre em contato com o administrador.');
      } else {
        setPerfil(data as Perfil);
      }
      setCarregando(false);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, s) => {
      setTimeout(() => {
        if (ativo) void atualizar(s);
      }, 0);
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (carregando) return <main>Carregando...</main>;
  if (erro) return (
    <main>
      <p role="alert">{erro}</p>
      {session && <button onClick={() => void supabase?.auth.signOut()}>Sair</button>}
    </main>
  );
  if (!session || !perfil) return <Login />;

  return (
    <Layout perfil={perfil}>
      <Routes>
        <Route element={<Protegida perfil={perfil} nivel="autenticado" />}>
          <Route path="/meus-chamados" element={<MeusChamados perfil={perfil} />} />
          <Route path="/novo-chamado" element={<NovoChamado perfil={perfil} />} />
        </Route>
        <Route element={<Protegida perfil={perfil} nivel="equipe" />}>
          <Route path="/fila" element={<Fila atendenteId={session?.user.id || null} />} />
        </Route>
        <Route path="/chamado/:id" element={<ChamadoDetalhe />} />
        <Route element={<Protegida perfil={perfil} nivel="admin" />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route path="/painel" element={<Painel />} />
        <Route path="*" element={<Navigate to="/meus-chamados" replace />} />
      </Routes>
    </Layout>
  );
}

export function Rotas() {
  return <BrowserRouter><App /></BrowserRouter>;
}