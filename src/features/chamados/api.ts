import { supabase } from '../../lib/supabase';
import type { Categoria, Chamado } from './tipos';
function cliente() { if (!supabase) throw new Error('Configure as variáveis do Supabase no arquivo .env.'); return supabase; }
export async function listarCategorias(): Promise<Categoria[]> {
  const { data, error } = await cliente().from('categorias').select('id,nome').order('nome');
  if (error) throw error; return data;
}
export async function listarMeusChamados(id: string): Promise<Chamado[]> {
  const { data, error } = await cliente().from('chamados').select('id,titulo,descricao,prioridade,status,criado_em,prazo_em').eq('solicitante_id', id).order('criado_em', { ascending: false });
  if (error) throw error; return data as Chamado[];
}
export async function criarChamado(chamado: { titulo: string; descricao: string; categoria_id: number; prioridade: string; solicitante_id: string }) {
  const { error } = await cliente().from('chamados').insert(chamado);
  if (error) throw error;
}
