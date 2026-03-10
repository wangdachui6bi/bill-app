import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Grid3X3, Bookmark, X, Check, Repeat } from 'lucide-react';
import dayjs from 'dayjs';
import type { BillType, Bill, BillTemplate } from '../types';
import { addBill, generateId, getTemplates, addTemplate, deleteTemplate } from '../stores/billStore';
import { getParentCategories, getChildCategories, getCategoryDisplay } from '../utils/categories';
import { parseBillText } from '../utils/billParser';
import './AddBill.css';

type InputMode = 'category' | 'smart';

function evalExpression(expr: string): number {
  const cleaned = expr.replace(/[^0-9+\-.]/g, '');
  if (!cleaned) return 0;
  try {
    const parts: number[] = [];
    const ops: string[] = [];
    let num = '';
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if ((ch === '+' || ch === '-') && num !== '') {
        parts.push(parseFloat(num));
        ops.push(ch);
        num = '';
      } else {
        num += ch;
      }
    }
    if (num) parts.push(parseFloat(num));
    let result = parts[0] || 0;
    for (let i = 0; i < ops.length; i++) {
      if (ops[i] === '+') result += parts[i + 1];
      else result -= parts[i + 1];
    }
    return Math.round(result * 100) / 100;
  } catch {
    return 0;
  }
}

export default function AddBill() {
  const navigate = useNavigate();
  const [billType, setBillType] = useState<BillType>('expense');
  const [inputMode, setInputMode] = useState<InputMode>('smart');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [smartInput, setSmartInput] = useState('');
  const [continuousMode, setContinuousMode] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [templates, setTemplates] = useState<BillTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; content: string; bill?: Bill }[]>([
    { role: 'bot', content: '嗨！告诉我你花了什么钱，我来帮你记账吧～\n例如：「午餐吃面条15元」「打车回家30」「买水果25.5」' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const parentCategories = getParentCategories(billType);
  const hasOperator = /[+-]/.test(amount.slice(1));
  const displayAmount = hasOperator ? `${amount} = ${evalExpression(amount)}` : amount || '0';
  const finalAmount = hasOperator ? evalExpression(amount) : parseFloat(amount) || 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadTemplates = useCallback(async () => {
    setTemplates(await getTemplates());
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const resetForm = () => {
    setAmount('');
    setNote('');
    setDate(dayjs().format('YYYY-MM-DDTHH:mm'));
    setSelectedCategory('');
  };

  const handleSave = async () => {
    if (!finalAmount || !selectedCategory) return;

    const bill: Bill = {
      id: generateId(),
      amount: finalAmount,
      type: billType,
      categoryId: selectedCategory,
      note,
      date: new Date(date).toISOString(),
      createdAt: new Date().toISOString(),
    };

    await addBill(bill);
    window.dispatchEvent(new Event('billUpdated'));

    if (continuousMode) {
      resetForm();
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 1500);
    } else {
      navigate(-1);
    }
  };

  const handleSmartInput = async () => {
    if (!smartInput.trim()) return;

    const userMsg = smartInput.trim();
    setSmartInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    const parsed = parseBillText(userMsg);
    if (parsed) {
      const cat = getCategoryDisplay(parsed.categoryId);
      const bill: Bill = {
        id: generateId(),
        amount: parsed.amount,
        type: parsed.type,
        categoryId: parsed.categoryId,
        note: parsed.note,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addBill(bill);
      window.dispatchEvent(new Event('billUpdated'));

      const typeLabel = parsed.type === 'expense' ? '支出' : '收入';
      setChatMessages(prev => [...prev, {
        role: 'bot',
        content: `已记录！${cat.icon} ${cat.fullName} ${typeLabel} ¥${parsed.amount.toFixed(2)}\n备注：${parsed.note}`,
        bill,
      }]);
    } else {
      setChatMessages(prev => [...prev, {
        role: 'bot',
        content: '抱歉，没能识别出金额。请试试这样说：\n「午餐15元」「打车25」「买衣服300元」'
      }]);
    }
  };

  const handleNumpad = (key: string) => {
    if (key === 'del') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === '.') {
      const parts = amount.split(/[+-]/);
      const lastPart = parts[parts.length - 1];
      if (!lastPart.includes('.')) setAmount(prev => prev + '.');
    } else if (key === '+' || key === '-') {
      if (!amount) return;
      const last = amount[amount.length - 1];
      if (last === '+' || last === '-') {
        setAmount(prev => prev.slice(0, -1) + key);
      } else {
        setAmount(prev => prev + key);
      }
    } else {
      const parts = amount.split(/[+-]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.') && lastPart.split('.')[1].length >= 2) return;
      setAmount(prev => prev + key);
    }
  };

  const handleSaveTemplate = async () => {
    if (!finalAmount || !selectedCategory) return;
    const cat = getCategoryDisplay(selectedCategory);
    const t: BillTemplate = {
      id: generateId(),
      name: note || cat.fullName,
      amount: finalAmount,
      type: billType,
      categoryId: selectedCategory,
      note,
    };
    await addTemplate(t);
    await loadTemplates();
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 1500);
  };

  const handleUseTemplate = (t: BillTemplate) => {
    setBillType(t.type);
    setSelectedCategory(t.categoryId);
    setAmount(t.amount.toString());
    setNote(t.note);
    setShowTemplates(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    await loadTemplates();
  };

  const numpadKeys = ['1', '2', '3', '+', '4', '5', '6', '-', '7', '8', '9', 'del', '.', '0', '00'];

  return (
    <div className="page add-bill-page">
      {/* Header */}
      <div className="add-header">
        <button className="add-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <div className="add-type-tabs">
          <button
            className={`type-tab ${billType === 'expense' ? 'active' : ''}`}
            onClick={() => setBillType('expense')}
          >
            支出
          </button>
          <button
            className={`type-tab ${billType === 'income' ? 'active' : ''}`}
            onClick={() => setBillType('income')}
          >
            收入
          </button>
        </div>
        <div className="add-mode-toggle">
          <button
            className={`mode-btn ${inputMode === 'category' ? 'active' : ''}`}
            onClick={() => setInputMode('category')}
            title="分类记账"
          >
            <Grid3X3 size={18} />
          </button>
          <button
            className={`mode-btn ${inputMode === 'smart' ? 'active' : ''}`}
            onClick={() => setInputMode('smart')}
            title="智能记账"
          >
            <MessageCircle size={18} />
          </button>
        </div>
      </div>

      {inputMode === 'category' ? (
        <>
          {/* Template Bar */}
          <div className="template-bar">
            <button
              className={`template-toggle ${showTemplates ? 'active' : ''}`}
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <Bookmark size={14} />
              <span>模板</span>
            </button>
            <button
              className={`continuous-toggle ${continuousMode ? 'active' : ''}`}
              onClick={() => setContinuousMode(!continuousMode)}
            >
              <Repeat size={14} />
              <span>连续</span>
            </button>
            {selectedCategory && finalAmount > 0 && (
              <button className="save-template-btn" onClick={handleSaveTemplate}>
                + 存为模板
              </button>
            )}
          </div>

          {/* Template List */}
          {showTemplates && (
            <div className="template-list">
              {templates.length === 0 ? (
                <div className="template-empty">还没有模板，填好账单后点"存为模板"</div>
              ) : (
                templates.map(t => {
                  const cat = getCategoryDisplay(t.categoryId);
                  return (
                    <div key={t.id} className="template-item" onClick={() => handleUseTemplate(t)}>
                      <span className="template-icon">{cat.icon}</span>
                      <div className="template-info">
                        <div className="template-name">{t.name}</div>
                        <div className="template-amount">¥{t.amount.toFixed(2)}</div>
                      </div>
                      <button className="template-del" onClick={e => { e.stopPropagation(); handleDeleteTemplate(t.id); }}>
                        <X size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Category Selection */}
          <div className="category-grid-wrapper page-content">
            {parentCategories.map(parent => {
              const children = getChildCategories(parent.id);
              const hasChildren = children.length > 0;
              return (
                <div key={parent.id} className="category-group">
                  {!hasChildren ? (
                    <button
                      className={`category-btn ${selectedCategory === parent.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(parent.id)}
                    >
                      <span className="category-btn-icon" style={{ background: `${parent.color}20` }}>
                        {parent.icon}
                      </span>
                      <span className="category-btn-name">{parent.name}</span>
                    </button>
                  ) : (
                    <>
                      <div className="category-group-label">{parent.icon} {parent.name}</div>
                      <div className="category-children">
                        {children.map(child => (
                          <button
                            key={child.id}
                            className={`category-btn ${selectedCategory === child.id ? 'selected' : ''}`}
                            onClick={() => setSelectedCategory(child.id)}
                          >
                            <span className="category-btn-icon" style={{ background: `${child.color}20` }}>
                              {child.icon}
                            </span>
                            <span className="category-btn-name">{child.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Amount Input Panel */}
          <div className="amount-panel">
            <div className="amount-input-row">
              <input
                className="note-input"
                placeholder="添加备注..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <input
                type="datetime-local"
                className="date-input"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="amount-display">
              <span className="amount-currency">¥</span>
              <span className={`amount-value ${hasOperator ? 'has-expr' : ''}`}>{displayAmount}</span>
            </div>
            <div className="numpad numpad-4col">
              {numpadKeys.map(key => (
                <button
                  key={key}
                  className={`numpad-key ${key === 'del' ? 'key-del' : ''} ${key === '+' || key === '-' ? 'key-op' : ''}`}
                  onClick={() => handleNumpad(key)}
                >
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={!finalAmount || !selectedCategory}
            >
              {continuousMode ? '保存并继续' : '保存'}
            </button>
          </div>
        </>
      ) : (
        /* Smart Input Mode */
        <div className="smart-input-mode">
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.role === 'bot' && <div className="chat-avatar">🤖</div>}
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                  {msg.bill && (
                    <div className="chat-bill-card">
                      <span className="chat-bill-icon">
                        {getCategoryDisplay(msg.bill.categoryId).icon}
                      </span>
                      <span>{getCategoryDisplay(msg.bill.categoryId).fullName}</span>
                      <span className={msg.bill.type === 'expense' ? 'amount-expense' : 'amount-income'}>
                        {msg.bill.type === 'expense' ? '-' : '+'}¥{msg.bill.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="smart-input-bar">
            <input
              className="smart-input"
              placeholder="输入消费内容，如：午餐面条15元"
              value={smartInput}
              onChange={e => setSmartInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSmartInput()}
            />
            <button className="smart-send-btn" onClick={handleSmartInput}>
              发送
            </button>
          </div>
        </div>
      )}

      {/* Save Toast */}
      {showSaveToast && (
        <div className="save-toast">
          <Check size={20} />
          <span>已保存</span>
        </div>
      )}
    </div>
  );
}
