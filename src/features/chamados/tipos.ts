import type { Status } from './regras';
export type Papel = 'solicitante' | 'atendente' | 'admin';
export type Perfil = { id: string; nome: string; papel: Papel };
export type Chamado = {
  id: number;
  titulo: string;
  descricao: string;
  categoria_id: number;
  prioridade: string;
  status: Status;
  solicitante_id: string;
  atendente_id: string | null;
  criado_em: string;
  prazo_em: string;
  resolvido_em: string | null;
};
export type Categoria = { id: number; nome: string };
export interface Comentario {
  id: number;
  chamado_id: number;
  autor_id: string;
  texto: string;
  interno: boolean;
  criado_em: string;
  autor?: { nome: string };
}
export interface Historico {
  id: number;
  chamado_id: number;
  autor_id: string | null;
  status_anterior: string | null;
  status_novo: string;
  criado_em: string;
  autor?: { nome: string };
}