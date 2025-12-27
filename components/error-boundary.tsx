"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 바운더리 컴포넌트
 * 자식 컴포넌트에서 발생한 에러를 캐치하여 사용자 친화적인 에러 UI를 표시합니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
      console.error("에러 바운더리에서 에러 캐치:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl">문제가 발생했습니다</CardTitle>
              <CardDescription>
                예상치 못한 오류가 발생했습니다. 아래 옵션을 시도해보세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">에러 상세:</p>
                  <p className="text-xs text-muted-foreground break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  다시 시도
                </Button>
                <Button
                  onClick={() => window.location.href = "/"}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  홈으로 돌아가기
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                문제가 계속되면 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

