import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Save error details so we can show them in the UI and log to console
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    const { hasError, error, info } = this.state;
    if (!hasError) return this.props.children;

    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-bold text-red-700 mb-2">Something went wrong</h3>
        <p className="text-sm text-red-700 mb-4">An error occurred while rendering this component.</p>
        {error && (
          <div className="mb-3">
            <div className="font-semibold text-sm text-red-800">Error:</div>
            <pre className="text-xs text-red-700 whitespace-pre-wrap">{String(error && error.message)}</pre>
          </div>
        )}
        {info && info.componentStack && (
          <div>
            <div className="font-semibold text-sm text-red-800">Component stack:</div>
            <pre className="text-xs text-red-700 whitespace-pre-wrap">{info.componentStack}</pre>
          </div>
        )}
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
