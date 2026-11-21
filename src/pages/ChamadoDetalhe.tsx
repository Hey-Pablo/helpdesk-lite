import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Chamado, Comentario } from '../features/chamados/tipos';
import { podeTransicionar } from '../features/chamados/regras';

// Busca chamado por ID com verificação de permissão
async function buscarChamado(id: number): Promise<Chamado & { categoria: { nome: string } }> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase
    .from('chamados')
    .select(`
      id, titulo, descricao, prioridade, status, criado_em, prazo_em, resolvido_em,
      categoria: categoria_id (nome)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return (data as any) as Chamado & { categoria: { nome: string } };
}

// Busca comentários
async function listarComentarios(chamadoId: number): Promise<Comentario[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase
    .from('comentarios')
    .select('id, texto, interno, criado_em, autor_id, autor: autor_id (nome)')
    .eq('chamado_id', chamadoId)
    .order('criado_em');
  if (error) throw error;
  return (data as any) || [];
}

// Busca histórico
interface HistoricoItem {
  id: number;
  status_anterior: string | null;
  status_novo: string;
  criado_em: string;
  autor: { nome: string } | null;
}

async function listarHistorico(chamadoId: number): Promise<HistoricoItem[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase
    .from('historico')
    .select('id, status_anterior, status_novo, criado_em, autor: autor_id (nome)')
    .eq('chamado_id', chamadoId)
    .order('criado_em');
  if (error) throw error;
  return (data as any) || [];
}

// Adiciona comentário
async function adicionarComentario(
  chamadoId: number,
  texto: string,
  interno: boolean,
  usuarioId: string | null
) {
  if (!supabase) throw new Error('Supabase não configurado');
  const { error } = await supabase
    .from('comentarios')
    .insert({
      chamado_id: chamadoId,
      texto,
      interno,
      autor_id: usuarioId
    });
  if (error) throw error;
}

// Atualiza status
async function atualizarStatus(id: number, status: string, atendenteId: string | null) {
  if (!supabase) throw new Error('Supabase não configurado');

  // Buscar chamado atual para registrar histórico
  const { data: chamado, error: chamadoError } = await supabase
    .from('chamados')
    .select('status')
    .eq('id', id)
    .single();

  if (chamadoError) throw chamadoError;

  const statusAnterior = chamado.status;

  const { error } = await supabase
    .from('chamados')
    .update({ status, atendente_id: atendenteId })
    .eq('id', id);

  if (error) throw error;

  // Registrar no histórico
  const { error: histError } = await supabase
    .from('historico')
    .insert({
      chamado_id: id,
      autor_id: atendenteId,
      status_anterior: statusAnterior,
      status_novo: status
    });

  if (histError) throw histError;
}

export function ChamadoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const chamadoId = Number(id);
  const queryClient = useQueryClient();

  // Simular ID do usuário logado (na prática viria do contexto)
  const usuarioLogado = { id: '10000000-0000-0000-0000-000000000001', papel: 'solicitante', nome: 'Solicitante fictício' } as const;

  const chamado = useQuery({
    queryKey: ['chamado', chamadoId],
    queryFn: () => buscarChamado(chamadoId),
    enabled: !!chamadoId
  });

  const comentarios = useQuery({
    queryKey: ['comentarios', chamadoId],
    queryFn: () => listarComentarios(chamadoId),
    enabled: !!chamadoId
  });

  const historico = useQuery({
    queryKey: ['historico', chamadoId],
    queryFn: () => listarHistorico(chamadoId),
    enabled: !!chamadoId
  });

  const mutationComentario = useMutation({
    mutationFn: ({ texto, interno }: { texto: string; interno: boolean }) =>
      adicionarComentario(chamadoId, texto, interno, usuarioLogado.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios', chamadoId] });
    }
  });

  const mutationStatus = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      atualizarStatus(chamadoId, status, usuarioLogado.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamado', chamadoId] });
      queryClient.invalidateQueries({ queryKey: ['fila'] });
    }
  });

  // Handler simplificado para o form
  const [novoComentario, setNovoComentario] = useState<string>('');
  const [interno, setInterno] = useState<boolean>(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (novoComentario.trim()) {
      mutationComentario.mutate({ texto: novoComentario.trim(), interno });
      setNovoComentario('');
      setInterno(false);
    }
  }

  if (chamado.isLoading) return <main>Carregando chamado...</main>;
  if (chamado.error) return <main role="alert">Chamado não encontrado ou erro ao carregar.</main>;
  const c = chamado.data!;

  const statusLabels: Record<string, string> = {
    aberto: 'Aberto',
    em_atendimento: 'Em atendimento',
    aguardando_usuario: 'Aguardando usuário',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
    reaberto: 'Reaberto'
  };

  return (
    <main>
      <Link to="/">Voltar</Link>
      <article className="card">
        <h1>Chamado #{c.id} - {c.titulo}</h1>
        <p><strong>Descrição:</strong> {c.descricao}</p>
        <p><strong>Categoria:</strong> {c.categoria?.nome}</p>
        <p><strong>Prioridade:</strong> {c.prioridade}</p>
        <p><strong>Status:</strong> {statusLabels[c.status] || c.status}</p>
        <p><strong>Criado:</strong> {new Date(c.criado_em).toLocaleString('pt-BR')}</p>
        <p><strong>Prazo:</strong> {new Date(c.prazo_em).toLocaleString('pt-BR')}</p>
        {c.resolvido_em && <p><strong>Resolvido em:</strong> {new Date(c.resolvido_em).toLocaleString('pt-BR')}</p>}
      </article>

      <section className="card">
        <h2>Histórico de status</h2>
        {historico.data?.length === 0 && <p>Sem alterações de status.</p>}
        {historico.data?.map(h => (
          <div key={h.id} className="border-b py-2">
            <p><strong>{new Date(h.criado_em).toLocaleString('pt-BR')}</strong></p>
            <p>{h.status_anterior || 'Iniciado'} → <strong>{statusLabels[h.status_novo] || h.status_novo}</strong></p>
            {h.autor && <p className="text-sm text-gray-600">Por: {h.autor.nome}</p>}
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Comentários ({comentarios.data?.length || 0})</h2>
        {comentarios.data?.map(cmt => (
          <div key={cmt.id} className={`border-b py-2 ${cmt.interno ? 'bg-gray-50' : ''}`}>
            <p>{cmt.texto}</p>
            <p className="text-xs text-gray-600">
              {new Date(cmt.criado_em).toLocaleString('pt-BR')}
              {cmt.interno && ' (interno)'}
            </p>
          </div>
        ))}
        {comentarios.data?.length === 0 && <p>Sem comentários.</p>}
      </section>
    </main>
  );
}