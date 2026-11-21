import { describe, expect, it } from 'vitest';
import { podeAcessar } from '../src/components/acesso';
describe('acesso por papel', () => {
  it('restringe fila à equipe e administração ao administrador', () => {
    expect(podeAcessar('solicitante', 'equipe')).toBe(false);
    expect(podeAcessar('atendente', 'equipe')).toBe(true);
    expect(podeAcessar('atendente', 'admin')).toBe(false);
    expect(podeAcessar('admin', 'admin')).toBe(true);
    expect(podeAcessar('solicitante', 'autenticado')).toBe(true);
  });
});
