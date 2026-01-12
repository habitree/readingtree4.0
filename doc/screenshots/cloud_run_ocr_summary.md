# Google Cloud Run 및 이미지 텍스트 추출 서비스 요약

## 1. Google Cloud Run 개요
Google Cloud Run은 컨테이너화된 애플리케이션을 빠르고 안전하게 실행할 수 있는 **완전 관리형 서버리스 컴퓨팅 플랫폼**입니다.

### 주요 특징
- **서버리스 (Serverless)**: 인프라 관리 부담 없이 코드 배포에만 집중할 수 있습니다.
- **자동 확장 (Autoscaling)**: 트래픽에 따라 0에서 무한대로 인스턴스를 자동으로 확장하며, 요청이 없을 때는 비용이 발생하지 않는 **Scale-to-zero**를 지원합니다.
- **컨테이너 기반**: Docker 컨테이너를 사용하므로 언어나 라이브러리에 구애받지 않고 유연한 개발이 가능합니다.
- **종량제 요금**: 실제 사용한 리소스(CPU, 메모리)에 대해서만 100밀리초 단위로 비용이 청구됩니다.

---

## 2. 이미지 텍스트 추출 (OCR) 서비스 상세
제공된 정보를 바탕으로 구성된 이미지 인식 및 텍스트 추출 서비스의 세부 사항입니다.

### 서비스 정보
- **서비스 명**: `extractTextFromImage`
- **리전 (Region)**: `us-central1` (미국 중부)
- **서비스 URL**: [https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage](https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage)

### 서비스 기능
- **텍스트 추출**: 이미지 파일 내의 문자를 인식하여 디지털 텍스트 데이터로 변환합니다.
- **클라우드 통합**: Google Cloud Functions(현 Cloud Run Functions) 기반으로 구축되어, 이미지 업로드 시 실시간으로 트리거되어 처리할 수 있습니다.

---

## 3. 비용 (Pricing) 개요
Cloud Run의 비용은 실제 서비스 사용량에 따라 결정되며, 매우 경제적인 **사용량 기반 모델**입니다.

### 주요 과금 항목 (us-central1 기준)
- **CPU 및 메모리**: 요청을 처리하는 동안 인스턴스에 할당된 리소스에 대해 100밀리초 단위로 과금됩니다.
- **요청 횟수**: 100만 건당 약 $0.40 수준입니다.
- **네트워크**: 서비스에서 외부로 전송되는 데이터 양에 따라 과금됩니다.

### 무료 등급 (Free Tier)
Google Cloud는 매달 넉넉한 무료 한도를 제공합니다:
- **CPU**: 처음 18만 vCPU-초
- **메모리**: 처음 36만 GiB-초
- **요청**: 처음 200만 건
- **네트워크**: 매달 1GiB 데이터 전송 (북미 내)

> [!TIP]
> 개인 프로젝트나 소규모 서비스의 경우, 대부분의 트래픽을 무료 등급 범위 내에서 처리할 수 있어 비용 부담이 거의 없습니다.

---

## 4. 프로젝트 활용 및 연동 자료
현재 진행 중인 프로젝트에 `extractTextFromImage` 기능을 도입하기 위한 가이드입니다.

### 호출 방법 (API 연동)
제공된 URL은 HTTPS POST 요청을 통해 이미지 데이터를 받고 텍스트를 응답하는 방식입니다.

#### Node.js (Axios 활용 예시)
```javascript
const axios = require('axios');
const fs = require('fs');

async function extractText(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  try {
    const response = await axios.post('https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage', {
      image: base64Image
    });
    console.log('추출된 텍스트:', response.data.text);
  } catch (error) {
    console.error('OCR 요청 실패:', error);
  }
}
```

### 필수 확인 및 준비 사항
1. **인증 (Authentication)**: 해당 함수가 비공개(Private)인 경우, Google Cloud Service Account의 ID 토큰을 Authorization 헤더에 실어 보내야 합니다.
2. **제한 사항**: 이미지 크기(보통 10MB 이하) 및 포맷(JPG, PNG 등)에 따른 제약 사항을 확인해야 합니다.
3. **Google Vision API**: 내부적으로 Vision API를 사용하는 경우, 해당 API의 사용량도 프로젝트 비용에 합산될 수 있습니다.

---

## 5. 처리당 예상 비용 산정 (2~3매 기준)
요청당 이미지 2~3매를 처리할 때발생하는 비용을 Cloud Run과 Cloud Vision API를 합산하여 추정한 결과입니다.

### 예상 시나리오 (1회 요청 시)
- **OCR 처리**: 이미지 3매 (문서 텍스트 추출 기능 사용)
- **리소스 사용**: CPU 1개, 메모리 512MB 기준 약 2초간 실행

### 항목별 상세 비용 (매월 1,000건 이하 사용 시)
이미지 2~3매 수준의 소규모 요청은 **무료 등급 내에서 100% 소화 가능**합니다.
- **Cloud Run (실행 비용)**: $0 (무료 한도 내)
- **Cloud Vision API (OCR 기능)**: $0 (매월 첫 1,000개 이미지 무료)
- **합계**: **월 1,000개 이미지까지는 0원**

### 항목별 상세 비용 (무료 등급 초과 시 - 유료 전환 후)
무료 한도를 모두 사용한 이후의 예상 금액입니다. (1달러 = 1,400원 환율 가정)
- **OCR 비용**: 이미지 1,000매당 $1.50 $\rightarrow$ 3매 기준 약 $0.0045 (약 6.3원)
- **Cloud Run 비용**: 요청 100만 건당 $0.40 $\rightarrow$ 1회 요청 기준 약 $0.0000004 (무시 가능한 수준)
- **합계**: **1회 처리(3매)당 약 7원 내외**

> [!NOTE]
> 매우 저렴한 비용으로 대량의 이미지를 처리할 수 있습니다. 1만 원이면 약 1,400회 이상의 요청(이미지 4,200매 이상)을 처리할 수 있는 수준입니다.

### 참고 문서
- [Cloud Run 가격 책정 상세](https://cloud.google.com/run/pricing?hl=ko)
- [Cloud Vision API 가격 책정 상세](https://cloud.google.com/vision/pricing?hl=ko)
- [Cloud Vision API (OCR) 문서](https://cloud.google.com/vision/docs/ocr?hl=ko)
- [Node.js용 Google Cloud 클라이언트 라이브러리](https://cloud.google.com/nodejs/docs/reference/vision/latest)
