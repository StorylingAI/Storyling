/**
 * HSK Level Mapping for Chinese Words
 * 
 * HSK (Hanyu Shuiping Kaoshi) is the standardized Chinese proficiency test.
 * Levels range from 1 (beginner) to 6 (advanced).
 * 
 * This is a simplified mapping of common words. In production, this would be
 * a comprehensive database or API integration.
 */

export interface WordFrequency {
  hskLevel: number | null;
  frequency: 'very_common' | 'common' | 'uncommon' | 'rare';
  rank?: number; // Word frequency rank (lower = more common)
}

// Sample HSK level mappings (simplified for demonstration)
const HSK_MAPPINGS: Record<string, number> = {
  // HSK 1 (150 words) - Most basic
  '你': 1, '好': 1, '我': 1, '是': 1, '的': 1, '吗': 1, '呢': 1,
  '不': 1, '会': 1, '在': 1, '有': 1, '人': 1, '他': 1, '她': 1,
  '们': 1, '这': 1, '那': 1, '什么': 1, '谁': 1, '哪': 1, '里': 1,
  '几': 1, '多': 1, '少': 1, '大': 1, '小': 1, '一': 1, '二': 1,
  '三': 1, '四': 1, '五': 1, '六': 1, '七': 1, '八': 1, '九': 1,
  '十': 1, '个': 1, '岁': 1, '本': 1, '块': 1, '钱': 1, '点': 1,
  '分': 1, '天': 1, '年': 1, '月': 1, '日': 1, '号': 1, '星期': 1,
  '今天': 1, '明天': 1, '昨天': 1, '上': 1, '下': 1, '前': 1, '后': 1,
  '左': 1, '右': 1, '中': 1, '外': 1, '东': 1, '西': 1,
  '南': 1, '北': 1, '爱': 1, '吃': 1, '喝': 1, '看': 1, '听': 1,
  '说': 1, '读': 1, '写': 1, '买': 1, '卖': 1, '来': 1, '去': 1,
  '坐': 1, '站': 1, '走': 1, '跑': 1, '飞': 1, '开': 1, '关': 1,
  '打': 1, '做': 1, '叫': 1, '想': 1, '认识': 1, '知道': 1, '学习': 1,
  '工作': 1, '休息': 1, '睡觉': 1, '起床': 1, '吃饭': 1, '喝水': 1,
  '看书': 1, '看电视': 1, '听音乐': 1, '打电话': 1, '上网': 1,
  '新': 1, '旧': 1, '老': 1, '年轻': 1, '高': 1, '矮': 1, '长': 1, '短': 1,
  '胖': 1, '瘦': 1, '漂亮': 1, '好看': 1, '难看': 1, '干净': 1, '脏': 1,
  '快': 1, '慢': 1, '早': 1, '晚': 1, '忙': 1, '闲': 1, '对': 1, '错': 1,
  '好吃': 1, '难吃': 1, '好喝': 1, '难喝': 1, '冷': 1, '热': 1, '暖和': 1,
  '凉快': 1, '舒服': 1, '难受': 1, '高兴': 1, '不高兴': 1,
  
  // HSK 2 (300 words) - Elementary
  '但是': 2, '所以': 2, '因为': 2, '如果': 2, '虽然': 2, '还是': 2,
  '已经': 2, '正在': 2, '刚才': 2, '马上': 2, '一直': 2, '总是': 2,
  '常常': 2, '有时候': 2, '每天': 2, '每次': 2, '第一': 2, '最后': 2,
  '开始': 2, '结束': 2, '帮助': 2, '告诉': 2, '问': 2, '回答': 2,
  '介绍': 2, '欢迎': 2, '谢谢': 2, '对不起': 2, '没关系': 2, '再见': 2,
  '快乐': 2, '生气': 2, '难过': 2, '累': 2, '饿': 2,
  '渴': 2, '健康': 2, '生病': 2,
  '医院': 2, '医生': 2, '药': 2, '感冒': 2, '发烧': 2, '头疼': 2,
  '公司': 2, '办公室': 2, '老师': 2, '学生': 2, '同学': 2, '朋友': 2,
  '家人': 2, '爸爸': 2, '妈妈': 2, '哥哥': 2, '姐姐': 2, '弟弟': 2,
  '妹妹': 2, '儿子': 2, '女儿': 2, '丈夫': 2, '妻子': 2,
  
  // HSK 3 (600 words) - Intermediate
  '开会': 3, '接受': 3, '一亿': 3, '存钱': 3, '赚钱': 3, '花钱': 3,
  '借钱': 3, '还钱': 3, '付钱': 3, '价格': 3, '便宜': 3, '贵': 3,
  '打折': 3, '优惠': 3, '购物': 3, '商店': 3, '超市': 3, '市场': 3,
  '银行': 3, '邮局': 3, '机场': 3, '火车站': 3, '地铁': 3, '公交车': 3,
  '出租车': 3, '飞机': 3, '火车': 3, '汽车': 3, '自行车': 3,
  '交通': 3, '路': 3, '街': 3, '桥': 3, '楼': 3, '层': 3,
  '房间': 3, '客厅': 3, '卧室': 3, '厨房': 3, '卫生间': 3, '阳台': 3,
  '门': 3, '窗户': 3, '墙': 3, '地板': 3, '天花板': 3,
  '家具': 3, '桌子': 3, '椅子': 3, '床': 3, '沙发': 3, '柜子': 3,
  '电视': 3, '电脑': 3, '手机': 3, '相机': 3, '冰箱': 3, '洗衣机': 3,
  '空调': 3, '风扇': 3, '灯': 3, '钟': 3, '镜子': 3,
  
  // HSK 4 (1200 words) - Upper Intermediate
  '由于': 4, '关于': 4, '对于': 4, '至于': 4, '无论': 4,
  '不管': 4, '即使': 4, '尽管': 4, '然而': 4, '而且': 4, '并且': 4,
  '况且': 4, '何况': 4, '否则': 4, '不然': 4, '要不': 4, '要么': 4,
  '或者': 4, '与其': 4, '宁可': 4, '宁愿': 4, '反而': 4,
  '相反': 4, '反之': 4, '总之': 4, '总而言之': 4, '简而言之': 4,
  '换句话说': 4, '也就是说': 4, '比如': 4, '例如': 4, '比方说': 4,
  '首先': 4, '其次': 4, '然后': 4, '接着': 4, '终于': 4,
  '突然': 4, '忽然': 4, '立刻': 4, '立即': 4, '赶快': 4,
  '赶紧': 4, '尽快': 4, '尽量': 4, '尽力': 4, '努力': 4, '加油': 4,
  
  // HSK 5 (2500 words) - Advanced
  '基于': 5, '依据': 5, '按照': 5, '通过': 5,
  '经过': 5, '经由': 5, '借助': 5, '凭借': 5, '依靠': 5, '依赖': 5,
  '取决于': 5, '在于': 5, '关键在于': 5, '问题在于': 5, '难点在于': 5,
  '重点在于': 5, '着重': 5, '侧重': 5, '强调': 5, '突出': 5, '凸显': 5,
  '体现': 5, '反映': 5, '表明': 5, '说明': 5, '证明': 5, '表示': 5,
  '显示': 5, '展示': 5, '呈现': 5, '表现': 5, '展现': 5, '显现': 5,
  
  // HSK 6 (5000+ words) - Mastery
  '鉴于': 6, '诸如': 6, '倘若': 6, '假使': 6, '假如': 6, '倘使': 6,
  '若是': 6, '要是': 6, '万一': 6, '一旦': 6, '只要': 6, '只有': 6,
  '除非': 6, '除了': 6, '除此之外': 6, '此外': 6, '另外': 6, '再者': 6,
  '与此同时': 6,
};

/**
 * Get HSK level and frequency information for a Chinese word
 */
export function getWordFrequency(word: string): WordFrequency {
  const hskLevel = HSK_MAPPINGS[word] || null;
  
  // Determine frequency based on HSK level
  let frequency: WordFrequency['frequency'];
  if (hskLevel === null) {
    frequency = 'rare';
  } else if (hskLevel <= 2) {
    frequency = 'very_common';
  } else if (hskLevel <= 4) {
    frequency = 'common';
  } else {
    frequency = 'uncommon';
  }
  
  return {
    hskLevel,
    frequency,
  };
}

/**
 * Get HSK level label for display
 */
export function getHSKLabel(level: number | null): string {
  if (level === null) return 'Not in HSK';
  return `HSK ${level}`;
}

/**
 * Get frequency label for display
 */
export function getFrequencyLabel(frequency: WordFrequency['frequency']): string {
  const labels = {
    very_common: 'Very Common',
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
  };
  return labels[frequency];
}

/**
 * Get badge color for HSK level
 */
export function getHSKBadgeColor(level: number | null): string {
  if (level === null) return 'gray';
  if (level <= 2) return 'green';
  if (level <= 4) return 'yellow';
  return 'red';
}

/**
 * Get badge color for frequency
 */
export function getFrequencyBadgeColor(frequency: WordFrequency['frequency']): string {
  const colors = {
    very_common: 'green',
    common: 'blue',
    uncommon: 'yellow',
    rare: 'red',
  };
  return colors[frequency];
}
