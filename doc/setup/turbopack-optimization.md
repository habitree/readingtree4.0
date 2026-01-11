# Turbopack 최적화 가이드

**작성일:** 2026년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## Turbopack 활성화

### 설정 변경

**`next.config.js`:**
```javascript
experimental: {
  turbo: {
    // Turbopack 최적화 설정
  },
}
```

**`package.json`:**
```json
{
  "scripts": {
    "dev": "next dev --turbo"
  }
}
```

---

## Turbopack 오류 해결

### "failed to create whole tree" 오류

**원인:**
- 파일 시스템 캐시 문제
- .next 폴더 손상
- node_modules 캐시 문제

**해결 방법:**

1. **캐시 폴더 삭제**
   ```powershell
   Remove-Item -Path .next -Recurse -Force
   Remove-Item -Path node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue
   ```

2. **서버 재시작**
   ```powershell
   npm run dev
   ```

3. **여전히 오류가 발생하면**
   - Node.js 버전 확인 (18.x 이상 권장)
   - 디스크 공간 확인
   - 파일 시스템 권한 확인

---

## 성능 비교

### Turbopack vs Webpack

- **빌드 속도:** Turbopack이 2-10배 빠름
- **HMR (Hot Module Replacement):** Turbopack이 더 빠른 업데이트
- **메모리 사용:** Turbopack이 더 효율적

---

## 참고 사항

- Turbopack은 Next.js 16에서 안정화됨
- 개발 환경에서만 사용 (프로덕션 빌드는 webpack 사용)
- 일부 플러그인은 아직 지원되지 않을 수 있음
