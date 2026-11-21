import { supabase } from '../../lib/supabase';
import type { Categoria, Chamado } from './tipos';

function cliente() { if (!supabase) throw new Error('Configure as variáveis do Supabase no arquivo .env.'); return supabase; }

// Categorias
export async function listarCategorias(): Promise<Categoria[]> {
  const { data, error } = await cliente().from('categorias').select('id,nome').order('nome');
  if (error) throw error;
  return (data as Categoria[]) || [];
}

// Chamados do solicitante
export async function listarMeusChamados(id: string): Promise<Chamado[]> {
  const { data, error } = await cliente().from('chamados')
    .select('id,titulo,descricao,categoria_id,prioridade,status,solicitante_id,atendente_id,criado_em,prazo_em,resolvido_em')
    .eq('solicitante_id', id)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data as Chamado[]) || [];
}

// Criar chamado
export async function criarChamado(chamado: { titulo: string; descricao: string; categoria_id: number; prioridade: string; solicitante_id: string }) {
  const { error } = await cliente().from('chamados').insert(chamado);
  if (error) throw error;
}

// Listar todos os chamados (para equipe/administrador)
export async function listarChamadosEquipe(): Promise<Chamado[]> {
  const { data, error } = await cliente().from('chamados')
    .select('id,titulo,descricao,categoria_id,prioridade,status,solicitante_id,atendente_id,criado_em,prazo_em,resolvido_em')
    .order('prazo_em');
  if (error) throw error;
  return (data as Chamado[]) || [];
}

// Buscar chamado por ID
export async function buscarChamado(id: number): Promise<Chamado & { categoria: { nome: string } }> {
  const { data, error } = await cliente().from('chamados')
    .select(`
      id, titulo, descricao, prioridade, status, criado_em, prazo_em, resolvido_em,
      categoria: categoria_id (nome)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return (data as any) as Chamado & { categoria: { nome: string } };
}

// Atualizar status do chamado
export async function atualizarStatus(id: number, status: string, atendente_id: string | null = null) {
  const { error } = await cliente().from('chamados')
    .update({ status, atendente_id })
    .eq('id', id);
  if (error) throw error;
}