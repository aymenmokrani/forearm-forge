import { Component, type ReactNode } from 'react';
import { STORAGE_KEY } from '../domain/storage';

interface State {
  error: Error | null;
  confirmReset: boolean;
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Last line of defence: if a screen throws, offer to save the raw data and reset
 * instead of leaving a white screen that reappears on every reload.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, confirmReset: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  private download = () => {
    const raw = readRaw() ?? '{}';
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `forearmforge-rescue-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  private reset = () => {
    try {
      const raw = readRaw();
      if (raw) window.localStorage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, raw);
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable; reload anyway */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app">
        <main className="screen screen-pad-bottom">
          <div className="empty">
            <p className="empty-title">Something broke</p>
            <div className="empty-body">
              <p>ForearmForge hit an error it couldn't recover from. Your training data is still on this device.</p>
              <button type="button" className="btn btn-primary btn-block" onClick={() => window.location.reload()}>
                Try again
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={this.download}>
                Download my data
              </button>
              {this.state.confirmReset ? (
                <button type="button" className="btn btn-danger btn-block" onClick={this.reset}>
                  Yes, start fresh
                </button>
              ) : (
                <button type="button" className="btn btn-danger-ghost btn-block" onClick={() => this.setState({ confirmReset: true })}>
                  Start fresh…
                </button>
              )}
              <p className="muted small">Starting fresh keeps a backup copy in this browser's storage.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
