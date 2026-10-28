'use client';

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import type { EstadoDoFormulario } from '@/app/area-do-gestor/utm/acoes';
import estilos from './utm.module.css';

const INICIAL: EstadoDoFormulario = { ok: false, erro: null, mensagem: null };

/**
 * Formulário que chama uma Server Action e mostra a resposta dela (erro de
 * validação ou confirmação) sem recarregar a página. Os campos vêm prontos do
 * servidor, como children.
 *
 * O envio é pelo onSubmit, e não por <form action>: com action, o React 19
 * limpa os campos ao fim de todo envio, e um erro de validação apagaria o que
 * a pessoa digitou. Aqui os campos só são limpos num cadastro que deu certo
 * (`limparAoSalvar`).
 */
export default function Formulario({
  acao,
  children,
  rotulo,
  limparAoSalvar = false,
}: {
  acao: (anterior: EstadoDoFormulario, dados: FormData) => Promise<EstadoDoFormulario>;
  children: ReactNode;
  rotulo: string;
  limparAoSalvar?: boolean;
}) {
  const [estado, setEstado] = useState(INICIAL);
  const [pendente, iniciar] = useTransition();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);
    iniciar(async () => {
      const resposta = await acao(estado, dados);
      setEstado(resposta);
      if (resposta.ok && limparAoSalvar) formulario.reset();
    });
  }

  return (
    <form onSubmit={enviar} className={estilos.formulario}>
      {children}
      {estado.erro && (
        <p className={estilos.alerta} role="alert">
          {estado.erro}
        </p>
      )}
      {estado.ok && estado.mensagem && (
        <p className={estilos.sucesso} role="status">
          {estado.mensagem}
        </p>
      )}
      <div className={estilos.botoes}>
        <button type="submit" className={`${estilos.botao} ${estilos.botaoPrimario}`} disabled={pendente}>
          {pendente ? 'Salvando…' : rotulo}
        </button>
      </div>
    </form>
  );
}
