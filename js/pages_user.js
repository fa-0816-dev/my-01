/* ============================================
   用户端页面渲染 pages_user.js (上半部分)
   首页、景点列表、景点详情、地图导览、以图识景
   ============================================ */

/* ===== 首页 ===== */
Router.pages['/'] = (app) => {
    const spots = DB.get(STORAGE_KEYS.SPOTS);
    const travels = DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.status === 'approved');
    const user = Query.getCurrentUser();

    // 个性化推荐（协同过滤，后台运行）
    let recommendHTML = '';
    if (user) {
        try {
            const recResult = Algorithms.CollaborativeFiltering.recommend(user.id, 4);
            console.log('[首页推荐] user.id=' + user.id + ' count=' + (recResult?.recommendations?.length || 0));
            if (recResult && recResult.recommendations && recResult.recommendations.length > 0) {
                recommendHTML = `
                    <div class="section">
                        <div class="section-title">✨ 为您推荐</div>
                        <p class="section-subtitle">根据您的浏览偏好，精选了这些景点</p>
                        <div class="grid grid-4">
                            ${recResult.recommendations.map(r => renderSpotCard(r.spot)).join('')}
                        </div>
                    </div>
                `;
            }
        } catch(e) {
            console.warn('[首页推荐] 协同过滤异常，跳过: ' + e.message);
            // 兜底：按类别均衡推荐热门
            const byCat = {};
            spots.forEach(s => { byCat[s.category] = byCat[s.category] || []; byCat[s.category].push(s); });
            const fallbackSpots = [];
            Object.values(byCat).forEach(list => {
                fallbackSpots.push(...list.sort((a,b)=>b.hot-a.hot).slice(0, 1));
            });
            if (fallbackSpots.length > 0) {
                recommendHTML = `
                    <div class="section">
                        <div class="section-title">🔥 热门景点</div>
                        <div class="grid grid-4">
                            ${fallbackSpots.slice(0,4).map(r => renderSpotCard(r)).join('')}
                        </div>
                    </div>
                `;
            }
        }
    }

    // === 个性化热门景点 ===
    let hotSpots;
    if (user) {
        // 根据用户交互历史计算类别偏好权重
        const history = DB.get(STORAGE_KEYS.USER_HISTORY).filter(h => h.userId === user.id);
        const checkins = DB.get(STORAGE_KEYS.CHECKINS).filter(c => c.userId === user.id);
        const favs = DB.get(STORAGE_KEYS.USER_FAV_SPOTS).filter(f => f.userId === user.id);
        const userSpotIds = new Set([
            ...history.map(h => h.spotId),
            ...checkins.map(c => c.spotId),
            ...favs.map(f => f.spotId)
        ]);
        // 统计类别偏好
        const catWeight = {};
        spots.forEach(s => { if (userSpotIds.has(s.id)) { catWeight[s.category] = (catWeight[s.category] || 0) + 1; } });
        // 加权排序：hot × (1 + 类别偏好)，已交互过的景点降权让新景点冒头
        hotSpots = [...spots].sort((a, b) => {
            const wa = catWeight[a.category] || 0;
            const wb = catWeight[b.category] || 0;
            const scoreA = a.hot * (1 + wa * 0.5) - (userSpotIds.has(a.id) ? 999 : 0);
            const scoreB = b.hot * (1 + wb * 0.5) - (userSpotIds.has(b.id) ? 999 : 0);
            return scoreB - scoreA;
        }).slice(0, 8);
    } else {
        hotSpots = [...spots].sort((a, b) => b.hot - a.hot).slice(0, 8);
    }

    // === 个性化热门游记 ===
    let hotTravels;
    if (user) {
        const favSpotIds = new Set([
            ...DB.get(STORAGE_KEYS.CHECKINS).filter(c => c.userId === user.id).map(c => c.spotId),
            ...DB.get(STORAGE_KEYS.USER_FAV_SPOTS).filter(f => f.userId === user.id).map(f => f.spotId)
        ]);
        hotTravels = [...travels].sort((a, b) => {
            // 游记里有用户打卡/收藏景点的 → 优先
            const aRelated = a.spotId && favSpotIds.has(a.spotId) ? 100 : 0;
            const bRelated = b.spotId && favSpotIds.has(b.spotId) ? 100 : 0;
            return (b.hot + bRelated) - (a.hot + aRelated);
        }).slice(0, 6);
    } else {
        hotTravels = travels.slice(0, 6);
    }

    // 校区筛选入口
    const campuses = [...new Set(spots.map(s => s.campus))];

    // 轮播图（从后台读取，支持管理员编辑）
    const banners = DB.get(STORAGE_KEYS.HOME_BANNERS)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Hero 横幅（从后台读取）
    const hero = DB.get(STORAGE_KEYS.HERO_BANNER) || { title: '探索属于你的校园', subtitle: '', bg: 'linear-gradient(135deg, #2d9b7a, #4db896)' };

    app.innerHTML = `
        <!-- 轮播图 -->
        <div class="carousel" id="home-carousel">
            ${banners.map((b, i) => `
                <div class="carousel-slide ${i === 0 ? 'active' : ''}">
                    <div class="slide-bg" style="${b.bg && (b.bg.startsWith('http') || b.bg.startsWith('asset') || b.bg.startsWith('./') || b.bg.startsWith('data:'))
                        ? `background:url('${b.bg}') center/cover no-repeat`
                        : `background:${b.bg}`}"></div>
                    <div class="slide-overlay"></div>
                    <div class="slide-content">
                        <h2>${b.title}</h2>
                        <p>${b.subtitle}</p>
                    </div>
                </div>
            `).join('')}
            <button class="carousel-btn prev" onclick="UI.carousel.prev()">❮</button>
            <button class="carousel-btn next" onclick="UI.carousel.next()">❯</button>
            <div class="carousel-dots">
                ${banners.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="UI.carousel.go(${i})"></div>`).join('')}
            </div>
        </div>

        <!-- 英雄区 / 搜索 -->
        <div class="hero" style="${hero.bg && (hero.bg.startsWith('http') || hero.bg.startsWith('asset') || hero.bg.startsWith('./') || hero.bg.startsWith('data:'))
            ? `background:url('${hero.bg}') center/cover no-repeat`
            : `background:${hero.bg}`}">
            <h1>${hero.title}</h1>
            ${hero.subtitle ? `<p>${hero.subtitle}</p>` : ''}
            <div class="hero-search">
                <input id="home-search" placeholder="🔍 搜索景点、游记、校园故事...">
                <button onclick="homeSearch()">搜索</button>
            </div>
        </div>

        <!-- 校区筛选入口 -->
        <div class="section">
            <div class="section-title">📍 按校区浏览</div>
            <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
                ${campuses.map(c => `
                    <a href="#/spots?campus=${encodeURIComponent(c)}" class="card" style="padding:28px;text-align:center;cursor:pointer;text-decoration:none">
                        <div style="font-size:2.5rem;margin-bottom:10px">🏫</div>
                        <div class="card-title">${c}</div>
                        <div class="card-desc">${spots.filter(s=>s.campus===c).length} 个景点</div>
                    </a>
                `).join('')}
            </div>
        </div>

        <!-- 热门景点 / 个性化推荐 -->
        ${recommendHTML || `
            <div class="section">
                <div class="section-title">🔥 热门景点 TOP8</div>
                <p class="section-subtitle">${user ? '登录后可获得专属个性化推荐' : '登录体验个性化推荐'}</p>
                <div class="grid grid-4">
                    ${hotSpots.map(renderSpotCard).join('')}
                </div>
            </div>
        `}

        <!-- 热门游记 -->
        <div class="section">
            <div class="section-title">📖 ${user ? '为你精选的游记' : '热门游记'}</div>
            ${user ? '<p class="section-subtitle">根据你打卡和收藏的景点推荐</p>' : ''}
            <div class="grid grid-3">
                ${hotTravels.map(renderTravelCard).join('')}
            </div>
            <div style="text-align:center;margin-top:16px">
                <a href="#/travels" class="btn btn-outline">查看全部游记 →</a>
            </div>
        </div>
    `;

    // 初始化轮播
    setTimeout(() => UI.carousel.init('home-carousel'), 50);

    // 初始化搜索
    document.getElementById('home-search')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') homeSearch();
    });
};

window.homeSearch = () => {
    const kw = document.getElementById('home-search').value.trim();
    if (kw) {
        Router.navigate('/spots?kw=' + encodeURIComponent(kw));
    } else {
        UI.toast('请输入搜索关键词', 'warning');
    }
};

/* ===== 景点列表页 ===== */
Router.pages['/spots'] = (app) => {
    const kw = Router.getQuery('kw') || '';
    const campus = Router.getQuery('campus') || '';
    const category = Router.getQuery('category') || '';
    const sort = Router.getQuery('sort') || 'hot';

    let spots = DB.get(STORAGE_KEYS.SPOTS);

    if (kw) spots = spots.filter(s => s.name.includes(kw) || s.description.includes(kw));
    if (campus) spots = spots.filter(s => s.campus === campus);
    if (category) spots = spots.filter(s => s.category === category);

    if (sort === 'hot') spots.sort((a, b) => b.hot - a.hot);
    else if (sort === 'name') spots.sort((a, b) => a.name.localeCompare(b.name));

    const allCampuses = [...new Set(DB.get(STORAGE_KEYS.SPOTS).map(s => s.campus))];
    const allCategories = [...new Set(DB.get(STORAGE_KEYS.SPOTS).map(s => s.category))];

    app.innerHTML = `
        <div class="section">
            <div class="section-title">📍 景点列表</div>

            <!-- 筛选栏 -->
            <div class="filter-bar">
                <div style="flex:1;min-width:200px">
                    <input id="search-kw" class="form-control" placeholder="🔍 搜索景点名称/描述" value="${kw}">
                </div>
                <div>
                    <label>校区</label>
                    <select id="filter-campus" class="form-control">
                        <option value="">全部</option>
                        ${allCampuses.map(c => `<option ${campus===c?'selected':''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>类别</label>
                    <select id="filter-category" class="form-control">
                        <option value="">全部</option>
                        ${allCategories.map(c => `<option ${category===c?'selected':''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>排序</label>
                    <select id="filter-sort" class="form-control">
                        <option value="hot" ${sort==='hot'?'selected':''}>🔥 按热度</option>
                        <option value="name" ${sort==='name'?'selected':''}>📝 按名称</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="applySpotFilter()">筛选</button>
            </div>

            <!-- 结果 -->
            ${spots.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p>没有找到匹配的景点</p>
                </div>
            ` : `
                <p class="section-subtitle">共 ${spots.length} 个景点</p>
                <div class="grid grid-4">
                    ${spots.map(renderSpotCard).join('')}
                </div>
            `}
        </div>
    `;

    // 绑定筛选事件：下拉框 change 自动触发，搜索框回车触发
    const triggerFilter = () => {
        const q = new URLSearchParams();
        const k = document.getElementById('search-kw').value.trim();
        if (k) q.set('kw', k);
        const c = document.getElementById('filter-campus').value;
        if (c) q.set('campus', c);
        const cat = document.getElementById('filter-category').value;
        if (cat) q.set('category', cat);
        const s = document.getElementById('filter-sort').value;
        if (s) q.set('sort', s);
        Router.navigate('/spots' + (q.toString() ? '?' + q.toString() : ''));
    };

    window.applySpotFilter = triggerFilter;

    document.getElementById('filter-campus').addEventListener('change', triggerFilter);
    document.getElementById('filter-category').addEventListener('change', triggerFilter);
    document.getElementById('filter-sort').addEventListener('change', triggerFilter);
    document.getElementById('search-kw').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerFilter();
    });
};

/* ===== 景点详情页 ===== */
Router.pages['/spots/:id'] = (app, spotId) => {
    const spot = Query.getSpot(spotId);
    if (!spot) {
        app.innerHTML = '<div class="empty-state"><div class="empty-icon">❓</div><p>景点不存在</p></div>';
        return;
    }

    const user = Query.getCurrentUser();
    const isFav = user ? Query.getUserFavSpotIds(user.id).includes(spotId) : false;
    const isLiked = user ? Query.hasLiked(user.id, spotId, 'spot') : false;
    const comments = Query.getSpotComments(spotId);

    // 记录浏览历史
    if (user) Query.addHistory(user.id, spotId);

    const nearbySpots = DB.get(STORAGE_KEYS.SPOTS)
        .filter(s => s.id !== spotId && s.campus === spot.campus)
        .slice(0, 4);

    app.innerHTML = `
        <div class="detail-header">
            ${(() => {
                const imgs = spot.images && spot.images.length > 0 ? spot.images : (spot.image ? [spot.image] : []);
                if (imgs.length > 0) {
                    if (imgs.length === 1) {
                        return `<img src="${imgs[0]}" alt="${spot.name}" style="max-width:100%;max-height:320px;border-radius:12px;object-fit:cover;box-shadow:var(--shadow);margin-bottom:16px">`;
                    }
                    // 多图轮播
                    return `
                        <div id="spot-carousel" style="position:relative;border-radius:12px;overflow:hidden;margin-bottom:16px;box-shadow:var(--shadow);max-width:100%;height:320px">
                            ${imgs.map((src, i) => `<img src="${src}" style="width:100%;height:100%;object-fit:cover;display:${i===0?'block':'none'};transition:opacity 0.3s" data-idx="${i}">`).join('')}
                            ${imgs.length > 1 ? `
                                <button onclick="spotCarouselPrev()" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:18px">‹</button>
                                <button onclick="spotCarouselNext()" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:18px">›</button>
                                <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.5);color:white;padding:2px 10px;border-radius:10px;font-size:12px">
                                    <span id="spot-carousel-cur">1</span>/${imgs.length}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
                return `<div style="font-size:4rem;margin-bottom:10px">${spot.icon}</div>`;
            })()}
            <h1>${spot.name}</h1>
            <p>📍 ${spot.address} · ${spot.campus} · ${spot.category}</p>
            <div class="detail-actions">
                <button class="btn btn-primary btn-lg" onclick="handleCheckin(${spot.id})">
                    ✅ 打卡
                </button>
                <button class="btn btn-outline btn-lg ${isFav?'active':''}" onclick="handleFavSpot(${spot.id})">
                    ${isFav ? '⭐ 已收藏' : '☆ 收藏'}
                </button>
                <button class="btn btn-outline btn-lg ${isLiked?'active':''}" onclick="handleLikeSpot(${spot.id})">
                    ${isLiked ? '👍 已点赞' : '👎 点赞'}
                </button>
                <a href="#/map?spot=${spot.id}" class="btn btn-secondary btn-lg">🗺️ 在地图查看</a>
            </div>
        </div>

        <div class="detail-body">
            <div>
                <div class="detail-section">
                    <h3>📝 景点介绍</h3>
                    <p style="line-height:1.8;color:var(--text-light)">${spot.description}</p>
                </div>

                <div class="detail-section">
                    <h3>📍 位置信息</h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
                        <div><strong>校区：</strong>${spot.campus}</div>
                        <div><strong>类别：</strong>${spot.category}</div>
                        <div><strong>地址：</strong>${spot.address}</div>
                        <div><strong>开放时间：</strong>${spot.openTime}</div>
                        <div><strong>经纬度：</strong>${spot.lat}, ${spot.lng}</div>
                        <div><strong>热度值：</strong>🔥 ${spot.hot}</div>
                    </div>
                </div>

                <!-- Leaflet 小地图 -->
                <div class="detail-section">
                    <h3>🗺️ 位置地图</h3>
                    <div class="map-container" style="height:320px">
                        <div id="detail-map" style="height:100%"></div>
                    </div>
                </div>

                <!-- 相关游记 -->
                <div class="detail-section">
                    <h3>📖 相关游记</h3>
                    ${renderRelatedTravels(spot.id)}
                </div>

                <!-- 评论区 -->
                <div class="detail-section">
                    <h3>💬 评论区 (${comments.length})</h3>
                    ${user ? `
                        <div style="margin-bottom:20px">
                            <textarea id="comment-input" class="form-control form-textarea" placeholder="说点什么吧..."></textarea>
                            <button class="btn btn-primary mt-8" onclick="submitComment(${spotId}, 'spot')">发表评论</button>
                        </div>
                    ` : `<p class="text-muted mb-16">登录后可发表评论</p>`}

                    ${comments.length === 0 ? '<p class="text-muted">暂无评论，快来抢沙发吧！</p>' : comments.map(c => {
                        const cu = Query.getUser(c.userId) || {};
                        return `
                        <div class="comment-item" style="cursor:pointer;transition:background 0.2s" onclick="showUserCard(${c.userId})"
                             onmouseover="this.style.background='var(--primary-light,#f0faf5)'"
                             onmouseout="this.style.background=''">
                            <div class="comment-header">
                                <span class="comment-author" style="text-decoration:underline">${cu.avatar || '👤'} ${cu.username || '匿名用户'}</span>
                                <span class="comment-time">${c.time}</span>
                            </div>
                            <div class="comment-content">${c.content}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div>
                <div class="detail-section">
                    <h3>🔥 同校区推荐</h3>
                    ${nearbySpots.length === 0
                        ? '<p class="text-muted">暂无同校区景点</p>'
                        : nearbySpots.map(renderSmallSpotCard).join('')}
                </div>
            </div>
        </div>
    `;

    // 初始化地图
    setTimeout(() => {
        const mapEl = document.getElementById('detail-map');
        if (!mapEl || mapEl._leaflet_id) return;
        const map = L.map('detail-map').setView([spot.lat, spot.lng], 16);
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1','2','3','4'],
            attribution: '© 高德地图',
            maxZoom: 19
        }).addTo(map);
        L.marker([spot.lat, spot.lng]).addTo(map)
            .bindPopup(`<b>${spot.name}</b><br>${spot.address}`).openPopup();
    }, 100);
};

/* ===== 校园地图导览页 ===== */
Router.pages['/map'] = (app) => {
    const spots = DB.get(STORAGE_KEYS.SPOTS);
    const highlightId = parseInt(Router.getQuery('spot') || 0);

    app.innerHTML = `
        <div class="section" style="padding-bottom:0">
            <div class="section-title">🗺️ 校园地图导览</div>

            <!-- 路线规划 -->
            <div class="route-controls">
                <div class="form-group">
                    <label class="form-label">起点</label>
                    <select id="route-start" class="form-control">
                        <option value="">选择起点...</option>
                        ${spots.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">终点</label>
                    <select id="route-end" class="form-control">
                        <option value="">选择终点...</option>
                        ${spots.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-primary" onclick="planRoute()">🧭 生成路线</button>
                <button class="btn btn-secondary" onclick="clearRoute()">清除路线</button>
            </div>

            <!-- 路线信息 -->
            <div id="route-info" class="detail-section hidden" style="margin-bottom:16px">
                <h3>📏 路线详情</h3>
                <div id="route-content"></div>
            </div>

            <!-- 地图 -->
            <div class="map-container" id="map-container">
                <button class="map-fs-btn" id="map-fs-btn" onclick="Router.toggleMapFullscreen()">⛶ 放大全屏</button>
                <div id="campus-map"></div>
            </div>
        </div>
    `;

    let mapInstance = null;
    let markersLayer = null;
    let routeLine = null;

    setTimeout(() => {
        const map = L.map('campus-map').setView([28.1335, 112.9950], 17);
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1','2','3','4'],
            attribution: '© 高德地图',
            maxZoom: 19
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);

        // 右键菜单 DOM（只初始化一次）
        const ctxMenu = document.createElement('div');
        ctxMenu.className = 'marker-ctx-menu';
        ctxMenu.style.cssText = 'display:none;position:fixed;z-index:1000;background:white;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);padding:6px 0;min-width:160px;overflow:hidden';
        ctxMenu.innerHTML = `<div class="ctx-item" style="padding:8px 16px;cursor:pointer;font-size:0.88rem;color:var(--primary);display:flex;align-items:center;gap:8px;border-bottom:1px solid #eee">📍 <span id="ctx-spot-name"></span></div><div class="ctx-item" id="ctx-edit-pos" style="padding:8px 16px;cursor:pointer;font-size:0.88rem;display:flex;align-items:center;gap:8px">✏️ 修改地点位置（管理员）</div>`;
        document.body.appendChild(ctxMenu);

        let editingMarker = null;
        let editingSpot = null;
        let originalLatLng = null;
        let ghostMarker = null;
        const isAdminNow = () => Query.isAdminLoggedIn();

        // 点击外部关闭菜单
        document.addEventListener('click', () => { ctxMenu.style.display = 'none'; });

        ctxMenu.querySelector('#ctx-edit-pos').addEventListener('click', () => {
            if (!editingMarker) return;
            ctxMenu.style.display = 'none';
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            editingMarker.dragging.enable();
            UI.toast('✏️ 开始拖拽：按住左键移动标记位置', 'info');
        });

        // 添加所有景点标记
        spots.forEach(s => {
            const marker = L.marker([s.lat, s.lng], { draggable: false })
                .addTo(markersLayer)
                .bindPopup(`
                    <b style="font-size:1.05rem">${UI.spotIcon(s, 36)} ${s.name}</b><br>
                    <span style="color:#666;font-size:0.85rem">${s.category} · ${s.campus}</span><br>
                    <span style="color:#888;font-size:0.8rem">${s.address}</span><br>
                    <a href="#/spots/${s.id}" style="color:var(--primary);font-size:0.85rem">查看详情 →</a>
                `);

            // 右键：仅管理员显示自定义菜单
            marker.on('contextmenu', (e) => {
                L.DomEvent.preventDefault(e.originalEvent);
                if (!isAdminNow()) return; // 普通用户 → 屏蔽
                editingMarker = marker;
                editingSpot = s;
                originalLatLng = { lat: s.lat, lng: s.lng };
                ctxMenu.querySelector('#ctx-spot-name').textContent = s.name;
                ctxMenu.style.left = (e.originalEvent.clientX + 4) + 'px';
                ctxMenu.style.top = (e.originalEvent.clientY + 4) + 'px';
                ctxMenu.style.display = 'block';
            });

            // 开始拖拽 → 显示虚影 + move 光标
            marker.on('dragstart', () => {
                editingSpot = s;
                originalLatLng = { lat: s.lat, lng: s.lng };
                // 创建虚影
                const ll = marker.getLatLng();
                ghostMarker = L.marker([ll.lat, ll.lng], {
                    interactive: false,
                    opacity: 0.35,
                    icon: L.divIcon({
                        className: '',
                        html: `<div style="width:30px;height:30px;border-radius:50%;background:rgba(45,155,122,0.4);border:2px dashed var(--primary);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:14px">📍</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(map);
                marker._origCursor = marker.getElement().style.cursor;
                marker.getElement().style.cursor = 'move';
                document.body.style.cursor = 'move';
            });

            // 拖拽中 → 虚影跟随
            marker.on('drag', () => {
                if (ghostMarker) ghostMarker.setLatLng(marker.getLatLng());
            });

            // 松开左键
            marker.on('dragend', () => {
                document.body.style.cursor = '';
                if (ghostMarker) { map.removeLayer(ghostMarker); ghostMarker = null; }
                const newLl = marker.getLatLng();
                marker.dragging.disable();
                // 恢复地图交互
                map.dragging.enable();
                map.touchZoom.enable();
                map.doubleClickZoom.enable();
                map.scrollWheelZoom.enable();
                map.boxZoom.enable();
                map.keyboard.enable();

                if (!isAdminNow()) return;

                UI.openModal('📍 保存新位置',
                    `<p><strong>景点：</strong>${editingSpot.name}</p>
                     <p><strong>原坐标：</strong>${originalLatLng.lat.toFixed(4)}, ${originalLatLng.lng.toFixed(4)}</p>
                     <p><strong>新坐标：</strong>${newLl.lat.toFixed(4)}, ${newLl.lng.toFixed(4)}</p>
                     <p class="text-muted" style="font-size:0.85rem">是否保存该景点新的经纬度？</p>`,
                    `<button class="btn btn-outline" onclick="cancelSpotMove()">取消</button>
                     <button class="btn btn-primary" onclick="confirmSpotMove()">✅ 保存</button>`);

                window.confirmSpotMove = () => {
                    editingSpot.lat = parseFloat(newLl.lat.toFixed(5));
                    editingSpot.lng = parseFloat(newLl.lng.toFixed(5));
                    DB.update(STORAGE_KEYS.SPOTS, editingSpot.id, {
                        lat: editingSpot.lat, lng: editingSpot.lng
                    });
                    UI.closeModal();
                    UI.toast('位置已保存，所有页面同步更新', 'success');
                };
                window.cancelSpotMove = () => {
                    marker.setLatLng([originalLatLng.lat, originalLatLng.lng]);
                    editingSpot.lat = originalLatLng.lat;
                    editingSpot.lng = originalLatLng.lng;
                    UI.closeModal();
                    UI.toast('已取消，位置回弹到原点', 'info');
                };
            });

            if (s.id === highlightId) {
                marker.openPopup();
                map.setView([s.lat, s.lng], 16);
            }
        });

        mapInstance = map;

        window.planRoute = () => {
            const startId = parseInt(document.getElementById('route-start').value);
            const endId = parseInt(document.getElementById('route-end').value);
            if (!startId || !endId) {
                UI.toast('请选择起点和终点', 'warning');
                return;
            }

            const start = Query.getSpot(startId);
            const end = Query.getSpot(endId);
            if (!start || !end) return;

            // 清除已有路线
            if (routeLine) { map.removeLayer(routeLine); routeLine = null; }

            // 计算沿途景点（直线附近的）
            const dx = end.lng - start.lng;
            const dy = end.lat - start.lat;
            const dist = Utils.haversineDistance(start.lat, start.lng, end.lat, end.lng);

            const routeSpots = spots.filter(s => {
                if (s.id === startId || s.id === endId) return false;
                const distToLine = Utils.pointToLineDistance(
                    s.lat, s.lng, start.lat, start.lng, end.lat, end.lng
                );
                return distToLine < dist * 0.3 && s.id !== startId && s.id !== endId;
            }).slice(0, 5);

            // 绘制路线（直线 + 中间点模拟路径）
            const waypoints = [start, ...routeSpots, end];
            const latlngs = waypoints.map(w => [w.lat, w.lng]);
            routeLine = L.polyline(latlngs, {
                color: '#2d9b7a', weight: 5, opacity: 0.8, dashArray: '10, 10'
            }).addTo(map);

            // 标记起点终点
            L.marker([start.lat, start.lng], {
                icon: L.divIcon({ className: '', html: `<div style="background:#27ae60;color:white;padding:2px 8px;border-radius:4px;font-size:12px">起点</div>` })
            }).addTo(map).bindPopup('起点: ' + start.name);

            L.marker([end.lat, end.lng], {
                icon: L.divIcon({ className: '', html: `<div style="background:#e74c3c;color:white;padding:2px 8px;border-radius:4px;font-size:12px">终点</div>` })
            }).addTo(map).bindPopup('终点: ' + end.name);

            // 显示路线信息
            document.getElementById('route-info').classList.remove('hidden');
            document.getElementById('route-content').innerHTML = `
                <p><strong>距离：</strong>${dist.toFixed(2)} km</p>
                <p><strong>步行时间（预计）：</strong>${Math.round(dist * 12)} 分钟</p>
                <p><strong>沿途景点（${routeSpots.length} 个）：</strong></p>
                ${routeSpots.length === 0 ? '<p class="text-muted">无</p>' :
                    routeSpots.map(s => `
                        <div style="padding:8px 12px;background:var(--secondary);border-radius:6px;margin-bottom:6px">
                            ${UI.spotIcon(s, 28)} <a href="#/spots/${s.id}">${s.name}</a> (${s.category})
                        </div>
                    `).join('')}
            `;

            map.fitBounds(routeLine.getBounds().pad(0.2));
            UI.toast(`路线规划完成！约 ${dist.toFixed(2)}km`, 'success');
        };

        window.clearRoute = () => {
            if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
            document.getElementById('route-info').classList.add('hidden');
            mapInstance.setView([28.1335, 112.9950], 17);
        };
    }, 100);
};

/* ===== 以图识景页 ===== */
Router.pages['/recognize'] = (app) => {
    app.innerHTML = `
        <div class="section">
            <div class="section-title">📸 以图识景</div>
            <p class="section-subtitle">上传校园建筑照片，系统智能识别其中的校园景点</p>

            <!-- 上传区域 -->
            <div id="upload-area" class="upload-area" onclick="document.getElementById('file-input').click()">
                <div class="upload-icon">📷</div>
                <div class="upload-text">点击上传 / 拖拽图片到这里</div>
                <div class="upload-hint">支持 JPG、PNG 格式，建议上传清晰的校园建筑照片</div>
                <input type="file" id="file-input" accept="image/*" style="display:none">
            </div>

            <!-- 预览 -->
            <div id="preview-container" style="display:none;margin:16px 0;text-align:center">
                <img id="preview-img" style="max-width:400px;border-radius:12px;box-shadow:var(--shadow)">
                <div style="margin-top:12px">
                    <button class="btn btn-primary" onclick="startRecognize()">🔍 开始识别</button>
                    <button class="btn btn-outline" onclick="clearPreview()">重新上传</button>
                </div>
            </div>

            <!-- 识别结果 -->
            <div id="result-container" class="recognize-result">
                <h3>🎯 识别结果</h3>
                <div id="result-content"></div>
            </div>
        </div>
    `;

    let uploadedImageData = null;

    // 拖拽上传
    const uploadArea = document.getElementById('upload-area');
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault(); uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    const handleFile = (file) => {
        if (!file.type.startsWith('image/')) { UI.toast('请上传图片文件', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            uploadedImageData = ev.target.result;
            document.getElementById('preview-img').src = ev.target.result;
            document.getElementById('preview-container').style.display = 'block';
            document.getElementById('upload-area').style.display = 'none';
            document.getElementById('result-container').classList.remove('show');
        };
        reader.readAsDataURL(file);
    };

    window.clearPreview = () => {
        uploadedImageData = null;
        document.getElementById('file-input').value = '';
        document.getElementById('preview-container').style.display = 'none';
        document.getElementById('upload-area').style.display = 'block';
        document.getElementById('result-container').classList.remove('show');
    };

    window.startRecognize = async () => {
        if (!uploadedImageData) return;
        UI.showLoading();
        const result = await Algorithms.YOLOv8.recognize(uploadedImageData);
        UI.hideLoading();

        const resultBox = document.getElementById('result-container');
        resultBox.classList.add('show');

            if (result.success) {
                document.getElementById('result-content').innerHTML = `
                    <div class="detection-box">✅ 检测到 ${result.matches.length} 个景点！</div>
                    <div class="grid grid-2">
                        ${result.matches.map(m => `
                            <div class="card" style="padding:16px">
                                ${m.spot.image && (m.spot.image.startsWith('data:image') || m.spot.image.startsWith('asset') || m.spot.image.startsWith('http'))
                                    ? `<img src="${m.spot.image}" style="width:100%;height:80px;object-fit:cover;border-radius:8px">`
                                    : `<div class="card-img" style="height:80px;font-size:2.5rem">${m.spot.icon}</div>`}
                                <div class="card-body" style="padding:12px 0 0">
                                    <div class="card-title">${m.spot.name}</div>
                                    <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">
                                        ${m.spot.category} · ${m.spot.campus}
                                    </div>
                                    <div style="font-size:0.85rem;margin-bottom:8px">
                                        <span class="badge badge-primary">置信度: ${(parseFloat(m.confidence)*100).toFixed(1)}%</span>
                                    </div>
                                    <p style="font-size:0.8rem;color:var(--text-light);line-height:1.5">
                                        ${m.spot.description.substring(0, 80)}...
                                    </p>
                                    <a href="#/spots/${m.spot.id}" class="btn btn-sm btn-outline mt-8">查看详情 →</a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                UI.toast('识别完成！', 'success');
            } else {
                document.getElementById('result-content').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🤔</div>
                        <p>没有识别出景点</p>
                        <p class="text-muted" style="font-size:0.85rem">请尝试上传更清晰的照片</p>
                    </div>
                `;
                UI.toast('未识别到景点', 'warning');
            }
    };
};

/* ============================================
   辅助渲染函数（共享）
   ============================================ */

function renderSpotCard(spot) {
    const hasImg = spot.image && (
        spot.image.startsWith('data:image') ||
        spot.image.startsWith('http') ||
        spot.image.startsWith('asset') ||
        spot.image.startsWith('./')
    );
    return `
        <a href="#/spots/${spot.id}" class="card" style="text-decoration:none;color:inherit">
            <div class="card-img">
                <span class="img-badge">🔥 ${spot.hot}</span>
                ${hasImg
                    ? `<img src="${spot.image}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:12px" onerror="this.style.display='none';this.parentNode.innerHTML+='<span style=\\'font-size:3rem\\'>${spot.icon}</span>'">`
                    : `<span style="font-size:3rem">${spot.icon}</span>`}
            </div>
            <div class="card-body">
                <div class="card-title">${spot.name}</div>
                <div style="margin-bottom:6px">
                    <span class="card-tag">${spot.category}</span>
                    <span class="card-tag">${spot.campus}</span>
                </div>
                <div class="card-desc">${spot.description}</div>
                <div class="card-meta">
                    <span>📍 ${spot.address}</span>
                </div>
            </div>
        </a>
    `;
}

function renderSmallSpotCard(spot) {
    return `
        <a href="#/spots/${spot.id}" style="display:flex;gap:10px;padding:10px;border-radius:8px;
            text-decoration:none;color:inherit;transition:background 0.2s"
            onmouseover="this.style.background='var(--secondary)'" onmouseout="this.style.background='transparent'">
            ${UI.spotIcon(spot, 32)}
            <div style="flex:1">
                <div style="font-weight:600;font-size:0.9rem">${spot.name}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${spot.category} · 🔥${spot.hot}</div>
            </div>
        </a>
    `;
}

function renderTravelCard(travel) {
    const author = Query.getUser(travel.userId);
    return `
        <a href="#/travels/${travel.id}" class="card" style="text-decoration:none;color:inherit">
            <div class="card-img">
                <span style="font-size:3rem">${travel.image || '📖'}</span>
            </div>
            <div class="card-body">
                <div class="card-title">${travel.title}</div>
                <div class="card-desc">${travel.content.substring(0, 80)}...</div>
                <div style="margin-bottom:6px">
                    ${(travel.tags || []).slice(0, 3).map(t => `<span class="card-tag">#${t}</span>`).join('')}
                </div>
                <div class="card-meta">
                    <span>${author?.avatar} ${author?.username || '匿名'}</span>
                    <span>❤️${travel.likes || 0} ⭐${travel.favorites || 0}</span>
                </div>
            </div>
        </a>
    `;
}

function renderRelatedTravels(spotId) {
    const allTravels = DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.status === 'approved');
    const related = allTravels.filter(t => {
        const spots = DB.get(STORAGE_KEYS.SPOTS);
        return (t.tags || []).some(tag => spots.find(s => s.name.includes(tag) || s.category.includes(tag)));
    }).slice(0, 4);

    if (related.length === 0) return '<p class="text-muted">暂无相关游记</p>';
    return `<div class="grid grid-2">${related.map(renderTravelCard).join('')}</div>`;
}

/* ---------- 交互处理函数（全局） ---------- */

// 景点详情多图轮播
window._spotCarouselIdx = 0;
window.spotCarouselShow = (idx) => {
    const c = document.getElementById('spot-carousel');
    if (!c) return;
    const imgs = c.querySelectorAll('img');
    const total = imgs.length;
    window._spotCarouselIdx = ((idx % total) + total) % total;
    imgs.forEach((img, i) => { img.style.display = (i === window._spotCarouselIdx) ? 'block' : 'none'; });
    const cur = document.getElementById('spot-carousel-cur');
    if (cur) cur.textContent = window._spotCarouselIdx + 1;
};
window.spotCarouselNext = () => spotCarouselShow(window._spotCarouselIdx + 1);
window.spotCarouselPrev = () => spotCarouselShow(window._spotCarouselIdx - 1);

window.handleCheckin = (spotId) => {
    const user = Query.getCurrentUser();
    if (!user) { UI.toast('请先登录', 'warning'); Router.navigate('/login'); return; }

    const checkins = DB.get(STORAGE_KEYS.CHECKINS);
    const today = new Date().toLocaleDateString();
    const todayCheckin = checkins.find(c => c.userId === user.id && c.spotId === spotId &&
        c.time.startsWith(today));

    if (todayCheckin) {
        UI.toast('今天已经打过卡啦！', 'warning');
        return;
    }

    DB.add(STORAGE_KEYS.CHECKINS, {
        userId: user.id, spotId, time: Utils.now()
    });
    UI.toast('🎉 打卡成功！', 'success');

    // 打卡 → 热度 +3（最强信号，真的去了）
    const spot = Query.getSpot(spotId);
    if (spot) DB.update(STORAGE_KEYS.SPOTS, spotId, { hot: spot.hot + 3 });
};

window.handleFavSpot = (spotId) => {
    const user = Query.getCurrentUser();
    if (!user) { UI.toast('请先登录', 'warning'); Router.navigate('/login'); return; }

    const favs = DB.get(STORAGE_KEYS.USER_FAV_SPOTS);
    const existIdx = favs.findIndex(f => f.userId === user.id && f.spotId === spotId);
    const spot = Query.getSpot(spotId);

    if (existIdx >= 0) {
        favs.splice(existIdx, 1);
        DB.set(STORAGE_KEYS.USER_FAV_SPOTS, favs);
        // 取消收藏 → 热度 -2
        if (spot) DB.update(STORAGE_KEYS.SPOTS, spotId, { hot: Math.max(0, spot.hot - 2) });
        UI.toast('已取消收藏', 'info');
    } else {
        favs.push({ userId: user.id, spotId });
        DB.set(STORAGE_KEYS.USER_FAV_SPOTS, favs);
        // 收藏 → 热度 +2（想再次去）
        if (spot) DB.update(STORAGE_KEYS.SPOTS, spotId, { hot: spot.hot + 2 });
        UI.toast('⭐ 收藏成功！热度+2', 'success');
    }

    Router.handleRoute();
};

window.handleLikeSpot = (spotId) => {
    const user = Query.getCurrentUser();
    if (!user) { UI.toast('请先登录', 'warning'); Router.navigate('/login'); return; }

    const liked = Query.toggleLike(user.id, spotId, 'spot');
    const spot = Query.getSpot(spotId);
    if (spot) {
        const delta = liked ? 1 : -1;
        DB.update(STORAGE_KEYS.SPOTS, spotId, { hot: Math.max(0, spot.hot + delta) });
    }
    UI.toast(liked ? '👍 点赞成功 热度+1' : '已取消点赞', 'info');
    Router.handleRoute();
};

/* ===== 好友功能 ===== */
window.showUserCard = (userId) => {
    const user = Query.getCurrentUser();
    if (!user) { UI.toast('请先登录', 'warning'); return; }
    if (userId === user.id) { UI.toast('这是你自己', 'info'); return; }
    const target = Query.getUser(userId);
    if (!target) return;

    const friends = DB.get(STORAGE_KEYS.FRIENDS);
    // 双向查找好友关系
    const myRelation = friends.find(f =>
        (f.fromUserId === user.id && f.toUserId === userId) ||
        (f.fromUserId === userId && f.toUserId === user.id)
    );
    let btnHTML;
    if (!myRelation) {
        btnHTML = `<button class="btn btn-primary" onclick="sendFriendRequest(${userId})">➕ 加好友</button>`;
    } else if (myRelation.status === 'pending') {
        if (myRelation.fromUserId === user.id) {
            btnHTML = `<button class="btn btn-outline" disabled>⏳ 等待对方确认</button>`;
        } else {
            btnHTML = `
                <button class="btn btn-primary" onclick="acceptFriend(${myRelation.id})">✅ 接受</button>
                <button class="btn btn-outline" onclick="rejectFriend(${myRelation.id})">❌ 拒绝</button>
            `;
        }
    } else if (myRelation.status === 'accepted') {
        btnHTML = `<button class="btn btn-outline" onclick="removeFriend(${myRelation.id})">🗑️ 删除好友</button>`;
    }

    UI.openModal(`${target.avatar} ${target.username}`, `
        <div style="text-align:center;padding:20px">
            <div style="font-size:3rem;margin-bottom:10px">${target.avatar}</div>
            <h3 style="margin:8px 0">${target.username}</h3>
            <p class="text-muted">🎓 ${target.studentId} | 📱 ${target.phone}</p>
            <p style="margin-top:10px">${target.bio || '这个人很懒，还没写简介'}</p>
            <div style="margin-top:20px;display:flex;gap:10px;justify-content:center">
                ${btnHTML}
            </div>
        </div>
    `);
};

window.sendFriendRequest = (toUserId) => {
    const me = Query.getCurrentUser();
    if (!me) return;
    const friends = DB.get(STORAGE_KEYS.FRIENDS);
    const exists = friends.find(f =>
        (f.fromUserId === me.id && f.toUserId === toUserId) ||
        (f.fromUserId === toUserId && f.toUserId === me.id)
    );
    if (exists) { UI.toast('已经是好友或已发送请求', 'warning'); return; }
    const id = Date.now();
    DB.add(STORAGE_KEYS.FRIENDS, {
        id, fromUserId: me.id, toUserId,
        status: 'pending', time: new Date().toLocaleString('zh-CN')
    });
    UI.toast('✅ 好友请求已发送！', 'success');
    UI.closeModal();
};

window.acceptFriend = (friendId) => {
    DB.update(STORAGE_KEYS.FRIENDS, friendId, { status: 'accepted' });
    UI.toast('✅ 已接受！你们是好友了', 'success');
    UI.closeModal();
    Router.handleRoute();
};

window.rejectFriend = (friendId) => {
    DB.remove(STORAGE_KEYS.FRIENDS, friendId);
    UI.toast('已拒绝', 'info');
    UI.closeModal();
};

window.removeFriend = (friendId) => {
    UI.openModal('删除好友', '<p>确定要删除这个好友吗？</p>', `
        <button class="btn btn-danger" onclick="DB.remove('${STORAGE_KEYS.FRIENDS}', ${friendId}); UI.closeModal(); Router.handleRoute(); UI.toast('已删除好友');">确定删除</button>
        <button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
    `);
};

window.searchUser = () => {
    const kw = document.getElementById('friend-search-input').value.trim();
    if (!kw) { UI.toast('输入用户名或学号', 'warning'); return; }
    const users = DB.get(STORAGE_KEYS.USERS);
    const me = Query.getCurrentUser();
    const results = users.filter(u => u.id !== me.id && (
        u.username.includes(kw) || u.studentId.includes(kw)
    ));
    const list = document.getElementById('friend-search-results');
    if (results.length === 0) {
        list.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px">没找到匹配的用户</p>';
        return;
    }
    list.innerHTML = results.map(u => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--secondary);border-radius:8px;margin-bottom:8px;cursor:pointer"
             onclick="showUserCard(${u.id})">
            <div style="font-size:1.8rem">${u.avatar}</div>
            <div style="flex:1">
                <div style="font-weight:600">${u.username}</div>
                <div class="text-muted" style="font-size:0.8rem">🎓 ${u.studentId}</div>
            </div>
            <span style="color:var(--primary)">查看 →</span>
        </div>
    `).join('');
};

window.submitComment = (targetId, targetType) => {
    const user = Query.getCurrentUser();
    if (!user) { UI.toast('请先登录', 'warning'); return; }
    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    if (!content) { UI.toast('请输入评论内容', 'warning'); return; }

    DB.add(STORAGE_KEYS.COMMENTS, {
        userId: user.id, targetId, targetType, content, time: Utils.now()
    });
    UI.toast('评论发表成功！', 'success');
    Router.handleRoute();
};

// 轮播对象
UI.carousel = {
    init(id) {
        const carousel = document.getElementById(id);
        if (!carousel) return;
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dots = carousel.querySelectorAll('.carousel-dot');
        let idx = 0;

        const goTo = (n) => {
            idx = (n + slides.length) % slides.length;
            slides.forEach((s, i) => s.classList.toggle('active', i === idx));
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        };

        carousel.__go = goTo;
        // 自动轮播
        carousel.__timer = setInterval(() => goTo(idx + 1), 4000);
    },
    next() { const c = document.getElementById('home-carousel'); c?.__go && c.__go(getActiveIndex(c) + 1); },
    prev() { const c = document.getElementById('home-carousel'); c?.__go && c.__go(getActiveIndex(c) - 1); },
    go(n) { const c = document.getElementById('home-carousel'); c?.__go && c.__go(n); }
};

function getActiveIndex(carousel) {
    const slides = carousel.querySelectorAll('.carousel-slide');
    for (let i = 0; i < slides.length; i++) {
        if (slides[i].classList.contains('active')) return i;
    }
    return 0;
}

/* ============================================
   用户端页面渲染 pages_user.js (下半部分)
   游记列表、游记详情、发布游记、个人中心、站内消息、登录注册、404
   ============================================ */

/* ===== 游记列表页 ===== */
Router.pages['/travels'] = (app) => {
    const kw = Router.getQuery('kw') || '';
    const tag = Router.getQuery('tag') || '';

    let travels = DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.status === 'approved');

    if (kw) travels = travels.filter(t => t.title.includes(kw) || t.content.includes(kw));
    if (tag) travels = travels.filter(t => (t.tags || []).includes(tag));

    // 所有标签
    const allTags = [...new Set(travels.flatMap(t => t.tags || []))];

    app.innerHTML = `
        <div class="section">
            <div class="section-title">📖 校园游记</div>
            <p class="section-subtitle">看看学长学姐们的校园故事，也发布你的游记吧！</p>

            <!-- 标签筛选 -->
            <div class="tag-group">
                <span class="tag ${!tag?'active':''}" onclick="filterTag('')">全部</span>
                ${allTags.map(t => `
                    <span class="tag ${tag===t?'active':''}" onclick="filterTag('${t}')">#${t}</span>
                `).join('')}
            </div>

            <!-- 搜索 -->
            <div class="filter-bar">
                <div style="flex:1;min-width:200px">
                    <input id="travel-search" class="form-control" placeholder="🔍 搜索游记" value="${kw}">
                </div>
                <button class="btn btn-primary" onclick="filterTravel()">搜索</button>
                <a href="#/travels/publish" class="btn btn-outline">✍️ 发布游记</a>
            </div>

            ${travels.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">📖</div>
                    <p>暂无游记</p>
                    <a href="#/travels/publish" class="btn btn-primary mt-16">成为第一个发布游记的人！</a>
                </div>
            ` : `
                <p class="section-subtitle">共 ${travels.length} 篇游记</p>
                <div class="grid grid-3">
                    ${travels.map(renderTravelCard).join('')}
                </div>
            `}
        </div>
    `;

    window.filterTag = (t) => {
        const q = new URLSearchParams();
        if (t) q.set('tag', t);
        if (kw) q.set('kw', kw);
        Router.navigate('/travels' + (q.toString() ? '?' + q.toString() : ''));
    };

    window.filterTravel = () => {
        const k = document.getElementById('travel-search').value.trim();
        const q = new URLSearchParams();
        if (k) q.set('kw', k);
        if (tag) q.set('tag', tag);
        Router.navigate('/travels' + (q.toString() ? '?' + q.toString() : ''));
    };

    document.getElementById('travel-search')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterTravel();
    });
};

/* ===== 游记详情页 ===== */
Router.pages['/travels/:id'] = (app, travelId) => {
    const travel = Query.getTravel(travelId);
    if (!travel || travel.status !== 'approved') {
        app.innerHTML = '<div class="empty-state"><div class="empty-icon">❓</div><p>游记不存在或未审核通过</p></div>';
        return;
    }

    const user = Query.getCurrentUser();
    const isAuthor = user && user.id === travel.userId;
    const isFav = user ? Query.getUserFavTravelIds(user.id).includes(travelId) : false;
    const liked = user ? Query.hasLiked(user.id, travelId, 'travel') : false;
    const comments = Query.getTravelComments(travelId);
    const author = Query.getUser(travel.userId);

    app.innerHTML = `
        <div class="detail-header">
            <div style="font-size:3rem;margin-bottom:10px">${travel.image || '📖'}</div>
            <h1>${travel.title}</h1>
            <p>✍️ ${author?.username || '匿名'} · ${travel.createTime}</p>
            <div class="detail-actions">
                <button class="btn ${liked?'btn-primary':'btn-outline'} btn-lg" onclick="handleLikeTravel(${travelId})">
                    ${liked ? '❤️' : '🤍'} 点赞 ${travel.likes || 0}
                </button>
                <button class="btn ${isFav?'btn-primary':'btn-outline'} btn-lg" onclick="handleFavTravel(${travelId})">
                    ${isFav ? '⭐ 已收藏' : '☆ 收藏'} ${travel.favorites || 0}
                </button>
                ${isAuthor ? `<button class="btn btn-danger btn-lg" onclick="deleteTravel(${travelId})">🗑️ 删除</button>` : ''}
            </div>
        </div>

        <div class="detail-body">
            <div>
                <div class="detail-section">
                    <div style="margin-bottom:16px">
                        ${(travel.tags || []).map(t => `<span class="tag tag-outline">#${t}</span>`).join('')}
                    </div>
                    <div style="line-height:1.9;font-size:1rem;color:var(--text-light)">
                        ${Utils.renderRichText(travel.content)}
                    </div>
                </div>

                <!-- 评论区 -->
                <div class="detail-section">
                    <h3>💬 评论 (${comments.length})</h3>
                    ${user ? `
                        <div style="margin-bottom:20px">
                            <textarea id="travel-comment-input" class="form-control form-textarea" placeholder="写下你的评论..."></textarea>
                            <button class="btn btn-primary mt-8" onclick="submitTravelComment(${travelId})">发表评论</button>
                        </div>
                    ` : `<p class="text-muted mb-16">登录后可发表评论</p>`}

                    ${comments.length === 0 ? '<p class="text-muted">暂无评论</p>' : comments.map(c => {
                        const cu = Query.getUser(c.userId) || {};
                        return `
                        <div class="comment-item" style="cursor:pointer" onclick="showUserCard(${c.userId})">
                            <div class="comment-header">
                                <span class="comment-author">${cu.avatar || '👤'} ${cu.username || '匿名'}</span>
                                <span class="comment-time">${c.time}
                                    ${user && user.id === c.userId ? `
                                        <button class="btn btn-sm btn-danger" style="margin-left:8px" onclick="event.stopPropagation(); deleteComment(${c.id})">删除</button>
                                    ` : ''}
                                </span>
                            </div>
                            <div class="comment-content">${c.content}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div>
                <div class="detail-section">
                    <h3>📊 互动数据</h3>
                    <div style="display:flex;justify-content:space-around;text-align:center;padding:12px 0">
                        <div><div style="font-size:1.5rem;font-weight:700;color:var(--primary)">${travel.likes || 0}</div><div class="text-muted" style="font-size:0.8rem">点赞</div></div>
                        <div><div style="font-size:1.5rem;font-weight:700;color:var(--accent)">${travel.favorites || 0}</div><div class="text-muted" style="font-size:0.8rem">收藏</div></div>
                        <div><div style="font-size:1.5rem;font-weight:700;color:var(--info)">${comments.length}</div><div class="text-muted" style="font-size:0.8rem">评论</div></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>✍️ 发布你的游记</h3>
                    <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px">分享你的校园故事，让更多同学看到！</p>
                    <a href="#/travels/publish" class="btn btn-primary btn-block">立即发布</a>
                </div>
            </div>
        </div>
    `;

    window.handleLikeTravel = (id) => {
        const u = Query.getCurrentUser();
        if (!u) { UI.toast('请先登录', 'warning'); return; }
        const liked = Query.toggleLike(u.id, id, 'travel');
        const t = Query.getTravel(id);
        DB.update(STORAGE_KEYS.TRAVELS, id, { likes: (t.likes || 0) + (liked ? 1 : -1) });
        UI.toast(liked ? '点赞成功' : '取消点赞', 'info');
        Router.handleRoute();
    };

    window.handleFavTravel = (id) => {
        const u = Query.getCurrentUser();
        if (!u) { UI.toast('请先登录', 'warning'); return; }
        const favs = DB.get(STORAGE_KEYS.USER_FAV_TRAVELS);
        const existIdx = favs.findIndex(f => f.userId === u.id && f.travelId === id);
        const t = Query.getTravel(id);
        if (existIdx >= 0) {
            favs.splice(existIdx, 1);
            DB.update(STORAGE_KEYS.TRAVELS, id, { favorites: (t.favorites || 0) - 1 });
            UI.toast('已取消收藏', 'info');
        } else {
            favs.push({ userId: u.id, travelId: id });
            DB.update(STORAGE_KEYS.TRAVELS, id, { favorites: (t.favorites || 0) + 1 });
            UI.toast('⭐ 收藏成功', 'success');
        }
        DB.set(STORAGE_KEYS.USER_FAV_TRAVELS, favs);
        Router.handleRoute();
    };

    window.deleteTravel = (id) => {
        UI.openModal('删除确认', '<p>确定要删除这篇游记吗？此操作不可恢复。</p>',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmDeleteTravel(${id})">确认删除</button>`);
    };

    window.confirmDeleteTravel = (id) => {
        DB.remove(STORAGE_KEYS.TRAVELS, id);
        UI.closeModal();
        UI.toast('游记已删除', 'success');
        Router.navigate('/travels');
    };

    window.submitTravelComment = (targetId) => {
        const u = Query.getCurrentUser();
        const input = document.getElementById('travel-comment-input');
        const content = input.value.trim();
        if (!content) { UI.toast('请输入评论', 'warning'); return; }
        DB.add(STORAGE_KEYS.COMMENTS, {
            userId: u.id, targetId, targetType: 'travel', content, time: Utils.now()
        });
        UI.toast('评论发表成功', 'success');
        Router.handleRoute();
    };

    window.deleteComment = (id) => {
        DB.remove(STORAGE_KEYS.COMMENTS, id);
        UI.toast('评论已删除', 'success');
        Router.handleRoute();
    };
};

/* ===== 发布游记页 ===== */
Router.pages['/travels/publish'] = (app) => {
    const user = Query.getCurrentUser();
    if (!user) { Router.navigate('/login'); return; }

    app.innerHTML = `
        <div class="section">
            <div class="section-title">✍️ 发布游记</div>

            <div class="detail-section">
                <div class="form-group">
                    <label class="form-label">游记标题 *</label>
                    <input id="publish-title" class="form-control" placeholder="给你的游记起个响亮的名字">
                </div>
                <div class="form-group">
                    <label class="form-label">游记内容 *</label>
                    <textarea id="publish-content" class="form-control form-textarea" rows="10"
                        placeholder="分享你的校园故事... 支持换行"></textarea>
                </div>

                <!-- 自动标签预览 -->
                <div class="form-group">
                    <label class="form-label">🏷️ 自动生成标签</label>
                    <div id="auto-tags-preview" style="min-height:40px;padding:10px;background:var(--secondary);border-radius:8px">
                        <span class="text-muted">输入内容后自动生成...</span>
                    </div>
                </div>

                <!-- 敏感词检测结果 -->
                <div id="sensitive-result" style="margin-bottom:12px"></div>

                <div style="display:flex;gap:12px">
                    <button class="btn btn-primary btn-lg" onclick="publishTravel()">🚀 提交发布</button>
                    <button class="btn btn-secondary btn-lg" onclick="Router.navigate('/travels')">取消</button>
                </div>
            </div>
        </div>
    `;

    // 实时自动生成标签（后台算法驱动）
    const textarea = document.getElementById('publish-content');
    textarea.addEventListener('input', Utils.debounce(() => {
        const text = textarea.value.trim();
        if (text.length < 10) {
            document.getElementById('auto-tags-preview').innerHTML =
                '<span class="text-muted">内容太短，输入更多字后自动生成...</span>';
            return;
        }
        const result = Algorithms.TextRank.extractWithDetail(text, 5);
        document.getElementById('auto-tags-preview').innerHTML = result.tags.length > 0
            ? result.tags.map(t => `<span class="tag tag-outline">#${t}</span>`).join('')
            : '<span class="text-muted">暂无法识别标签</span>';
    }, 800));

    window.publishTravel = () => {
        const title = document.getElementById('publish-title').value.trim();
        const content = document.getElementById('publish-content').value.trim();

        if (!title || !content) {
            UI.toast('请填写标题和内容', 'warning');
            return;
        }

        // 敏感词预检
        const sensitive = Algorithms.SensitiveWord.check(content + title);
        if (sensitive.hasSensitive) {
            document.getElementById('sensitive-result').innerHTML = `
                <div class="badge badge-danger" style="padding:10px 14px">⚠️ ${sensitive.message}</div>
            `;
            UI.toast('检测到敏感词，请修改', 'error');
            return;
        }
        document.getElementById('sensitive-result').innerHTML = '';

        // TextRank 提取标签
        const textRankResult = Algorithms.TextRank.extractWithDetail(content + title, 5);
        const tags = textRankResult.tags.length > 0 ? textRankResult.tags : ['校园', '游记'];

        DB.add(STORAGE_KEYS.TRAVELS, {
            userId: user.id,
            title,
            content,
            tags,
            image: '📖',
            likes: 0,
            favorites: 0,
            status: 'pending',
            createTime: Utils.now()
        });

        UI.toast('游记已提交，等待管理员审核', 'success');
        Router.navigate('/travels');
    };
};

/* ===== 个人中心 ===== */
Router.pages['/profile'] = (app) => {
    const user = Query.getCurrentUser();
    if (!user) { Router.navigate('/login'); return; }

    const favSpots = DB.get(STORAGE_KEYS.USER_FAV_SPOTS).filter(f => f.userId === user.id);
    const favTravels = DB.get(STORAGE_KEYS.USER_FAV_TRAVELS).filter(f => f.userId === user.id);
    const checkins = DB.get(STORAGE_KEYS.CHECKINS).filter(c => c.userId === user.id);
    const history = Query.getUserHistory(user.id);
    const myTravels = DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.userId === user.id);

    app.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${user.avatar}</div>
            <div class="profile-info">
                <h2>${user.username}</h2>
                <p>🎓 学号: ${user.studentId} | 📱 ${user.phone}</p>
                <p style="margin-top:6px;opacity:0.8">${user.bio || '这个人很懒，还没写简介'}</p>
            </div>
        </div>

        <div class="profile-tabs">
            <div class="profile-tab active" onclick="switchProfileTab('checkin')">📍 打卡记录 (${checkins.length})</div>
            <div class="profile-tab" onclick="switchProfileTab('fav-spot')">⭐ 收藏景点 (${favSpots.length})</div>
            <div class="profile-tab" onclick="switchProfileTab('fav-travel')">📖 收藏游记 (${favTravels.length})</div>
            <div class="profile-tab" onclick="switchProfileTab('friends')">👥 好友</div>
            <div class="profile-tab" onclick="switchProfileTab('history')">🕐 浏览历史 (${history.length})</div>
            <div class="profile-tab" onclick="switchProfileTab('mine')">✍️ 我的游记 (${myTravels.length})</div>
            <div class="profile-tab" onclick="switchProfileTab('settings')">⚙️ 账户设置</div>
        </div>

        <div id="profile-content"></div>
    `;

    // Tab 切换
    window.switchProfileTab = (tab) => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        renderProfileContent(tab);
    };

    window.renderProfileContent = (tab) => {
        const container = document.getElementById('profile-content');
        if (!container) return;

        const checkins = DB.get(STORAGE_KEYS.CHECKINS).filter(c => c.userId === user.id)
            .sort((a, b) => b.time.localeCompare(a.time));
        const favSpots = DB.get(STORAGE_KEYS.USER_FAV_SPOTS).filter(f => f.userId === user.id);
        const favTravels = DB.get(STORAGE_KEYS.USER_FAV_TRAVELS).filter(f => f.userId === user.id);
        const history = Query.getUserHistory(user.id);
        const myTravels = DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.userId === user.id);

        if (tab === 'checkin') {
            container.innerHTML = `<div class="detail-section">
                <h3>📍 打卡记录</h3>
                ${checkins.length === 0 ? '<p class="text-muted">还没有打卡记录，快去打卡吧！</p>' : `
                ${checkins.map(c => {
                    const s = Query.getSpot(c.spotId);
                    return `
                        <div style="display:flex;gap:12px;padding:12px;background:var(--secondary);border-radius:8px;margin-bottom:8px">
                            <div style="font-size:2rem">${s?.icon || '📍'}</div>
                            <div style="flex:1">
                                <div style="font-weight:600">${s?.name || '未知景点'}</div>
                                <div class="text-muted" style="font-size:0.8rem">${c.time}</div>
                            </div>
                        </div>`;
                }).join('')}
                `}
            </div>`;
        } else if (tab === 'fav-spot') {
            container.innerHTML = `<div class="detail-section">
                <h3>⭐ 收藏的景点</h3>
                ${favSpots.length === 0 ? '<p class="text-muted">还没有收藏任何景点</p>' : `
                <div class="grid grid-3">
                    ${favSpots.map(f => { const s = Query.getSpot(f.spotId); return s ? renderSpotCard(s) : ''; }).join('')}
                </div>
                `}
            </div>`;
        } else if (tab === 'fav-travel') {
            container.innerHTML = `<div class="detail-section">
                <h3>📖 收藏的游记</h3>
                ${favTravels.length === 0 ? '<p class="text-muted">还没有收藏任何游记</p>' : `
                <div class="grid grid-3">
                    ${favTravels.map(f => { const t = Query.getTravel(f.travelId); return t ? renderTravelCard(t) : ''; }).join('')}
                </div>
                `}
            </div>`;
        } else if (tab === 'friends') {
            const friends = DB.get(STORAGE_KEYS.FRIENDS);
            const myFriends = friends.filter(f => (
                (f.fromUserId === user.id || f.toUserId === user.id) && f.status === 'accepted'
            ));
            const pendingRequests = friends.filter(f => f.toUserId === user.id && f.status === 'pending');
            const sentRequests = friends.filter(f => f.fromUserId === user.id && f.status === 'pending');

            const friendsList = myFriends.map(f => {
                const otherId = f.fromUserId === user.id ? f.toUserId : f.fromUserId;
                return Query.getUser(otherId);
            }).filter(Boolean);

            container.innerHTML = `
                <div class="detail-section">
                    <h3>👥 我的好友 (${friendsList.length})</h3>
                    ${friendsList.length === 0 ? '<p class="text-muted">还没有好友，搜索添加吧！</p>' : `
                        <div class="grid grid-3">
                            ${friendsList.map(f => `
                                <div style="text-align:center;padding:12px;background:var(--secondary);border-radius:10px;cursor:pointer"
                                     onclick="showUserCard(${f.id})">
                                    <div style="font-size:2.5rem">${f.avatar}</div>
                                    <div style="font-weight:600;margin-top:4px">${f.username}</div>
                                    <div class="text-muted" style="font-size:0.75rem">🎓 ${f.studentId}</div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <div class="detail-section" style="margin-top:16px">
                    <h3>➕ 添加好友</h3>
                    <div style="display:flex;gap:8px;margin-bottom:12px">
                        <input id="friend-search-input" placeholder="输入用户名或学号..."
                               style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px">
                        <button class="btn btn-primary" onclick="searchUser()">🔍 搜索</button>
                    </div>
                    <div id="friend-search-results"></div>
                </div>

                ${pendingRequests.length > 0 ? `
                <div class="detail-section" style="margin-top:16px">
                    <h3>📨 待处理的请求 (${pendingRequests.length})</h3>
                    ${pendingRequests.map(r => {
                        const from = Query.getUser(r.fromUserId);
                        return `
                            <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--secondary);border-radius:8px;margin-bottom:6px">
                                <div style="font-size:1.8rem">${from?.avatar || '👤'}</div>
                                <div style="flex:1">
                                    <div style="font-weight:600">${from?.username || '未知用户'}</div>
                                    <div class="text-muted" style="font-size:0.75rem">${r.time}</div>
                                </div>
                                <button class="btn btn-primary" onclick="acceptFriend(${r.id})">✅ 接受</button>
                                <button class="btn btn-outline" onclick="rejectFriend(${r.id})">❌</button>
                            </div>`;
                    }).join('')}
                </div>` : ''}

                ${sentRequests.length > 0 ? `
                <div class="detail-section" style="margin-top:16px">
                    <h3>⏳ 我发出的请求 (${sentRequests.length})</h3>
                    ${sentRequests.map(r => {
                        const to = Query.getUser(r.toUserId);
                        return `
                            <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--secondary);border-radius:8px;margin-bottom:6px">
                                <div style="font-size:1.8rem">${to?.avatar || '👤'}</div>
                                <div style="flex:1">
                                    <div style="font-weight:600">${to?.username || '未知用户'}</div>
                                    <div class="text-muted" style="font-size:0.75rem">等待对方确认 · ${r.time}</div>
                                </div>
                            </div>`;
                    }).join('')}
                </div>` : ''}
            `;
        } else if (tab === 'history') {
            container.innerHTML = `<div class="detail-section">
                <h3>🕐 浏览历史</h3>
                ${history.length === 0 ? '<p class="text-muted">还没有浏览记录</p>' : `
                ${history.map(h => {
                    const s = Query.getSpot(h.spotId);
                    return `
                        <a href="#/spots/${h.spotId}" style="display:flex;gap:12px;padding:10px;background:var(--secondary);border-radius:8px;margin-bottom:6px;text-decoration:none;color:inherit">
                            <div style="font-size:1.5rem">${s?.icon || '📍'}</div>
                            <div style="flex:1">
                                <div style="font-weight:500;font-size:0.9rem">${s?.name || '未知'}</div>
                                <div class="text-muted" style="font-size:0.75rem">${h.time}</div>
                            </div>
                        </a>`;
                }).join('')}
                `}
            </div>`;
        } else if (tab === 'mine') {
            container.innerHTML = `<div class="detail-section">
                <h3>✍️ 我的游记</h3>
                ${myTravels.length === 0 ? '<p class="text-muted">还没有发布游记</p>' : `
                ${myTravels.map(t => `
                    <div style="padding:14px;background:var(--secondary);border-radius:8px;margin-bottom:8px">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                            <div style="font-weight:600">${t.title}</div>
                            <span class="badge ${t.status==='approved'?'badge-success':t.status==='pending'?'badge-warning':'badge-danger'}">
                                ${t.status==='approved'?'已通过':t.status==='pending'?'审核中':'已驳回'}
                            </span>
                        </div>
                        <div class="text-muted" style="font-size:0.8rem">${t.createTime} | ❤️${t.likes || 0} ⭐${t.favorites || 0}</div>
                        ${t.status==='approved' ? `<a href="#/travels/${t.id}" class="btn btn-sm btn-outline mt-8">查看</a>` : ''}
                    </div>
                `).join('')}
                `}
            </div>`;
        } else if (tab === 'settings') {
            container.innerHTML = `
                <div class="detail-section">
                    <h3>👤 基本信息</h3>
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input id="edit-username" class="form-control" value="${user.username}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">个人简介</label>
                        <textarea id="edit-bio" class="form-control form-textarea" rows="3">${user.bio || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">邮箱</label>
                        <input id="edit-email" class="form-control" value="${user.email || ''}">
                    </div>
                    <button class="btn btn-primary" onclick="saveProfile()">💾 保存修改</button>
                </div>

                <div class="detail-section">
                    <h3>🔑 修改密码</h3>
                    <div class="form-group">
                        <label class="form-label">原密码</label>
                        <input id="old-pwd" class="form-control" type="password">
                    </div>
                    <div class="form-group">
                        <label class="form-label">新密码</label>
                        <input id="new-pwd" class="form-control" type="password">
                    </div>
                    <div class="form-group">
                        <label class="form-label">确认新密码</label>
                        <input id="confirm-pwd" class="form-control" type="password">
                    </div>
                    <button class="btn btn-primary" onclick="changePwd()">🔄 修改密码</button>
                </div>

                <div class="detail-section" style="border-left:4px solid var(--danger)">
                    <h3>⚠️ 注销账号</h3>
                    <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px">注销后数据将被永久删除</p>
                    <button class="btn btn-danger" onclick="cancelUserAccount()">删除我的账号</button>
                </div>
            `;

            window.saveProfile = () => {
                Auth.updateProfile({
                    username: document.getElementById('edit-username').value.trim(),
                    bio: document.getElementById('edit-bio').value.trim(),
                    email: document.getElementById('edit-email').value.trim(),
                    avatar: document.getElementById('edit-username').value.trim().charAt(0)
                });
                UI.toast('资料已保存', 'success');
                Router.handleRoute();
            };

            window.changePwd = () => {
                const oldPwd = document.getElementById('old-pwd').value;
                const newPwd = document.getElementById('new-pwd').value;
                const confirmPwd = document.getElementById('confirm-pwd').value;
                if (!oldPwd || !newPwd) { UI.toast('请填写完整', 'warning'); return; }
                if (newPwd !== confirmPwd) { UI.toast('两次密码不一致', 'error'); return; }
                if (newPwd.length < 6) { UI.toast('新密码至少6位', 'error'); return; }
                const result = Auth.changePassword(oldPwd, newPwd);
                UI.toast(result.message || (result.success ? '密码已修改' : ''), result.success ? 'success' : 'error');
            };

            window.cancelUserAccount = () => {
                UI.openModal('⚠️ 注销账号',
                    '<p>您确定要注销账号吗？此操作将永久删除您的所有数据，无法恢复！</p>' +
                    '<p style="margin-top:12px"><strong>请再次输入您的密码以确认：</strong></p>' +
                    '<input id="cancel-pwd" class="form-control" type="password">',
                    `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
                     <button class="btn btn-danger" onclick="confirmCancelAccount()">确认注销</button>`);
            };

            window.confirmCancelAccount = () => {
                const pwd = document.getElementById('cancel-pwd').value;
                if (pwd !== user.password) { UI.toast('密码错误', 'error'); return; }
                Auth.cancelAccount();
                UI.closeModal();
                UI.toast('账号已注销', 'info');
                Router.navigate('/');
            };
        }
    };

    // 默认渲染第一个tab
    renderProfileContent('checkin');
};

/* ===== 站内消息页 ===== */
Router.pages['/messages'] = (app) => {
    const user = Query.getCurrentUser();
    if (!user) { Router.navigate('/login'); return; }

    const messages = Query.getUserMessages(user.id);
    const unreadCount = messages.filter(m => !m.read).length;

    app.innerHTML = `
        <div class="section">
            <div class="section-title">📨 站内消息 ${unreadCount > 0 ? `<span class="badge badge-danger">${unreadCount} 条未读</span>` : ''}</div>

            ${messages.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>暂无消息</p>
                </div>
            ` : `
                <div class="detail-section">
                    ${messages.map(m => {
                        const typeIcons = { system: '📢', comment: '💬', recommend: '🎯', follow: '👥' };
                        const typeColors = { system: 'badge-info', comment: 'badge-primary', recommend: 'badge-success', follow: 'badge-warning' };
                        return `
                        <div style="padding:14px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start;
                            ${!m.read ? 'background:rgba(45,155,122,0.05)' : ''}"
                            onclick="markAsRead(${m.id})">
                            <div style="font-size:1.8rem">${typeIcons[m.type] || '📌'}</div>
                            <div style="flex:1">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                                    <div style="font-weight:600">${m.title} ${!m.read ? '<span class="badge badge-danger">NEW</span>' : ''}</div>
                                    <span class="badge ${typeColors[m.type] || 'badge-muted'}">${m.type}</span>
                                </div>
                                <div class="text-muted" style="font-size:0.85rem">${m.content}</div>
                                <div class="text-muted" style="font-size:0.75rem;margin-top:4px">${m.time}</div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            `}
        </div>
    `;

    window.markAsRead = (msgId) => {
        DB.update(STORAGE_KEYS.MESSAGES, msgId, { read: true });
        Router.handleRoute();
    };
};

/* ===== 统一登录/注册入口 ===== */
Router.pages['/access'] = (app) => {
    const userLog = Query.isLoggedIn();
    const adminLog = Query.isAdminLoggedIn();

    app.innerHTML = `
        <div class="section">
            <div class="auth-entry-wrap">
                <div class="auth-entry-hero">
                    <div class="auth-entry-title">欢迎来到校园景点导览系统</div>
                    <div class="auth-entry-sub">请选择你的身份进入</div>
                </div>

                <div class="auth-entry-cards">
                    <!-- 用户入口 -->
                    <div class="auth-entry-card user-card ${userLog ? 'disabled' : ''}">
                        <div class="auth-entry-icon">🧑‍🎓</div>
                        <div class="auth-entry-card-title">普通用户</div>
                        <div class="auth-entry-card-desc">浏览景点 · 打卡收藏 · 发布游记</div>
                        ${userLog ? `
                            <div class="auth-entry-logged">✅ 已登录</div>
                            <div class="auth-entry-btns">
                                <a href="#/profile" class="btn btn-outline">进入个人中心</a>
                            </div>
                        ` : `
                            <div class="auth-entry-btns">
                                <a href="#/login" class="btn btn-primary btn-lg">登录</a>
                                <a href="#/register" class="btn btn-outline btn-lg">注册</a>
                            </div>
                        `}
                    </div>

                    <!-- 管理员入口 -->
                    <div class="auth-entry-card admin-card ${adminLog ? 'disabled' : ''}">
                        <div class="auth-entry-icon">🛡️</div>
                        <div class="auth-entry-card-title">管理员</div>
                        <div class="auth-entry-card-desc">景点管理 · 游记审核 · 数据看板</div>
                        ${adminLog ? `
                            <div class="auth-entry-logged">✅ 已登录</div>
                            <div class="auth-entry-btns">
                                <a href="#/admin/dashboard" class="btn btn-outline">进入管理后台</a>
                            </div>
                        ` : `
                            <div class="auth-entry-btns">
                                <a href="#/admin/login" class="btn btn-primary btn-lg">管理员登录</a>
                                <a href="#/admin/register" class="btn btn-outline btn-lg">管理员注册</a>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
};

/* ===== 登录/注册 ===== */
Router.pages['/login'] = (app) => {
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>🔐 用户登录</h2>
                <div class="auth-tabs">
                    <div class="auth-tab active" onclick="switchAuthTab('login')">登录</div>
                    <div class="auth-tab" onclick="switchAuthTab('register')">注册</div>
                </div>
                <div id="auth-form">
                    <div class="form-group">
                        <label class="form-label">学号/手机号/邮箱</label>
                        <input id="login-identifier" class="form-control" placeholder="请输入学号/手机号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input id="login-password" class="form-control" type="password" placeholder="请输入密码">
                    </div>
                    <button class="btn btn-primary btn-block" onclick="userLogin()">登录</button>
                </div>
            </div>
        </div>
    `;

    window.switchAuthTab = (tab) => {
        if (tab === 'login') Router.navigate('/login');
        else Router.navigate('/register');
    };

    window.userLogin = () => {
        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;
        if (!identifier || !password) { UI.toast('请填写完整', 'warning'); return; }
        const result = Auth.login(identifier, password);
        if (result.success) {
            UI.toast('登录成功，欢迎回来！', 'success');
            setTimeout(() => Router.navigate('/'), 500);
        } else {
            UI.toast(result.message, 'error');
        }
    };
};

Router.pages['/register'] = (app) => {
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>📝 用户注册</h2>
                <div class="auth-tabs">
                    <div class="auth-tab" onclick="switchAuthTab2('login')">登录</div>
                    <div class="auth-tab active" onclick="switchAuthTab2('register')">注册</div>
                </div>
                <div class="form-group">
                    <label class="form-label">昵称</label>
                    <input id="reg-username" class="form-control" placeholder="给自己起个好名字">
                </div>
                <div class="form-group">
                    <label class="form-label">学号 (8位数字)</label>
                    <input id="reg-studentId" class="form-control" placeholder="如: 20230001">
                </div>
                <div class="form-group">
                    <label class="form-label">手机号</label>
                    <input id="reg-phone" class="form-control" placeholder="11位手机号">
                </div>
                <div class="form-group">
                    <label class="form-label">邮箱 (选填)</label>
                    <input id="reg-email" class="form-control" placeholder="选填">
                </div>
                <div class="form-group">
                    <label class="form-label">密码 (至少6位)</label>
                    <input id="reg-password" class="form-control" type="password" placeholder="至少6位">
                </div>
                <button class="btn btn-primary btn-block" onclick="userRegister()">立即注册</button>
            </div>
        </div>
    `;

    window.switchAuthTab2 = (tab) => {
        if (tab === 'login') Router.navigate('/login');
        else Router.navigate('/register');
    };

    window.userRegister = () => {
        const data = {
            username: document.getElementById('reg-username').value.trim(),
            studentId: document.getElementById('reg-studentId').value.trim(),
            phone: document.getElementById('reg-phone').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value
        };
        if (!data.username || !data.studentId || !data.phone || !data.password) {
            UI.toast('请填写所有必填项', 'warning'); return;
        }
        if (data.password.length < 6) { UI.toast('密码至少6位', 'warning'); return; }

        const result = Auth.register(data);
        if (result.success) {
            UI.toast('注册成功！', 'success');
            Auth.login(data.studentId, data.password);
            setTimeout(() => Router.navigate('/'), 500);
        } else {
            UI.toast(result.message, 'error');
        }
    };
};

/* ===== 404 ===== */
Router.pages['/404'] = (app) => {
    app.innerHTML = `
        <div class="empty-state" style="padding:80px 20px">
            <div style="font-size:5rem">😵</div>
            <h2>页面走丢了</h2>
            <p class="text-muted">找不到你要访问的页面</p>
            <a href="#/" class="btn btn-primary mt-16">返回首页</a>
        </div>
    `;
};

