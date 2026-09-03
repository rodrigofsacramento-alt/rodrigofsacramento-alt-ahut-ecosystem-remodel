import { Component, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface State { hasError: boolean }
interface Props { children: ReactNode }

/**
 * ErrorBoundary por rota (DEV/QUBITS).
 * Sem ele, qualquer chunk lazy que falhe/suspenda derruba o subtree inteiro
 * (sidebar+header+pagina) substituindo pela splash "Carregando..." e a tela
 * fica "presa/quebrada". Captura o erro na rota e permite recarregar a pagina
 * sem desmontar o app inteiro.
 */
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[RouteErrorBoundary] capturado:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <BoundaryFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

function BoundaryFallback({ onReset }: { onReset: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-300">
      <div className="text-4xl">⚠️</div>
      <p className="text-sm font-medium">Falha ao carregar esta página.</p>
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-[#00FFCC] text-slate-950 text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Tentar novamente
        </button>
        <button
          onClick={() => { onReset(); navigate('/'); }}
          className="px-4 py-2 rounded-xl border border-white/15 text-slate-200 text-xs font-medium hover:bg-white/5 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}