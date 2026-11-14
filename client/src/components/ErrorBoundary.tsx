import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-paper p-6 text-ink">
          <div className="card-paper w-full max-w-lg rounded-[2rem] p-8 text-center shadow-soft">
            <AlertTriangle className="mx-auto mb-5 h-10 w-10 text-vermilion" aria-hidden="true" />
            <h1 className="font-display text-3xl font-semibold tracking-tight">Se nos ha caído el peine.</h1>
            <p className="mt-3 text-ink-soft">
              Algo ha fallado al cargar la web. Recarga la página y seguimos donde lo dejamos.
            </p>
            {import.meta.env.DEV && this.state.error ? (
              <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-paper-deep p-3 text-left text-xs text-ink-soft">
                {this.state.error.message}
              </pre>
            ) : null}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-paper-soft transition hover:bg-vermilion"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
