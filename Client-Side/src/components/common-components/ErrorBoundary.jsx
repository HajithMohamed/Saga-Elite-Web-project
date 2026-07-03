import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-page text-ink py-10">
          <div className="container mx-auto px-4">
            <div className="rounded-3xl border border-red-500 bg-[#1b0f0f] p-8 text-center">
              <h1 className="text-3xl font-bold text-ink">Something went wrong</h1>
              <p className="mt-4 text-sm text-gray-300">
                An unexpected error occurred while loading this section.
              </p>
              <pre className="mt-6 max-h-56 overflow-auto rounded-2xl bg-black/60 p-4 text-left text-xs text-gray-300">
                {String(this.state.error)}
              </pre>
              <button
                type="button"
                onClick={this.handleReset}
                className="mt-6 rounded-2xl bg-gold-deep px-6 py-3 text-sm font-bold text-black hover:bg-[#b88f2f]"
              >
                Try again
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
