import type { Category, BillType } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: 'food', name: '餐饮', icon: '🍜', color: '#FF6B6B', type: 'expense' },
  { id: 'food-breakfast', name: '早餐', icon: '🥐', color: '#FF6B6B', type: 'expense', parentId: 'food' },
  { id: 'food-lunch', name: '午餐', icon: '🍱', color: '#FF6B6B', type: 'expense', parentId: 'food' },
  { id: 'food-dinner', name: '晚餐', icon: '🍲', color: '#FF6B6B', type: 'expense', parentId: 'food' },
  { id: 'food-snack', name: '零食', icon: '🍿', color: '#FF6B6B', type: 'expense', parentId: 'food' },
  { id: 'food-drink', name: '饮料', icon: '🧋', color: '#FF6B6B', type: 'expense', parentId: 'food' },
  { id: 'food-fruit', name: '水果', icon: '🍎', color: '#FF6B6B', type: 'expense', parentId: 'food' },

  { id: 'transport', name: '交通', icon: '🚗', color: '#4ECDC4', type: 'expense' },
  { id: 'transport-bus', name: '公交地铁', icon: '🚇', color: '#4ECDC4', type: 'expense', parentId: 'transport' },
  { id: 'transport-taxi', name: '打车', icon: '🚕', color: '#4ECDC4', type: 'expense', parentId: 'transport' },
  { id: 'transport-train', name: '火车', icon: '🚄', color: '#4ECDC4', type: 'expense', parentId: 'transport' },
  { id: 'transport-plane', name: '飞机', icon: '✈️', color: '#4ECDC4', type: 'expense', parentId: 'transport' },
  { id: 'transport-fuel', name: '加油', icon: '⛽', color: '#4ECDC4', type: 'expense', parentId: 'transport' },

  { id: 'shopping', name: '购物', icon: '🛍️', color: '#FF9F43', type: 'expense' },
  { id: 'shopping-clothes', name: '衣服', icon: '👗', color: '#FF9F43', type: 'expense', parentId: 'shopping' },
  { id: 'shopping-digital', name: '数码', icon: '📱', color: '#FF9F43', type: 'expense', parentId: 'shopping' },
  { id: 'shopping-daily', name: '日用品', icon: '🧴', color: '#FF9F43', type: 'expense', parentId: 'shopping' },
  { id: 'shopping-cosmetics', name: '美妆', icon: '💄', color: '#FF9F43', type: 'expense', parentId: 'shopping' },

  { id: 'housing', name: '居住', icon: '🏠', color: '#6C5CE7', type: 'expense' },
  { id: 'housing-rent', name: '房租', icon: '🏘️', color: '#6C5CE7', type: 'expense', parentId: 'housing' },
  { id: 'housing-mortgage', name: '房贷', icon: '🏦', color: '#6C5CE7', type: 'expense', parentId: 'housing' },
  { id: 'housing-property', name: '物业费', icon: '🔑', color: '#6C5CE7', type: 'expense', parentId: 'housing' },
  { id: 'housing-water', name: '水费', icon: '💧', color: '#6C5CE7', type: 'expense', parentId: 'housing' },
  { id: 'housing-electric', name: '电费', icon: '⚡', color: '#6C5CE7', type: 'expense', parentId: 'housing' },
  { id: 'housing-gas', name: '燃气费', icon: '🔥', color: '#6C5CE7', type: 'expense', parentId: 'housing' },

  { id: 'entertainment', name: '娱乐', icon: '🎮', color: '#A29BFE', type: 'expense' },
  { id: 'entertainment-movie', name: '电影', icon: '🎬', color: '#A29BFE', type: 'expense', parentId: 'entertainment' },
  { id: 'entertainment-game', name: '游戏', icon: '🎮', color: '#A29BFE', type: 'expense', parentId: 'entertainment' },
  { id: 'entertainment-sport', name: '运动', icon: '⚽', color: '#A29BFE', type: 'expense', parentId: 'entertainment' },
  { id: 'entertainment-travel', name: '旅行', icon: '🏖️', color: '#A29BFE', type: 'expense', parentId: 'entertainment' },

  { id: 'health', name: '医疗', icon: '🏥', color: '#00B894', type: 'expense' },
  { id: 'health-medicine', name: '药品', icon: '💊', color: '#00B894', type: 'expense', parentId: 'health' },
  { id: 'health-hospital', name: '就医', icon: '🩺', color: '#00B894', type: 'expense', parentId: 'health' },

  { id: 'education', name: '教育', icon: '📚', color: '#0984E3', type: 'expense' },
  { id: 'education-book', name: '书籍', icon: '📖', color: '#0984E3', type: 'expense', parentId: 'education' },
  { id: 'education-course', name: '课程', icon: '🎓', color: '#0984E3', type: 'expense', parentId: 'education' },

  { id: 'social', name: '社交', icon: '🤝', color: '#E17055', type: 'expense' },
  { id: 'social-gift', name: '礼物', icon: '🎁', color: '#E17055', type: 'expense', parentId: 'social' },
  { id: 'social-dinner', name: '请客', icon: '🍻', color: '#E17055', type: 'expense', parentId: 'social' },
  { id: 'social-redpacket', name: '红包', icon: '🧧', color: '#E17055', type: 'expense', parentId: 'social' },

  { id: 'family', name: '家庭', icon: '👨‍👩‍👧', color: '#FDCB6E', type: 'expense' },
  { id: 'family-parents', name: '孝敬长辈', icon: '🧓', color: '#FDCB6E', type: 'expense', parentId: 'family' },
  { id: 'family-kids', name: '子女教育', icon: '👶', color: '#FDCB6E', type: 'expense', parentId: 'family' },
  { id: 'family-pet', name: '宠物', icon: '🐾', color: '#FDCB6E', type: 'expense', parentId: 'family' },

  { id: 'love', name: '恋爱', icon: '💕', color: '#FF6B81', type: 'expense' },
  { id: 'love-date', name: '约会', icon: '🥂', color: '#FF6B81', type: 'expense', parentId: 'love' },
  { id: 'love-gift', name: '送礼物', icon: '🎁', color: '#FF6B81', type: 'expense', parentId: 'love' },
  { id: 'love-flower', name: '鲜花', icon: '💐', color: '#FF6B81', type: 'expense', parentId: 'love' },
  { id: 'love-movie', name: '看电影', icon: '🎬', color: '#FF6B81', type: 'expense', parentId: 'love' },
  { id: 'love-hotel', name: '酒店', icon: '🏨', color: '#FF6B81', type: 'expense', parentId: 'love' },
  { id: 'love-anniversary', name: '纪念日', icon: '💍', color: '#FF6B81', type: 'expense', parentId: 'love' },
  { id: 'love-dessert', name: '甜品', icon: '🍰', color: '#FF6B81', type: 'expense', parentId: 'love' },
  { id: 'love-photo', name: '拍照写真', icon: '📸', color: '#FF6B81', type: 'expense', parentId: 'love' },

  { id: 'beauty', name: '丽人', icon: '💅', color: '#FD79A8', type: 'expense' },
  { id: 'beauty-hair', name: '美发', icon: '💇', color: '#FD79A8', type: 'expense', parentId: 'beauty' },
  { id: 'beauty-nail', name: '美甲', icon: '💅', color: '#FD79A8', type: 'expense', parentId: 'beauty' },
  { id: 'beauty-spa', name: 'SPA', icon: '🧖', color: '#FD79A8', type: 'expense', parentId: 'beauty' },
  { id: 'beauty-skincare', name: '护肤', icon: '🧴', color: '#FD79A8', type: 'expense', parentId: 'beauty' },

  { id: 'communication', name: '通讯', icon: '📱', color: '#74B9FF', type: 'expense' },

  { id: 'car', name: '汽车', icon: '🚘', color: '#636E72', type: 'expense' },
  { id: 'car-parking', name: '停车费', icon: '🅿️', color: '#636E72', type: 'expense', parentId: 'car' },
  { id: 'car-maintain', name: '保养维修', icon: '🔧', color: '#636E72', type: 'expense', parentId: 'car' },
  { id: 'car-insurance', name: '车险', icon: '🛡️', color: '#636E72', type: 'expense', parentId: 'car' },
  { id: 'car-wash', name: '洗车', icon: '🧽', color: '#636E72', type: 'expense', parentId: 'car' },

  { id: 'baby', name: '母婴', icon: '🍼', color: '#FAB1A0', type: 'expense' },
  { id: 'baby-milk', name: '奶粉', icon: '🍼', color: '#FAB1A0', type: 'expense', parentId: 'baby' },
  { id: 'baby-diaper', name: '尿布', icon: '👶', color: '#FAB1A0', type: 'expense', parentId: 'baby' },
  { id: 'baby-toy', name: '玩具', icon: '🧸', color: '#FAB1A0', type: 'expense', parentId: 'baby' },

  { id: 'insurance', name: '保险', icon: '🛡️', color: '#00CEC9', type: 'expense' },
  { id: 'loan', name: '借还款', icon: '💳', color: '#D63031', type: 'expense' },
  { id: 'loan-repay', name: '还贷款', icon: '🏦', color: '#D63031', type: 'expense', parentId: 'loan' },
  { id: 'loan-credit', name: '还信用卡', icon: '💳', color: '#D63031', type: 'expense', parentId: 'loan' },
  { id: 'loan-lend', name: '借出', icon: '🤝', color: '#D63031', type: 'expense', parentId: 'loan' },

  { id: 'other-expense', name: '其他支出', icon: '📝', color: '#B2BEC3', type: 'expense' },

  // Income categories
  { id: 'salary', name: '工资', icon: '💰', color: '#00B894', type: 'income' },
  { id: 'bonus', name: '奖金', icon: '🏆', color: '#00B894', type: 'income' },
  { id: 'investment', name: '理财', icon: '📈', color: '#6C5CE7', type: 'income' },
  { id: 'parttime', name: '兼职', icon: '💼', color: '#0984E3', type: 'income' },
  { id: 'redpacket-income', name: '红包', icon: '🧧', color: '#E17055', type: 'income' },
  { id: 'reimburse', name: '报销', icon: '📋', color: '#4ECDC4', type: 'income' },
  { id: 'other-income', name: '其他收入', icon: '💵', color: '#B2BEC3', type: 'income' },
];

export function getCategoryById(id: string): Category | undefined {
  return DEFAULT_CATEGORIES.find(c => c.id === id);
}

export function getParentCategories(type: BillType): Category[] {
  return DEFAULT_CATEGORIES.filter(c => c.type === type && !c.parentId);
}

export function getChildCategories(parentId: string): Category[] {
  return DEFAULT_CATEGORIES.filter(c => c.parentId === parentId);
}

export function getCategoryDisplay(id: string): { icon: string; name: string; color: string; fullName: string } {
  const cat = getCategoryById(id);
  if (!cat) return { icon: '❓', name: '未知', color: '#B2BEC3', fullName: '未知' };

  if (cat.parentId) {
    const parent = getCategoryById(cat.parentId);
    return {
      icon: cat.icon,
      name: cat.name,
      color: cat.color,
      fullName: parent ? `${parent.name}·${cat.name}` : cat.name,
    };
  }

  return { icon: cat.icon, name: cat.name, color: cat.color, fullName: cat.name };
}
