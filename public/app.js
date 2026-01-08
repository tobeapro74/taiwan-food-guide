// ============================================
// 대만맛집정보 앱 - 모바일 최적화 버전
// ============================================

(function() {
    'use strict';

    // ============================================
    // 전역 상태 관리
    // ============================================
    const state = {
        currentTab: 'home',
        currentView: 'home', // home, search, detail
        currentItem: null,
        navigationHistory: [],
        isLoading: false
    };

    // ============================================
    // DOM 요소
    // ============================================
    const elements = {
        // 로딩
        loadingOverlay: document.getElementById('globalLoadingOverlay'),
        pullToRefreshIndicator: document.getElementById('pullToRefreshIndicator'),

        // 섹션
        homeSection: document.getElementById('homeSection'),
        searchSection: document.getElementById('searchSection'),
        detailSection: document.getElementById('detailSection'),
        mainContent: document.getElementById('mainContent'),

        // 컨테이너
        popularContainer: document.getElementById('popularContainer'),
        marketContainer: document.getElementById('marketContainer'),
        searchResultsContainer: document.getElementById('searchResultsContainer'),
        detailContent: document.getElementById('detailContent'),

        // 타이틀
        searchTitle: document.getElementById('searchTitle'),
        detailTitle: document.getElementById('detailTitle'),

        // 버튼
        backBtn: document.getElementById('backBtn'),
        detailBackBtn: document.getElementById('detailBackBtn'),

        // 모달
        categoryModal: document.getElementById('categoryModal'),
        marketModal: document.getElementById('marketModal'),
        tourModal: document.getElementById('tourModal')
    };

    // ============================================
    // 유틸리티 함수
    // ============================================

    // 구글 지도 링크 생성
    function getGoogleMapsLink(restaurantName, location) {
        let query = restaurantName || '';
        if (location && !location.includes('야시장')) {
            query += ' ' + location;
        }
        query += ' Taipei Taiwan';
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
    }

    // 고유 색상 그라데이션 생성
    function getGradientColor(name) {
        const hashString = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash;
            }
            return Math.abs(hash);
        };

        const colorPalettes = [
            ['#667eea', '#764ba2'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#43e97b', '#38f9d7'],
            ['#fa709a', '#fee140'],
            ['#30cfd0', '#330867'],
            ['#a8edea', '#fed6e3'],
            ['#ff9a9e', '#fecfef'],
            ['#ffecd2', '#fcb69f'],
            ['#ff8a80', '#ea6100'],
            ['#84fab0', '#8fd3f4'],
            ['#a1c4fd', '#c2e9fb']
        ];

        const palette = colorPalettes[hashString(name || 'default') % colorPalettes.length];
        return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
    }

    // ============================================
    // 로딩 인디케이터
    // ============================================

    function showLoading() {
        if (state.isLoading) return;
        state.isLoading = true;
        elements.loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        state.isLoading = false;
        elements.loadingOverlay.style.display = 'none';
    }

    // 전역 함수로 노출
    window.showGlobalLoading = showLoading;
    window.hideGlobalLoading = hideLoading;

    // ============================================
    // Pull-to-Refresh
    // ============================================

    function initPullToRefresh() {
        if (!('ontouchstart' in window)) return;

        const indicator = elements.pullToRefreshIndicator;
        const textEl = indicator.querySelector('.pull-to-refresh-text');
        const mainContent = elements.mainContent;

        let startY = 0;
        let currentY = 0;
        let pulling = false;
        let refreshing = false;
        const PULL_THRESHOLD = 80;

        function isAtTop() {
            return mainContent.scrollTop <= 0;
        }

        mainContent.addEventListener('touchstart', function(e) {
            if (refreshing || !isAtTop() || state.currentView !== 'home') return;
            startY = e.touches[0].clientY;
            pulling = false;
        }, { passive: true });

        mainContent.addEventListener('touchmove', function(e) {
            if (refreshing || !isAtTop() || startY === 0 || state.currentView !== 'home') return;

            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;

            if (deltaY > 20) {
                pulling = true;
                indicator.classList.add('pulling');
                textEl.textContent = deltaY >= PULL_THRESHOLD ? '놓으면 새로고침' : '당겨서 새로고침';
            }
        }, { passive: true });

        mainContent.addEventListener('touchend', function(e) {
            if (!pulling || refreshing) {
                startY = 0;
                return;
            }

            const deltaY = currentY - startY;

            if (deltaY >= PULL_THRESHOLD) {
                refreshing = true;
                indicator.classList.remove('pulling');
                indicator.classList.add('refreshing');
                textEl.textContent = '조회중...';
                showLoading();

                setTimeout(function() {
                    window.location.reload();
                }, 300);
            } else {
                indicator.classList.remove('pulling');
            }

            startY = 0;
            currentY = 0;
            pulling = false;
        }, { passive: true });

        mainContent.addEventListener('touchcancel', function() {
            indicator.classList.remove('pulling');
            startY = 0;
            currentY = 0;
            pulling = false;
        }, { passive: true });
    }

    // ============================================
    // 터치 이벤트 핸들러
    // ============================================

    function addTouchFeedback(element, callback) {
        let touchStartX = 0;
        let touchStartY = 0;
        let isTap = false;
        const SCROLL_THRESHOLD = 10;

        element.addEventListener('touchstart', function(e) {
            if (e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isTap = true;
            }
            element.classList.add('pressed');
        }, { passive: true });

        element.addEventListener('touchmove', function(e) {
            if (e.touches.length > 0) {
                const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
                    isTap = false;
                }
            }
        }, { passive: true });

        element.addEventListener('touchend', function(e) {
            element.classList.remove('pressed');
            if (isTap && callback) {
                e.preventDefault();
                callback(e);
            }
        }, { passive: false });

        element.addEventListener('touchcancel', function() {
            element.classList.remove('pressed');
        }, { passive: true });

        // 데스크톱 클릭 이벤트
        element.addEventListener('click', function(e) {
            if (!('ontouchstart' in window) && callback) {
                callback(e);
            }
        });
    }

    // ============================================
    // 카드 생성 함수
    // ============================================

    // 가로 스크롤용 카드
    function createHorizontalCard(item) {
        const card = document.createElement('div');
        card.className = 'restaurant-card-horizontal';

        const gradient = getGradientColor(item.이름);

        card.innerHTML = `
            <div class="card-image">
                <div class="placeholder-image" style="background: ${gradient};">
                    ${item.이름 ? item.이름.substring(0, 4) : '🍜'}
                </div>
            </div>
            <div class="card-info">
                <div class="card-name">${item.이름 || '이름 없음'}</div>
                <div class="card-location">
                    <i class="bi bi-geo-alt"></i>
                    ${item.위치 ? item.위치.substring(0, 15) : ''}
                </div>
            </div>
        `;

        // 이미지 로드 시도
        loadCardImage(card, item);

        addTouchFeedback(card, () => showDetail(item));

        return card;
    }

    // 세로 리스트용 카드
    function createListCard(item) {
        const card = document.createElement('div');
        card.className = 'restaurant-card';

        const gradient = getGradientColor(item.이름);

        let marketTag = '';
        if (item.야시장 && item.야시장 !== '') {
            marketTag = `<span class="card-market">🌙 ${item.야시장}</span>`;
        }

        card.innerHTML = `
            <div class="card-image">
                <div class="placeholder-image" style="background: ${gradient};">
                    ${item.이름 ? item.이름.substring(0, 3) : '🍜'}
                </div>
            </div>
            <div class="card-info">
                <div class="card-name">${item.이름 || '이름 없음'}</div>
                <div class="card-location">
                    <i class="bi bi-geo-alt"></i>
                    ${item.위치 || ''}
                </div>
                ${item.특징 ? `<div class="card-feature">${item.특징}</div>` : ''}
                ${marketTag}
            </div>
        `;

        // 이미지 로드 시도
        loadCardImage(card, item);

        addTouchFeedback(card, () => showDetail(item));

        return card;
    }

    // 카드 이미지 로드
    async function loadCardImage(card, item) {
        if (!item.이름 || !item.위치) return;

        try {
            const response = await fetch(`/api/image/${encodeURIComponent(item.이름)}/${encodeURIComponent(item.위치)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.imageUrl) {
                    const imageDiv = card.querySelector('.card-image');
                    const img = document.createElement('img');
                    img.src = data.imageUrl;
                    img.alt = item.이름;
                    img.loading = 'lazy';
                    img.onload = () => {
                        imageDiv.innerHTML = '';
                        imageDiv.appendChild(img);
                    };
                }
            }
        } catch (error) {
            // 이미지 로드 실패 시 기본 그라데이션 유지
        }
    }

    // 스켈레톤 카드 생성
    function createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton-image skeleton"></div>
            <div class="skeleton-info">
                <div class="skeleton-title skeleton"></div>
                <div class="skeleton-text skeleton"></div>
                <div class="skeleton-text-sm skeleton"></div>
            </div>
        `;
        return card;
    }

    // 빈 상태 메시지
    function createEmptyMessage(message) {
        const div = document.createElement('div');
        div.className = 'empty-message';
        div.innerHTML = `
            <i class="bi bi-search"></i>
            <p>${message}</p>
        `;
        return div;
    }

    // ============================================
    // 화면 전환
    // ============================================

    function showHome() {
        state.currentView = 'home';
        elements.homeSection.style.display = 'block';
        elements.searchSection.style.display = 'none';
        elements.detailSection.style.display = 'none';

        // 네비게이션 활성화
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === 'home');
        });

        elements.mainContent.scrollTop = 0;
    }

    function showSearch(title, items) {
        state.currentView = 'search';
        state.navigationHistory.push({ view: 'search', title, items });

        elements.homeSection.style.display = 'none';
        elements.searchSection.style.display = 'block';
        elements.detailSection.style.display = 'none';

        elements.searchTitle.textContent = title;
        elements.searchResultsContainer.innerHTML = '';

        if (items && items.length > 0) {
            items.forEach(item => {
                elements.searchResultsContainer.appendChild(createListCard(item));
            });
        } else {
            elements.searchResultsContainer.appendChild(createEmptyMessage('검색 결과가 없습니다.'));
        }

        elements.mainContent.scrollTop = 0;
    }

    function showDetail(item) {
        state.currentView = 'detail';
        state.currentItem = item;
        state.navigationHistory.push({ view: 'detail', item });

        elements.homeSection.style.display = 'none';
        elements.searchSection.style.display = 'none';
        elements.detailSection.style.display = 'block';

        elements.detailTitle.textContent = item.이름 || '상세 정보';

        const gradient = getGradientColor(item.이름);

        let marketTag = '';
        if (item.야시장 && item.야시장 !== '') {
            marketTag = `<span class="detail-market-tag">🌙 ${item.야시장}</span>`;
        }

        elements.detailContent.innerHTML = `
            <div class="detail-image" id="detailImageContainer">
                <div class="placeholder-image" style="background: ${gradient}; font-size: 2rem;">
                    ${item.이름 ? item.이름.substring(0, 6) : '🍜'}
                </div>
            </div>
            <div class="detail-info">
                <div class="detail-name">${item.이름 || '이름 없음'}</div>
                ${item.위치 ? `
                    <div class="detail-item">
                        <i class="bi bi-geo-alt-fill"></i>
                        <span>${item.위치}</span>
                    </div>
                ` : ''}
                ${item.특징 ? `
                    <div class="detail-item">
                        <i class="bi bi-info-circle-fill"></i>
                        <span>${item.특징}</span>
                    </div>
                ` : ''}
                ${marketTag}
                <button class="map-btn" id="mapBtn">
                    <i class="bi bi-map-fill"></i>
                    구글 지도에서 보기
                </button>
            </div>
        `;

        // 지도 버튼 이벤트
        const mapBtn = document.getElementById('mapBtn');
        addTouchFeedback(mapBtn, () => {
            window.open(getGoogleMapsLink(item.이름, item.위치), '_blank');
        });

        // 상세 이미지 로드
        loadDetailImage(item);

        elements.mainContent.scrollTop = 0;
    }

    // 상세 이미지 로드
    async function loadDetailImage(item) {
        if (!item.이름 || !item.위치) return;

        try {
            const response = await fetch(`/api/image/${encodeURIComponent(item.이름)}/${encodeURIComponent(item.위치)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.imageUrl) {
                    const container = document.getElementById('detailImageContainer');
                    if (container) {
                        const img = document.createElement('img');
                        img.src = data.imageUrl;
                        img.alt = item.이름;
                        img.onload = () => {
                            container.innerHTML = '';
                            container.appendChild(img);
                        };
                    }
                }
            }
        } catch (error) {
            // 이미지 로드 실패 시 기본 그라데이션 유지
        }
    }

    function goBack() {
        state.navigationHistory.pop();

        if (state.navigationHistory.length > 0) {
            const prev = state.navigationHistory[state.navigationHistory.length - 1];
            if (prev.view === 'search') {
                state.currentView = 'search';
                elements.homeSection.style.display = 'none';
                elements.searchSection.style.display = 'block';
                elements.detailSection.style.display = 'none';
                elements.searchTitle.textContent = prev.title;
            } else {
                showHome();
            }
        } else {
            showHome();
        }
    }

    // ============================================
    // API 호출
    // ============================================

    async function fetchCategory(category) {
        showLoading();
        try {
            const response = await fetch(`/api/category/${encodeURIComponent(category)}`);
            const data = await response.json();
            hideLoading();

            const title = category === '전체' ? '전체 맛집' : `${category} 맛집`;
            showSearch(title, data.items);
        } catch (error) {
            hideLoading();
            showSearch('검색 결과', []);
        }
    }

    async function fetchMarket(market) {
        showLoading();
        try {
            const response = await fetch(`/api/market/${encodeURIComponent(market)}`);
            const data = await response.json();
            hideLoading();

            const title = market === '전체' ? '전체 야시장' : market;
            showSearch(title, data.items);
        } catch (error) {
            hideLoading();
            showSearch('검색 결과', []);
        }
    }

    async function fetchCityTour(area) {
        showLoading();
        try {
            const response = await fetch(`/api/city-tour/${encodeURIComponent(area)}`);
            const data = await response.json();
            hideLoading();

            const title = area === '전체' ? '전체 도심투어' : `${area} 맛집 & 카페`;
            showSearch(title, data.items);
        } catch (error) {
            hideLoading();
            showSearch('검색 결과', []);
        }
    }

    async function fetchPlaces() {
        showLoading();
        try {
            const response = await fetch('/api/places');
            const data = await response.json();
            hideLoading();
            showSearch('갈만한 곳', data.items);
        } catch (error) {
            hideLoading();
            showSearch('검색 결과', []);
        }
    }

    // ============================================
    // 홈 화면 데이터 로드
    // ============================================

    async function loadHomeData() {
        // 인기 맛집 로드 (전체에서 일부 선택)
        try {
            const response = await fetch('/api/category/전체');
            const data = await response.json();

            elements.popularContainer.innerHTML = '';

            // 랜덤하게 섞어서 8개 선택
            const shuffled = [...(data.items || [])].sort(() => Math.random() - 0.5);
            const popular = shuffled.slice(0, 8);

            popular.forEach(item => {
                elements.popularContainer.appendChild(createHorizontalCard(item));
            });
        } catch (error) {
            console.error('인기 맛집 로드 실패:', error);
        }

        // 야시장 맛집 로드
        loadMarketItems('전체');
    }

    async function loadMarketItems(market) {
        elements.marketContainer.innerHTML = '';

        // 스켈레톤 표시
        for (let i = 0; i < 3; i++) {
            elements.marketContainer.appendChild(createSkeletonCard());
        }

        try {
            const response = await fetch(`/api/market/${encodeURIComponent(market)}`);
            const data = await response.json();

            elements.marketContainer.innerHTML = '';

            const items = (data.items || []).slice(0, 6);

            if (items.length > 0) {
                items.forEach(item => {
                    elements.marketContainer.appendChild(createListCard(item));
                });
            } else {
                elements.marketContainer.appendChild(createEmptyMessage('등록된 맛집이 없습니다.'));
            }
        } catch (error) {
            elements.marketContainer.innerHTML = '';
            elements.marketContainer.appendChild(createEmptyMessage('데이터를 불러올 수 없습니다.'));
        }
    }

    // ============================================
    // 모달 관리
    // ============================================

    function openModal(modal) {
        modal.style.display = 'flex';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    function closeAllModals() {
        elements.categoryModal.style.display = 'none';
        elements.marketModal.style.display = 'none';
        elements.tourModal.style.display = 'none';
    }

    // ============================================
    // 이벤트 리스너 초기화
    // ============================================

    function initEventListeners() {
        // 뒤로가기 버튼
        addTouchFeedback(elements.backBtn, goBack);
        addTouchFeedback(elements.detailBackBtn, goBack);

        // 퀵 카테고리 버튼
        document.querySelectorAll('.quick-btn').forEach(btn => {
            addTouchFeedback(btn, () => {
                fetchCategory(btn.dataset.category);
            });
        });

        // 야시장 칩 버튼
        document.querySelectorAll('.market-chip').forEach(chip => {
            addTouchFeedback(chip, () => {
                document.querySelectorAll('.market-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                loadMarketItems(chip.dataset.market);
            });
        });

        // 하단 네비게이션
        document.querySelectorAll('.nav-item').forEach(item => {
            addTouchFeedback(item, () => {
                const tab = item.dataset.tab;

                switch(tab) {
                    case 'home':
                        showHome();
                        break;
                    case 'category':
                        openModal(elements.categoryModal);
                        break;
                    case 'market':
                        openModal(elements.marketModal);
                        break;
                    case 'tour':
                        openModal(elements.tourModal);
                        break;
                    case 'places':
                        fetchPlaces();
                        break;
                }
            });
        });

        // 카테고리 모달 옵션
        elements.categoryModal.querySelectorAll('.modal-option').forEach(option => {
            addTouchFeedback(option, () => {
                closeModal(elements.categoryModal);
                fetchCategory(option.dataset.category);
            });
        });

        // 야시장 모달 옵션
        elements.marketModal.querySelectorAll('.modal-option').forEach(option => {
            addTouchFeedback(option, () => {
                closeModal(elements.marketModal);
                fetchMarket(option.dataset.market);
            });
        });

        // 도심투어 모달 옵션
        elements.tourModal.querySelectorAll('.modal-option').forEach(option => {
            addTouchFeedback(option, () => {
                closeModal(elements.tourModal);
                fetchCityTour(option.dataset.tour);
            });
        });

        // 모달 닫기 버튼
        document.getElementById('closeCategoryModal').addEventListener('click', () => closeModal(elements.categoryModal));
        document.getElementById('closeMarketModal').addEventListener('click', () => closeModal(elements.marketModal));
        document.getElementById('closeTourModal').addEventListener('click', () => closeModal(elements.tourModal));

        // 모달 외부 클릭 시 닫기
        [elements.categoryModal, elements.marketModal, elements.tourModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });

        // 브라우저 뒤로가기
        window.addEventListener('popstate', () => {
            if (state.currentView !== 'home') {
                goBack();
            }
        });

        // 페이지 로드/표시 시 로딩 숨김
        window.addEventListener('pageshow', hideLoading);
        window.addEventListener('load', hideLoading);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                hideLoading();
            }
        });
    }

    // ============================================
    // Service Worker 등록
    // ============================================

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker 등록 성공:', registration.scope);

                        // 업데이트 확인
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('새 버전이 있습니다. 새로고침하세요.');
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.log('ServiceWorker 등록 실패:', error);
                    });
            });
        }
    }

    // ============================================
    // 앱 초기화
    // ============================================

    function init() {
        console.log('🍜 대만맛집정보 앱을 시작합니다!');

        initEventListeners();
        initPullToRefresh();
        registerServiceWorker();
        loadHomeData();

        // URL 파라미터 처리
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab === 'market') {
            openModal(elements.marketModal);
        } else if (tab === 'tour') {
            openModal(elements.tourModal);
        }
    }

    // DOM 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
