'use client';

import { useActionState } from 'react';
import { entrar, type EstadoDaEntrada } from '../acoes';
import estilos from '@/components/area-do-corretor/area.module.css';

const INICIAL: EstadoDaEntrada = { erro: null, email: '' };

export default function FormularioEntrada({ volta }: { volta: string }) {
  const [estado, enviar, enviando] = useActionState(entrar, INICIAL);

  return (
    <form action={enviar} className={estilos.formulario}>
      <input type="hidden" name="volta" value={volta} />
      <div className={estilos.campo}>
        <label htmlFor="email" className={estilos.rotulo}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          defaultValue={estado.email}
          className={estilos.entradaTexto}
        />
      </div>
      <div className={estilos.campo}>
        <label htmlFor="senha" className={estilos.rotulo}>
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className={estilos.entradaTexto}
        />
      </div>
      {estado.erro && (
        <p className={estilos.erro} role="alert">
          {estado.erro}
        </p>
      )}
      <button type="submit" className={`${estilos.botao} ${estilos.botaoPrimario}`} disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
