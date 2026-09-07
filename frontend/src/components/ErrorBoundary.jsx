import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="w-14 h-14 mx-auto bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Interface Recovery</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected display error occurred while rendering the page. Click reload below to refresh the system session.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-slate-950/80 p-3 rounded-lg text-left text-[11px] font-mono text-rose-400 max-h-28 overflow-y-auto border border-rose-900/40">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Hard Reload
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                Reset & Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;