import type { Papel } from '../features/chamados/tipos';
export type Nivel = 'autenticado' | 'equipe' | 'admin';
export function podeAcessar(papel: Papel, nivel: Nivel): boolean {
  return nivel === 'autenticado' || (nivel === 'equipe' && (papel === 'atendente' || papel === 'admin')) || (nivel === 'admin' && papel === 'admin');
}
