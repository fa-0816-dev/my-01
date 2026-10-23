/* ============================================
   SPA 路由系统（Hash 路由）
   ============================================ */

const Router = {
    currentRoute: '/',
    pages: {},      // 用户端页面
    adminPages: {}, // 管理员端页面

    // 初始化
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    // 导航
    navigate(route) {
        location.hash = route;
    },

    // 获取当前路由（不带#号）
    getRoute() {
        const hash = location.hash || '#/';
        // 剥离查询参数，只返回路径
        return hash.slice(1).split('?')[0] || '/';
    },

    // 获取 hash 中的查询参数（修复 Hash 模式下 URL 对象拿不到 hash 后 query 的问题）
    getQuery(key) {
        const hash = location.hash || '';
        const qIndex = hash.indexOf('?');
        if (qIndex < 0) return null;
        const params = new URLSearchParams(hash.slice(qIndex + 1));
        return params.get(key);
    },

    // 路由分发
    handleRoute() {
        const route = this.getRoute();
        this.currentRoute = route;
        UI.updateActiveNav(route);
        this.updateUserArea();
        this.updateNavMenu();

        // 路由守卫：管理员页需要管理员登录
        if (route.startsWith('/admin')) {
            if (!Query.isAdminLoggedIn() && route !== '/admin/login' && route !== '/admin/register') {
                this.navigate('/admin/login');
                return;
            }
        }

        // 路由守卫：需要用户登录的页面
        const needLogin = ['/profile', '/messages', '/travels/publish'];
        if (needLogin.some(p => route.startsWith(p)) && !Query.isLoggedIn()) {
            this.navigate('/login');
            return;
        }

        const app = document.getElementById('app');
        UI.showLoading();
        setTimeout(() => {
            app.innerHTML = '';
            app.className = 'app-container fade-in';

            if (route.startsWith('/admin')) {
                // 管理员端 - 根路径自动分发
                if (route === '/admin' || route === '/admin/') {
                    if (Query.isAdminLoggedIn()) {
                        this.navigate('/admin/dashboard');
                    } else {
                        this.navigate('/admin/login');
                    }
                    return;
                }
                // 剥离查询参数，只保留路径部分
                const pureRoute = route.split('?')[0];
                const subRoute = pureRoute.replace('/admin', '') || '/';
                this.renderAdminPage(subRoute, app);
            } else {
                // 用户端 - 也剥离查询参数，避免 /spots?kw=xxx 这类情况
                const pureRoute = route.split('?')[0];
                this.renderUserPage(pureRoute, app);
            }
            UI.hideLoading();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    },

    renderUserPage(route, container) {
        if (this.pages[route]) {
            this.pages[route](container);
        } else if (route.startsWith('/spots/')) {
            const id = parseInt(route.split('/')[2]);
            if (this.pages['/spots/:id']) this.pages['/spots/:id'](container, id);
        } else if (route.startsWith('/travels/')) {
            const id = parseInt(route.split('/')[2]);
            if (this.pages['/travels/:id']) this.pages['/travels/:id'](container, id);
        } else {
            this.pages['/404'](container);
        }
    },

    renderAdminPage(route, container) {
        if (this.adminPages[route]) {
            this.adminPages[route](container);
        } else if (route.startsWith('/spots/edit')) {
            const id = parseInt(route.split('/')[3] || 0);
            if (this.adminPages['/spots/edit']) this.adminPages['/spots/edit'](container, id);
        } else if (route.startsWith('/users/edit')) {
            const id = parseInt(route.split('/')[3] || 0);
            if (this.adminPages['/users/edit']) this.adminPages['/users/edit'](container, id);
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔧</div><p>页面建设中</p></div>';
        }
    },

    // 更新导航栏用户区域
    updateUserArea() {
        const area = document.getElementById('user-area');
        if (!area) return;
        const isUser = Query.isLoggedIn();
        const isAdmin = Query.isAdminLoggedIn();

        if (isAdmin && !isUser) {
            // 只登录管理员
            area.innerHTML = `
                <div class="user-avatar admin-avatar" onclick="Router.toggleUserDropdown()" title="管理员面板">管</div>
                <div class="user-dropdown" id="user-dropdown">
                    <a href="#/admin/dashboard">📊 数据看板</a>
                    <a href="#/admin/home">🏠 首页轮播图</a>
                    <a href="#/admin/spots">📍 景点管理</a>
                    <a href="#/admin/travels">📖 游记审核</a>
                    <a href="#/admin/settings">⚙️ 管理员设置</a>
                    <button onclick="Router.logoutAdmin()">🚪 退出登录</button>
                </div>
            `;
        } else if (isUser && !isAdmin) {
            // 只登录普通用户
            const u = Query.getCurrentUser();
            area.innerHTML = `
                <div class="user-avatar" onclick="Router.toggleUserDropdown()" title="个人中心">${u.avatar}</div>
                <div class="user-dropdown" id="user-dropdown">
                    <a href="#/profile">👤 个人中心</a>
                    <a href="#/messages">📨 消息通知</a>
                    <button onclick="Router.logout()">🚪 退出登录</button>
                </div>
            `;
        } else if (isUser && isAdmin) {
            // 都登录了 - 合并显示
            const u = Query.getCurrentUser();
            area.innerHTML = `
                <div class="user-avatar" onclick="Router.toggleUserDropdown()" title="已登录">${u.avatar}</div>
                <div class="user-dropdown" id="user-dropdown">
                    <a href="#/profile">👤 个人中心</a>
                    <a href="#/messages">📨 消息通知</a>
                    <a href="#/admin/dashboard" style="border-top:1px solid #eee;margin-top:6px;padding-top:10px">🛡️ 管理后台</a>
                    <button onclick="Router.logoutAll()">🚪 全部退出</button>
                </div>
            `;
        } else {
            // 都没登录
            area.innerHTML = `
                <a href="#/login" class="btn btn-outline">登录</a>
                <a href="#/register" class="btn btn-primary">注册</a>
            `;
        }
    },

    logoutAdmin() {
        Auth.logoutAdmin();
        UI.toast('管理员已退出', 'success');
        this.updateUserArea();
        this.updateNavMenu();
        this.navigate('/access');
    },

    logoutAll() {
        Auth.logout();
        Auth.logoutAdmin();
        UI.toast('已全部退出', 'success');
        this.updateUserArea();
        this.updateNavMenu();
        this.navigate('/access');
    },

    toggleUserDropdown() {
        const dd = document.getElementById('user-dropdown');
        if (dd) dd.classList.toggle('show');
        // 点击外部关闭
        if (dd.classList.contains('show')) {
            setTimeout(() => {
                document.addEventListener('click', () => {
                    dd.classList.remove('show');
                }, { once: true });
            }, 100);
        }
    },

    toggleMapFullscreen() {
        const container = document.getElementById('map-container');
        const btn = document.getElementById('map-fs-btn');
        if (!container || !btn) return;

        const isFs = container.classList.toggle('fullscreen');
        btn.innerHTML = isFs ? '⛶ 退出全屏' : '⛶ 放大全屏';
        btn.style.zIndex = isFs ? '10001' : '';

        // 强制 Leaflet 内部所有容器铺满
        const forceFill = () => {
            const mapEl = document.getElementById('campus-map');
            if (!mapEl || !mapEl._leaflet_map) return;
            const map = mapEl._leaflet_map;

            if (isFs) {
                // 全屏时强制铺满视口
                const w = window.innerWidth;
                const h = window.innerHeight;
                mapEl.style.width = w + 'px';
                mapEl.style.height = h + 'px';
                const lc = mapEl.querySelector('.leaflet-container');
                if (lc) {
                    lc.style.width = w + 'px';
                    lc.style.height = h + 'px';
                    lc.style.position = 'absolute';
                    lc.style.top = '0'; lc.style.left = '0';
                }
            } else {
                // 退出全屏：清除 inline style，让 CSS 接管
                mapEl.style.width = '';
                mapEl.style.height = '';
                const lc = mapEl.querySelector('.leaflet-container');
                if (lc) {
                    lc.style.width = '';
                    lc.style.height = '';
                    lc.style.position = '';
                    lc.style.top = ''; lc.style.left = '';
                }
            }
            map.invalidateSize(true);
        };

        setTimeout(forceFill, 30);
        setTimeout(forceFill, 150);
        setTimeout(forceFill, 400);

        // ESC 退出全屏
        if (isFs) {
            setTimeout(() => {
                document.addEventListener('keydown', function escHandler(e) {
                    if (e.key === 'Escape') {
                        container.classList.remove('fullscreen');
                        btn.innerHTML = '⛶ 放大全屏';
                        btn.style.zIndex = '';
                        document.removeEventListener('keydown', escHandler);
                        setTimeout(forceFill, 30);
                        setTimeout(forceFill, 150);
                        setTimeout(forceFill, 400);
                    }
                });
            }, 100);
        }
    },

    updateNavMenu() {
        const authLink = document.querySelector('.nav-link.auth-entry');
        if (authLink) {
            const userLog = Query.isLoggedIn();
            const adminLog = Query.isAdminLoggedIn();
            if (adminLog && !userLog) {
                authLink.textContent = '管理后台';
                authLink.href = '#/admin/dashboard';
            } else if (userLog && !adminLog) {
                authLink.textContent = '个人中心';
                authLink.href = '#/profile';
            } else if (userLog && adminLog) {
                authLink.textContent = '已登录';
                authLink.href = '#/access';
            } else {
                authLink.textContent = '登录/注册';
                authLink.href = '#/access';
            }
        }
    },

    logout() {
        Auth.logout();
        UI.toast('已退出登录', 'success');
        this.navigate('/');
    }
};
