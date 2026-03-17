import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected application error"
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application crashed:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111318] p-4 text-white">
        <div className="w-full max-w-lg rounded-xl border border-rose-400/40 bg-[#1e1e1e] p-6 shadow-2xl">
          <h1 className="text-xl font-semibold text-rose-300">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-300">
            The app hit a runtime error and could not render this screen.
          </p>
          <p className="mt-3 rounded-md bg-black/30 p-3 text-xs text-rose-200">
            {this.state.errorMessage}
          </p>
          <button
            onClick={this.handleReload}
            className="mt-4 rounded-lg border border-white/20 bg-[#252526] px-4 py-2 text-sm text-white transition hover:border-blue-400/60"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
