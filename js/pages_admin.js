/* ============================================
   管理员端页面渲染 pages_admin.js
   登录注册、数据看板、景点档案、用户管理、游记审核、评论管理、消息管理、个人设置
   ============================================ */

/* ===== 管理员登录 ===== */
Router.adminPages['/login'] = (app) => {
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card" style="border:2px solid var(--accent)">
                <h2>🛡️ 管理员登录</h2>
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input id="admin-login-username" class="form-control" placeholder="admin">
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input id="admin-login-password" class="form-control" type="password" placeholder="admin123">
                </div>
                <button class="btn btn-primary btn-block" onclick="adminLogin()">登录管理后台</button>
                <div style="margin-top:16px;text-align:center">
                    <a href="#/admin/register" style="font-size:0.85rem">注册管理员</a>
                    <span style="margin:0 8px">|</span>
                    <a href="#/" style="font-size:0.85rem">返回首页</a>
                </div>
            </div>
        </div>
    `;

    window.adminLogin = () => {
        const username = document.getElementById('admin-login-username').value.trim();
        const password = document.getElementById('admin-login-password').value;
        if (!username || !password) { UI.toast('请填写完整', 'warning'); return; }
        const result = Auth.adminLogin(username, password);
        if (result.success) {
            UI.toast('管理员登录成功', 'success');
            setTimeout(() => Router.navigate('/admin/dashboard'), 500);
        } else {
            UI.toast(result.message, 'error');
        }
    };
};

/* ===== 管理员注册 ===== */
Router.adminPages['/register'] = (app) => {
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>📝 注册管理员</h2>
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input id="admin-reg-username" class="form-control" placeholder="4-20位字符">
                </div>
                <div class="form-group">
                    <label class="form-label">真实姓名</label>
                    <input id="admin-reg-name" class="form-control" placeholder="您的姓名">
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input id="admin-reg-password" class="form-control" type="password" placeholder="至少6位">
                </div>
                <button class="btn btn-primary btn-block" onclick="adminRegister()">立即注册</button>
                <div style="margin-top:16px;text-align:center">
                    <a href="#/admin/login" style="font-size:0.85rem">已有账号？去登录</a>
                </div>
            </div>
        </div>
    `;

    window.adminRegister = () => {
        const data = {
            username: document.getElementById('admin-reg-username').value.trim(),
            name: document.getElementById('admin-reg-name').value.trim(),
            password: document.getElementById('admin-reg-password').value
        };
        if (!data.username || !data.name || !data.password) { UI.toast('请填写完整', 'warning'); return; }
        if (data.password.length < 6) { UI.toast('密码至少6位', 'warning'); return; }

        const result = Auth.adminRegister(data);
        if (result.success) {
            UI.toast('注册成功，请登录', 'success');
            setTimeout(() => Router.navigate('/admin/login'), 800);
        } else {
            UI.toast(result.message, 'error');
        }
    };
};

/* ---------- 管理员布局壳 ---------- */
const ADMIN_SIDEBAR = [
    { path: '/dashboard', icon: '📊', name: '数据看板' },
    { path: '/spots', icon: '📍', name: '景点档案管理' },
    { path: '/users', icon: '👥', name: '用户管理' },
    { path: '/travels', icon: '📖', name: '游记审核' },
    { path: '/comments', icon: '💬', name: '评论管理' },
    { path: '/messages', icon: '📨', name: '站内消息管理' },
    { path: '/settings', icon: '⚙️', name: '个人设置' }
];

function wrapAdminLayout(contentHTML, activePath) {
    const admin = Query.getCurrentAdmin();
    return `
        <div class="admin-layout">
            <aside class="admin-sidebar">
                <h3>🛡️ 管理后台</h3>
                ${ADMIN_SIDEBAR.map(item => `
                    <a href="#/admin${item.path}" class="${activePath === item.path ? 'active' : ''}">
                        <span>${item.icon}</span> ${item.name}
                    </a>
                `).join('')}
                <div style="margin-top:24px;padding:16px;border-top:1px solid var(--border)">
                    <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">当前: ${admin?.name}</div>
                    <button class="btn btn-sm btn-outline btn-block" onclick="adminLogout()">🚪 退出登录</button>
                </div>
            </aside>
            <main class="admin-content">${contentHTML}</main>
        </div>
    `;
}

window.adminLogout = () => {
    Auth.adminLogout();
    UI.toast('已退出管理员登录', 'info');
    Router.navigate('/admin/login');
};

/* ===== 数据看板 ===== */
Router.adminPages['/dashboard'] = (app) => {
    const spots = DB.get(STORAGE_KEYS.SPOTS);
    const users = DB.get(STORAGE_KEYS.USERS);
    const travels = DB.get(STORAGE_KEYS.TRAVELS);
    const pendingTravels = travels.filter(t => t.status === 'pending');
    const comments = DB.get(STORAGE_KEYS.COMMENTS);
    const checkins = DB.get(STORAGE_KEYS.CHECKINS);

    // 各校区景点分布
    const campusStats = {};
    spots.forEach(s => { campusStats[s.campus] = (campusStats[s.campus] || 0) + 1; });

    // 游记状态分布
    const travelStats = { approved: 0, pending: 0, rejected: 0 };
    travels.forEach(t => { travelStats[t.status] = (travelStats[t.status] || 0) + 1; });

    const content = `
        <div class="section">
            <div class="section-title">📊 数据看板</div>

            <!-- 统计卡片 -->
            <div class="stats-grid">
                <div class="stat-card clickable" onclick="Router.navigate('/admin/spots')">
                    <div class="stat-icon">📍</div>
                    <div class="stat-number">${spots.length}</div>
                    <div class="stat-label">校园景点</div>
                    <div class="stat-hint">点击管理 →</div>
                </div>
                <div class="stat-card clickable" onclick="Router.navigate('/admin/users')">
                    <div class="stat-icon">👥</div>
                    <div class="stat-number">${users.length}</div>
                    <div class="stat-label">注册用户</div>
                    <div class="stat-hint">点击管理 →</div>
                </div>
                <div class="stat-card clickable" onclick="Router.navigate('/admin/travels')">
                    <div class="stat-icon">📖</div>
                    <div class="stat-number">${travels.length}</div>
                    <div class="stat-label">游记总数</div>
                    <div class="stat-hint">点击管理 →</div>
                </div>
                <div class="stat-card clickable" onclick="Router.navigate('/admin/travels?status=pending')">
                    <div class="stat-icon">✅</div>
                    <div class="stat-number">${pendingTravels.length}</div>
                    <div class="stat-label">待审核游记</div>
                    <div class="stat-hint">点击审核 →</div>
                </div>
            </div>

            <div class="grid" style="grid-template-columns:2fr 1fr">
                <!-- 待审核游记 -->
                <div class="detail-section clickable" onclick="Router.navigate('/admin/travels?status=pending')" title="点击前往审核">
                    <h3>📋 待审核游记</h3>
                    ${pendingTravels.length === 0 ? '<p class="text-muted">暂无待审核游记 🎉</p>' : `
                        ${pendingTravels.slice(0, 5).map(t => {
                            const author = Query.getUser(t.userId);
                            return `
                            <div style="padding:12px;background:var(--secondary);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
                                <div>
                                    <div style="font-weight:600">${t.title}</div>
                                    <div class="text-muted" style="font-size:0.8rem">by ${author?.username} · ${t.createTime}</div>
                                </div>
                                <a href="#/admin/travels?status=pending" class="btn btn-sm btn-primary" onclick="event.stopPropagation()">审核</a>
                            </div>
                        `}).join('')}
                    `}
                </div>

                <!-- 各校区景点分布 -->
                <div class="detail-section clickable" onclick="Router.navigate('/admin/spots')" title="点击前往景点档案">
                    <h3>🏫 校区景点分布</h3>
                    ${Object.entries(campusStats).map(([c, n]) => `
                        <div style="margin-bottom:12px">
                            <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:4px">
                                <span>${c}</span><span class="text-muted">${n} 个</span>
                            </div>
                            <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                                <div style="height:100%;background:var(--primary);border-radius:4px;width:${n / spots.length * 100}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="grid" style="grid-template-columns:1fr 1fr">
                <!-- 游记状态 -->
                <div class="detail-section clickable" onclick="Router.navigate('/admin/travels')" title="点击前往游记管理">
                    <h3>📖 游记状态分布</h3>
                    <div style="display:flex;gap:16px;margin-top:12px">
                        <div style="flex:1;text-align:center;padding:16px;background:var(--secondary);border-radius:8px">
                            <div class="stat-number" style="color:var(--success)">${travelStats.approved}</div>
                            <div class="text-muted" style="font-size:0.85rem">已通过</div>
                        </div>
                        <div style="flex:1;text-align:center;padding:16px;background:var(--secondary);border-radius:8px">
                            <div class="stat-number" style="color:var(--warning)">${travelStats.pending}</div>
                            <div class="text-muted" style="font-size:0.85rem">审核中</div>
                        </div>
                        <div style="flex:1;text-align:center;padding:16px;background:var(--secondary);border-radius:8px">
                            <div class="stat-number" style="color:var(--danger)">${travelStats.rejected || 0}</div>
                            <div class="text-muted" style="font-size:0.85rem">已驳回</div>
                        </div>
                    </div>
                </div>

                <!-- 打卡统计 -->
                <div class="detail-section clickable" onclick="Router.navigate('/admin/spots')" title="点击前往景点档案">
                    <h3>📍 打卡统计: ${checkins.length}</h3>
                    ${spots.sort((a, b) => (b.hot || 0) - (a.hot || 0)).slice(0, 5).map((s, i) => `
                        <div style="display:flex;align-items:center;gap:10px;padding:6px 0">
                            <span style="width:24px;height:24px;border-radius:50%;background:${i<3?'var(--primary)':'var(--border)'};
                                color:white;display:flex;align-items:center;justify-content:center;font-size:0.7rem">${i+1}</span>
                            <span style="flex:1;font-size:0.9rem">${UI.spotIcon(s, 24)} ${s.name}</span>
                            <span class="text-muted" style="font-size:0.85rem">🔥 ${s.hot}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/dashboard');
};

/* ===== 景点档案管理 ===== */
Router.adminPages['/spots'] = (app) => {
    const spots = DB.get(STORAGE_KEYS.SPOTS);

    const content = `
        <div class="section">
            <div class="section-title">📍 景点档案管理</div>
            <div style="margin-bottom:16px">
                <button class="btn btn-primary" onclick="adminOpenSpotForm()">➕ 新增景点</button>
                <button class="btn btn-outline" onclick="exportSpots()">📤 导出数据</button>
                <button class="btn btn-outline" onclick="importData()">📥 导入数据</button>
                <button class="btn btn-outline" style="border-color:var(--danger);color:var(--danger)" onclick="adminResetAll()">🗑️ 重置全部</button>
            </div>

            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>图标</th>
                            <th>名称</th>
                            <th>类别</th>
                            <th>校区</th>
                            <th>经纬度</th>
                            <th>热度</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${spots.map(s => `
                            <tr>
                                <td>${s.id}</td>
                                <td style="font-size:1.5rem">${UI.spotIcon(s, 36)}</td>
                                <td><strong>${s.name}</strong></td>
                                <td>${s.category}</td>
                                <td>${s.campus}</td>
                                <td style="font-size:0.75rem;color:var(--text-muted)">${s.lat}, ${s.lng}</td>
                                <td>🔥 ${s.hot}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" onclick="adminOpenSpotForm(${s.id})">编辑</button>
                                    <button class="btn btn-sm btn-danger" onclick="adminDeleteSpot(${s.id})">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/spots');

    window.adminOpenSpotForm = (spotId = 0) => {
        const spot = spotId ? Query.getSpot(spotId) : {};
        const isEdit = !!spotId;
        UI.openModal(isEdit ? '编辑景点' : '新增景点', `
            <div class="form-group">
                <label class="form-label">景点名称</label>
                <input id="f-name" class="form-control" value="${spot.name || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">图标</label>
                <div style="display:flex;gap:8px;align-items:center">
                    <button type="button" id="f-icon-btn" onclick="toggleIconPicker()" style="padding:10px 14px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);cursor:pointer;font-size:1.5rem;min-width:60px">${spot.icon || '📍'}</button>
                    <input id="f-icon" type="hidden" value="${spot.icon || '📍'}">
                    <span class="text-muted" style="font-size:0.8rem">点击选择图标</span>
                </div>
                <!-- 图标选择器 -->
                <div id="icon-picker" class="icon-picker-grid">
                    ${['📍','🏫','🌳','📚','🏛️','🏟️','🎨','🧬','⚙️','🚪','🍜','🏥','🎵','🎭','🌲','🔬','🔨','📖','🏢','🗺️','🏃','🧪','🌸','🌻','🌴','🏔️','🌊','🌙','⭐','⚡','🔥','💧','🌿','🍃','🎓','🎯','📌','🔖','🏷️','💎','🎁','🌈','☕','🍱','🏪','🏬','🏠','🛖','🌆','⛲','⛳','🎒','📷','🎬','🎤','🎧','📱','💻','🖥️','📺','🔭','🌟','✨','💫','🛝','🎠','🎡','🏝️','🏜️','🏞️','🏕️','🏖️','🏗️','🛕','⛩️','🏯','🏰','🕌','🛗','🚏','🚨','🚦','🚥','🚧','⛽','🛣️','🛤️','🛢️','🧭','🧱','🪨','🪵','🛖','🪑','🚪','🛗','🪞','🪟','🛏️','🛋️','🪤','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🧽','🧯','🛒','🚬','⚰️','⚱️','🗿','🪧','🪪','💈','💉','💊','🩹','🩺','🚪','🛃','🛄','🛅','🚹','🚺','🚼','⚧','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','👁️‍🗨️','🔚','🔙','🔛','🔝','🔜','〰️','➰','➿','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔷','🔳','🔲','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔷','🔳','🔲','🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💪','🦾','🦵','🦶','👀','👁️','👅','👄','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🫅','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🫃','🫄','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','🧌','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','🕴️','👥','🫂','👣','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🐢','🐍','🦎','🦖','🦕','🐳','🐋','🐬','🦭','🐟','🐠','🐡','🦈','🐙','🐚','🪸','🪼','🐌','🦀','🦞','🦐','🦑','🐒','🦧','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🦁','🐯','🐅','🐆','🐎','🐖','🐗','🐽','🐏','🐑','🐐','🐪','🐫','🦙','🦒','🐘','🦣','🦏','🦛','🐭','🐁','🐀','🐹','🐰','🐇','🐿️','🦫','🦔','🦇','🐻','🐻‍❄️','🐨','🐼','🦥','🦦','🦨','🦘','🦡','🐾','🦃','🐔','🐓','🐣','🐤','🐥','🐦','🐧','🕊️','🐦','🐧','🕊️','🦅','🦆','🦢','🦉','🦤','🪶','🦩','🦚','🦜','🪽','🐦','🐧','🕊️','🐸','🐊','🐢','🦎','🐍','🐲','🐉','🦕','🦖','🐳','🐋','🐬','🦭','🐟','🐠','🐡','🦈','🐙','🐚','🪸','🪼','🐌','🦀','🦞','🦐','🦑','🌱','🪴','🌲','🌳','🌴','🌵','🌾','🌿','☘️','🍀','🍁','🍂','🍃','🪹','🪺','🍄','🌰','🦀','🦞','🦐','🦑','🦪','🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒','🍓','🫐','🥝','🍅','🫒','🥥','🥑','🍆','🥔','🥕','🌽','🌶️','🫑','🥒','🥬','🥦','🧄','🧅','🥜','🫘','🌰','🫚','🫛','🍞','🥐','🥖','🫓','🥨','🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🫗','🥤','🧋','🧃','🧉','🧊','🥢','🍽️','🍴','🥄','🔪','🫙','🏺','🌍','🌎','🌏','🌐','🪨','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌙','🌚','🌛','🌜','☀️','🌝','🌞','🪐','⭐','🌟','🌠','🌌','☁️','⛅','⛈️','🌤️','🌥️','🌦️','🌧️','🌨️','🌩️','🌪️','🌫️','🌬️','🌀','🌈','🌂','☂️','☔','⛱️','⚡','❄️','☃️','⛄','☄️','🔥','💧','🌊','🎃','🎄','🎁','🎈','🎉','🎊','🏮','🎆','🎇','🧨','✨','🌟','⭐','💫','🌀','🎵','🎶','🎼','🎤','🎧','📻','🎷','🪗','🎸','🎹','🎺','🎻','🪈','🥁','🪘','🥳','🤹','⛳','⛸️','🏂','🛷','⛷️','🏂','🏋️','🤼','🤸','🤺','⛹️','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🏵️','🎫','🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🎹','🎻','🪈','📱','📲','☎️','📞','📟','📠','🔋','🪫','🔌','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','💾','💿','📀','🧮','🎥','🎞️','📽️','🎬','📺','📷','📸','📹','📼','🔍','🔎','🕯️','💡','🔦','🏮','🪔','📔','📕','📖','📗','📘','📙','📚','📓','📒','📃','📜','📄','📰','🗞️','📑','🔖','🏷️','💰','💴','💵','💶','💷','💸','💳','🧾','💹','💱','💲','💠','🧿','🪧','🪪','🔇','🔈','🔉','🔊','📢','📣','📯','🔔','🔕','🎼','🎵','🎶','🎙️','🎚️','🎛️','🎤','🎧','📻','🎷','🪗','🎸','🎹','🎺','🎻','🪈','🥁','🪘','⚙️','🪜','⌛','⏳','⌚','⏰','⏱️','⏲️','🕰️','🕛','🕧','🕐','🕜','🕑','🕝','🕒','🕞','🕓','🕟','🕔','🕠','🕕','🕡','🕖','🕢','🕗','🕣','🕘','🕤','🕙','🕥','🕚','🕦','📡','🔋','🪫','🔌','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','💾','💿','📀','🧮','🎥','🎞️','📽️','🎬','📺','📷','📸','📹','📼','🔍','🔎','🕯️','💡','🔦','🏮','🪔','📔','📕','📖','📗','📘','📙','📚','📓','📒','📃','📜','📄','📰','🗞️','📑','🔖','🏷️','💰','💴','💵','💶','💷','💸','💳','🧾','💹','💱','💲','💠','🧿','🪧','🪪'].map(e =>
                        `<button type="button" onclick="pickIcon('${e}')" style="padding:8px;border:1px solid transparent;background:none;border-radius:6px;cursor:pointer;font-size:1.2rem;transition:all 0.15s" onmouseover="this.style.background='var(--secondary)'" onmouseout="this.style.background=''">${e}</button>`
                    ).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">类别</label>
                <select id="f-category" class="form-control">
                    ${['学习场所','办公建筑','教学场所','运动场所','餐饮服务','地标建筑','自然景观','文化场馆','活动场所'].map(c =>
                        `<option ${spot.category===c?'selected':''}>${c}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">校区</label>
                <select id="f-campus" class="form-control">
                    <option ${spot.campus==='东园'?'selected':''}>东园</option>
                    <option ${spot.campus==='西园'?'selected':''}>西园</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">景点图片 (可上传多张，最多5张。点击图片可设为封面)</label>
                <input id="f-images" class="form-control" type="file" accept="image/*" multiple onchange="adminAddSpotImgs(this)">
                <div id="f-img-grid" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
                    ${(() => {
                        const imgs = spot.images || (spot.image ? [spot.image] : []);
                        const coverIdx = spot.coverIndex || 0;
                        return imgs.map((src, i) => `
                            <div style="position:relative;cursor:pointer" onclick="adminSetCoverImg(${i})">
                                <img src="${src}" style="width:80px;height:60px;border-radius:6px;object-fit:cover;border:2px solid ${i===coverIdx?'#2d9b7a':'var(--border)'}">
                                ${i===coverIdx ? '<div style="position:absolute;top:2px;left:2px;background:#2d9b7a;color:white;font-size:10px;padding:1px 5px;border-radius:3px">封面</div>' : ''}
                                <button type="button" onclick="event.stopPropagation();adminRemoveSpotImg(${i})" style="position:absolute;top:-6px;right:-6px;background:var(--danger);color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;line-height:1">×</button>
                            </div>
                        `).join('');
                    })()}
                </div>
                <input id="f-images-data" type="hidden" value="${JSON.stringify(spot.images || (spot.image ? [spot.image] : []))}">
                <input id="f-cover-index" type="hidden" value="${spot.coverIndex || 0}">
            </div>
            <div class="form-group">
                <label class="form-label">描述</label>
                <textarea id="f-desc" class="form-control form-textarea" rows="3">${spot.description || ''}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="form-group">
                    <label class="form-label">纬度</label>
                    <input id="f-lat" class="form-control" value="${spot.lat || 28.13}">
                </div>
                <div class="form-group">
                    <label class="form-label">经度</label>
                    <input id="f-lng" class="form-control" value="${spot.lng || 112.99}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">地址</label>
                <input id="f-address" class="form-control" value="${spot.address || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">开放时间</label>
                <input id="f-openTime" class="form-control" value="${spot.openTime || ''}">
            </div>
        `, `
            <button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="adminSaveSpot(${spotId})">💾 保存</button>
        `);
    };

    // 多图上传 - 添加
    window.adminAddSpotImgs = async (input) => {
        console.log('[adminAddSpotImgs] 触发了！files.length =', input.files?.length);
        if (!input.files || !input.files.length) return;
        const dataInput = document.getElementById('f-images-data');
        const current = JSON.parse(dataInput.value || '[]');
        console.log('[adminAddSpotImgs] 当前已有图片数量:', current.length);

        if (current.length >= 5) {
            UI.toast('最多上传5张图片', 'warning');
            input.value = ''; return;
        }

        const files = Array.from(input.files).slice(0, 5 - current.length);
        UI.toast('正在读取 ' + files.length + ' 张图片...', 'info');

        for (const file of files) {
            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => { current.push(e.target.result); console.log('[adminAddSpotImgs] 读入一张，base64长度=', e.target.result?.length); resolve(); };
                reader.onerror = () => { console.error('[adminAddSpotImgs] FileReader 错误'); resolve(); };
                reader.readAsDataURL(file);
            });
        }

        dataInput.value = JSON.stringify(current);
        console.log('[adminAddSpotImgs] 完成！共', current.length, '张');
        // 重新渲染缩略图网格
        adminRenderSpotImgs();
        input.value = '';
        UI.toast('✓ 已添加 ' + files.length + ' 张（共 ' + current.length + '/5）', 'success');
    };

    window.adminRemoveSpotImg = (index) => {
        const dataInput = document.getElementById('f-images-data');
        const coverInput = document.getElementById('f-cover-index');
        const current = JSON.parse(dataInput.value || '[]');
        current.splice(index, 1);
        dataInput.value = JSON.stringify(current);
        // 如果删掉了原来的封面，修正索引
        let coverIdx = parseInt(coverInput.value || '0');
        if (index === coverIdx) coverIdx = 0;
        else if (index < coverIdx) coverIdx -= 1;
        if (coverIdx >= current.length) coverIdx = 0;
        coverInput.value = coverIdx;
        adminRenderSpotImgs();
    };

    window.adminSetCoverImg = (index) => {
        const coverInput = document.getElementById('f-cover-index');
        const dataInput = document.getElementById('f-images-data');
        const imgs = JSON.parse(dataInput.value || '[]');
        if (index >= 0 && index < imgs.length) {
            coverInput.value = index;
            UI.toast('✓ 封面已更新', 'success');
            adminRenderSpotImgs();
        }
    };

    window.adminRenderSpotImgs = () => {
        const dataInput = document.getElementById('f-images-data');
        const coverInput = document.getElementById('f-cover-index');
        const grid = document.getElementById('f-img-grid');
        if (!grid) return;
        const imgs = JSON.parse(dataInput.value || '[]');
        let coverIdx = parseInt(coverInput.value || '0');
        if (coverIdx >= imgs.length) coverIdx = 0;
        coverInput.value = coverIdx;
        grid.innerHTML = imgs.map((src, i) => `
            <div style="position:relative;cursor:pointer" onclick="adminSetCoverImg(${i})">
                <img src="${src}" style="width:80px;height:60px;border-radius:6px;object-fit:cover;border:2px solid ${i===coverIdx?'#2d9b7a':'var(--border)'}">
                ${i===coverIdx ? '<div style="position:absolute;top:2px;left:2px;background:#2d9b7a;color:white;font-size:10px;padding:1px 5px;border-radius:3px">封面</div>' : ''}
                <button type="button" onclick="event.stopPropagation();adminRemoveSpotImg(${i})" style="position:absolute;top:-6px;right:-6px;background:var(--danger);color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;line-height:1">×</button>
            </div>
        `).join('');
    };

    // 图标选择器
    window.toggleIconPicker = () => {
        const p = document.getElementById('icon-picker');
        if (!p) return;
        if (p.style.display === 'none') {
            p.style.display = 'grid';
        } else {
            p.style.display = 'none';
        }
    };
    window.pickIcon = (e) => {
        document.getElementById('f-icon').value = e;
        document.getElementById('f-icon-btn').textContent = e;
        document.getElementById('icon-picker').style.display = 'none';
    };
    // 点击弹窗外关闭图标选择器
    document.addEventListener('click', (ev) => {
        const p = document.getElementById('icon-picker');
        if (!p || !p.parentElement) return;
        if (!p.parentElement.contains(ev.target) && ev.target.id !== 'f-icon-btn' && !ev.target.closest('#icon-picker')) {
            p.style.display = 'none';
        }
    });

    window.adminSaveSpot = (spotId) => {
        const dataInput = document.getElementById('f-images-data');
        const coverInput = document.getElementById('f-cover-index');
        const existingSpot = spotId ? Query.getSpot(spotId) : {};
        let images = [];
        try { images = JSON.parse(dataInput.value || '[]'); } catch(e) { images = []; }
        let coverIdx = parseInt(coverInput.value || '0');
        if (coverIdx >= images.length) coverIdx = 0;

        console.log('[adminSaveSpot] spotId=', spotId);
        console.log('[adminSaveSpot] images数量=', images.length, 'coverIdx=', coverIdx);
        if (images.length > 0) console.log('[adminSaveSpot] 封面图开头=', images[coverIdx].substring(0, 30) + '...');

        const data = {
            name: document.getElementById('f-name').value.trim(),
            icon: document.getElementById('f-icon').value.trim() || '📍',
            category: document.getElementById('f-category').value,
            campus: document.getElementById('f-campus').value,
            images: images,
            coverIndex: coverIdx,
            image: images.length > 0 ? images[coverIdx] : (existingSpot.image || ''),  // 封面图作主图
            description: document.getElementById('f-desc').value.trim(),
            lat: parseFloat(document.getElementById('f-lat').value) || 28.13,
            lng: parseFloat(document.getElementById('f-lng').value) || 112.99,
            address: document.getElementById('f-address').value.trim(),
            openTime: document.getElementById('f-openTime').value.trim()
        };
        if (!data.name) { UI.toast('请填写景点名称', 'warning'); return; }

        try {
            if (spotId) {
                DB.update(STORAGE_KEYS.SPOTS, spotId, data);
                console.log('[adminSaveSpot] ✓ DB.update 成功!');
                UI.toast('景点已更新', 'success');
            } else {
                DB.add(STORAGE_KEYS.SPOTS, { ...data, hot: 0 });
                console.log('[adminSaveSpot] ✓ DB.add 成功!');
                UI.toast('景点已添加', 'success');
            }
            // 验证存进去了
            const verify = spotId ? Query.getSpot(spotId) : null;
            if (verify) console.log('[adminSaveSpot] 验证: spot.image=', verify.image?.substring(0, 30));
        } catch(e) {
            console.error('[adminSaveSpot] ✗ 保存失败!', e);
            UI.toast('保存失败: ' + e.message, 'error');
            return;
        }
        UI.closeModal();
        Router.handleRoute();
    };

    window.adminDeleteSpot = (spotId) => {
        UI.openModal('删除确认', '<p>确定删除该景点吗？此操作不可恢复。</p>',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmDeleteSpot(${spotId})">确认删除</button>`);
    };

    window.confirmDeleteSpot = (spotId) => {
        DB.remove(STORAGE_KEYS.SPOTS, spotId);
        UI.closeModal();
        UI.toast('景点已删除', 'success');
        Router.handleRoute();
    };

    window.exportSpots = () => {
        // 导出所有可持久化数据
        const allData = {
            _exportedAt: new Date().toISOString(),
            _version: 1,
            spots: DB.get(STORAGE_KEYS.SPOTS),
            home_banners: DB.get(STORAGE_KEYS.HOME_BANNERS),
            hero_banner: DB.get(STORAGE_KEYS.HERO_BANNER),
            travels: DB.get(STORAGE_KEYS.TRAVELS),
            settings: DB.get(STORAGE_KEYS.SETTINGS),
        };
        const json = JSON.stringify(allData);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'campus_data_' + Date.now() + '.json'; a.click();
        URL.revokeObjectURL(url);
        UI.toast('✓ 全部数据已导出（含' + allData.spots.length + '个景点）', 'success');
    };

    window.importData = () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onerror = () => { UI.toast('❌ 文件读取失败', 'error'); };
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    const spots = Array.isArray(data) ? data : data.spots;
                    if (!spots || !Array.isArray(spots)) {
                        UI.toast('❌ 文件格式不对', 'error'); return;
                    }
                    // ★ 存到全局变量，避免 onclick 引号转义地狱
                    window._pendingImportData = data;
                    UI.openModal('📥 导入数据确认',
                        `<p>即将导入 <b>${spots.length}</b> 个景点。</p>
                         <p style="color:var(--warning);margin-top:10px">⚠️ 这会<b>覆盖</b>当前所有景点数据，不可撤销！</p>`,
                        `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
                         <button class="btn btn-primary" onclick="UI._confirmImport()">✅ 确认导入</button>`
                    );
                } catch(err) {
                    UI.toast('❌ JSON 解析失败：' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    UI._confirmImport = () => {
        const data = window._pendingImportData;
        if (!data) { UI.toast('❌ 没有待导入数据', 'error'); return; }
        try {
            const spots = Array.isArray(data) ? data : data.spots;
            DB.set(STORAGE_KEYS.SPOTS, spots);
            if (data.home_banners) DB.set(STORAGE_KEYS.HOME_BANNERS, data.home_banners);
            if (data.hero_banner) DB.set(STORAGE_KEYS.HERO_BANNER, data.hero_banner);
            localStorage.setItem('__cg_seed_version__', 'v-imported-' + Date.now());
            UI.closeModal();
            UI.toast('✓ 导入成功！共 ' + spots.length + ' 个景点', 'success');
            Router.handleRoute();
        } catch(err) {
            UI.toast('❌ 导入失败：' + err.message, 'error');
        }
        window._pendingImportData = null;
    };

    window.adminResetAll = () => {
        UI.openModal('🗑️ 重置全部数据',
            `<p>确定要<b>重置所有数据</b>吗？这会把景点、横幅等全部恢复成初始种子数据！</p>
             <p style="color:var(--danger);margin-top:10px"><b>⚠️ 不可撤销！</b>已上传的图片、删除的景点都会丢失。</p>`,
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="UI.closeModal();DB.reset();UI.toast('✓ 已重置','success');Router.handleRoute()">确认重置</button>`
        );
    };
};

/* ===== 用户管理 ===== */
Router.adminPages['/users'] = (app) => {
    const users = DB.get(STORAGE_KEYS.USERS);
    const admins = DB.get(STORAGE_KEYS.ADMINS);
    const currentAdmin = Query.getCurrentAdmin();
    const isSuper = currentAdmin && currentAdmin.role === 'super';

    // 快速判断某个用户是不是管理员
    const userIsAdmin = (userId) => admins.some(a => a.username === users.find(u => u.id === userId)?.username);

    const content = `
        <div class="section">
            <div class="section-title">👥 用户管理 (${users.length}) ${isSuper ? '<span style="font-size:0.75rem;color:#2d9b7a;margin-left:10px">👑 超级管理员模式</span>' : ''}</div>

            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>昵称</th>
                            <th>学号</th>
                            <th>角色</th>
                            <th>手机号</th>
                            <th>邮箱</th>
                            <th>注册时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => {
                            const isAdmin = userIsAdmin(u.id);
                            return `
                            <tr>
                                <td>${u.id}</td>
                                <td><div class="user-avatar" style="display:inline-flex;width:28px;height:28px;font-size:0.85rem;margin-right:6px">${u.avatar}</div>${u.username}</td>
                                <td>${u.studentId}</td>
                                <td>${isAdmin
                                    ? '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:0.75rem;white-space:nowrap">👑 管理员</span>'
                                    : '<span style="background:#e5e7eb;color:#4b5563;padding:2px 8px;border-radius:4px;font-size:0.75rem;white-space:nowrap">普通用户</span>'}</td>
                                <td>${u.phone}</td>
                                <td style="font-size:0.8rem">${u.email || '-'}</td>
                                <td style="font-size:0.8rem;color:var(--text-muted)">${u.createTime}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" onclick="adminOpenUserForm(${u.id})">编辑</button>
                                    ${isSuper ? `<button class="btn btn-sm ${isAdmin ? 'btn-outline' : 'btn-primary'}" onclick="adminToggleUserAdmin(${u.id}, ${!isAdmin})">${isAdmin ? '取消管理员' : '👑 设为管理员'}</button>` : ''}
                                    <button class="btn btn-sm btn-danger" onclick="adminDeleteUser(${u.id})">删除</button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ${!isSuper ? '<p style="color:var(--text-muted);font-size:0.8rem;margin-top:12px">💡 只有超级管理员可以设置用户角色</p>' : ''}
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/users');

    window.adminOpenUserForm = (userId) => {
        const u = Query.getUser(userId);
        UI.openModal('编辑用户', `
            <div class="form-group">
                <label class="form-label">昵称</label>
                <input id="u-username" class="form-control" value="${u.username}">
            </div>
            <div class="form-group">
                <label class="form-label">手机号</label>
                <input id="u-phone" class="form-control" value="${u.phone}">
            </div>
            <div class="form-group">
                <label class="form-label">邮箱</label>
                <input id="u-email" class="form-control" value="${u.email || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">重置密码 (留空不修改)</label>
                <input id="u-password" class="form-control" type="password" placeholder="输入新密码">
            </div>
        `, `
            <button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="adminSaveUser(${userId})">💾 保存</button>
        `);
    };

    window.adminSaveUser = (userId) => {
        const data = {
            username: document.getElementById('u-username').value.trim(),
            phone: document.getElementById('u-phone').value.trim(),
            email: document.getElementById('u-email').value.trim(),
            avatar: document.getElementById('u-username').value.trim().charAt(0)
        };
        const newPwd = document.getElementById('u-password').value;
        if (newPwd) data.password = newPwd;
        DB.update(STORAGE_KEYS.USERS, userId, data);
        UI.closeModal();
        UI.toast('用户信息已更新', 'success');
        Router.handleRoute();
    };

    // 超级管理员专属：设置/取消管理员
    window.adminToggleUserAdmin = (userId, makeAdmin) => {
        const currentAdmin = Query.getCurrentAdmin();
        if (!currentAdmin || currentAdmin.role !== 'super') {
            UI.toast('❌ 只有超级管理员可以操作', 'error');
            return;
        }
        const user = Query.getUser(userId);
        if (!user) { UI.toast('用户不存在', 'error'); return; }

        const admins = DB.get(STORAGE_KEYS.ADMINS);

        if (makeAdmin) {
            // 检查用户名是否和现有管理员冲突
            if (admins.find(a => a.username === user.username)) {
                UI.toast('该用户已是管理员', 'warning');
                return;
            }
            DB.add(STORAGE_KEYS.ADMINS, {
                username: user.username,
                password: user.password || '123456',
                name: user.username,
                role: 'content'
            });
            UI.toast('👑 ' + user.username + ' 已设为内容管理员', 'success');
        } else {
            const admin = admins.find(a => a.username === user.username);
            if (!admin) { UI.toast('该用户不是管理员', 'warning'); return; }
            DB.remove(STORAGE_KEYS.ADMINS, admin.id);
            UI.toast('已取消 ' + user.username + ' 的管理员权限', 'info');
        }
        Router.handleRoute();
    };

    window.adminDeleteUser = (userId) => {
        UI.openModal('删除确认', '<p>确定删除该用户吗？其所有打卡/收藏/评论数据将保留。</p>',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmDeleteUser(${userId})">确认删除</button>`);
    };

    window.confirmDeleteUser = (userId) => {
        DB.remove(STORAGE_KEYS.USERS, userId);
        UI.closeModal();
        UI.toast('用户已删除', 'success');
        Router.handleRoute();
    };
};

/* ===== 游记审核管理 ===== */
Router.adminPages['/travels'] = (app) => {
    const filter = Router.getQuery('status') || '';
    let travels = DB.get(STORAGE_KEYS.TRAVELS);
    if (filter) travels = travels.filter(t => t.status === filter);

    const count = {
        all: DB.get(STORAGE_KEYS.TRAVELS).length,
        approved: DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.status === 'approved').length,
        pending: DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.status === 'pending').length,
        rejected: DB.get(STORAGE_KEYS.TRAVELS).filter(t => t.status === 'rejected').length
    };

    const content = `
        <div class="section">
            <div class="section-title">📖 游记审核管理</div>

            <!-- 筛选 -->
            <div class="tag-group">
                <a href="#/admin/travels" class="tag ${!filter?'active':''}">全部 (${count.all})</a>
                <a href="#/admin/travels?status=pending" class="tag ${filter==='pending'?'active':''}">⏳ 待审核 (${count.pending})</a>
                <a href="#/admin/travels?status=approved" class="tag ${filter==='approved'?'active':''}">✅ 已通过 (${count.approved})</a>
                <a href="#/admin/travels?status=rejected" class="tag ${filter==='rejected'?'active':''}">❌ 已驳回 (${count.rejected})</a>
            </div>

            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>标题</th>
                            <th>作者</th>
                            <th>内容预览</th>
                            <th>标签</th>
                            <th>提交时间</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${travels.map(t => {
                            const author = Query.getUser(t.userId);
                            return `
                            <tr>
                                <td>${t.id}</td>
                                <td><strong>${t.title}</strong></td>
                                <td>${author?.username || '未知'}</td>
                                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem">${t.content.substring(0, 60)}...</td>
                                <td>${(t.tags || []).map(tag => `<span class="card-tag">#${tag}</span>`).join('')}</td>
                                <td style="font-size:0.8rem;color:var(--text-muted)">${t.createTime}</td>
                                <td>
                                    <span class="badge ${t.status==='approved'?'badge-success':t.status==='pending'?'badge-warning':'badge-danger'}" style="white-space:nowrap">
                                        ${t.status==='approved'?'已通过':t.status==='pending'?'审核中':'已驳回'}
                                    </span>
                                </td>
                                <td>
                                    ${t.status === 'pending' ? `
                                        <button class="btn btn-sm btn-primary" onclick="approveTravel(${t.id})">通过</button>
                                        <button class="btn btn-sm btn-danger" onclick="rejectTravel(${t.id})">驳回</button>
                                    ` : `
                                        <button class="btn btn-sm btn-outline" onclick="viewTravel(${t.id})">查看</button>
                                        <button class="btn btn-sm btn-danger" onclick="adminDeleteTravel(${t.id})">删除</button>
                                    `}
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/travels');

    window.approveTravel = (id) => {
        const t = Query.getTravel(id);
        DB.update(STORAGE_KEYS.TRAVELS, id, { status: 'approved' });
        // 推送消息给用户
        DB.add(STORAGE_KEYS.MESSAGES, {
            userId: t.userId,
            title: '游记审核通过 ✅',
            content: `您发布的游记《${t.title}》已审核通过，现在可以在前台看到啦！`,
            type: 'system', read: false, time: Utils.now()
        });
        UI.toast('已通过，用户已收到通知', 'success');
        Router.handleRoute();
    };

    window.rejectTravel = (id) => {
        const t = Query.getTravel(id);
        UI.openModal('驳回游记', `
            <p>请填写驳回原因：</p>
            <textarea id="reject-reason" class="form-control form-textarea" rows="3" placeholder="如：内容不符合规范..."></textarea>
        `, `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmReject(${id}, '${t.title.replace(/'/g, "\\'")}', ${t.userId})">确认驳回</button>`);
    };

    window.confirmReject = (id, title, userId) => {
        const reason = document.getElementById('reject-reason').value.trim();
        DB.update(STORAGE_KEYS.TRAVELS, id, { status: 'rejected' });
        DB.add(STORAGE_KEYS.MESSAGES, {
            userId,
            title: '游记被驳回',
            content: `您发布的游记《${title}》未通过审核${reason ? ('，原因：' + reason) : ''}。请修改后重新提交。`,
            type: 'system', read: false, time: Utils.now()
        });
        UI.closeModal();
        UI.toast('已驳回，用户已收到通知', 'warning');
        Router.handleRoute();
    };

    window.viewTravel = (id) => { Router.navigate('/travels/' + id); };

    window.adminDeleteTravel = (id) => {
        UI.openModal('删除游记', '<p>确定删除该游记吗？</p>',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmDeleteTravel2(${id})">删除</button>`);
    };

    window.confirmDeleteTravel2 = (id) => {
        DB.remove(STORAGE_KEYS.TRAVELS, id);
        UI.closeModal();
        UI.toast('游记已删除', 'success');
        Router.handleRoute();
    };
};

/* ===== 评论管理 ===== */
Router.adminPages['/comments'] = (app) => {
    const comments = DB.get(STORAGE_KEYS.COMMENTS);

    const content = `
        <div class="section">
            <div class="section-title">💬 评论管理 (${comments.length})</div>

            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>评论者</th>
                            <th>目标</th>
                            <th>内容</th>
                            <th>时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${comments.map(c => {
                            const author = Query.getUser(c.userId);
                            let target = '';
                            if (c.targetType === 'spot') {
                                const s = Query.getSpot(c.targetId);
                                target = `<a href="#/spots/${c.targetId}">📍 ${s?.name || '#' + c.targetId}</a>`;
                            } else {
                                const t = Query.getTravel(c.targetId);
                                target = `<a href="#/travels/${c.targetId}">📖 ${t?.title?.substring(0, 20) || '#' + c.targetId}</a>`;
                            }
                            return `
                            <tr>
                                <td>${c.id}</td>
                                <td>${author?.username || '未知'}</td>
                                <td>${target}</td>
                                <td style="max-width:250px;font-size:0.85rem">${c.content}</td>
                                <td style="font-size:0.8rem;color:var(--text-muted)">${c.time}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="adminDeleteComment(${c.id})">删除</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/comments');

    window.adminDeleteComment = (id) => {
        DB.remove(STORAGE_KEYS.COMMENTS, id);
        UI.toast('评论已删除', 'success');
        Router.handleRoute();
    };
};

/* ===== 站内消息管理 ===== */
Router.adminPages['/messages'] = (app) => {
    const messages = DB.get(STORAGE_KEYS.MESSAGES);
    const users = DB.get(STORAGE_KEYS.USERS);

    const content = `
        <div class="section">
            <div class="section-title">📨 站内消息管理</div>

            <!-- 发送消息 -->
            <div class="detail-section">
                <h3>✉️ 发送新消息</h3>
                <div class="form-group">
                    <label class="form-label">目标用户</label>
                    <select id="msg-user" class="form-control">
                        <option value="0">全部用户 (群发)</option>
                        ${users.map(u => `<option value="${u.id}">${u.username} (${u.studentId})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">消息标题</label>
                    <input id="msg-title" class="form-control" placeholder="消息标题">
                </div>
                <div class="form-group">
                    <label class="form-label">消息类型</label>
                    <select id="msg-type" class="form-control">
                        <option value="system">系统通知</option>
                        <option value="recommend">推荐更新</option>
                        <option value="comment">评论提醒</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">消息内容</label>
                    <textarea id="msg-content" class="form-control form-textarea" rows="4" placeholder="详细内容..."></textarea>
                </div>
                <button class="btn btn-primary" onclick="sendAdminMessage()">📤 发送消息</button>
            </div>

            <!-- 消息列表 -->
            <div class="detail-section">
                <h3>📋 已发送消息 (${messages.length})</h3>
                ${messages.length === 0 ? '<p class="text-muted">暂无消息</p>' : `
                ${messages.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 20).map(m => {
                    const u = Query.getUser(m.userId);
                    return `
                    <div style="padding:12px;background:var(--secondary);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start">
                        <div style="flex:1">
                            <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
                                <strong>${m.title}</strong>
                                <span class="badge badge-info">${m.type}</span>
                                ${m.read ? '<span class="text-muted" style="font-size:0.75rem">已读</span>' : '<span class="badge badge-danger">未读</span>'}
                            </div>
                            <div style="font-size:0.85rem;color:var(--text-light)">${m.content}</div>
                            <div class="text-muted" style="font-size:0.75rem;margin-top:4px">→ ${u?.username || '#unknown'} · ${m.time}</div>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="deleteAdminMsg(${m.id})">删除</button>
                    </div>
                `}).join('')}
                `}
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/messages');

    window.sendAdminMessage = () => {
        const userId = parseInt(document.getElementById('msg-user').value);
        const title = document.getElementById('msg-title').value.trim();
        const type = document.getElementById('msg-type').value;
        const content = document.getElementById('msg-content').value.trim();

        if (!title || !content) { UI.toast('请填写标题和内容', 'warning'); return; }

        if (userId === 0) {
            // 群发
            users.forEach(u => {
                DB.add(STORAGE_KEYS.MESSAGES, {
                    userId: u.id, title, type, content,
                    read: false, time: Utils.now()
                });
            });
            UI.toast(`已向 ${users.length} 个用户发送消息`, 'success');
        } else {
            DB.add(STORAGE_KEYS.MESSAGES, {
                userId, title, type, content,
                read: false, time: Utils.now()
            });
            UI.toast('消息发送成功', 'success');
        }

        document.getElementById('msg-title').value = '';
        document.getElementById('msg-content').value = '';
        Router.handleRoute();
    };

    window.deleteAdminMsg = (id) => {
        DB.remove(STORAGE_KEYS.MESSAGES, id);
        UI.toast('消息已删除', 'success');
        Router.handleRoute();
    };
};

/* ===== 管理员个人设置 ===== */
Router.adminPages['/settings'] = (app) => {
    const admin = Query.getCurrentAdmin();

    const content = `
        <div class="section">
            <div class="section-title">⚙️ 管理员个人设置</div>

            <div class="detail-section">
                <h3>👤 基本信息</h3>
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input id="admin-username" class="form-control" value="${admin.username}" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">姓名</label>
                    <input id="admin-name" class="form-control" value="${admin.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">角色</label>
                    <input class="form-control" value="${admin.role === 'super' ? '超级管理员' : '内容管理员'}" disabled>
                </div>
                <button class="btn btn-primary" onclick="saveAdminProfile()">💾 保存修改</button>
            </div>

            <div class="detail-section">
                <h3>🔑 修改密码</h3>
                <div class="form-group">
                    <label class="form-label">原密码</label>
                    <input id="admin-oldpwd" class="form-control" type="password">
                </div>
                <div class="form-group">
                    <label class="form-label">新密码</label>
                    <input id="admin-newpwd" class="form-control" type="password">
                </div>
                <button class="btn btn-primary" onclick="changeAdminPwd()">🔄 修改密码</button>
            </div>

            <div class="detail-section" style="border-left:4px solid var(--danger)">
                <h3>⚠️ 注销管理员账号</h3>
                <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px">注销后将无法再登录管理后台</p>
                <button class="btn btn-danger" onclick="cancelAdminAccount()">注销账号</button>
            </div>
        </div>
    `;

    app.innerHTML = wrapAdminLayout(content, '/settings');

    window.saveAdminProfile = () => {
        const name = document.getElementById('admin-name').value.trim();
        Auth.adminUpdateProfile({ name });
        UI.toast('资料已保存', 'success');
    };

    window.changeAdminPwd = () => {
        const oldPwd = document.getElementById('admin-oldpwd').value;
        const newPwd = document.getElementById('admin-newpwd').value;
        if (!oldPwd || !newPwd) { UI.toast('请填写完整', 'warning'); return; }
        if (newPwd.length < 6) { UI.toast('密码至少6位', 'warning'); return; }
        const result = Auth.adminChangePassword(oldPwd, newPwd);
        UI.toast(result.message || (result.success ? '密码已修改' : ''), result.success ? 'success' : 'error');
    };

    window.cancelAdminAccount = () => {
        UI.openModal('⚠️ 注销管理员账号',
            '<p>确定要注销账号吗？此操作不可恢复。</p>' +
            '<input id="admin-cancel-pwd" class="form-control" type="password" placeholder="请输入密码确认">',
            `<button class="btn btn-outline" onclick="UI.closeModal()">取消</button>
             <button class="btn btn-danger" onclick="confirmCancelAdmin()">确认注销</button>`);
    };

    window.confirmCancelAdmin = () => {
        const pwd = document.getElementById('admin-cancel-pwd').value;
        const admins = DB.get(STORAGE_KEYS.ADMINS);
        const current = Query.getCurrentAdmin();
        if (pwd !== current.password) { UI.toast('密码错误', 'error'); return; }
        Auth.adminCancelAccount();
        UI.closeModal();
        UI.toast('已注销', 'info');
        Router.navigate('/admin/login');
    };
};
