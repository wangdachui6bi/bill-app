import type { BillType } from '../types';
import { DEFAULT_CATEGORIES } from './categories';

interface ParsedBill {
  amount: number;
  type: BillType;
  categoryId: string;
  note: string;
  confidence: number;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'food': ['吃饭', '餐', '饭', '菜', '炒', '火锅', '烧烤', '麻辣烫', '外卖', '食堂', '小吃'],
  'food-breakfast': ['早餐', '早饭', '早点', '包子', '豆浆', '油条', '煎饼'],
  'food-lunch': ['午餐', '午饭', '中餐', '中饭'],
  'food-dinner': ['晚餐', '晚饭', '夜宵', '宵夜'],
  'food-snack': ['零食', '薯片', '饼干', '糖果', '巧克力', '坚果', '蛋糕', '面包', '甜点'],
  'food-drink': ['奶茶', '咖啡', '饮料', '可乐', '果汁', '茶', '星巴克', '瑞幸', '蜜雪'],
  'food-fruit': ['水果', '苹果', '香蕉', '橙子', '葡萄', '西瓜', '草莓', '樱桃'],

  'transport': ['交通', '出行'],
  'transport-bus': ['公交', '地铁', '公交卡', '地铁卡'],
  'transport-taxi': ['打车', '滴滴', '出租车', '的士', '网约车', '快车', '专车'],
  'transport-train': ['火车', '高铁', '动车', '火车票', '12306'],
  'transport-plane': ['飞机', '机票', '航班'],
  'transport-fuel': ['加油', '油费', '汽油', '加油站', '充电桩'],

  'shopping': ['购物', '买东西', '超市'],
  'shopping-clothes': ['衣服', '裤子', '鞋', '帽子', '外套', '裙子', '内衣', '袜子', 'T恤'],
  'shopping-digital': ['手机', '电脑', '平板', 'iPad', 'ipad', '耳机', '键盘', '鼠标', '数码', '电子', '充电器', '数据线'],
  'shopping-daily': ['日用', '纸巾', '洗衣液', '牙膏', '牙刷', '沐浴露', '洗发水', '垃圾袋'],
  'shopping-cosmetics': ['化妆品', '口红', '面膜', '护肤', '精华', '防晒', '美妆', '染发', '头饰'],

  'housing': ['居住'],
  'housing-rent': ['房租', '租房', '租金'],
  'housing-mortgage': ['房贷', '按揭', '月供'],
  'housing-property': ['物业', '物业费'],
  'housing-water': ['水费'],
  'housing-electric': ['电费', '电力'],
  'housing-gas': ['燃气', '煤气', '天然气'],

  'entertainment': ['娱乐', '玩'],
  'entertainment-movie': ['电影', '影院', '电影票'],
  'entertainment-game': ['游戏', '充值', '皮肤', '会员'],
  'entertainment-sport': ['运动', '健身', '游泳', '跑步', '篮球', '羽毛球', '乒乓球'],
  'entertainment-travel': ['旅游', '旅行', '景区', '门票', '酒店', '民宿', '住宿'],

  'health': ['医疗', '看病'],
  'health-medicine': ['药', '药品', '药店', '感冒药', '止痛药'],
  'health-hospital': ['医院', '就医', '挂号', '体检', '看病', '诊所'],

  'education': ['教育', '学习'],
  'education-book': ['书', '教材', '书籍', '图书'],
  'education-course': ['课程', '培训', '网课', '学费', '补课'],

  'social': ['社交'],
  'social-gift': ['礼物', '生日', '送礼', '结婚', '随礼', '份子钱'],
  'social-dinner': ['请客', '聚餐', '聚会'],
  'social-redpacket': ['红包', '微信红包', '压岁钱'],

  'family': ['家庭', '家人'],
  'family-parents': ['孝敬', '父母', '爸妈', '爸', '妈', '长辈', '家里', '给家'],
  'family-kids': ['孩子', '儿子', '女儿', '幼儿园', '辅导班'],
  'family-pet': ['宠物', '猫粮', '狗粮', '猫', '狗', '宠物医院'],

  'love': ['恋爱', '对象', '男朋友', '女朋友', '男友', '女友', '老公', '老婆', '另一半'],
  'love-date': ['约会', '吃大餐', '烛光晚餐', '情侣', '两人', '一起吃', '约饭'],
  'love-gift': ['送女朋友', '送男朋友', '送对象', '给女朋友', '给男朋友', '给对象', '情人节', '七夕', '生日礼物', '圣诞礼物'],
  'love-flower': ['花', '鲜花', '玫瑰', '花束', '花店'],
  'love-movie': ['和对象看电影', '情侣电影', '一起看电影', '约看电影'],
  'love-hotel': ['开房', '酒店', '情侣酒店', '住酒店', '钟点房'],
  'love-anniversary': ['纪念日', '周年', '一百天', '结婚纪念', '恋爱纪念'],
  'love-dessert': ['甜品', '蛋糕店', '甜点', '冰淇淋', '下午茶'],
  'love-photo': ['拍照', '写真', '情侣照', '婚纱照', '证件照'],

  'beauty': ['丽人', '美容'],
  'beauty-hair': ['美发', '理发', '剪头发', '烫头', '染头', '做头发', '发型'],
  'beauty-nail': ['美甲', '指甲', '做指甲'],
  'beauty-spa': ['SPA', 'spa', '按摩', '足浴', '推拿', '桑拿', '泡澡'],
  'beauty-skincare': ['护肤品', '面霜', '乳液', '爽肤水', '眼霜'],

  'communication': ['话费', '流量', '宽带', '网费', '手机费', '电话费'],

  'car': ['汽车', '车'],
  'car-parking': ['停车', '停车费', '车位'],
  'car-maintain': ['保养', '维修', '修车', '换轮胎', '4S店'],
  'car-insurance': ['车险', '车保'],
  'car-wash': ['洗车'],

  'baby': ['母婴', '宝宝', '婴儿'],
  'baby-milk': ['奶粉', '辅食'],
  'baby-diaper': ['尿布', '尿不湿', '纸尿裤'],
  'baby-toy': ['玩具', '积木', '乐高'],

  'insurance': ['保险', '社保', '医保', '商业保险', '意外险', '重疾险'],
  'loan': ['借还款'],
  'loan-repay': ['还贷', '还款', '还学贷', '还房贷', '还车贷', '助学贷', '学贷'],
  'loan-credit': ['还信用卡', '信用卡', '花呗', '白条', '还花呗', '还白条'],
  'loan-lend': ['借出', '借给', '借钱'],

  'other-expense': ['其他'],

  'salary': ['工资', '薪资', '薪水', '月薪'],
  'bonus': ['奖金', '年终奖', '绩效', '提成'],
  'investment': ['理财', '利息', '收益', '股票', '基金', '分红'],
  'parttime': ['兼职', '副业', '外快', '私活'],
  'redpacket-income': ['收红包', '收到红包'],
  'reimburse': ['报销'],
  'other-income': ['其他收入', '退款'],
};

const INCOME_KEYWORDS = ['工资', '薪资', '收入', '奖金', '报销', '退款', '收到', '理财收益', '利息', '兼职', '副业', '分红', '转入'];

function extractAmount(text: string): number | null {
  const patterns = [
    /(\d+(?:\.\d{1,2})?)\s*[元块圆¥￥]/,
    /[¥￥]\s*(\d+(?:\.\d{1,2})?)/,
    /花了?\s*(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)\s*(?:块|元)/,
    /(\d+(?:\.\d{1,2})?)$/,
    /(\d+(?:\.\d{1,2})?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      if (amount > 0 && amount < 10000000) return amount;
    }
  }
  return null;
}

function detectType(text: string): BillType {
  for (const keyword of INCOME_KEYWORDS) {
    if (text.includes(keyword)) return 'income';
  }
  return 'expense';
}

function matchCategory(text: string, type: BillType): { categoryId: string; confidence: number } {
  let bestMatch = { categoryId: type === 'expense' ? 'other-expense' : 'other-income', confidence: 0 };

  const lowerText = text.toLowerCase();

  // Prioritize child categories (more specific) over parent categories
  const childCategories = DEFAULT_CATEGORIES.filter(c => c.type === type && c.parentId);
  const parentOnlyCategories = DEFAULT_CATEGORIES.filter(c => c.type === type && !c.parentId);

  for (const cat of childCategories) {
    const keywords = CATEGORY_KEYWORDS[cat.id] || [];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        const confidence = keyword.length / text.length + 0.5;
        if (confidence > bestMatch.confidence) {
          bestMatch = { categoryId: cat.id, confidence: Math.min(confidence, 1) };
        }
      }
    }
  }

  if (bestMatch.confidence < 0.3) {
    for (const cat of parentOnlyCategories) {
      const keywords = CATEGORY_KEYWORDS[cat.id] || [];
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          const confidence = keyword.length / text.length + 0.3;
          if (confidence > bestMatch.confidence) {
            bestMatch = { categoryId: cat.id, confidence: Math.min(confidence, 0.8) };
          }
        }
      }
    }
  }

  return bestMatch;
}

export function parseBillText(text: string): ParsedBill | null {
  const amount = extractAmount(text);
  if (!amount) return null;

  const type = detectType(text);
  const { categoryId, confidence } = matchCategory(text, type);
  const note = text.replace(/[¥￥]\s*\d+(?:\.\d{1,2})?/, '').replace(/\d+(?:\.\d{1,2})?\s*[元块圆¥￥]?/, '').trim() || text;

  return {
    amount,
    type,
    categoryId,
    note: note.substring(0, 50),
    confidence,
  };
}
