"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signInWithKakao, signInWithGoogle, signOut as serverSignOut } from "@/app/actions/auth";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (provider: "kakao" | "google") => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: User | null; // 서버에서 받은 초기 사용자 정보
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 인증 Context Provider
 * 서버에서 받은 초기 사용자 정보를 사용하고, 실시간 업데이트는 서버 세션과 동기화합니다.
 * 
 * 규칙: 서버 중심 세션 관리
 * - 초기 사용자 정보는 서버에서 받은 것을 사용
 * - onAuthStateChange는 서버 세션과 동기화 확인용으로만 사용
 * - 로그인/로그아웃은 서버 액션으로만 처리
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false); // 서버에서 이미 받았으므로 false
  const supabase = createClient();

  useEffect(() => {
    // 초기 사용자 정보 설정 (서버에서 받은 정보 우선)
    setUser(initialUser);
    setIsLoading(false);

    // 인증 상태 변경 감지 (서버 세션과 동기화 확인용)
    // 실제 사용자 정보는 서버 세션이 기준이므로, 클라이언트는 표시만 담당
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // 서버 세션과 동기화 확인
      // 로그아웃 시 클라이언트 상태도 업데이트
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, initialUser]);

  const signIn = async (provider: "kakao" | "google") => {
    // 서버 액션 호출
    if (provider === "kakao") {
      await signInWithKakao();
    } else {
      await signInWithGoogle();
    }
    // redirect()가 호출되므로 여기까지 도달하지 않음
  };

  const signOut = async () => {
    // 서버 액션 호출
    await serverSignOut();
    // redirect()가 호출되므로 여기까지 도달하지 않음
    // 하지만 안전을 위해 상태도 업데이트
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 인증 Context를 사용하는 커스텀 훅
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

