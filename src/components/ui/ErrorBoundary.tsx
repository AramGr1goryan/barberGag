"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[UI Component Error Caught]:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-[#1d202c]/80 border border-rose-500/30 backdrop-blur-xl text-center space-y-4 my-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
              Произошла ошибка при отображении
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Компонент временно недоступен. Вы можете обновить его или повторить попытку.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-2 rounded-xl border-white/10 hover:bg-white/5 text-white/90 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Попробовать снова</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
