import React, { Component } from 'react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <div className="bg-destructive/10 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              We're sorry, but we couldn't load the casting details. Please try again.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = (WrappedComponent) => {
  return (props) => (
    <ErrorBoundary>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
};
