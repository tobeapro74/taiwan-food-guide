const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const axios = require('axios');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    {"이름": "진삼십 루로우판", "위치": "타이베이 중산", "특징": "루로우판 전문점, 진하고 달콤한 간장 돼지고기 덮밥"},
    {"이름": "금봉 루로우판", "위치": "타이베이 중산구", "특징": "미슐랭 빕구르망 선정, 현지인이 사랑하는 루로우판"},
    {"이름": "후지산 루로우판", "위치": "타이베이 시먼딩", "특징": "시먼딩 대표 루로우판 맛집, 짭조름하고 고소한 맛"},
    {"이름": "마이 루로우판", "위치": "타이베이 융캉제", "특징": "융캉제 인기 루로우판, 부드러운 삼겹살 조림"},
    {"이름": "자이 지로우판", "위치": "타이베이 중정구", "특징": "자이 스타일 닭고기덮밥, 담백하고 고소한 닭기름 소스"},
    {"이름": "류지아 지로우판", "위치": "타이베이 중산구", "특징": "현지인 추천 지로우판, 잘게 찢은 닭고기와 특제 소스"},
    {"이름": "민성 지로우판", "위치": "타이베이 민성", "특징": "50년 전통 지로우판 맛집, 부드러운 닭고기"},
    {"이름": "콩로우판 전문점", "위치": "타이베이 닝샤", "특징": "큼직한 오겹살 찜 덮밥, 든든한 한 끼"},
    {"이름": "타이베이역 비엔당", "위치": "타이베이역", "특징": "대만 철도 도시락, 파이구판(돼지갈비 덮밥) 유명"},
    {"이름": "푸항 또우장", "위치": "타이베이 다안구", "특징": "퐌투안(대만식 주먹밥)과 또우장 아침 전문점"},
    {"이름": "아랑 기름밥", "위치": "타이베이 중산구", "특징": "여우판(기름밥) 전문, 찹쌀에 표고버섯과 돼지고기"},
    {"이름": "닝샤 미까오", "위치": "타이베이 닝샤 야시장", "특징": "찹쌀을 원통형으로 쪄낸 미까오, 찰진 식감", "야시장": "닝샤 야시장"},
    {"이름": "스린 퐌투안", "위치": "타이베이 스린", "특징": "대만식 주먹밥, 요우티아오와 러우쑹이 들어간 든든한 아침"},
    {"이름": "영강 파이구판", "위치": "타이베이 융캉제", "특징": "바삭한 돼지갈비 덮밥, 특제 양념이 일품"},
    {"이름": "철판볶음밥 전문", "위치": "타이베이 시먼딩", "특징": "대만식 철판볶음밥, 다양한 토핑 선택 가능"}
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
    "스린 야시장": ["하오따따 지파이", "왕자 치즈감자", "충성호 굴전", "우유튀김", "아훼이 면선", "스린뻐 또우화", "샤오황 따빠처우", "스린 퐌투안"],
    "닝샤 야시장": ["류유지 타로볼 튀김", "위엔화볜 굴전", "지파이", "고구마볼", "샹창 찹쌀 소세지", "오징어튀김", "닝샤 미까오"],
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
    ],
    "중정기념당": [
      {"이름": "춘수당", "위치": "타이베이 중정기념당", "특징": "버블티(펄밀크티) 원조 브랜드, 1983년 타이중에서 시작된 대만 대표 찻집"},
      {"이름": "중정기념당", "위치": "타이베이시 중정구", "특징": "타이완의 상징적인 건물, 넓은 광장과 아름다운 정원"}
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
        return await getPhotoFromPlaceId(placeId, cacheKey, restaurantName);
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
        return await getPhotoFromPlaceId(placeId, cacheKey, restaurantName);
      }
    }

    // 3순위: 첫 번째 검색 결과 사용 (맛집 이름만으로 검색한 결과)
    if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
      const placeId = searchData.results[0].place_id;
      return await getPhotoFromPlaceId(placeId, cacheKey, restaurantName);
    }

    return null;

  } catch (error) {
    console.error(`Google Places API 호출 실패 (${restaurantName}):`, error.message);
    return null;
  }
}

// Google 이미지를 Cloudinary에 업로드
async function uploadToCloudinary(googlePhotoUrl, restaurantName) {
  try {
    // 한글 이름을 영문/숫자로 변환하여 public_id 생성
    const sanitizedName = restaurantName
      .replace(/[^a-zA-Z0-9가-힣]/g, '_')
      .substring(0, 50);
    const publicId = `taiwan_food/${sanitizedName}_${Date.now()}`;

    // Google 이미지를 Cloudinary에 업로드
    const result = await cloudinary.uploader.upload(googlePhotoUrl, {
      public_id: publicId,
      folder: 'taiwan_food',
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 300, crop: 'fill', quality: 'auto' }
      ]
    });

    console.log(`Cloudinary 업로드 성공: ${restaurantName} -> ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`Cloudinary 업로드 실패 (${restaurantName}):`, error.message);
    return null;
  }
}

// Place ID로부터 사진 가져오기 (별도 함수로 분리)
async function getPhotoFromPlaceId(placeId, cacheKey, restaurantName) {
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

    // Google Photo URL 생성
    const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;

    // Cloudinary에 업로드
    const cloudinaryUrl = await uploadToCloudinary(googlePhotoUrl, restaurantName);

    if (cloudinaryUrl) {
      // Cloudinary URL을 캐시에 저장
      imageCache.set(cacheKey, cloudinaryUrl);
      return cloudinaryUrl;
    }

    // Cloudinary 업로드 실패 시 Google URL 반환
    imageCache.set(cacheKey, googlePhotoUrl);
    return googlePhotoUrl;

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
    for (const cat of ['면류', '만두', '밥류', '디저트', '길거리음식']) {
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
  for (const category of ["면류", "만두", "밥류", "디저트", "길거리음식"]) {
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

// 검색 API - 식당이름, 빌딩, 음식, 도로명 등 통합 검색
app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();

  if (!query) {
    return res.json({ query: '', items: [], count: 0 });
  }

  const results = [];
  const seenNames = new Set();

  // 모든 카테고리에서 검색
  const categories = ['면류', '만두', '밥류', '디저트', '길거리음식'];

  for (const category of categories) {
    const items = taiwanFoodMap[category] || [];
    for (const item of items) {
      if (seenNames.has(item.이름)) continue;

      // 검색 대상: 이름, 위치, 특징, 야시장
      const name = (item.이름 || '').toLowerCase();
      const location = (item.위치 || '').toLowerCase();
      const feature = (item.특징 || '').toLowerCase();
      const market = (item.야시장 || '').toLowerCase();

      // 검색어가 포함되어 있는지 확인
      if (name.includes(query) ||
          location.includes(query) ||
          feature.includes(query) ||
          market.includes(query)) {
        seenNames.add(item.이름);
        results.push({
          ...item,
          카테고리: category,
          matchType: name.includes(query) ? 'name' :
                     location.includes(query) ? 'location' :
                     market.includes(query) ? 'market' : 'feature'
        });
      }
    }
  }

  // 도심투어에서 검색
  for (const area in taiwanFoodMap["도심투어"]) {
    const items = taiwanFoodMap["도심투어"][area] || [];
    for (const item of items) {
      if (seenNames.has(item.이름)) continue;

      const name = (item.이름 || '').toLowerCase();
      const location = (item.위치 || '').toLowerCase();
      const feature = (item.특징 || '').toLowerCase();

      if (name.includes(query) ||
          location.includes(query) ||
          feature.includes(query) ||
          area.toLowerCase().includes(query)) {
        seenNames.add(item.이름);
        results.push({
          ...item,
          도심투어: area,
          matchType: name.includes(query) ? 'name' :
                     location.includes(query) ? 'location' : 'feature'
        });
      }
    }
  }

  // 갈만한 곳에서 검색
  const places = taiwanFoodMap["갈만한 곳"] || [];
  for (const item of places) {
    if (seenNames.has(item.이름)) continue;

    const name = (item.이름 || '').toLowerCase();
    const location = (item.위치 || '').toLowerCase();
    const feature = (item.특징 || '').toLowerCase();

    if (name.includes(query) ||
        location.includes(query) ||
        feature.includes(query)) {
      seenNames.add(item.이름);
      results.push({
        ...item,
        타입: '명소',
        matchType: name.includes(query) ? 'name' :
                   location.includes(query) ? 'location' : 'feature'
      });
    }
  }

  // 이름 매칭을 우선으로 정렬
  results.sort((a, b) => {
    const priority = { name: 0, market: 1, location: 2, feature: 3 };
    return priority[a.matchType] - priority[b.matchType];
  });

  res.json({
    query,
    items: results,
    count: results.length
  });
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

