# 대만 맛집 정보 - Node.js 웹 애플리케이션

Node.js와 Express로 만든 대만 맛집 정보 웹 애플리케이션입니다.

## 특징

- **Express.js 서버**: RESTful API 제공
- **반응형 웹 디자인**: 모바일 및 데스크톱 지원
- **Google Places API 통합**: 실제 매장 이미지 자동 로드
- **캐싱 시스템**: node-cache를 사용한 효율적인 이미지 캐싱 (7일간 유효)
- **인앱브라우저 지원**: 모바일 인앱브라우저에서 테스트 가능

## 설치 방법

```bash
cd 대만맛집-nodejs
npm install
```

## 실행 방법

### 기본 실행
```bash
npm start
```

### 개발 모드 실행
```bash
npm run dev
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## Google Places API 설정 (선택사항)

Google Places API 키를 설정하면 실제 매장 이미지를 가져올 수 있습니다. API 키가 없어도 프로그램은 정상 작동합니다 (Unsplash 폴백 이미지 사용).

### macOS/Linux:
```bash
export GOOGLE_PLACES_API_KEY='your-api-key-here'
npm start
```

### Windows (PowerShell):
```powershell
$env:GOOGLE_PLACES_API_KEY='your-api-key-here'
npm start
```

### Windows (CMD):
```cmd
set GOOGLE_PLACES_API_KEY=your-api-key-here
npm start
```

## API 엔드포인트

- `GET /api/category/:category` - 카테고리별 맛집 정보
  - 예: `/api/category/면류`
  
- `GET /api/market/:market` - 야시장별 맛집 정보
  - 예: `/api/market/스린 야시장`
  
- `GET /api/city-tour/:area` - 도심투어별 맛집 정보
  - 예: `/api/city-tour/시먼딩`
  
- `GET /api/places` - 갈만한 곳 정보

- `GET /api/image/:restaurantName/:location` - Google Places API를 통한 이미지 가져오기

## 기능

- **맛집 검색**: 면류, 밥류, 만두, 디저트 카테고리별로 맛집 정보 검색
- **야시장 검색**: 스린, 닝샤, 펑자, 단수이, 라오허제, 난지창 야시장별 맛집 리스트
- **도심투어 검색**: 시먼딩, 융캉제, 중산카페거리 지역별 맛집 및 카페 추천
- **갈만한 곳 검색**: 대만 관광 명소 정보
- **구글 지도 링크**: 각 맛집의 구글 지도 링크 제공
- **실시간 이미지 로딩**: Google Places API를 통한 실제 매장 이미지

## 기술 스택

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **캐싱**: node-cache
- **HTTP 클라이언트**: axios
- **CORS**: cors

## 인앱브라우저 테스트

모바일 기기에서 테스트하려면:

1. 서버를 실행합니다: `npm start`
2. 컴퓨터의 로컬 IP 주소를 확인합니다
   - macOS/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`
3. 모바일 기기의 인앱브라우저에서 `http://[YOUR-IP]:3000`으로 접속합니다

예: `http://192.168.0.10:3000`

## 프로젝트 구조

```
대만맛집-nodejs/
├── server.js           # Express 서버 및 API 라우트
├── package.json        # 프로젝트 설정 및 의존성
├── README.md          # 프로젝트 문서
└── public/            # 프론트엔드 파일
    ├── index.html     # 메인 HTML
    ├── styles.css     # 스타일시트
    └── app.js         # 클라이언트 JavaScript
```

## 라이선스

ISC

## 참고사항

- 이 프로젝트는 Python CustomTkinter 버전에서 Node.js 웹 버전으로 포팅되었습니다.
- Google Places API는 선택사항이며, 없어도 정상 작동합니다.
- 캐시는 메모리에 저장되므로 서버 재시작 시 초기화됩니다.

