// client/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import './ErrorBoundary.css';

interface Props {
    children: ReactNode;
    fallbackUI?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    level?: 'page' | 'section' | 'component';
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Update state with error info
        this.setState({
            error,
            errorInfo,
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to error reporting service (e.g., Sentry, LogRocket)
        // this.logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallbackUI) {
                return this.props.fallbackUI;
            }

            // Default error UI based on level
            const { level = 'component' } = this.props;
            const { error, errorInfo } = this.state;

            if (level === 'page') {
                return (
                    <div className="error-boundary-page">
                        <div className="error-content">
                            <div className="error-icon-wrapper">
                                <AlertTriangle size={64} />
                            </div>
                            <h1 className="error-title">Oops! Something went wrong</h1>
                            <p className="error-message">
                                We're sorry, but something unexpected happened. Please try refreshing the page.
                            </p>

                            <div className="error-actions">
                                <button className="error-btn primary" onClick={this.handleReset}>
                                    <RefreshCcw size={20} />
                                    Try Again
                                </button>
                                <button className="error-btn secondary" onClick={this.handleGoHome}>
                                    <Home size={20} />
                                    Go Home
                                </button>
                            </div>

                            {process.env.NODE_ENV === 'development' && error && (
                                <details className="error-details">
                                    <summary>Error Details (Development Only)</summary>
                                    <div className="error-stack">
                                        <p><strong>Error:</strong> {error.toString()}</p>
                                        {errorInfo && (
                                            <pre>{errorInfo.componentStack}</pre>
                                        )}
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>
                );
            }

            if (level === 'section') {
                return (
                    <div className="error-boundary-section">
                        <div className="error-icon">
                            <AlertTriangle size={32} />
                        </div>
                        <div className="error-text">
                            <h3>Unable to load this section</h3>
                            <p>Something went wrong. Please try again.</p>
                        </div>
                        <button className="error-btn-small" onClick={this.handleReset}>
                            <RefreshCcw size={16} />
                            Retry
                        </button>
                    </div>
                );
            }

            // Component level (minimal)
            return (
                <div className="error-boundary-component">
                    <AlertTriangle size={20} />
                    <span>Error loading component</span>
                    <button onClick={this.handleReset} className="error-btn-mini">
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}
