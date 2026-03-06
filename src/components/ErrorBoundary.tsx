import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ background: '#000' }}
        >
          <div className="text-center max-w-md">
            <div
              className="flex items-center justify-center mx-auto mb-6"
              style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)' }}
            >
              <AlertTriangle style={{ width: 32, height: 32, color: '#EF4444' }} />
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 24, color: '#F5F0E8', marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              Our team has been notified. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="active:scale-[0.96] transition-transform"
              style={{
                padding: '12px 32px',
                borderRadius: 12,
                background: '#16A34A',
                color: '#000',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
