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
  Settings
} from "lucide-react";

interface ApiIntegrationInfoProps {
  data: {
    gemini: {
      enabled: boolean;
      configured: boolean;
      model: string;
      apiVersion: string;
      keyStatus: string;
      priority: number;
      description: string;
      features: string[];
    };
    vision: {
      enabled: boolean;
      configured: boolean;
      authMethod: string;
      credentialsPath: string;
      priority: number;
      description: string;
      features: string[];
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
    recommendations: Array<{
      type: string;
      message: string;
      action: string;
      priority: string;
    }>;
    summary: {
      totalApis: number;
      enabledApis: number;
      status: string;
    };
  };
}

export function ApiIntegrationInfo({ data }: ApiIntegrationInfoProps) {
  const { gemini, vision, ocrFlow, recommendations, summary } = data;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API 연동 정보</h1>
          <p className="text-muted-foreground mt-2">
            현재 설정된 OCR API 연동 상태 및 설정 정보
          </p>
        </div>
        <Badge 
          variant={summary.status === "정상" ? "default" : "destructive"}
          className="text-sm px-4 py-2"
        >
          {summary.status}
        </Badge>
      </div>

      {/* 요약 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            연동 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{summary.totalApis}</div>
              <div className="text-sm text-muted-foreground">총 API 수</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.enabledApis}</div>
              <div className="text-sm text-muted-foreground">활성화된 API</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {ocrFlow.currentStrategy}
              </div>
              <div className="text-sm text-muted-foreground">현재 전략</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 권장 사항 */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">권장 사항</h2>
          {recommendations.map((rec, index) => (
            <Alert 
              key={index}
              variant={rec.type === "success" ? "default" : rec.type === "warning" ? "destructive" : "default"}
            >
              {rec.type === "success" && <CheckCircle2 className="h-4 w-4" />}
              {rec.type === "warning" && <AlertTriangle className="h-4 w-4" />}
              {rec.type === "info" && <Info className="h-4 w-4" />}
              <AlertTitle className="flex items-center gap-2">
                {rec.message}
                <Badge variant="outline">{rec.priority}</Badge>
              </AlertTitle>
              <AlertDescription>{rec.action}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* OCR 처리 흐름 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            OCR 처리 흐름
          </CardTitle>
          <CardDescription>
            이미지 텍스트 추출 시 실행되는 단계별 처리 과정
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{ocrFlow.step1.title}</h3>
                  <Badge variant={ocrFlow.step1.status === "사용 가능" ? "default" : "secondary"}>
                    {ocrFlow.step1.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{ocrFlow.step1.action}</p>
              </div>
              {ocrFlow.step1.status === "사용 가능" && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {ocrFlow.step1.status !== "사용 가능" && (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{ocrFlow.step2.title}</h3>
                  <Badge variant={ocrFlow.step2.status === "사용 가능" ? "default" : "secondary"}>
                    {ocrFlow.step2.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{ocrFlow.step2.action}</p>
              </div>
              {ocrFlow.step2.status === "사용 가능" && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {ocrFlow.step2.status !== "사용 가능" && (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gemini API 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Gemini API (1순위)
              </CardTitle>
              <CardDescription className="mt-2">{gemini.description}</CardDescription>
            </div>
            {gemini.enabled ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-4 w-4" />
                활성화
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-4 w-4" />
                비활성화
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">모델</div>
              <div className="font-mono text-sm">{gemini.model}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">API 버전</div>
              <div className="font-mono text-sm">{gemini.apiVersion}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm font-medium text-muted-foreground mb-1">API 키 상태</div>
              <div className="font-mono text-sm">{gemini.keyStatus}</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">주요 기능</div>
            <ul className="space-y-1">
              {gemini.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Vision API 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Google Vision API (2순위, 폴백)
              </CardTitle>
              <CardDescription className="mt-2">{vision.description}</CardDescription>
            </div>
            {vision.enabled ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-4 w-4" />
                활성화
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-4 w-4" />
                비활성화
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">인증 방법</div>
              <div className="font-mono text-sm">{vision.authMethod}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm font-medium text-muted-foreground mb-1">인증 파일 경로</div>
              <div className="font-mono text-sm break-all">{vision.credentialsPath}</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">주요 기능</div>
            <ul className="space-y-1">
              {vision.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 환경 변수 설정 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle>환경 변수 설정 가이드</CardTitle>
          <CardDescription>
            Vercel 대시보드에서 다음 환경 변수를 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <div className="mb-2 text-muted-foreground"># Gemini API (필수)</div>
            <div>GEMINI_API_KEY=AIzaSy...</div>
            
            <div className="mt-4 mb-2 text-muted-foreground"># Vision API (선택, 폴백용)</div>
            <div>GOOGLE_APPLICATION_CREDENTIALS=./service-account.json</div>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>설정 방법</AlertTitle>
            <AlertDescription>
              Vercel 대시보드 → Settings → Environment Variables에서 추가하고 재배포하세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
