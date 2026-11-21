import { podeTransicionar, type Status } from './regras';

export function prepararAtualizacao(atual: Status, proximo: Status, atendenteId: string | null) {
  if (!podeTransicionar(atual, proximo)) throw new Error('Transição de status inválida');
  if ((atual === 'aberto' || atual === 'reaberto') && proximo === 'em_atendimento') {
    return { status: proximo, atendente_id: atendenteId };
  }
  return { status: proximo };
}
