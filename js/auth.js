/* ============================================
   用户认证模块
   ============================================ */

const Auth = {
    // 注册新用户
    register(userData) {
        const users = DB.get(STORAGE_KEYS.USERS);

        // 校验学号唯一性
        if (users.find(u => u.studentId === userData.studentId)) {
            return { success: false, message: '该学号已注册' };
        }
        // 校验手机号唯一性
        if (users.find(u => u.phone === userData.phone)) {
            return { success: false, message: '该手机号已注册' };
        }
        // 手机号格式
        if (!Utils.validPhone(userData.phone)) {
            return { success: false, message: '手机号格式不正确' };
        }
        // 学号格式
        if (!Utils.validStudentId(userData.studentId)) {
            return { success: false, message: '学号必须为8位数字' };
        }

        const newUser = DB.add(STORAGE_KEYS.USERS, {
            username: userData.username,
            studentId: userData.studentId,
            phone: userData.phone,
            password: userData.password,
            email: userData.email || '',
            avatar: userData.username.charAt(0),
            createTime: Utils.now(),
            bio: ''
        });

        return { success: true, user: newUser };
    },

    // 用户登录
    login(identifier, password) {
        const users = DB.get(STORAGE_KEYS.USERS);
        const user = users.find(u =>
            (u.phone === identifier || u.studentId === identifier || u.email === identifier) &&
            u.password === password
        );
        if (!user) return { success: false, message: '账号或密码错误' };
        localStorage.setItem('cg_current_user', user.id);
        return { success: true, user };
    },

    // 退出登录
    logout() {
        localStorage.removeItem('cg_current_user');
        localStorage.removeItem('cg_current_admin');
    },

    // 注销用户
    cancelAccount() {
        const uid = localStorage.getItem('cg_current_user');
        if (!uid) return;
        DB.remove(STORAGE_KEYS.USERS, parseInt(uid));
        this.logout();
    },

    // 修改密码
    changePassword(oldPwd, newPwd, isAdmin = false) {
        const storageKey = isAdmin ? 'cg_admins' : STORAGE_KEYS.USERS;
        const id = isAdmin
            ? parseInt(localStorage.getItem('cg_current_admin'))
            : parseInt(localStorage.getItem('cg_current_user'));
        const users = DB.get(storageKey);
        const user = users.find(u => u.id === id);
        if (!user) return { success: false, message: '用户不存在' };
        if (user.password !== oldPwd) return { success: false, message: '原密码错误' };
        DB.update(storageKey, id, { password: newPwd });
        return { success: true };
    },

    // 更新用户信息
    updateProfile(updates) {
        const uid = parseInt(localStorage.getItem('cg_current_user'));
        DB.update(STORAGE_KEYS.USERS, uid, updates);
    },

    // ============ 管理员 ============
    adminLogin(username, password) {
        const admins = DB.get(STORAGE_KEYS.ADMINS);
        const admin = admins.find(a => a.username === username && a.password === password);
        if (!admin) return { success: false, message: '管理员账号或密码错误' };
        localStorage.setItem('cg_current_admin', admin.id);
        return { success: true, admin };
    },

    adminRegister(data) {
        const admins = DB.get(STORAGE_KEYS.ADMINS);
        if (admins.find(a => a.username === data.username)) {
            return { success: false, message: '用户名已存在' };
        }
        const newAdmin = DB.add(STORAGE_KEYS.ADMINS, {
            username: data.username,
            password: data.password,
            name: data.name || data.username,
            role: 'content'
        });
        return { success: true, admin: newAdmin };
    },

    adminLogout() {
        localStorage.removeItem('cg_current_admin');
    },

    // 别名，兼容 router.js 调用
    logoutAdmin() {
        this.adminLogout();
    },

    adminChangePassword(oldPwd, newPwd) {
        return this.changePassword(oldPwd, newPwd, true);
    },

    adminCancelAccount() {
        const id = parseInt(localStorage.getItem('cg_current_admin'));
        DB.remove(STORAGE_KEYS.ADMINS, id);
        this.adminLogout();
    },

    adminUpdateProfile(updates) {
        const id = parseInt(localStorage.getItem('cg_current_admin'));
        DB.update(STORAGE_KEYS.ADMINS, id, updates);
    }
};
