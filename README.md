# Sponsor Creator — Brand Studio

AI로 인플루언서 협찬 화보 4컷을 자동 생성하는 브랜드 스튜디오.

## 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:5173 접속 → 상단에 Gemini API 키 입력 → 사진 업로드 → 생성.

## Vercel 배포

1. `git init && git add . && git commit -m "init"`
2. GitHub 리포에 푸시
3. [vercel.com/new](https://vercel.com/new) → 리포 선택 → Deploy
4. (선택) **Settings → Environment Variables**에서 Firebase 변수 추가

## 환경 변수

| 변수 | 설명 |
|---|---|
| `VITE_FIREBASE_CONFIG` | Firebase 설정 JSON 문자열. 미설정 시 Firebase 비활성화 (localStorage만 사용) |
| `VITE_APP_ID` | Firestore 경로 prefix (기본: `sponsor-creator`) |

Gemini API 키는 사용자가 UI에서 직접 입력 (BYOK).

## 구조

```
src/
├── App.jsx                생성 플로우 orchestrator
├── main.jsx / index.css
├── lib/
│   ├── firebase.js        싱글톤 초기화
│   ├── gemini.js          generateImage()
│   ├── image.js           압축·업로드 유틸
│   └── utils.js           fetchWithRetry
├── hooks/
│   ├── useAuth.js
│   ├── useSettings.js
│   └── useNotification.js
├── constants/index.js     프리셋·시간·조명·카테고리
└── components/
    ├── Header.jsx
    ├── SourcePanel.jsx
    ├── DirectionPanel.jsx
    ├── PreviewPanel.jsx
    ├── ImageDropzone.jsx
    └── Notification.jsx
```
