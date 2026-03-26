import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
          <p className="text-[14px] text-[#003049]/60">Something went wrong</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-[13px] px-3 py-1 rounded border text-[#003049] hover:bg-[#003049]/5 transition-colors"
            style={{ borderColor: 'rgba(0,48,73,0.2)' }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
