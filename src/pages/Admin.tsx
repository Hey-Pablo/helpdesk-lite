import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Categoria } from '../features/chamados/tipos';

// Busca categorias
async function listarCategorias(): Promise<Categoria[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from('categorias').select('*').order('nome');
  if (error) throw error;
  return (data as Categoria[]) || [];
}

// Busca regras de SLA
interface SlaRegra {
  prioridade: string;
  horas: number;
}

async function listarSla(): Promise<SlaRegra[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from('sla_regras').select('*').order('prioridade');
  if (error) throw error;
  return (data as SlaRegra[]) || [];
}

// Cria categoria
async function criarCategoria(nome: string) {
  if (!supabase) throw new Error('Supabase não configurado');
  const { error } = await supabase.from('categorias').insert({ nome });
  if (error) throw error;
}

// Atualiza SLA
async function atualizarSla(prioridade: string, horas: number) {
  if (!supabase) throw new Error('Supabase não configurado');
  const { error } = await supabase
    .from('sla_regras')
    .update({ horas })
    .eq('prioridade', prioridade);
  if (error) throw error;
}

export function Admin() {
  const queryClient = useQueryClient();
  const categorias = useQuery({ queryKey: ['categorias-admin'], queryFn: listarCategorias });
  const sla = useQuery({ queryKey: ['sla-admin'], queryFn: listarSla });

  const mutationCategoria = useMutation({
    mutationFn: criarCategoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias-admin'] })
  });

  const mutationSla = useMutation({
    mutationFn: ({ priority, horas }: { priority: string; horas: number }) =>
      atualizarSla(priority, horas),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sla-admin'] })
  });

  const [novoNome, setNovoNome] = useState<string>('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (novoNome.trim()) {
      mutationCategoria.mutate(novoNome.trim());
      setNovoNome('');
    }
  }

  return (
    <main>
      <h1>Administração</h1>

      <section className="card">
        <h2>Categorias</h2>
        <p className="text-sm text-gray-600 mb-2">
          Administração de categorias para classificação de chamados.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            name="nome_categoria"
            type="text"
            placeholder="Novo nome da categoria"
            required
            className="flex-1"
          />
          <button type="submit" disabled={mutationCategoria.isPending}>
            {mutationCategoria.isPending ? 'Salvando...' : 'Adicionar'}
          </button>
        </form>
        {categorias.data?.length === 0 && <p>Sem categorias cadastradas.</p>}
        <table className="w-full">
          <thead>
            <tr><th>Nome</th><th>ID</th></tr>
          </thead>
          <tbody>
            {categorias.data?.map(c => (
              <tr key={c.id} className="border-t">
                <td>{c.nome}</td>
                <td>{c.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {categorias.error && <p role="alert">Erro ao carregar categorias.</p>}
      </section>

      <section className="card">
        <h2>SLA - Prazos por prioridade</h2>
        <p className="text-sm text-gray-600 mb-2">
          Horas de SLA para cada prioridade. Alterando o valor, o prazo será recalculado apenas para novos chamados.
        </p>
        <table className="w-full">
          <thead>
            <tr><th>Prioridade</th><th>Horas</th><th>Dias úteis</th></tr>
          </thead>
          <tbody>
            {sla.data?.map(s => (
              <tr key={s.prioridade} className="border-t">
                <td>{s.prioridade}</td>
                <td>
                  <PrioritizeInput
                    value={s.horas}
                    onChange={(val) => mutationSla.mutate({ priority: s.prioridade, horas: val })}
                    disabled={mutationSla.isPending}
                  />
                </td>
                <td>{(s.horas / 8).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sla.error && <p role="alert">Erro ao carregar SLA.</p>}
      </section>
    </main>
  );
}

function PrioritizeInput({ value, onChange, disabled }: { value: number; onChange: (val: number) => void; disabled: boolean }) {
  const [internalValue, setInternalValue] = useState<string>(String(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  };

  const handleBlur = () => {
    const val = Number(internalValue);
    if (!isNaN(val) && val > 0) {
      onChange(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <input
      type="number"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      min={1}
      className="w-16 border rounded p-1"
    />
  );
}