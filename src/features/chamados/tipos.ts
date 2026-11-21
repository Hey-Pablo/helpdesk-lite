import type { Status } from './regras';
export type Papel = 'solicitante' | 'atendente' | 'admin';
export type Perfil = { id: string; nome: string; papel: Papel };
export type Chamado = { id: number; titulo: string; descricao: string; prioridade: string; status: Status; criado_em: string; prazo_em: string };
export type Categoria = { id: number; nome: string };
