/**
 * 구조화된 로깅 유틸리티
 * 프로덕션 환경에서 에러 추적을 위한 로깅 기능
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * 로그 메시지 포맷팅
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * 정보 로그
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage("info", message, context));
    }
    // 프로덕션에서는 외부 로깅 서비스로 전송 가능
  }

  /**
   * 경고 로그
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage("warn", message, context));
    }
    // 프로덕션에서는 외부 로깅 서비스로 전송 가능
  }

  /**
   * 에러 로그
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : String(error),
    };

    if (this.isDevelopment) {
      console.error(this.formatMessage("error", message, errorContext));
    } else {
      // 프로덕션에서는 외부 로깅 서비스로 전송
      // 예: Sentry, LogRocket, DataDog 등
      console.error(this.formatMessage("error", message, errorContext));
    }
  }

  /**
   * 디버그 로그 (개발 환경에서만)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

/**
 * 에러 로깅 헬퍼 함수
 * 기존 console.error를 대체할 수 있는 함수
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  logger.error(message, error, context);
}

