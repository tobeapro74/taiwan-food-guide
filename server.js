const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 캐시 설정 (7일간 유효)
const imageCache = new NodeCache({ stdTTL: 604800, checkperiod: 86400 });

// Google Places API 키 (환경 변수에서 가져오기)
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyAP4-MpGNRYObV4vbPMjXdWYSUCLoux1s4';

// 대만 맛집 데이터
const taiwanFoodMap = {
  "면류": [
    {"이름": "아종면선", "위치": "타이베이 시먼딩", "특징": "걸쭉한 국물의 면선으로 유명한 맛집"},
    {"이름": "용캉우육면", "위치": "타이베이 용캉제", "특징": "진한 국물의 우육면 전문점"}
  ],
  "만두": [
    {"이름": "딩타이펑", "위치": "타이베이 신이", "특징": "세계적으로 유명한 샤오롱바오 전문점"},
    {"이름": "융캉제 딩타이펑", "위치": "타이베이 융캉제", "특징": "융캉제에 위치한 딩타이펑 지점"}
  ],
  "밥류": [
  ],
  "디저트": [
    {"이름": "스무시 하우스", "위치": "타이베이 스린", "특징": "유명한 망고빙수 전문점"},
    {"이름": "아이메이 홍두빙", "위치": "단수이", "특징": "유명한 팥빙수 전문점", "야시장": "단수이 야시장"},
    {"이름": "스린뻐 또우화", "위치": "Jihe Rd", "특징": "대만식 두부 디저트", "야시장": "스린 야시장"},
    {"이름": "우유튀김", "위치": "Jihe Rd, 7-1號", "특징": "튀긴 우유", "야시장": "스린 야시장"},
    {"이름": "샤오황 따빠처우", "위치": "스린야시장 내", "특징": "고구마볼", "야시장": "스린 야시장"},
    {"이름": "류유지 타로볼 튀김", "위치": "타이베이 닝샤 야시장 91번 노점", "특징": "미슐랭 추천, 바삭하고 고소한 타로볼 튀김", "야시장": "닝샤 야시장"},
    {"이름": "고구마볼", "위치": "타이베이 닝샤 야시장 초입 2번 노점", "특징": "오리지널, 치즈, 초콜릿 등 다양한 맛의 고구마볼", "야시장": "닝샤 야시장"},
    {"이름": "대만식 우유튀김", "위치": "타이중 펑자 야시장 Wenhua Rd", "특징": "겉은 바삭, 속은 부드러운 디저트", "야시장": "펑자 야시장"},
    {"이름": "타로볼 튀김", "위치": "타이중 펑자 야시장 초입", "특징": "미슐랭 추천 간식으로 유명한 고소한 타로볼", "야시장": "펑자 야시장"}
  ],
  "길거리음식": [
    {"이름": "하오따따 지파이", "위치": "Jihe Rd, Shilin District", "특징": "대왕 지파이 (닭가슴살 튀김)", "야시장": "스린 야시장"},
    {"이름": "왕자 치즈감자", "위치": "No. 1, Jihe Rd", "특징": "치즈감자", "야시장": "스린 야시장"},
    {"이름": "충성호 굴전", "위치": "Dadong Rd, Shilin District", "특징": "굴전, 오아첸", "야시장": "스린 야시장"},
    {"이름": "아훼이 면선", "위치": "스린야시장 내", "특징": "대만식 면선 (곱창국수)", "야시장": "스린 야시장"},
    {"이름": "위엔화볜 굴전", "위치": "타이베이 닝샤 야시장 59번 부근", "특징": "현지인 강추, 굴이 풍부하고 촉촉한 굴 오믈렛", "야시장": "닝샤 야시장"},
    {"이름": "지파이", "위치": "타이베이 닝샤 야시장 78번 노점", "특징": "대왕 지파이 (닭가슴살 튀김), 바삭한 튀김과 촉촉한 속살", "야시장": "닝샤 야시장"},
    {"이름": "샹창 찹쌀 소세지", "위치": "타이베이 닝샤 야시장 59-2번 노점", "특징": "찹쌀과 소세지의 조화, 든든한 간식", "야시장": "닝샤 야시장"},
    {"이름": "오징어튀김", "위치": "타이베이 닝샤 야시장 89번 노점", "특징": "바다향 가득, 바삭한 식감", "야시장": "닝샤 야시장"},
    {"이름": "구운 옥수수", "위치": "타이중 펑자 야시장", "특징": "5가지 맛 선택 가능 (오리지널, 후추, 매운맛 등) 무지개 옥수수 구이", "야시장": "펑자 야시장"},
    {"이름": "밍룬 계란 팬케이크", "위치": "타이중 펑자 야시장 Fuxing Rd 546번", "특징": "바삭한 대만식 계란 팬케이크와 다양한 속재료", "야시장": "펑자 야시장"},
    {"이름": "1번 닭날개 볶음밥", "위치": "타이중 펑자 야시장 펑자 대학교 근처", "특징": "닭날개 속에 밥이 들어간 독특한 간식", "야시장": "펑자 야시장"},
    {"이름": "펑자 지파이", "위치": "타이중 펑자 야시장 중심부", "특징": "바삭하고 촉촉한 대왕 닭가슴살 튀김", "야시장": "펑자 야시장"}
  ],
  "갈만한 곳": [
    {"이름": "단수이", "위치": "신베이시 단수이구", "특징": "강가의 아름다운 해안 도시, 유명한 옛 거리와 맛집들이 많음", "야시장": "단수이 야시장"},
    {"이름": "고양이마을 (후투엔)", "위치": "신베이시 루이팡구", "특징": "고양이들이 자유롭게 돌아다니는 아기자기한 마을", "야시장": ""},
    {"이름": "지우펀", "위치": "신베이시 루이팡구", "특징": "구릉 지대에 위치한 작은 산골마을, 카페와 갤러리가 많음", "야시장": ""},
    {"이름": "예류", "위치": "신베이시 완리구", "특징": "해안 절벽과 바위로 유명한 경관 명소", "야시장": ""},
    {"이름": "스펀", "위치": "신베이시 루이팡구", "특징": "물이 뿜어나오는 특별한 지질 현상으로 유명", "야시장": ""},
    {"이름": "용산사", "위치": "타이베이시 베이터우구", "특징": "타이베이 최고의 절, 아름다운 중국식 건축물", "야시장": ""},
    {"이름": "중정기념당", "위치": "타이베이시 중정구", "특징": "타이완의 상징적인 건물, 넓은 광장과 아름다운 정원", "야시장": ""},
    {"이름": "융캉제", "위치": "타이베이시 다안구", "특징": "전통 대만 거리, 맛집과 쇼핑거리가 많은 번화가"},
    {"이름": "고궁박물관", "위치": "타이베이시 스린구", "특징": "세계 최대 규모의 중국 미술품 컬렉션", "야시장": ""},
    {"이름": "타이베이 근교 온천", "위치": "타이베이시 베이터우구/신베이시", "특징": "베이터우, 지룽 등 근교에 위치한 유명 온천 지역", "야시장": ""},
    {"이름": "타이베이 101", "위치": "타이베이시 신이구", "특징": "타이베이의 랜드마크, 전망대와 쇼핑몰", "야시장": ""}
  ],
  "야시장별": {
    "스린 야시장": ["하오따따 지파이", "왕자 치즈감자", "충성호 굴전", "우유튀김", "아훼이 면선", "스린뻐 또우화", "샤오황 따빠처우"],
    "닝샤 야시장": ["류유지 타로볼 튀김", "위엔화볜 굴전", "지파이", "고구마볼", "샹창 찹쌀 소세지", "오징어튀김"],
    "펑자 야시장": ["대만식 우유튀김", "타로볼 튀김", "구운 옥수수", "밍룬 계란 팬케이크", "1번 닭날개 볶음밥", "펑자 지파이"],
    "단수이 야시장": ["아이메이 홍두빙"],
    "라오허제 야시장": [],
    "난지창 야시장": []
  },
  "도심투어": {
    "시먼딩": [
      {"이름": "아종면선", "위치": "타이베이 시먼딩", "특징": "걸쭉한 국물의 면선으로 유명한 맛집"},
      {"이름": "행복당", "위치": "타이베이 시먼딩", "특징": "유명한 타로 밀크티와 팥빙수 전문 디저트 찻집"},
      {"이름": "삼형제빙수", "위치": "타이베이 시먼딩", "특징": "망고빙수 맛집, 시먼딩 대표 빙수집"},
      {"이름": "스무시 하우스 시먼딩점", "위치": "타이베이 시먼딩", "특징": "유명한 망고빙수 전문점"},
      {"이름": "시먼딩 펑차", "위치": "타이베이 시먼딩", "특징": "유명한 펄 밀크티 전문점"},
      {"이름": "시먼딩 차관", "위치": "타이베이 시먼딩", "특징": "전통 대만 찻집, 우롱차와 철관음 전문"},
      {"이름": "천천빙", "위치": "타이베이 시먼딩", "특징": "대만 전통 찻집, 빙수와 디저트도 판매"},
      {"이름": "시먼카페", "위치": "타이베이 시먼딩", "특징": "트렌디한 카페, 인스타 감성 사진 명소"},
      {"이름": "스타벅스 시먼딩점", "위치": "타이베이 시먼딩", "특징": "쇼핑 중 휴식하기 좋은 카페"}
    ],
    "융캉제": [
      {"이름": "용캉우육면", "위치": "타이베이 용캉제", "특징": "진한 국물의 우육면 전문점"},
      {"이름": "융캉제 딩타이펑", "위치": "타이베이 융캉제", "특징": "유명한 샤오롱바오 전문점"},
      {"이름": "옐로우 커피", "위치": "타이베이 융캉제", "특징": "브런치와 커피가 유명한 카페"}
    ],
    "중산카페거리": [
      {"이름": "VWI by CHADWANG", "위치": "타이베이 중산", "특징": "유명한 브런치 카페"},
      {"이름": "Fika Fika Cafe", "위치": "타이베이 중산", "특징": "원두 로스팅 전문 카페"},
      {"이름": "Congrats Cafe", "위치": "타이베이 중산", "특징": "예쁜 디저트와 커피가 유명한 카페"}
    ]
  }
};

// Google Places API를 통해 이미지 가져오기
async function getPlaceImageFromGoogle(restaurantName, location) {
  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  const cacheKey = `${restaurantName}|${location}`;
  const cachedImage = imageCache.get(cacheKey);
  
  if (cachedImage) {
    return cachedImage;
  }

  try {
    const searchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    
    // 1순위: 맛집 이름만으로 검색 (맛집 이름이 우선되도록)
    let searchQuery = `${restaurantName} Taipei Taiwan`;
    let searchParams = {
      query: searchQuery,
      key: GOOGLE_PLACES_API_KEY,
      language: 'ko'
    };

    let searchResponse = await axios.get(searchUrl, { params: searchParams, timeout: 10000 });
    let searchData = searchResponse.data;

    // 검색 결과가 있고, 첫 번째 결과가 맛집 이름과 관련이 있는지 확인
    if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
      const firstResult = searchData.results[0];
      const resultName = (firstResult.name || '').toLowerCase();
      const restaurantNameLower = restaurantName.toLowerCase();
      
      // 첫 번째 결과가 맛집 이름을 포함하는지 확인
      // 또는 "night market", "야시장" 같은 일반적인 장소가 아닌지 확인
      const isRestaurantMatch = resultName.includes(restaurantNameLower) || 
                                restaurantNameLower.includes(resultName.split(' ')[0]) ||
                                (!resultName.includes('night market') && !resultName.includes('야시장') && !resultName.includes('market'));
      
      if (isRestaurantMatch) {
        const placeId = firstResult.place_id;
        return await getPhotoFromPlaceId(placeId, cacheKey);
      }
    }

    // 2순위: 맛집 이름 + 위치 정보로 검색 (위치 정보 정리)
    let cleanLocation = location;
    if (cleanLocation.includes('야시장')) {
      cleanLocation = cleanLocation
        .replace('닝샤 야시장', 'Ningxia')
        .replace('스린 야시장', 'Shilin')
        .replace('단수이 야시장', 'Tamsui')
        .replace('야시장', '');
    }
    
    // 노점 번호 등 상세 정보 제거
    cleanLocation = cleanLocation.replace(/\d+번\s*노점/g, '')
                                  .replace(/초입\s*\d+번\s*노점/g, '')
                                  .replace(/\d+-\d+번\s*노점/g, '')
                                  .replace(/\d+번\s*부근/g, '')
                                  .replace(/타이베이\s*/g, '')
                                  .trim();
    
    if (cleanLocation) {
      searchQuery = `${restaurantName} ${cleanLocation} Taipei Taiwan`.trim();
      searchParams = {
        query: searchQuery,
        key: GOOGLE_PLACES_API_KEY,
        language: 'ko'
      };

      searchResponse = await axios.get(searchUrl, { params: searchParams, timeout: 10000 });
      searchData = searchResponse.data;

      if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
        const placeId = searchData.results[0].place_id;
        return await getPhotoFromPlaceId(placeId, cacheKey);
      }
    }

    // 3순위: 첫 번째 검색 결과 사용 (맛집 이름만으로 검색한 결과)
    if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
      const placeId = searchData.results[0].place_id;
      return await getPhotoFromPlaceId(placeId, cacheKey);
    }

    return null;

  } catch (error) {
    console.error(`Google Places API 호출 실패 (${restaurantName}):`, error.message);
    return null;
  }
}

// Place ID로부터 사진 가져오기 (별도 함수로 분리)
async function getPhotoFromPlaceId(placeId, cacheKey) {
  try {

    // Place Details로 photos 정보 가져오기
    const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const detailsParams = {
      place_id: placeId,
      fields: 'photos,place_id',
      key: GOOGLE_PLACES_API_KEY,
      language: 'ko'
    };

    const detailsResponse = await axios.get(detailsUrl, { params: detailsParams, timeout: 10000 });
    const detailsData = detailsResponse.data;

    if (detailsData.status !== 'OK') {
      return null;
    }

    const result = detailsData.result || {};
    const photos = result.photos || [];

    if (photos.length === 0) {
      return null;
    }

    const photoReference = photos[0].photo_reference;

    if (!photoReference) {
      return null;
    }

    // Photo URL 생성
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;

    // 캐시에 저장
    imageCache.set(cacheKey, photoUrl);

    return photoUrl;

  } catch (error) {
    console.error(`사진 가져오기 실패 (place_id: ${placeId}):`, error.message);
    return null;
  }
}

// API 라우트
app.get('/api/category/:category', (req, res) => {
  const category = req.params.category;
  
  if (category === '전체') {
    // 모든 카테고리의 항목을 합침
    const allItems = [];
    for (const cat of ['면류', '만두', '디저트', '길거리음식']) {
      if (taiwanFoodMap[cat]) {
        allItems.push(...taiwanFoodMap[cat]);
      }
    }
    res.json({ category: '전체', items: allItems });
  } else {
    const items = taiwanFoodMap[category] || [];
    res.json({ category, items });
  }
});

app.get('/api/market/:market', (req, res) => {
  const market = req.params.market;
  
  // 전체 음식점 정보 매핑
  const allRestaurants = {};
  for (const category of ["면류", "만두", "디저트", "길거리음식"]) {
    if (taiwanFoodMap[category]) {
      for (const rest of taiwanFoodMap[category]) {
        allRestaurants[rest["이름"]] = rest;
      }
    }
  }
  
  if (market === '전체') {
    // 모든 야시장의 항목을 합침
    const allMarketItems = [];
    const seenNames = new Set();
    
    for (const marketName in taiwanFoodMap["야시장별"]) {
      const items = taiwanFoodMap["야시장별"][marketName] || [];
      for (const name of items) {
        if (!seenNames.has(name)) {
          seenNames.add(name);
          const restaurant = allRestaurants[name] || { "이름": name, "위치": "", "특징": "", "야시장": marketName };
          allMarketItems.push(restaurant);
        }
      }
    }
    
    res.json({ market: '전체', items: allMarketItems });
  } else {
    const items = taiwanFoodMap["야시장별"][market] || [];
    const fullItems = items.map(name => allRestaurants[name] || { "이름": name, "위치": "", "특징": "", "야시장": market });
    res.json({ market, items: fullItems });
  }
});

app.get('/api/city-tour/:area', (req, res) => {
  const area = req.params.area;
  
  if (area === '전체') {
    // 모든 도심투어 지역의 항목을 합침
    const allCityTourItems = [];
    const seenNames = new Set();
    
    for (const areaName in taiwanFoodMap["도심투어"]) {
      const items = taiwanFoodMap["도심투어"][areaName] || [];
      for (const item of items) {
        const itemName = item["이름"];
        if (!seenNames.has(itemName)) {
          seenNames.add(itemName);
          allCityTourItems.push(item);
        }
      }
    }
    
    res.json({ area: '전체', items: allCityTourItems });
  } else {
    const items = taiwanFoodMap["도심투어"][area] || [];
    res.json({ area, items });
  }
});

app.get('/api/places', (req, res) => {
  const items = taiwanFoodMap["갈만한 곳"] || [];
  res.json({ items });
});

app.get('/api/image/:restaurantName/:location', async (req, res) => {
  const { restaurantName, location } = req.params;
  const googleImageUrl = await getPlaceImageFromGoogle(restaurantName, location);
  res.json({ imageUrl: googleImageUrl });
});

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✨ 대만 맛집 정보 서버가 http://localhost:${PORT} 에서 실행 중입니다!`);
  console.log(`📱 인앱브라우저에서 http://localhost:${PORT} 를 열어주세요.`);
});

