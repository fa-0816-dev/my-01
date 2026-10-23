/* ============================================
   通用工具函数 & UI 组件
   ============================================ */

const UI = {
    // ---------- Toast 提示 ----------
    toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // ---------- Loading ----------
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('hidden');
    },
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.add('hidden');
    },

    // ---------- 模态框 ----------
    openModal(title, bodyHTML, footerHTML = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-footer').innerHTML = footerHTML;
        document.getElementById('modal-container').classList.remove('hidden');
    },
    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
    },

    // ---------- 图片裁剪弹窗（纯 Canvas） ----------
    /* 使用: UI.cropImage(file, {aspectRatio: 3.33}, (base64) => { ... }); */
    cropImage(file, options, onDone) {
        if (!file) { UI.toast('未选择文件', 'error'); return; }
        if (typeof options === 'function') { onDone = options; options = {}; }
        const aspectRatio = options.aspectRatio || 0;
        console.log('[cropImage] 开始, aspectRatio=', aspectRatio);
        const reader = new FileReader();
        reader.onerror = () => { console.error('[cropImage] FileReader error'); UI.toast('文件读取失败', 'error'); };
        reader.onload = (e) => {
            console.log('[cropImage] FileReader 完成, dataUrl长度=', e.target.result.length);
            const origDataUrl = e.target.result;
            const img = new Image();
            img.onerror = () => { console.error('[cropImage] img load error'); UI.toast('图片加载失败，使用原图', 'error'); onDone(origDataUrl); };
            img.onload = () => {
                console.log('[cropImage] Image 加载完成, 尺寸:', img.width, 'x', img.height);
                try {
                    const ratioHint = aspectRatio ? '📐 固定比例 ' + aspectRatio.toFixed(2) + ':1（推荐，避免变形）' : '💡 可自由调整裁剪区域';
                    const bodyHTML = '<div style="text-align:center;color:var(--text-muted);margin-bottom:10px;font-size:0.85rem">'
                        + ratioHint + '，拖动蓝框可移动，拖四角可缩放</div>'
                        + '<div id="crop-wrap" style="position:relative;display:inline-block;max-width:100%;max-height:60vh;user-select:none">'
                        + '<canvas id="crop-canvas" style="display:block;max-width:100%;max-height:60vh;border-radius:6px;background:#111"></canvas>'
                        + '<div id="crop-box" style="position:absolute;border:2px dashed var(--primary);background:rgba(45,155,122,0.15);cursor:move;display:none;box-shadow:0 0 0 9999px rgba(0,0,0,0.5)">'
                        + '<div class="crop-handle" data-h="tl" style="position:absolute;width:12px;height:12px;background:var(--primary);border:2px solid white;top:-6px;left:-6px;cursor:nwse-resize;border-radius:2px"></div>'
                        + '<div class="crop-handle" data-h="tr" style="position:absolute;width:12px;height:12px;background:var(--primary);border:2px solid white;top:-6px;right:-6px;cursor:nesw-resize;border-radius:2px"></div>'
                        + '<div class="crop-handle" data-h="bl" style="position:absolute;width:12px;height:12px;background:var(--primary);border:2px solid white;bottom:-6px;left:-6px;cursor:nesw-resize;border-radius:2px"></div>'
                        + '<div class="crop-handle" data-h="br" style="position:absolute;width:12px;height:12px;background:var(--primary);border:2px solid white;bottom:-6px;right:-6px;cursor:nwse-resize;border-radius:2px"></div>'
                        + '</div></div>';
                    UI.openModal('✂️ 裁剪图片', bodyHTML,
                        '<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>'
                        + '<button class="btn btn-primary" onclick="UI._confirmCrop()">✅ 确认裁剪使用</button>'
                        + '<button class="btn btn-outline" onclick="UI._useOriginal()">使用原图（不裁剪）</button>'
                    );

                    const canvas = document.getElementById('crop-canvas');
                    const ctx = canvas.getContext('2d');
                    const box = document.getElementById('crop-box');
                    if (!ctx) {
                        UI.toast('浏览器不支持 Canvas，使用原图', 'error');
                        UI.closeModal();
                        onDone(origDataUrl);
                        return;
                    }

                    const maxW = 720, maxH = 440;
                    let scale = Math.min(maxW / img.width, maxH / img.height, 1);
                    scale = Math.max(scale, 0.15);
                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    let bw, bh;
                    if (aspectRatio > 0) {
                        bh = Math.min(canvas.height * 0.9, canvas.width * 0.9 / aspectRatio);
                        bw = bh * aspectRatio;
                        if (bw > canvas.width * 0.9) {
                            bw = canvas.width * 0.9;
                            bh = bw / aspectRatio;
                        }
                    } else {
                        bw = canvas.width * 0.8;
                        bh = canvas.height * 0.8;
                    }
                    const bx = (canvas.width - bw) / 2;
                    const by = (canvas.height - bh) / 2;
                    let cropBox = { x: bx, y: by, w: bw, h: bh };
                    box.style.left = bx + 'px';
                    box.style.top = by + 'px';
                    box.style.width = bw + 'px';
                    box.style.height = bh + 'px';
                    box.style.display = 'block';

                    const applyRatio = (handle, orig, p) => {
                        const dx = p.x - (handle.includes('l') ? orig.x : orig.x + orig.w);
                        const dy = p.y - (handle.includes('t') ? orig.y : orig.y + orig.h);
                        let newW, newH;
                        if (Math.abs(dx * aspectRatio) > Math.abs(dy)) {
                            newW = Math.max(30, Math.min(canvas.width, orig.w + (handle.includes('l') ? -dx : dx)));
                            newH = newW / aspectRatio;
                        } else {
                            newH = Math.max(30, Math.min(canvas.height, orig.h + (handle.includes('t') ? -dy : dy)));
                            newW = newH * aspectRatio;
                        }
                        let nx = orig.x, ny = orig.y;
                        if (handle.includes('l')) nx = orig.x + orig.w - newW;
                        if (handle.includes('t')) ny = orig.y + orig.h - newH;
                        nx = Math.max(0, Math.min(nx, canvas.width - newW));
                        ny = Math.max(0, Math.min(ny, canvas.height - newH));
                        newW = Math.min(newW, canvas.width - nx);
                        newH = Math.min(newH, canvas.height - ny);
                        return { x: nx, y: ny, w: newW, h: newH };
                    };

                    let drag = null;
                    const startDrag = (e) => {
                        e.preventDefault();
                        const rect = canvas.getBoundingClientRect();
                        const p = { x: (e.clientX - rect.left) * (canvas.width / rect.width),
                                    y: (e.clientY - rect.top) * (canvas.height / rect.height) };
                        const target = e.target;
                        if (target.classList.contains('crop-handle')) {
                            drag = { mode: 'resize', handle: target.dataset.h, start: p, orig: {...cropBox} };
                        } else {
                            drag = { mode: 'move', start: p, orig: {...cropBox} };
                        }
                        document.addEventListener('mousemove', onDrag);
                        document.addEventListener('mouseup', endDrag, { once: true });
                    };
                    const onDrag = (e) => {
                        if (!drag) return;
                        const rect = canvas.getBoundingClientRect();
                        const p = { x: (e.clientX - rect.left) * (canvas.width / rect.width),
                                    y: (e.clientY - rect.top) * (canvas.height / rect.height) };
                        const dx = p.x - drag.start.x;
                        const dy = p.y - drag.start.y;
                        if (drag.mode === 'move') {
                            cropBox.x = Math.max(0, Math.min(canvas.width - cropBox.w, drag.orig.x + dx));
                            cropBox.y = Math.max(0, Math.min(canvas.height - cropBox.h, drag.orig.y + dy));
                        } else {
                            if (aspectRatio > 0) {
                                cropBox = applyRatio(drag.handle, drag.orig, p);
                            } else {
                                if (drag.handle.includes('l')) {
                                    cropBox.x = Math.max(0, Math.min(drag.orig.x + dx, drag.orig.x + drag.orig.w - 20));
                                    cropBox.w = drag.orig.x + drag.orig.w - cropBox.x;
                                } else if (drag.handle.includes('r')) {
                                    cropBox.w = Math.max(20, Math.min(canvas.width - cropBox.x, drag.orig.w + dx));
                                }
                                if (drag.handle.includes('t')) {
                                    cropBox.y = Math.max(0, Math.min(drag.orig.y + dy, drag.orig.y + drag.orig.h - 20));
                                    cropBox.h = drag.orig.y + drag.orig.h - cropBox.y;
                                } else if (drag.handle.includes('b')) {
                                    cropBox.h = Math.max(20, Math.min(canvas.height - cropBox.y, drag.orig.h + dy));
                                }
                            }
                        }
                        box.style.left = cropBox.x + 'px';
                        box.style.top = cropBox.y + 'px';
                        box.style.width = cropBox.w + 'px';
                        box.style.height = cropBox.h + 'px';
                    };
                    const endDrag = () => { drag = null; document.removeEventListener('mousemove', onDrag); };
                    box.addEventListener('mousedown', startDrag);

                    // 核心输出函数 —— 带最终兜底
                    const safeOutput = (cx, cy, cw, ch) => {
                        try {
                            const out = document.createElement('canvas');
                            out.width = Math.max(1, Math.round(cw / scale));
                            out.height = Math.max(1, Math.round(ch / scale));
                            const octx = out.getContext('2d');
                            if (!octx) throw new Error('2d context null');
                            octx.drawImage(img, cx / scale, cy / scale, cw / scale, ch / scale, 0, 0, out.width, out.height);
                            const result = out.toDataURL('image/jpeg', 0.85);
                            // 如果 toDataURL 返回空/无效，回退原图
                            if (!result || result.length < 100 || result.indexOf('data:image') !== 0) {
                                console.warn('crop toDataURL invalid, using original');
                                return origDataUrl;
                            }
                            return result;
                        } catch(err) {
                            console.warn('canvas output failed (' + err.message + '), using original image');
                            return origDataUrl;
                        }
                    };

                    UI._confirmCrop = () => {
                        UI.closeModal();
                        const base64 = safeOutput(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
                        onDone(base64);
                        if (base64 === origDataUrl) UI.toast('裁剪器遇到问题，已使用原图', 'info');
                    };
                    UI._useOriginal = () => {
                        UI.closeModal();
                        onDone(origDataUrl);
                    };
                } catch(err) {
                    console.error('crop init err:', err);
                    UI.toast('裁剪器异常，使用原图', 'error');
                    try { UI.closeModal(); } catch(_) {}
                    onDone(origDataUrl);
                }
            };
            img.src = origDataUrl;
        };
        reader.readAsDataURL(file);
    },

    // ---------- 主题切换 ----------
    initTheme() {
        const saved = localStorage.getItem('cg_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        const switcher = document.getElementById('theme-switcher');
        if (switcher) switcher.value = saved;
    },
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cg_theme', theme);
    },

    // ---------- 导航栏高亮 ----------
    updateActiveNav(route) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.route === route ||
                (route.startsWith(link.dataset.route) && link.dataset.route !== '/')) {
                link.classList.add('active');
            }
        });
    },

    // ---------- 移动端菜单 ----------
    initMobileMenu() {
        const toggle = document.getElementById('nav-toggle');
        const menu = document.getElementById('nav-menu');
        if (toggle && menu) {
            toggle.addEventListener('click', () => menu.classList.toggle('show'));
        }
    },

    // 景点图标/缩略图：有图用图，无图用 emoji
    spotIcon(s, size = 40) {
        const hasImg = s && s.image && (
            s.image.startsWith('data:image') ||
            s.image.startsWith('http') ||
            s.image.startsWith('asset') ||
            s.image.startsWith('./')
        );
        if (hasImg) {
            return `<img src="${s.image}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:8px;vertical-align:middle">`;
        }
        if (s && s.image && s.image.trim()) {
            return `<img src="${s.image}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:8px;vertical-align:middle" onerror="this.outerHTML='${s.icon || '📍'}'">`;
        }
        return `<span style="font-size:${Math.round(size*0.9)}px;vertical-align:middle">${s.icon || '📍'}</span>`;
    }
};

/* ---------- 工具函数 ---------- */
const Utils = {
    // ========== 坐标系转换（高德 GCJ-02 → WGS84，Leaflet 渲染必需） ==========
    _PI: Math.PI,
    _A: 6378245.0,
    _EE: 0.00669342162296594323,

    _outOfChina(lng, lat) {
        return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
    },

    _transformLat(x, y) {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * this._PI) + 20.0 * Math.sin(2.0 * x * this._PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * this._PI) + 40.0 * Math.sin(y / 3.0 * this._PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * this._PI) + 320 * Math.sin(y * this._PI / 30.0)) * 2.0 / 3.0;
        return ret;
    },

    _transformLng(x, y) {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * this._PI) + 20.0 * Math.sin(2.0 * x * this._PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * this._PI) + 40.0 * Math.sin(x / 3.0 * this._PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * this._PI) + 300.0 * Math.sin(x / 30.0 * this._PI)) * 2.0 / 3.0;
        return ret;
    },

    // GCJ-02 → WGS84（精确转换，误差 < 1 米）
    gcjToWgs84(lng, lat) {
        if (this._outOfChina(lng, lat)) return [lng, lat];
        let dLat = this._transformLat(lng - 105.0, lat - 35.0);
        let dLng = this._transformLng(lng - 105.0, lat - 35.0);
        const radLat = lat / 180.0 * this._PI;
        let magic = Math.sin(radLat);
        magic = 1 - this._EE * magic * magic;
        const sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((this._A * (1 - this._EE)) / (magic * sqrtMagic) * this._PI);
        dLng = (dLng * 180.0) / (this._A / sqrtMagic * Math.cos(radLat) * this._PI);
        const mgLat = lat + dLat;
        const mgLng = lng + dLng;
        return [lng * 2 - mgLng, lat * 2 - mgLat];
    },

    // 批量转换 [lat, lng] → WGS84
    toWgs84(lat, lng) {
        const [wgsLng, wgsLat] = this.gcjToWgs84(lng, lat);
        return [wgsLat, wgsLng];
    },

    // ========== 原有工具函数 ==========
    // 格式化日期
    formatDate(date) {
        if (!date) return '';
        return date.toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    },

    // 当前时间字符串
    now() { return new Date().toLocaleString('zh-CN'); },

    // 生成随机ID
    randomId() { return Math.random().toString(36).substr(2, 9); },

    // 防抖
    debounce(fn, delay = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },

    // 节流
    throttle(fn, delay = 300) {
        let last = 0;
        return (...args) => {
            const now = Date.now();
            if (now - last > delay) {
                last = now;
                fn(...args);
            }
        };
    },

    // 验证手机号
    validPhone(phone) { return /^1[3-9]\d{9}$/.test(phone); },

    // 验证学号（8位数字）
    validStudentId(sid) { return /^\d{8}$/.test(sid); },

    // 验证邮箱
    validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },

    // 计算两个经纬度之间的距离（km）
    haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // 计算点到线段距离（经纬度，返回km）
    pointToLineDistance(lat, lng, lat1, lng1, lat2, lng2) {
        const d = Math.abs(
            (lng2 - lng1) * lat - (lat2 - lat1) * lng + lat2 * lng1 - lng2 * lat1
        ) / Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);
        return d * 111; // 1度约111km
    },

    // 简单富文本（转义HTML + 保留换行 + 链接）
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    renderRichText(text) {
        let html = this.escapeHtml(text);
        html = html.replace(/\n/g, '<br>');
        html = html.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        return html;
    }
};
