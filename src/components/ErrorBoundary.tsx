import React from 'react';
import { RotateCcw, Home, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorInfo: any;
  showDetails: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary] Caught runtime exception:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.inline) {
        return (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 16,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--cms-text, #f1f5f9)',
              margin: '12px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={20} color="#ef4444" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {this.props.fallbackTitle || 'Komponen mengalami kendala tampilan.'}
              </span>
            </div>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <RotateCcw size={12} /> Coba Lagi
            </button>
          </div>
        );
      }

      return (
        <div
          style={{
            minHeight: '100dvh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'var(--cms-bg, #08080f)',
            color: 'var(--cms-text, #f1f5f9)',
            fontFamily: "'Inter', sans-serif",
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: 520,
              width: '100%',
              background: 'var(--cms-card-bg, rgba(255, 255, 255, 0.04))',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.1))',
              borderRadius: 24,
              padding: '32px 28px',
              textAlign: 'center',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
              animation: 'cmsPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertCircle size={32} strokeWidth={2.2} />
            </div>

            <h2
              style={{
                margin: '0 0 10px',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--cms-text, #ffffff)',
                letterSpacing: '-0.5px',
              }}
            >
              {this.props.fallbackTitle || 'Terjadi Kendala Tampilan'}
            </h2>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--cms-text-muted, #94a3b8)',
              }}
            >
              Komponen ini mengalami kendala sementara saat merender. Data Anda tetap aman.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 20,
              }}
            >
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '10px 20px',
                  borderRadius: 100,
                  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.15))',
                  background: 'var(--cms-card-bg, rgba(255, 255, 255, 0.08))',
                  color: 'var(--cms-text, #ffffff)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <RotateCcw size={14} />
                Coba Lagi
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 22px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--cms-accent, #7c3aed)',
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                  transition: 'all 0.2s',
                }}
              >
                Muat Ulang
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 18px',
                  borderRadius: 100,
                  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.15))',
                  background: 'transparent',
                  color: 'var(--cms-text-muted, #94a3b8)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <Home size={14} />
                Home
              </button>
            </div>

            {/* Expandable Technical Error Detail */}
            {this.state.error && (
              <div style={{ textAlign: 'left', marginTop: 16 }}>
                <button
                  onClick={this.toggleDetails}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--cms-text-muted, #94a3b8)',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    margin: '0 auto',
                    padding: '4px 8px',
                  }}
                >
                  <span>{this.state.showDetails ? 'Sembunyikan detail teknis' : 'Lihat detail teknis'}</span>
                  {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {this.state.showDetails && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 14,
                      background: 'rgba(0, 0, 0, 0.45)',
                      borderRadius: 12,
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontSize: 11,
                      color: '#f87171',
                      overflowX: 'auto',
                      maxHeight: 180,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <strong>Error:</strong> {this.state.error?.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <pre style={{ margin: '8px 0 0', opacity: 0.8, fontSize: 10 }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
