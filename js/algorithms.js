/* ============================================
   三大智能算法模块
   1. YOLOv8s 以图识景（模拟）
   2. TextRank 游记标签提取
   3. 基于用户的协同过滤推荐
   ============================================ */

const Algorithms = {

/* ---------- 算法 1：YOLOv8s 以图识景（模拟实现） ----------
   完整模拟深度学习目标检测流程：
   - 图像预处理：resize → normalize
   - 目标检测前向传播（模拟）
   - NMS 非极大值抑制
   - 置信度阈值过滤（0.7）
   - 数据库匹配
----------------------------------------------------- */
YOLOv8: {
    name: 'YOLOv8s 目标检测',
    description: '基于深度学习的实时目标检测算法',

    // 预处理：模拟图像预处理流程
    preprocess(imageData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    resized: true,
                    normalized: true,
                    tensorShape: '[1, 3, 640, 640]',
                    inputSize: 640
                });
            }, 300);
        });
    },

    // 目标检测（模拟前向推理）
    detect(preprocessedData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // 模拟检测出 3-5 个候选框
                const spots = DB.get(STORAGE_KEYS.SPOTS);
                const numDetections = 3 + Math.floor(Math.random() * 3);
                const detections = [];

                for (let i = 0; i < numDetections; i++) {
                    const spot = spots[Math.floor(Math.random() * spots.length)];
                    detections.push({
                        spotId: spot.id,
                        label: spot.name,
                        confidence: (0.55 + Math.random() * 0.44).toFixed(4), // 0.55 ~ 0.99
                        bbox: {
                            x: Math.floor(Math.random() * 300),
                            y: Math.floor(Math.random() * 200),
                            w: 150 + Math.floor(Math.random() * 100),
                            h: 120 + Math.floor(Math.random() * 80)
                        },
                        class: 'campus_spot'
                    });
                }

                resolve(detections);
            }, 600);
        });
    },

    // NMS 非极大值抑制 - 过滤重叠检测框
    nms(detections, iouThreshold = 0.45) {
        if (detections.length === 0) return [];

        // 按置信度降序排列
        const sorted = [...detections].sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence));
        const result = [];
        const suppressed = new Array(sorted.length).fill(false);

        for (let i = 0; i < sorted.length; i++) {
            if (suppressed[i]) continue;
            result.push(sorted[i]);

            for (let j = i + 1; j < sorted.length; j++) {
                if (suppressed[j]) continue;
                const iou = this.calculateIoU(sorted[i].bbox, sorted[j].bbox);
                if (iou > iouThreshold) {
                    suppressed[j] = true; // 抑制重叠框
                }
            }
        }
        return result;
    },

    // 计算两个边界框的 IoU
    calculateIoU(box1, box2) {
        const x1 = Math.max(box1.x, box2.x);
        const y1 = Math.max(box1.y, box2.y);
        const x2 = Math.min(box1.x + box1.w, box2.x + box2.w);
        const y2 = Math.min(box1.y + box1.h, box2.y + box2.h);

        const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
        const area1 = box1.w * box1.h;
        const area2 = box2.w * box2.h;
        const union = area1 + area2 - intersection;

        return union > 0 ? intersection / union : 0;
    },

    // 置信度阈值过滤（0.7）
    filterByConfidence(detections, threshold = 0.7) {
        return detections.filter(d => parseFloat(d.confidence) >= threshold);
    },

    // 匹配数据库景点档案
    matchDatabase(filteredDetections) {
        return filteredDetections.map(d => {
            const spot = Query.getSpot(d.spotId);
            return {
                ...d,
                spot
            };
        }).filter(d => d.spot);
    },

    // 完整识别流程
    async recognize(imageData) {
        const result = {
            algorithm: 'YOLOv8s',
            steps: [],
            success: false,
            matches: [],
            error: null
        };

        try {
            // Step 1: 图像预处理
            const preprocessed = await this.preprocess(imageData);
            result.steps.push({ step: 1, name: '图像预处理', detail: `resize→${preprocessed.inputSize}px, normalize→[0,1]` });

            // Step 2: 目标检测前向传播
            const rawDetections = await this.detect(preprocessed);
            result.steps.push({ step: 2, name: '目标检测', detail: `共检测到 ${rawDetections.length} 个候选框` });

            // Step 3: NMS 非极大值抑制
            const afterNMS = this.nms(rawDetections);
            result.steps.push({ step: 3, name: 'NMS去重', detail: `IoU阈值0.45, 保留 ${afterNMS.length} 个框` });

            // Step 4: 置信度过滤
            const filtered = this.filterByConfidence(afterNMS, 0.7);
            result.steps.push({ step: 4, name: '置信度过滤', detail: `阈值0.7, 高分框 ${filtered.length} 个` });

            // Step 5: 匹配数据库
            const matches = this.matchDatabase(filtered);
            result.steps.push({ step: 5, name: '数据库匹配', detail: `成功匹配 ${matches.length} 个校园景点` });

            result.matches = matches;
            result.success = matches.length > 0;

        } catch (e) {
            result.error = e.message;
        }

        return result;
    }
},


/* ---------- 算法 2：TextRank 游记关键词提取 ----------
   基于 TextRank 算法自动提取游记关键词作为标签：
   - jieba 风格分词（简化版）
   - 停用词过滤
   - 构建词共现图
   - 计算 PageRank 值
   - 输出 Top5 关键词
----------------------------------------------------- */
TextRank: {
    name: 'TextRank 关键词提取',
    description: '基于图模型的自动关键词提取算法',

    // 简化版中文分词（基于词典匹配）
    segment(text) {
        // 常见中文名词/动词词典（简化版jieba）
        const dict = new Set([
            '校园', '景点', '游记', '图书馆', '体育艺术馆', '东园食堂', '广场', '陶铸广场',
            '考研', '自习', '篮球', '足球', '美食', '推荐', '攻略', '指南',
            '学生', '老师', '同学', '学习', '生活', '活动', '中心', '大学',
            '打卡', '拍照', '风景', '地标', '建筑', '自然', '开放', '体验',
            '新生', '毕业', '宿舍', '课程', '实验', '研究', '社团', '比赛',
            '篮球', '羽毛球', '乒乓球', '健身', '跑步', '散步', '约会',
            '川味', '粤菜', '湘菜', '美食', '小吃', '火锅', '烧烤', '早餐',
            '秘密', '角落', '清晨', '傍晚', '夕阳', '日出', '美景', '网红',
            '图书馆', '陶铸广场', '神农楼', '崇德楼', '求是楼',
            '开放日', '考试', '复习', '作业', '论文', '答辩', '就业', '实习',
            '东区', '西区', '校区', '区域', '位置', '路线', '距离', '时间'
        ]);

        const tokens = [];
        let remaining = text;

        // 先尝试匹配词典中的长词
        dict.forEach(word => {
            if (remaining.includes(word)) {
                const regex = new RegExp(word, 'g');
                remaining = remaining.replace(regex, `|${word}|`);
            }
        });

        // 按 | 分割，再把剩余单字拼成2-gram
        const parts = remaining.split('|').filter(p => p.trim());
        parts.forEach(part => {
            if (dict.has(part)) {
                tokens.push(part);
            } else if (part.length >= 2) {
                // 双字切分
                for (let i = 0; i < part.length - 1; i++) {
                    tokens.push(part.substring(i, i + 2));
                }
            }
        });

        return tokens.filter(t => t.length >= 2);
    },

    // 停用词过滤
    filterStopWords(tokens) {
        const stopWords = new Set([
            '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
            '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有',
            '看', '好', '自己', '这', '那', '但', '而', '或', '与', '及', '被', '让',
            '把', '给', '从', '对', '为', '以', '于', '之', '其', '如', '等', '还',
            '又', '只', '再', '才', '已', '将', '并', '而', '个', '些', '每', '各',
            '这里', '那里', '这个', '那个', '这样', '那样', '什么', '怎么', '多少',
            '可以', '应该', '需要', '因为', '所以', '如果', '虽然', '但是', '然后',
            '其实', '当然', '可能', '大概', '一定', '真的', '非常', '特别', '比较'
        ]);
        return tokens.filter(t => !stopWords.has(t) && t.length >= 2);
    },

    // 构建词共现图 + PageRank
    extractKeywords(text, topN = 5) {
        // 1. 分词
        const tokens = this.segment(text);
        if (tokens.length === 0) return [];

        // 2. 停用词过滤
        const filtered = this.filterStopWords(tokens);
        if (filtered.length === 0) return [];

        // 3. 统计词频
        const freq = {};
        filtered.forEach(t => { freq[t] = (freq[t] || 0) + 1; });

        // 4. 构建共现图（窗口大小 = 5）
        const windowSize = 5;
        const cooccur = {};
        filtered.forEach((_, i) => {
            for (let j = i + 1; j < Math.min(i + windowSize + 1, filtered.length); j++) {
                const w1 = filtered[i], w2 = filtered[j];
                if (w1 !== w2) {
                    if (!cooccur[w1]) cooccur[w1] = {};
                    if (!cooccur[w2]) cooccur[w2] = {};
                    cooccur[w1][w2] = (cooccur[w1][w2] || 0) + 1;
                    cooccur[w2][w1] = (cooccur[w2][w1] || 0) + 1;
                }
            }
        });

        // 5. PageRank 迭代（简化版）
        const damping = 0.85;
        const maxIter = 50;
        const nodeSet = new Set(filtered);
        const words = [...nodeSet];
        const scores = {};
        words.forEach(w => { scores[w] = 1.0 / words.length; });

        for (let iter = 0; iter < maxIter; iter++) {
            const newScores = {};
            words.forEach(w => {
                let sum = 0;
                if (cooccur[w]) {
                    Object.keys(cooccur[w]).forEach(neighbor => {
                        const totalLinks = Object.keys(cooccur[neighbor] || {}).length || 1;
                        sum += (cooccur[w][neighbor] * scores[neighbor]) / totalLinks;
                    });
                }
                newScores[w] = (1 - damping) / words.length + damping * sum;
            });
            Object.assign(scores, newScores);
        }

        // 6. 按 PageRank 值排序取 Top N
        const ranked = words
            .map(w => ({ word: w, score: scores[w] || 0, freq: freq[w] || 0 }))
            .sort((a, b) => b.score - a.score);

        // 去重相似词
        const result = [];
        const usedWords = new Set();
        for (const item of ranked) {
            if (result.length >= topN) break;
            // 跳过已用词的子串
            if ([...usedWords].some(u => item.word.includes(u) || u.includes(item.word))) continue;
            usedWords.add(item.word);
            result.push(item);
        }

        return result;
    },

    // 完整提取流程（返回详细步骤）
    extractWithDetail(text, topN = 5) {
        const steps = [];
        steps.push({ step: 1, name: '中文分词', detail: `使用jieba风格分词, 得到 ${this.segment(text).length} 个候选词` });

        const filtered = this.filterStopWords(this.segment(text));
        steps.push({ step: 2, name: '停用词过滤', detail: `过滤后剩余 ${filtered.length} 个有效词` });

        const result = this.extractKeywords(text, topN);
        steps.push({ step: 3, name: 'TextRank图模型', detail: `PageRank迭代收敛, 输出Top${topN}` });

        return {
            algorithm: 'TextRank',
            tags: result.map(r => r.word),
            scores: result,
            steps,
            success: result.length > 0
        };
    }
},


/* ---------- 算法 3：基于用户的协同过滤推荐 ----------
   User-Based Collaborative Filtering：
   - 构建 0/1 用户-景点打卡/收藏矩阵
   - 皮尔逊相关系数计算用户相似度
   - 取 Top-10 相似邻居
   - 计算推荐得分（相似度加权平均）
   - 降序输出个性化推荐景点
----------------------------------------------------- */
CollaborativeFiltering: {
    name: 'User-Based CF 协同过滤',
    description: '基于用户相似度的个性化推荐算法',

    // 构建用户-景点交互矩阵
    // 权重：打卡=1.0, 收藏=1.0, 浏览=0.5（浏览行为弱但样本量大）
    buildUserSpotMatrix() {
        const users = DB.get(STORAGE_KEYS.USERS);
        const spots = DB.get(STORAGE_KEYS.SPOTS);
        const checkins = DB.get(STORAGE_KEYS.CHECKINS);
        const favSpots = DB.get(STORAGE_KEYS.USER_FAV_SPOTS);
        const history = DB.get(STORAGE_KEYS.USER_HISTORY);

        const matrix = {};
        users.forEach(u => {
            matrix[u.id] = {};
            spots.forEach(s => { matrix[u.id][s.id] = 0; });
        });

        // 浏览行为 → 0.5
        history.forEach(h => {
            if (matrix[h.userId] && matrix[h.userId][h.spotId] !== undefined) {
                matrix[h.userId][h.spotId] = Math.max(matrix[h.userId][h.spotId], 0.5);
            }
        });
        // 打卡行为 → 1.0
        checkins.forEach(c => {
            if (matrix[c.userId]) matrix[c.userId][c.spotId] = 1.0;
        });
        // 收藏行为 → 1.0（覆盖）
        favSpots.forEach(f => {
            if (matrix[f.userId]) matrix[f.userId][f.spotId] = 1.0;
        });

        return matrix;
    },

    // 皮尔逊相关系数
    pearsonSimilarity(vec1, vec2) {
        const keys = Object.keys(vec1);
        const n = keys.length;
        if (n === 0) return 0;

        let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;

        keys.forEach(k => {
            const v1 = vec1[k] || 0;
            const v2 = vec2[k] || 0;
            sum1 += v1;
            sum2 += v2;
            sum1Sq += v1 * v1;
            sum2Sq += v2 * v2;
            pSum += v1 * v2;
        });

        const num = pSum - (sum1 * sum2) / n;
        const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

        if (den === 0) return 0;
        return num / den;
    },

    // 获取 Top-K 相似用户
    getTopKNeighbors(userId, matrix, k = 10) {
        const similarities = [];
        const userVec = matrix[userId];
        if (!userVec) return [];

        Object.keys(matrix).forEach(otherId => {
            const oid = parseInt(otherId);
            if (oid !== userId) {
                const sim = this.pearsonSimilarity(userVec, matrix[otherId]);
                if (sim > 0) { // 只保留正相关
                    similarities.push({ userId: oid, similarity: sim });
                }
            }
        });

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, k);
    },

    // 计算推荐得分
    calculateRecommendation(userId, k = 10) {
        const matrix = this.buildUserSpotMatrix();
        const neighbors = this.getTopKNeighbors(userId, matrix, k);

        if (neighbors.length === 0) {
            // 没有相似邻居 → 热门推荐兜底
            const spots = DB.get(STORAGE_KEYS.SPOTS);
            return spots.sort((a, b) => b.hot - a.hot).slice(0, 4).map(s => ({
                spotId: s.id, score: s.hot / 100, reason: '热门推荐（无相似邻居）'
            }));
        }

        const userVec = matrix[userId];
        const spots = Object.keys(userVec);
        const scores = [];

        spots.forEach(spotId => {
            if (userVec[spotId] === 1) return; // 跳过已交互的

            let weightedSum = 0;
            let simSum = 0;

            neighbors.forEach(nb => {
                const nbSpotVal = matrix[nb.userId][spotId] || 0;
                if (nbSpotVal === 1) {
                    weightedSum += nb.similarity * nbSpotVal;
                    simSum += nb.similarity;
                }
            });

            if (simSum > 0) {
                scores.push({
                    spotId: parseInt(spotId),
                    score: parseFloat((weightedSum / simSum).toFixed(4)),
                    reason: `相似用户推荐（${neighbors.length}个邻居）`
                });
            }
        });

        return scores.sort((a, b) => b.score - a.score).slice(0, 6);
    },

    // 完整推荐（带详细步骤）
    recommend(userId, limit = 6) {
        const steps = [];
        steps.push({
            step: 1, name: '构建用户-景点矩阵',
            detail: '浏览=0.5, 打卡/收藏=1.0'
        });

        const matrix = this.buildUserSpotMatrix();
        const neighbors = this.getTopKNeighbors(userId, matrix, 10);

        // === 混合推荐：协同过滤 + 基于内容（类别偏好）===
        const spots = DB.get(STORAGE_KEYS.SPOTS);
        const userVec = matrix[userId] || {};
        const userInteracted = Object.entries(userVec).filter(([_, v]) => v > 0.01);

        // Step 2: 基于内容的类别偏好推荐
        let categoryRecs = [];
        let categoryCount = {};  // ← 提前声明，避免 undefined
        if (userInteracted.length > 0) {
            userInteracted.forEach(([spotId]) => {
                const spot = spots.find(s => s.id === parseInt(spotId));
                if (spot) categoryCount[spot.category] = (categoryCount[spot.category] || 0) + 1;
            });
            // 按类别热度排序
            const sortedCats = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
            // 推荐同类别但未交互过的景点
            sortedCats.forEach(([cat]) => {
                spots.filter(s => s.category === cat && !userVec[s.id])
                    .forEach(s => {
                        categoryRecs.push({
                            spotId: s.id,
                            score: (categoryCount[cat] || 1) * 0.1,  // 类别频率权重
                            reason: `你关注的「${cat}」类`
                        });
                    });
            });
            // 按分数去重排序取前 N
            const seen = new Set();
            categoryRecs = categoryRecs
                .sort((a, b) => b.score - a.score)
                .filter(r => { if (seen.has(r.spotId)) return false; seen.add(r.spotId); return true; })
                .slice(0, 8);
        }

        // Step 3: 协同过滤得分
        let cfRecs = [];
        if (neighbors.length > 0) {
            cfRecs = this.calculateRecommendation(userId, 10);
        }

        // Step 4: 混合打分（协同过滤权重 0.7，类别偏好 0.3）
        const merged = {};
        categoryRecs.forEach(r => { merged[r.spotId] = { ...r, score: r.score * 0.3 }; });
        cfRecs.forEach(r => {
            if (merged[r.spotId]) merged[r.spotId].score += r.score * 0.7;
            else merged[r.spotId] = { ...r, score: r.score * 0.7 };
        });

        let recommendations = Object.values(merged)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        // Step 5: 冷启动兜底（完全没交互 → 按类别均衡热门推荐）
        if (recommendations.length === 0) {
            // 从不同类别各取热门景点，确保多样性
            const categoryMap = {};
            spots.forEach(s => {
                if (!userVec[s.id]) {
                    if (!categoryMap[s.category]) categoryMap[s.category] = [];
                    categoryMap[s.category].push(s);
                }
            });
            const balanced = [];
            Object.values(categoryMap).forEach(list => {
                list.sort((a, b) => b.hot - a.hot);
                balanced.push(...list.slice(0, 2));  // 每类别取 2 个热门
            });
            recommendations = balanced.sort((a, b) => b.hot - a.hot)
                .slice(0, limit)
                .map(s => ({ spotId: s.id, score: s.hot / 100, reason: `热门「${s.category}」` }));
        }

        const finalSpots = recommendations.map(r => {
            const spot = spots.find(s => s.id === r.spotId);
            return { ...r, spot };
        }).filter(r => r.spot);

        return {
            algorithm: 'User-Based CF + Content Hybrid',
            userId,
            recommendations: finalSpots,
            steps: [
                { step: 1, name: '交互矩阵构建', detail: `用户${userId}有${userInteracted.length}条交互` },
                { step: 2, name: '协同过滤', detail: neighbors.length > 0 ? `找到${neighbors.length}个相似邻居` : '无相似邻居（冷启动）' },
                { step: 3, name: '类别偏好分析', detail: `用户偏好类别数 ${Object.keys(categoryCount || {}).length}` },
                { step: 4, name: '混合打分输出', detail: `CF权重0.7 + 内容权重0.3, 共${finalSpots.length}条推荐` }
            ],
            neighbors,
            categoryRecs
        };
    }
},

/* ---------- 敏感词检测 ---------- */
SensitiveWord: {
    check(text) {
        const found = [];
        SENSITIVE_WORDS.forEach(word => {
            if (text.includes(word)) found.push(word);
        });
        return {
            hasSensitive: found.length > 0,
            words: found,
            message: found.length > 0
                ? `检测到敏感词: ${found.join(', ')}，请修改后再提交`
                : '未检测到敏感词'
        };
    }
}

}; // end Algorithms
