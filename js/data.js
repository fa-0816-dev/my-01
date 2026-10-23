/* ============================================
   数据层 - Mock DB (localStorage 持久化)
   包含种子数据：景点、游记、用户、评论、消息、打卡、收藏、浏览历史
   ============================================ */

const STORAGE_KEYS = {
    SPOTS: 'cg_spots',
    TRAVELS: 'cg_travels',
    USERS: 'cg_users',
    ADMINS: 'cg_admins',
    COMMENTS: 'cg_comments',
    MESSAGES: 'cg_messages',
    CHECKINS: 'cg_checkins',
    USER_FAV_SPOTS: 'cg_fav_spots',
    USER_FAV_TRAVELS: 'cg_fav_travels',
    USER_HISTORY: 'cg_history',
    LIKES: 'cg_likes',
    SETTINGS: 'cg_settings',
    HOME_BANNERS: 'cg_home_banners',   // 首页轮播图
    HERO_BANNER: 'cg_hero_banner',     // 首页标语横幅
    FRIENDS: 'cg_friends'              // 好友关系
};

/* ---------- 首页轮播图种子 ---------- */
const SEED_BANNERS = [
    { id: 1, title: '🏫 探索校园之美', subtitle: '发现身边的每一处风景，记录青春里的每一次打卡', bg: 'assets/images/1.png', sort: 1 },
    { id: 2, title: '🗺️ 校园地图导览', subtitle: '规划你的专属校园步行路线', bg: 'assets/images/2.png', sort: 2 },
    { id: 3, title: '📸 以图识景', subtitle: '上传照片智能识别校园景点', bg: 'assets/images/3.png', sort: 3 }
];

/* ---------- 首页 Hero 横幅种子 ---------- */
const SEED_HERO = {
    title: '探索属于你的校园',
    subtitle: '发现校园地标 · 记录游览足迹 · 分享精彩游记',
    bg: 'assets/images/4.png',
    bgImage: ''
};

/* ---------- 种子数据 ---------- */

const SEED_SPOTS = [
    { id: 1, name: '植物园', category: '学习场所', campus: '西园', lat: 28.13009, lng: 112.99138, icon: '🌿', hot: 89,
      description: '校园内植物标本园，适合认知植物、休闲散步。', image: 'assets/images/植物园.jpg',
      images: ['assets/images/植物园.jpg'], address: '西园', openTime: '08:00-18:00' },
    { id: 2, name: '图书馆东馆', category: '学习场所', campus: '东园', lat: 28.13265, lng: 112.99966, icon: '📚', hot: 486,
      description: '图书馆东馆，8层2.6万平方米，自习阅读核心区域，校园地标。', image: 'assets/images/图书馆东馆.png',
      images: ['assets/images/图书馆东馆.png'], address: '东园中心', openTime: '08:00-22:00' },
    { id: 3, name: '体育艺术馆', category: '运动场所', campus: '东园', lat: 28.13455, lng: 112.99962, icon: '🏟️', hot: 295,
      description: '体育馆，文体活动场所，含篮球、羽毛球、乒乓球场地。', image: 'assets/images/体育艺术馆.jpg',
      images: ['assets/images/体育艺术馆.jpg', 'assets/images/体育艺术馆.png'], address: '东园中心偏北', openTime: '06:00-22:00' },
    { id: 4, name: '图书馆西馆', category: '学习场所', campus: '西园', lat: 28.1312, lng: 112.98952, icon: '📚', hot: 198,
      description: '图书馆西馆，自习阅读区域，2019年重新开放。', image: 'assets/images/图书馆西馆.jpg',
      images: ['assets/images/图书馆西馆.jpg'], address: '西园北侧', openTime: '08:00-22:00' },
    { id: 5, name: '东门', category: '地标建筑', campus: '东园', lat: 28.13294, lng: 113.00192, icon: '🚪', hot: 378,
      description: '学校主出入口，位于韶山南路498号，气势恢宏。', image: 'assets/images/东门.jpg',
      images: ['assets/images/东门.jpg'], address: '长沙市天心区韶山南路498号', openTime: '全天开放' },
    { id: 6, name: '西门', category: '地标建筑', campus: '西园', lat: 28.1311, lng: 112.9876, icon: '🚪', hot: 145,
      description: '西区出入口，西园师生主要进出通道。', image: 'assets/images/西门.jpg',
      images: ['assets/images/西门.jpg'], address: '西园西侧', openTime: '全天开放' },
    { id: 7, name: '南门', category: '地标建筑', campus: '西园', lat: 28.12732, lng: 112.99059, icon: '🚪', hot: 132,
      description: '南区出入口，临近南侧运动场。', image: 'assets/images/南门.png',
      images: ['assets/images/南门.png'], address: '西园南侧', openTime: '全天开放' },
    { id: 8, name: '校医院', category: '配套服务', campus: '西园', lat: 28.1307, lng: 112.9939, icon: '🏥', hot: 98,
      description: '校内医疗服务点，为师生提供基础医疗保障。', image: 'assets/images/校医院.png',
      images: ['assets/images/校医院.png'], address: '西园南侧', openTime: '08:00-18:00' },
    { id: 9, name: '东园运动场', category: '运动场所', campus: '东园', lat: 28.13381, lng: 112.99536, icon: '🏃', hot: 234,
      description: '东区田径运动场，标准400米跑道、足球场。', image: 'assets/images/东园运动场.jpg',
      images: ['assets/images/东园运动场.jpg'], address: '东园北侧', openTime: '06:00-22:00' },
    { id: 10, name: '西园运动场', category: '运动场所', campus: '西园', lat: 28.12831, lng: 112.99202, icon: '🏃', hot: 198,
      description: '西区田径运动场，田径、足球活动场所。', image: 'assets/images/西园运动场.jpg',
      images: ['assets/images/西园运动场.jpg'], address: '西园南侧', openTime: '06:00-22:00' }
];

const SEED_USERS = [
    { id: 1, username: '张小明', studentId: '20230001', phone: '13800138001', password: '123456',
      email: 'zhangxm@campus.edu', avatar: '张', createTime: '2023-09-01', bio: '热爱校园探索的新生' },
    { id: 2, username: '李华', studentId: '20220012', phone: '13800138002', password: '123456',
      email: 'lihua@campus.edu', avatar: '李', createTime: '2022-09-01', bio: '资深校园攻略达人' },
    { id: 3, username: '王芳', studentId: '20210056', phone: '13800138003', password: '123456',
      email: 'wangfang@campus.edu', avatar: '王', createTime: '2021-09-01', bio: '考研党，每日打卡图书馆' },
    { id: 4, username: '赵强', studentId: '20200101', phone: '13800138004', password: '123456',
      email: 'zhaoqiang@campus.edu', avatar: '赵', createTime: '2020-09-01', bio: '篮球爱好者，体育艺术馆常客' }
];

const SEED_ADMINS = [
    { id: 1, username: 'admin', password: 'admin123', name: '超级管理员', role: 'super' },
    { id: 2, username: 'manager', password: 'manager123', name: '内容管理员', role: 'content' }
];

const SEED_TRAVELS = [
    { id: 1, userId: 2, title: '我的校园秘密角落 - 陶铸广场清晨打卡',
      content: '作为一个在林科大生活了两年的老鸟，我发现了许多人不知道的秘密角落。尤其是清晨的陶铸广场，薄雾缭绕，阳光透过树影洒在草坪上，简直美得像一幅画。推荐大家早上6点半去体验一下，运气好还能看到晨练的同学在那里打太极。',
      tags: ['校园风景', '晨打卡', '陶铸广场'], image: '🏞️', likes: 45, favorites: 12,
      status: 'approved', createTime: '2025-03-15 08:30' },
    { id: 2, userId: 3, title: '图书馆考研专区生存指南',
      content: '准备考研的同学们看过来！东园图书馆三楼西侧有个考研专区，座位需要预约但很安静。我来分享一下我在那里复习了半年的经验：最佳位置是靠窗的17-22号座位，光线好又不被打扰；建议早上8点准时到，晚了好位置就没了。另外，一楼的24小时自习室非常适合冲刺阶段！',
      tags: ['考研', '图书馆', '自习'], image: '📚', likes: 89, favorites: 34,
      status: 'approved', createTime: '2025-03-20 14:20' },
    { id: 3, userId: 4, title: '体育艺术馆篮球场地全攻略',
      content: '想在学校打篮球？先看看这个！体育艺术馆有2个室内篮球场和4个室外场，室内场周末需要提前预约，工作日下午基本有空。最推荐的是西侧的室外场，傍晚有夕阳，风景好而且人不多。对了，晚上8点之后去还能蹭到学长的友谊赛！',
      tags: ['篮球', '体育艺术馆', '运动'], image: '🏟️', likes: 67, favorites: 21,
      status: 'approved', createTime: '2025-03-22 18:00' },
    { id: 4, userId: 1, title: '新生必看！一周逛遍林科大校园地标',
      content: '刚入学的小萌新们，是不是还分不清东园西园？这篇游记带你一周逛遍林科大所有地标！Day1：长沙校区大门→树木楼→树人楼；Day2：图书馆→陶铸广场→崇德楼；Day3：体育艺术馆→东园食堂→神农楼...每天安排两个景点，轻松不累！',
      tags: ['新生指南', '校园导览', '地标'], image: '🚪', likes: 156, favorites: 67,
      status: 'approved', createTime: '2025-03-25 10:15' },
    { id: 5, userId: 2, title: '东园食堂美食地图 - 三层每一家都试过',
      content: '作为一个吃货，我把东园食堂三层每一个窗口都试吃了一遍！一楼推荐川味小炒和兰州拉面，性价比极高；二楼的麻辣香锅和盖浇饭是学生最爱；三楼的旋转小火锅每周三有特价，强烈推荐！',
      tags: ['美食', '食堂', '探店'], image: '🍱', likes: 203, favorites: 89,
      status: 'approved', createTime: '2025-03-28 12:30' },
    { id: 6, userId: 3, title: '求是楼开放日体验报告',
      content: '上周六参加了求是楼的开放日活动，参观了电子信息实验室和物理实验室。设备真的很先进，老师也讲解得很耐心。印象最深的是那个全息投影演示，太酷了！建议理工科的学弟学妹多关注这种活动。',
      tags: ['实验', '开放日', '理工'], image: '🔬', likes: 34, favorites: 8,
      status: 'approved', createTime: '2025-03-30 16:45' },

    // ============ 扩充游记：让每个标签 ≥ 2 篇 ============
    { id: 7, userId: 2, title: '校园秋景图鉴 - 这10个角落拍出来都是大片',
      content: '秋天的林科大真的太美了！银杏大道金黄一片，枫叶林层林尽染。我整理了10个最出片的地点：长沙校区大门大道、陶铸广场东侧、图书馆后庭、体育艺术馆外的梧桐林...每一处都值得停留半小时拍照，朋友圈九图根本发不完。',
      tags: ['校园风景', '地标', '陶铸广场'], image: '🍁', likes: 178, favorites: 56,
      status: 'approved', createTime: '2025-10-15 17:00' },
    { id: 8, userId: 1, title: '晨打卡第100天，我眼里的林科大晨景',
      content: '不知不觉已经坚持晨跑打卡100天了！每天6点起床，从宿舍出发绕陶铸广场跑一圈，再在图书馆门口做拉伸。这一百天里我看到了日出时最美的校园：广场草坪有薄雾、树上挂满露珠、偶尔还有早起的老爷爷在打太极。晨打卡真的会上瘾。',
      tags: ['晨打卡', '陶铸广场', '校园风景'], image: '🌅', likes: 92, favorites: 28,
      status: 'approved', createTime: '2025-09-20 07:15' },
    { id: 9, userId: 3, title: '考研自习室位置怎么抢？老学姐来支招',
      content: '考研期间自习室的位置真的太难抢了！除了图书馆，我整理了几个冷门但安静的自习好地方：树人楼的402教室（周末人特别少）、崇德楼旁边的小凉亭、求是楼一楼的走廊自习区...这些地方基本没人跟你抢，而且光线好、空调足。',
      tags: ['考研', '自习', '图书馆'], image: '📖', likes: 124, favorites: 45,
      status: 'approved', createTime: '2025-04-10 09:30' },
    { id: 10, userId: 4, title: '体育艺术馆健身区使用攻略',
      content: '除了打球，体育艺术馆二楼还有一个免费健身区！虽然器材不如外面的健身房新，但对学生来说完全够用，而且人很少。我一般下午5点去，练一个小时器械再打半小时篮球，浑身湿透特别爽。给大家推荐几个好用的器械：卧推架、高位下拉、跑步机。',
      tags: ['体育艺术馆', '运动', '篮球'], image: '🏋️', likes: 78, favorites: 19,
      status: 'approved', createTime: '2025-05-08 19:00' },
    { id: 11, userId: 1, title: '新生第一周必做的15件事',
      content: '开学第一周不知道干嘛？这份清单送给你！1. 领取校园卡并激活；2. 逛一圈林科大（用地图导航页规划路线）；3. 加3-5个感兴趣的社团；4. 认识你的辅导员和班助；5. 去东园食堂三层各吃一次；6. 图书馆办借阅证...',
      tags: ['新生指南', '校园导览', '地标'], image: '🎒', likes: 212, favorites: 98,
      status: 'approved', createTime: '2025-09-05 14:00' },
    { id: 12, userId: 2, title: '深夜食堂探店 - 校园里那些凌晨还开着的店',
      content: '期末复习到凌晨肚子饿了怎么办？别担心，校园里还有这些深夜食堂！东园食堂一楼西侧的小吃摊营业到凌晨2点，主打手抓饼和热粥；神农楼旁边的便利店24小时营业，关东煮和泡面是熬夜党的最爱；校外步行5分钟的烧烤摊...',
      tags: ['食堂', '探店', '美食'], image: '🌙', likes: 165, favorites: 72,
      status: 'approved', createTime: '2025-06-18 23:30' },
    { id: 13, userId: 3, title: '陶铸广场春游全攻略 - 野餐放风筝好地方',
      content: '春天到了，陶铸广场绝对是林科大里最适合春游的地方！我和室友上周六在广场草坪上野餐，吹着风筝，还有人在旁边弹吉他唱歌。带个野餐垫、买点水果零食就能度过完美的一下午。对了，下午4点左右日落的时候拍照最好看！',
      tags: ['陶铸广场', '校园风景', '地标'], image: '🧺', likes: 134, favorites: 41,
      status: 'approved', createTime: '2025-03-28 16:20' },
    { id: 14, userId: 4, title: '图书馆自习室对比评测 - 哪个最适合你',
      content: '图书馆这么大，到底哪个区域最适合自习？我花了一个月把东园图书馆每一层都体验了一遍：一楼24小时自习室（适合熬夜党）、二楼期刊区（安静适合看书）、三楼考研专区（氛围紧张适合冲刺）、四楼研讨室（适合小组讨论）...',
      tags: ['图书馆', '自习', '考研'], image: '📚', likes: 98, favorites: 37,
      status: 'approved', createTime: '2025-07-22 11:00' },
    { id: 15, userId: 2, title: '篮球新手入门 - 林科大篮球氛围太好了',
      content: '以前从来没打过篮球，上学期被朋友拉去体育艺术馆室外场打了一次就入坑了！现在每周固定打3次。校园里的篮球氛围真的好，周末场场都有人打，还会有学长组织3v3比赛。新手也不用怕，大家都很友好，会主动带你。',
      tags: ['篮球', '运动', '体育艺术馆'], image: '🏀', likes: 88, favorites: 24,
      status: 'approved', createTime: '2025-06-02 20:00' },
    { id: 16, userId: 1, title: '校园导览路线推荐 - 半日游轻松打卡所有地标',
      content: '如果只有半天时间逛林科大，这条路线最合理：长沙校区大门（拍照）→ 树木楼（看校徽）→ 树人楼（感受课堂）→ 图书馆（必须打卡）→ 陶铸广场（必看风景）→ 东园食堂（吃午饭）。全程步行约2小时，轻松不累，适合带家长或朋友参观。',
      tags: ['校园导览', '地标', '新生指南'], image: '🗺️', likes: 145, favorites: 61,
      status: 'approved', createTime: '2025-10-01 15:00' }
];

const SEED_COMMENTS = [
    { id: 1, userId: 1, targetId: 2, targetType: 'spot', content: '图书馆真的很棒，周末经常去！', time: '2025-04-01 10:00' },
    { id: 2, userId: 2, targetId: 2, targetType: 'spot', content: '三楼考研专区位置确实好，不过预约好麻烦', time: '2025-04-02 14:30' },
    { id: 3, userId: 3, targetId: 5, targetType: 'spot', content: '东门拍照超好看！', time: '2025-04-03 09:15' },
    { id: 4, userId: 2, targetId: 2, targetType: 'travel', content: '考研专区说得太对了，我也是在那里上岸的！', time: '2025-03-21 11:20' },
    { id: 5, userId: 4, targetId: 3, targetType: 'travel', content: '我每天都在室外场打球，确实舒服', time: '2025-03-23 19:00' },
    { id: 6, userId: 1, targetId: 4, targetType: 'travel', content: '好详细！刚入学真的很需要这种攻略', time: '2025-03-26 09:30' }
];

const SEED_CHECKINS = [
    { id: 1, userId: 1, spotId: 2, time: '2025-04-01 08:30' },  // 图书馆东馆
    { id: 2, userId: 1, spotId: 5, time: '2025-04-02 18:00' },  // 东门
    { id: 3, userId: 1, spotId: 3, time: '2025-04-03 12:00' },  // 体育艺术馆
    { id: 4, userId: 2, spotId: 2, time: '2025-04-01 09:00' },  // 图书馆东馆
    { id: 5, userId: 2, spotId: 4, time: '2025-04-02 06:30' },  // 图书馆西馆
    { id: 6, userId: 2, spotId: 5, time: '2025-04-03 10:00' },  // 东门
    { id: 7, userId: 3, spotId: 2, time: '2025-04-01 08:00' },  // 图书馆东馆
    { id: 8, userId: 3, spotId: 4, time: '2025-04-02 14:00' },  // 图书馆西馆
    { id: 9, userId: 4, spotId: 3, time: '2025-04-01 17:00' },  // 体育艺术馆
    { id: 10, userId: 4, spotId: 9, time: '2025-04-03 20:00' }  // 东园运动场
];

const SEED_FAV_SPOTS = [
    { userId: 1, spotId: 2 }, { userId: 1, spotId: 5 },        // 用户1: 图书馆东馆、东门
    { userId: 2, spotId: 2 }, { userId: 2, spotId: 4 }, { userId: 2, spotId: 5 },
    { userId: 3, spotId: 2 }, { userId: 3, spotId: 4 },
    { userId: 4, spotId: 3 }, { userId: 4, spotId: 9 }
];

const SEED_FAV_TRAVELS = [
    { userId: 1, travelId: 2 }, { userId: 1, travelId: 4 },
    { userId: 2, travelId: 1 }, { userId: 2, travelId: 5 },
    { userId: 3, travelId: 2 },
    { userId: 4, travelId: 3 }
];

const SEED_MESSAGES = [
    { id: 1, userId: 1, title: '游记审核通过', content: '恭喜！您发布的游记《新生必看！一周逛遍校园地标》已审核通过。',
      type: 'system', read: false, time: '2025-03-25 11:00' },
    { id: 2, userId: 3, title: '游记待审核', content: '您发布的游记《求是楼开放日体验报告》正在审核中，请耐心等待。',
      type: 'system', read: false, time: '2025-03-30 17:00' },
    { id: 3, userId: 2, title: '新评论提醒', content: '张小明 在您的游记《图书馆考研专区生存指南》下发表了新评论。',
      type: 'comment', read: true, time: '2025-03-21 11:30' },
    { id: 4, userId: 1, title: '为您推荐', content: '基于您的浏览记录，我们为您推荐了新的热门景点！',
      type: 'recommend', read: false, time: '2025-04-04 09:00' }
];

/* ---------- 敏感词库（模拟） ---------- */
const SENSITIVE_WORDS = ['作弊', '代考', '赌博', '毒品', '暴力', '色情'];

/* ---------- 数据库操作 API ---------- */

const DB = {
    // 初始化
    init() {
        // 种子数据版本号：变了就强制覆盖（解决旧数据残留问题）
        const SEED_VERSION = 'v10-spot-images-20261023';
        const VER_KEY = '__cg_seed_version__';
        const needReset = localStorage.getItem(VER_KEY) !== SEED_VERSION;

        const dataMap = {
            [STORAGE_KEYS.SPOTS]: SEED_SPOTS,
            [STORAGE_KEYS.USERS]: SEED_USERS,
            [STORAGE_KEYS.ADMINS]: SEED_ADMINS,
            [STORAGE_KEYS.TRAVELS]: SEED_TRAVELS,
            [STORAGE_KEYS.COMMENTS]: SEED_COMMENTS,
            [STORAGE_KEYS.MESSAGES]: SEED_MESSAGES,
            [STORAGE_KEYS.HOME_BANNERS]: SEED_BANNERS,
            [STORAGE_KEYS.HERO_BANNER]: SEED_HERO,
        };
        Object.entries(dataMap).forEach(([key, val]) => {
            if (needReset || !localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(val));
            }
        });
        // 这些用户产生的数据只在首次初始化，保留用户已有记录
        const userDataMap = {
            [STORAGE_KEYS.CHECKINS]: SEED_CHECKINS,
            [STORAGE_KEYS.USER_FAV_SPOTS]: SEED_FAV_SPOTS,
            [STORAGE_KEYS.USER_FAV_TRAVELS]: SEED_FAV_TRAVELS,
            [STORAGE_KEYS.USER_HISTORY]: [
                // 用户1 (新生) → 图书馆东馆、东门、体育艺术馆、植物园
                { userId: 1, spotId: 2, time: '2025-09-01 09:00' },
                { userId: 1, spotId: 5, time: '2025-09-01 10:00' },
                { userId: 1, spotId: 3, time: '2025-09-01 14:00' },
                { userId: 1, spotId: 9, time: '2025-09-02 08:00' },
                { userId: 1, spotId: 1, time: '2025-09-02 17:00' },
                { userId: 1, spotId: 6, time: '2025-09-03 12:00' },
                // 用户2 (攻略达人) → 两馆、三校门
                { userId: 2, spotId: 2, time: '2025-09-01 08:30' },
                { userId: 2, spotId: 4, time: '2025-09-01 09:00' },
                { userId: 2, spotId: 5, time: '2025-09-01 10:00' },
                { userId: 2, spotId: 7, time: '2025-09-01 14:00' },
                { userId: 2, spotId: 6, time: '2025-09-02 09:00' },
                { userId: 2, spotId: 3, time: '2025-09-02 10:00' },
                { userId: 2, spotId: 10, time: '2025-09-02 15:00' },
                // 用户3 (考研党) → 两图书馆、运动场
                { userId: 3, spotId: 2, time: '2025-09-01 07:30' },
                { userId: 3, spotId: 4, time: '2025-09-01 08:00' },
                { userId: 3, spotId: 9, time: '2025-09-01 12:00' },
                { userId: 3, spotId: 10, time: '2025-09-01 18:00' },
                { userId: 3, spotId: 1, time: '2025-09-02 08:00' },
                // 用户4 (篮球爱好者) → 体育艺术馆、运动场
                { userId: 4, spotId: 3, time: '2025-09-01 17:00' },
                { userId: 4, spotId: 9, time: '2025-09-01 18:00' },
                { userId: 4, spotId: 10, time: '2025-09-02 07:00' },
                { userId: 4, spotId: 5, time: '2025-09-02 18:00' },
                { userId: 4, spotId: 6, time: '2025-09-03 12:00' },
            ],
            [STORAGE_KEYS.LIKES]: [],
            [STORAGE_KEYS.SETTINGS]: { theme: 'light' },
            [STORAGE_KEYS.FRIENDS]: []
        };
        Object.entries(userDataMap).forEach(([key, val]) => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(val));
            }
        });

        if (needReset) {
            localStorage.setItem(VER_KEY, SEED_VERSION);
        }
    },

    // 通用 CRUD
    get(key) {
        try { return JSON.parse(localStorage.getItem(key)) || []; }
        catch { return []; }
    },

    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // 增
    add(key, item) {
        const data = this.get(key);
        const newItem = { ...item, id: (data.reduce((max, d) => Math.max(max, d.id || 0), 0) + 1) };
        data.push(newItem);
        this.set(key, data);
        return newItem;
    },

    // 删
    remove(key, id) {
        const data = this.get(key).filter(d => d.id !== id);
        this.set(key, data);
    },

    // 改
    update(key, id, updates) {
        const data = this.get(key).map(d => d.id === id ? { ...d, ...updates } : d);
        this.set(key, data);
    },

    // 查单个
    find(key, id) {
        return this.get(key).find(d => d.id === id);
    },

    // 重置全部数据
    reset() {
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        this.init();
    }
};

/* ---------- 数据查询便捷方法 ---------- */
const Query = {
    // 获取当前用户（localStorage 中的登录态）
    getCurrentUser() {
        const uid = localStorage.getItem('cg_current_user');
        if (!uid) return null;
        const users = DB.get(STORAGE_KEYS.USERS);
        return users.find(u => u.id === parseInt(uid));
    },

    isLoggedIn() { return !!localStorage.getItem('cg_current_user'); },

    isAdminLoggedIn() { return !!localStorage.getItem('cg_current_admin'); },

    getCurrentAdmin() {
        const aid = localStorage.getItem('cg_current_admin');
        if (!aid) return null;
        const admins = DB.get(STORAGE_KEYS.ADMINS);
        return admins.find(a => a.id === parseInt(aid));
    },

    getSpot(id) { return DB.find(STORAGE_KEYS.SPOTS, id); },
    getTravel(id) { return DB.find(STORAGE_KEYS.TRAVELS, id); },
    getUser(id) { return DB.find(STORAGE_KEYS.USERS, id); },

    // 获取用户打卡的所有景点ID
    getUserCheckinSpotIds(userId) {
        return DB.get(STORAGE_KEYS.CHECKINS)
            .filter(c => c.userId === userId)
            .map(c => c.spotId);
    },

    // 获取用户收藏的景点ID
    getUserFavSpotIds(userId) {
        return DB.get(STORAGE_KEYS.USER_FAV_SPOTS)
            .filter(f => f.userId === userId)
            .map(f => f.spotId);
    },

    // 获取用户收藏的游记ID
    getUserFavTravelIds(userId) {
        return DB.get(STORAGE_KEYS.USER_FAV_TRAVELS)
            .filter(f => f.userId === userId)
            .map(f => f.travelId);
    },

    // 获取用户浏览历史
    getUserHistory(userId) {
        return DB.get(STORAGE_KEYS.USER_HISTORY)
            .filter(h => h.userId === userId)
            .sort((a, b) => b.time.localeCompare(a.time))
            .slice(0, 20);
    },

    // 获取用户消息
    getUserMessages(userId) {
        return DB.get(STORAGE_KEYS.MESSAGES)
            .filter(m => m.userId === userId)
            .sort((a, b) => b.time.localeCompare(a.time));
    },

    // 获取景点评论
    getSpotComments(spotId) {
        return DB.get(STORAGE_KEYS.COMMENTS)
            .filter(c => c.targetId === spotId && c.targetType === 'spot')
            .sort((a, b) => b.time.localeCompare(a.time));
    },

    // 获取游记评论
    getTravelComments(travelId) {
        return DB.get(STORAGE_KEYS.COMMENTS)
            .filter(c => c.targetId === travelId && c.targetType === 'travel')
            .sort((a, b) => b.time.localeCompare(a.time));
    },

    // 浏览历史 - 添加一条
    addHistory(userId, spotId) {
        const history = DB.get(STORAGE_KEYS.USER_HISTORY);
        // 去重
        const filtered = history.filter(h => !(h.userId === userId && h.spotId === spotId));
        filtered.push({ userId, spotId, time: new Date().toLocaleString('zh-CN') });
        DB.set(STORAGE_KEYS.USER_HISTORY, filtered);
    },

    // 点赞/取消点赞
    toggleLike(userId, targetId, targetType) {
        const likes = DB.get(STORAGE_KEYS.LIKES);
        const existIdx = likes.findIndex(l => l.userId === userId && l.targetId === targetId && l.targetType === targetType);
        if (existIdx >= 0) {
            likes.splice(existIdx, 1);
            DB.set(STORAGE_KEYS.LIKES, likes);
            return false;
        } else {
            likes.push({ userId, targetId, targetType });
            DB.set(STORAGE_KEYS.LIKES, likes);
            return true;
        }
    },

    hasLiked(userId, targetId, targetType) {
        return DB.get(STORAGE_KEYS.LIKES)
            .some(l => l.userId === userId && l.targetId === targetId && l.targetType === targetType);
    }
};

// 初始化
DB.init();
