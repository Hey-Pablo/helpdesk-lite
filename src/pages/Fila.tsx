import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Chamado } from '../features/chamados/tipos';
import { podeTransicionar } from '../features/chamados/regras';

// Busca todos os chamados (para equipe)
async function listarFila(): Promise<Chamado[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase
    .from('chamados')
    .select('id,titulo,descricao,prioridade,status,criado_em,prazo_em,atendente_id')
    .order('prazo_em');
  if (error) throw error;
  return (data as Chamado[]) || [];
}

// Atualiza o status de um chamado
async function atualizarStatus(id: number, status: string, atendenteId: string | null) {
  if (!supabase) throw new Error('Supabase não configurado');
  const { error } = await supabase
    .from('chamados')
    .update({ status, atendente_id: atendenteId })
    .eq('id', id);
  if (error) throw error;
}

export function Fila({ atendenteId }: { atendenteId: string | null }) {
  const queryClient = useQueryClient();
  const { data: chamados, isLoading, error } = useQuery({ queryKey: ['fila'], queryFn: listarFila });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      atualizarStatus(id, status, atendenteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fila'] })
  });

  if (isLoading) return <main>Carregando fila...</main>;
  if (error) return <main role="alert">Erro ao carregar a fila.</main>;

  const statusLabels: Record<string, string> = {
    aberto: 'Aberto',
    em_atendimento: 'Em atendimento',
    aguardando_usuario: 'Aguardando usuário',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
    reaberto: 'Reaberto'
  };

  const getStatusColor = (status: string, prazoEm: string) => {
    const agora = new Date();
    const prazo = new Date(prazoEm);
    if (status === 'resolvido' || status === 'fechado') return 'text-green-600';
    if (status === 'reaberto') return 'text-orange-600';
    if (agora > prazo) return 'text-red-600 font-bold';
    if (prazo.getTime() - agora.getTime() < 4 * 3600 * 1000) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <main>
      <h1>Fila de atendimento</h1>
      {chamados?.length === 0 && <p>Não há chamados na fila.</p>}
      {chamados?.map(c => (
        <article className="card" key={c.id}>
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold">
              #{c.id} - {c.titulo}
            </h2>
            <span className={getStatusColor(c.status, c.prazo_em)}>
              {statusLabels[c.status]}
            </span>
          </div>
          <p>{c.descricao}</p>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Prioridade: {c.prioridade}</span>
            <span>Prazo: {new Date(c.prazo_em).toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex gap-2 mt-2">
            {c.status === 'aberto' && (
              <button
                onClick={() => mutation.mutate({ id: c.id, status: 'em_atendimento' })}
                className="text-sm"
                disabled={mutation.isPending}
              >
                Assumir
              </button>
            )}
            {c.status === 'em_atendimento' && (
              <>
                <Link to={`/chamado/${c.id}`} className="text-sm text-blue-600">
                  Ver detalhes
                </Link>
                <button
                  onClick={() => mutation.mutate({ id: c.id, status: 'aguardando_usuario' })}
                  className="text-sm"
                  disabled={mutation.isPending}
                >
                  Aguardar usuário
                </button>
              </>
            )}
            {c.status === 'aguardando_usuario' && (
              <>
                <Link to={`/chamado/${c.id}`} className="text-sm text-blue-600">
                  Ver detalhes
                </Link>
                <button
                  onClick={() => mutation.mutate({ id: c.id, status: 'resolvido' })}
                  className="text-sm"
                  disabled={mutation.isPending}
                >
                  Marcar como resolvido
                </button>
              </>
            )}
            {c.status === 'resolvido' && (
              <>
                <Link to={`/chamado/${c.id}`} className="text-sm text-blue-600">
                  Ver detalhes
                </Link>
                <button
                  onClick={() => mutation.mutate({ id: c.id, status: 'fechado' })}
                  className="text-sm"
                  disabled={mutation.isPending}
                >
                  Fechar
                </button>
                <button
                  onClick={() => mutation.mutate({ id: c.id, status: 'reaberto' })}
                  className="text-sm text-orange-600"
                  disabled={mutation.isPending}
                >
                  Reabrir
                </button>
              </>
            )}
            {c.status === 'reaberto' && (
              <>
                <Link to={`/chamado/${c.id}`} className="text-sm text-blue-600">
                  Ver detalhes
                </Link>
                <button
                  onClick={() => mutation.mutate({ id: c.id, status: 'em_atendimento' })}
                  className="text-sm"
                  disabled={mutation.isPending}
                >
                  Retomar atendimento
                </button>
              </>
            )}
          </div>
        </article>
      ))}
    </main>
  );
}