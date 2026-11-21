import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Busca resumo dos indicadores
interface ResumoPainel {
  abertos: number;
  tempo_medio: string;
  percentual_no_prazo: number;
}

// Busca chamados por categoria
interface ChamadosPorCategoria {
  categoria_id: number;
  total: number;
  nome?: string;
}

// Busca chamados por atendente
interface ChamadosPorAtendente {
  atendente_id: string | null;
  total: number;
  nome?: string;
}

async function buscarResumo(): Promise<ResumoPainel> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from('painel_resumo').select('*').single();
  if (error) throw error;
  return {
    abertos: data.abertos || 0,
    tempo_medio: data.tempo_medio ? new Date(data.tempo_medio).toISOString() : '0 dias',
    percentual_no_prazo: data.percentual_no_prazo || 0
  };
}

async function buscarPorCategoria(): Promise<ChamadosPorCategoria[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from('painel_por_categoria').select('*');
  if (error) throw error;
  return data || [];
}

async function buscarPorAtendente(): Promise<ChamadosPorAtendente[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from('painel_por_atendente').select('*');
  if (error) throw error;

  // Buscar nomes dos atendentes
  if (data && data.length > 0) {
    const atendenteIds = data
      .filter(d => d.atendente_id)
      .map(d => d.atendente_id!)
      .filter((v, i, a) => a.indexOf(v) === i); // únicos

    if (atendenteIds.length > 0) {
      const { data: perfis } = await supabase.from('perfis').select('id, nome').in('id', atendenteIds);
      const mapaNomes = new Map(perfis?.map(p => [p.id, p.nome]) || []);
      return data.map(d => ({
        ...d,
        nome: d.atendente_id ? mapaNomes.get(d.atendente_id) : 'Não atribuído'
      }));
    }
  }
  return data || [];
}

export function Painel() {
  const resumo = useQuery({ queryKey: ['painel-resumo'], queryFn: buscarResumo });
  const porCategoria = useQuery({ queryKey: ['painel-categoria'], queryFn: buscarPorCategoria });
  const porAtendente = useQuery({ queryKey: ['painel-atendente'], queryFn: buscarPorAtendente });

  const statusLabels: Record<string, string> = {
    aberto: 'Aberto',
    em_atendimento: 'Em atendimento',
    aguardando_cliente: 'Aguardando cliente',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
    reaberto: 'Reaberto'
  };

  const tempoMedioHoras = (tempo: string) => {
    const segundos = new Date(tempo).getTime() - new Date('1970-01-01').getTime();
    const horas = segundos / 3600;
    return horas.toFixed(1);
  };

  if (resumo.isLoading || porCategoria.isLoading) {
    return <main>Carregando painel...</main>;
  }
  if (resumo.error || porCategoria.error) {
    return <main role="alert">Erro ao carregar os dados do painel.</main>;
  }

  const r = resumo.data!;
  const categorias = porCategoria.data!;
  const atendentes = porAtendente.data!;

  return (
    <main>
      <h1>Painel de chamados</h1>

      <section className="card">
        <h2>Resumo geral</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{r.abertos}</p>
            <p className="text-sm text-gray-600">Abertos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {r.percentual_no_prazo.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">No prazo</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {tempoMedioHoras(r.tempo_medio)}h
            </p>
            <p className="text-sm text-gray-600">Tempo médio</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Chamados por categoria</h2>
        <table className="w-full">
          <thead>
            <tr><th>Categoria</th><th>Total</th></tr>
          </thead>
          <tbody>
            {categorias.map(c => (
              <tr key={c.categoria_id} className="border-t">
                <td>{categorias.find(x => x.categoria_id === c.categoria_id)?.nome || c.categoria_id}</td>
                <td>{c.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Chamados por atendente</h2>
        <table className="w-full">
          <thead>
            <tr><th>Atendente</th><th>Total</th></tr>
          </thead>
          <tbody>
            {atendentes.map(a => (
              <tr key={a.atendente_id || 'unassigned'} className="border-t">
                <td>{a.nome || 'Não atribuído'}</td>
                <td>{a.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}