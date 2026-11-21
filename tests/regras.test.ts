import { describe, expect, it } from 'vitest';
import { podeTransicionar } from '../src/features/chamados/regras';

describe('transições de status', () => {
  it('permite o fluxo de atendimento e reabertura', () => {
    expect(podeTransicionar('aberto', 'em_atendimento')).toBe(true);
    expect(podeTransicionar('em_atendimento', 'aguardando_usuario')).toBe(true);
    expect(podeTransicionar('aguardando_usuario', 'em_atendimento')).toBe(true);
    expect(podeTransicionar('em_atendimento', 'resolvido')).toBe(true);
    expect(podeTransicionar('resolvido', 'fechado')).toBe(true);
    expect(podeTransicionar('resolvido', 'reaberto')).toBe(true);
    expect(podeTransicionar('fechado', 'reaberto')).toBe(true);
    expect(podeTransicionar('reaberto', 'em_atendimento')).toBe(true);
  });
  it('impede saltos e transição para o mesmo status', () => {
    expect(podeTransicionar('aberto', 'fechado')).toBe(false);
    expect(podeTransicionar('fechado', 'resolvido')).toBe(false);
    expect(podeTransicionar('aberto', 'aberto')).toBe(false);
  });
});
