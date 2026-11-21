export type Status = 'aberto' | 'em_atendimento' | 'aguardando_usuario' | 'resolvido' | 'fechado' | 'reaberto';
const transicoes: Record<Status, Status[]> = {
  aberto: ['em_atendimento'], em_atendimento: ['aguardando_usuario', 'resolvido'],
  aguardando_usuario: ['em_atendimento'], resolvido: ['fechado', 'reaberto'],
  fechado: ['reaberto'], reaberto: ['em_atendimento'],
};
export function podeTransicionar(atual: Status, proximo: Status): boolean {
  return transicoes[atual].includes(proximo);
}
