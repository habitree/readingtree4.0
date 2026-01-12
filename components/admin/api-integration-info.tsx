"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Zap, 
  Shield,
  ArrowRight,
  Settings,
  Search,
  Key,
  Globe,
  FileKey,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiIntegrationInfoProps {
  apiInfo: {
    // 인증
    supabase: {
      provider: string;
      enabled: boolean;
      configured: boolean;
      authMethods: {
        oauth: {
          kakao: string;
          google: string;
        };
        email: string;
      };
      urlStatus: string;
      anonKeyStatus: string;
      serviceRoleKeyStatus: string;
      apiReference: string;
      features: string[];
      notes: string;
    };
    kakaoSdk: {
      provider: string;
      enabled: boolean;
      configured: boolean;
      keyStatus: string;
      apiReference: string;
      features: string[];
      notes: string;
    };
    
    // 검색
    naver: {
      provider: string;
      enabled: boolean;
      configured: boolean;
      clientIdStatus: string;
      clientSecretStatus: string;
      apiReference: string;
      features: string[];
      notes: string;
    };
    
    // OCR
    gemini: {
      provider: string;
      enabled: boolean;
      configured: boolean;
      model: string;
      apiVersion: string;
      keyStatus: string;
      priority: number;
      description: string;
      apiReference: string;
      features: string[];
      notes: string;
    };
    vision: {
      provider: string;
      enabled: boolean;
      configured: boolean;
      authMethod: string;
      credentialsPath: string;
      priority: number;
      description: string;
      apiReference: string;
      features: string[];
      notes: string;
    };
    ocrFlow: {
      step1: {
        title: string;
        status: string;
        action: string;
      };
      step2: {
        title: string;
        status: string;
        action: string;
      };
      currentStrategy: string;
    };
    
    // 기타
    app: {
      appUrl: string;
      notes: string;
    };
    
    // 권장 사항
    recommendations: Array<{
      type: string;
      message: string;
      action: string;
      priority: string;
      category: string;
    }>;
    
    // 요약
    summary: {
      totalApis: number;
      enabledApis: number;
      criticalApis: number;
      criticalEnabled: boolean;
      status: string;
    };
  };
}

export function ApiIntegrationInfo({ apiInfo }: ApiIntegrationInfoProps) {
  const { 
    supabase, 
    kakaoSdk, 
    naver, 
    gemini, 
    vision, 
    ocrFlow, 
    app, 
    recommendations, 
    summary 
  } = apiInfo;

  // 카테고리별 권장 사항 분류
  const recommendationsByCategory = {
    인증: recommendations.filter(r => r.category === "인증"),
    검색: recommendations.filter(r => r.category === "검색"),
    OCR: recommendations.filter(r => r.category === "OCR"),
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 헤더 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">API 연동 정보</h1>
        <p className="text-muted-foreground">
          ReadingTree 서비스의 모든 외부 API 연동 현황 및 설정 정보
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 API 수</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalApis}개</div>
            <p className="text-xs text-muted-foreground">현재 연동 가능한 외부 API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성화된 API</CardTitle>
            {summary.enabledApis > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.enabledApis}개</div>
            <p className="text-xs text-muted-foreground">현재 사용 중인 API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">필수 API 상태</CardTitle>
            {summary.criticalEnabled ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.criticalEnabled ? "정상" : "누락"}
            </div>
            <p className="text-xs text-muted-foreground">
              필수 API {summary.criticalApis}개 중 {summary.criticalEnabled ? "모두" : "일부"} 설정됨
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 상태</CardTitle>
            <Badge 
              variant={summary.status === "완벽" ? "default" : summary.status === "정상" ? "default" : "destructive"}
              className="text-xs"
            >
              {summary.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{summary.status}</div>
            <p className="text-xs text-muted-foreground">전체 API 연동 상태</p>
          </CardContent>
        </Card>
      </div>

      {/* 긴급 권장 사항 */}
      {recommendationsByCategory.인증.some(r => r.type === "error") && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>긴급: 필수 API 설정 누락</AlertTitle>
          <AlertDescription>
            {recommendationsByCategory.인증
              .filter(r => r.type === "error")
              .map(r => r.message)
              .join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* 권장 사항 (카테고리별) */}
      {Object.entries(recommendationsByCategory).map(([category, recs]) => 
        recs.length > 0 && (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">
                {category} 관련 권장 사항
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recs.map((rec, index) => (
                <Alert 
                  key={index}
                  variant={
                    rec.type === "error" ? "destructive" :
                    rec.type === "warning" ? "default" :
                    rec.type === "success" ? "default" : "default"
                  }
                  className={cn(
                    rec.type === "success" && "border-green-500 bg-green-500/10"
                  )}
                >
                  {rec.type === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {rec.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                  {rec.type === "error" && <XCircle className="h-4 w-4" />}
                  {rec.type === "info" && <Info className="h-4 w-4" />}
                  <AlertTitle className="flex items-center gap-2">
                    {rec.message}
                    <Badge variant="outline" className="text-xs">
                      {rec.priority}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>{rec.action}</AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )
      )}

      {/* ========== 1. 인증 API ========== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          인증 API
        </h2>

        {/* Supabase Auth */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className={cn("h-5 w-5", supabase.enabled ? "text-green-500" : "text-red-500")} />
                  {supabase.provider}
                </CardTitle>
                <CardDescription className="mt-2">
                  모든 인증 기능의 핵심 인프라
                </CardDescription>
              </div>
              <Badge variant={supabase.enabled ? "default" : "destructive"}>
                {supabase.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground mb-1">Project URL</div>
                <div className="font-mono text-xs break-all">{supabase.urlStatus}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground mb-1">Anon Key</div>
                <div className="font-mono text-xs break-all">{supabase.anonKeyStatus}</div>
              </div>
              <div className="col-span-2">
                <div className="font-medium text-muted-foreground mb-1">Service Role Key</div>
                <div className="font-mono text-xs">{supabase.serviceRoleKeyStatus}</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">지원하는 인증 방법</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{supabase.authMethods.oauth.kakao}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{supabase.authMethods.oauth.google}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{supabase.authMethods.email}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {supabase.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a 
                href={supabase.apiReference} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Kakao SDK (선택사항) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className={cn("h-5 w-5", kakaoSdk.enabled ? "text-green-500" : "text-muted-foreground")} />
                  {kakaoSdk.provider}
                  <Badge variant="outline" className="text-xs">선택사항</Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {kakaoSdk.notes}
                </CardDescription>
              </div>
              <Badge variant={kakaoSdk.enabled ? "default" : "secondary"}>
                {kakaoSdk.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <div className="font-medium text-muted-foreground mb-1">App Key 상태</div>
              <div className="font-mono text-xs">{kakaoSdk.keyStatus}</div>
            </div>
            
            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {kakaoSdk.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a 
                href={kakaoSdk.apiReference} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 2. 검색 API ========== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6" />
          검색 API
        </h2>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className={cn("h-5 w-5", naver.enabled ? "text-green-500" : "text-red-500")} />
                  {naver.provider}
                </CardTitle>
                <CardDescription className="mt-2">
                  {naver.notes}
                </CardDescription>
              </div>
              <Badge variant={naver.enabled ? "default" : "destructive"}>
                {naver.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground mb-1">Client ID</div>
                <div className="font-mono text-xs break-all">{naver.clientIdStatus}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground mb-1">Client Secret</div>
                <div className="font-mono text-xs">{naver.clientSecretStatus}</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {naver.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a 
                href={naver.apiReference} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 3. OCR API ========== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6" />
          OCR API
        </h2>

        {/* OCR 처리 흐름 */}
        <Card>
          <CardHeader>
            <CardTitle>OCR 처리 흐름</CardTitle>
            <CardDescription>이미지 텍스트 추출 시도 순서</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[ocrFlow.step1, ocrFlow.step2].map((step, index) => (
                <div key={index}>
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-white",
                        index === 0 ? "bg-primary" : "bg-secondary"
                      )}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        <Badge variant={step.status === "사용 가능" ? "default" : "secondary"}>
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.action}</p>
                    </div>
                    {step.status === "사용 가능" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {index === 0 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">현재 전략</div>
              <div className="text-sm">{ocrFlow.currentStrategy}</div>
            </div>
          </CardContent>
        </Card>

        {/* Gemini API */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className={cn("h-5 w-5", gemini.enabled ? "text-green-500" : "text-red-500")} />
                  {gemini.provider}
                  <Badge variant="outline" className="text-xs">1순위</Badge>
                </CardTitle>
                <CardDescription className="mt-2">{gemini.description}</CardDescription>
              </div>
              <Badge variant={gemini.enabled ? "default" : "destructive"}>
                {gemini.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground mb-1">모델</div>
                <div className="font-mono text-xs">{gemini.model}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground mb-1">API 버전</div>
                <div className="font-mono text-xs">{gemini.apiVersion}</div>
              </div>
              <div className="col-span-2">
                <div className="font-medium text-muted-foreground mb-1">API 키 상태</div>
                <div className="font-mono text-xs break-all">{gemini.keyStatus}</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {gemini.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a 
                href={gemini.apiReference} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Vision API */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileKey className={cn("h-5 w-5", vision.enabled ? "text-green-500" : "text-red-500")} />
                  {vision.provider}
                  <Badge variant="outline" className="text-xs">2순위 (폴백)</Badge>
                </CardTitle>
                <CardDescription className="mt-2">{vision.description}</CardDescription>
              </div>
              <Badge variant={vision.enabled ? "default" : "destructive"}>
                {vision.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground mb-1">인증 방법</div>
                <div className="font-mono text-xs">{vision.authMethod}</div>
              </div>
              <div className="col-span-2">
                <div className="font-medium text-muted-foreground mb-1">서비스 계정 파일 경로</div>
                <div className="font-mono text-xs break-all">{vision.credentialsPath}</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {vision.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a 
                href={vision.apiReference} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 4. 기타 설정 ========== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            기타 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <div className="font-medium text-muted-foreground mb-1">앱 기본 URL</div>
            <div className="font-mono text-xs break-all">{app.appUrl}</div>
            <p className="text-xs text-muted-foreground mt-2">{app.notes}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
