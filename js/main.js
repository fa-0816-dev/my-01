/* ============================================
   应用入口 main.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化主题
    UI.initTheme();

    // 主题切换
    const themeSwitcher = document.getElementById('theme-switcher');
    themeSwitcher?.addEventListener('change', (e) => {
        UI.setTheme(e.target.value);
        UI.toast(`已切换到 ${e.target.options[e.target.selectedIndex].text}`, 'success');
    });

    // 移动端菜单
    UI.initMobileMenu();

    // 模态框点击外部关闭
    document.getElementById('modal-container')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-container') UI.closeModal();
    });

    // ESC 关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') UI.closeModal();
    });

    // 启动路由
    Router.init();

    console.log('🏫 校园景点导览系统已启动');
    console.log('💡 用户端测试账号: 20230001 / 123456');
    console.log('💡 管理员端测试账号: admin / admin123');
});
