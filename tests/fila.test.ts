import { describe, expect, it } from 'vitest';
import { prepararAtualizacao } from '../src/features/chamados/fila';

describe('atualização da fila', () => {
  it('atribui atendente somente ao assumir ou retomar', () => {
    expect(prepararAtualizacao('aberto', 'em_atendimento', 'novo')).toEqual({ status: 'em_atendimento', atendente_id: 'novo' });
    expect(prepararAtualizacao('reaberto', 'em_atendimento', 'novo')).toEqual({ status: 'em_atendimento', atendente_id: 'novo' });
    expect(prepararAtualizacao('em_atendimento', 'aguardando_usuario', 'novo')).toEqual({ status: 'aguardando_usuario' });
    expect(prepararAtualizacao('resolvido', 'fechado', 'novo')).toEqual({ status: 'fechado' });
  });

  it('rejeita transição inválida antes de atualizar', () => {
    expect(() => prepararAtualizacao('aguardando_usuario', 'resolvido', 'novo')).toThrow();
  });
});
