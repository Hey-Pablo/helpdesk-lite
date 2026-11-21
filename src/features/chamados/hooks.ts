import { useQuery } from '@tanstack/react-query';
import { listarCategorias, listarMeusChamados } from './api';
export const useCategorias = () => useQuery({ queryKey: ['categorias'], queryFn: listarCategorias });
export const useMeusChamados = (id: string) => useQuery({ queryKey: ['meus-chamados', id], queryFn: () => listarMeusChamados(id) });
