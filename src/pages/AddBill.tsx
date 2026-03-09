import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Grid3X3 } from 'lucide-react';
import dayjs from 'dayjs';
import type { BillType, Bill } from '../types';
import { addBill, generateId } from '../stores/billStore';
import { getParentCategories, getChildCategories, getCategoryDisplay } from '../utils/categories';
import { parseBillText } from '../utils/billParser';
import './AddBill.css';

type InputMode = 'category' | 'smart';

export default function AddBill() {
  const navigate = useNavigate();
  const [billType, setBillType] = useState<BillType>('expense');
  const [inputMode, setInputMode] = useState<InputMode>('smart');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [smartInput, setSmartInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; content: string; bill?: Bill }[]>([
    { role: 'bot', content: '嗨！告诉我你花了什么钱，我来帮你记账吧～\n例如：「午餐吃面条15元」「打车回家30」「买水果25.5」' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const parentCategories = getParentCategories(billType);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || !selectedCategory) return;

    const bill: Bill = {
      id: generateId(),
      amount: amt,
      type: billType,
      categoryId: selectedCategory,
      note,
      date: new Date(date).toISOString(),
      createdAt: new Date().toISOString(),
    };

    await addBill(bill);
    window.dispatchEvent(new Event('billUpdated'));
    navigate(-1);
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

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  const handleNumpad = (key: string) => {
    if (key === 'del') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + '.');
    } else {
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
      setAmount(prev => prev + key);
    }
  };

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
              <span className="amount-value">{amount || '0'}</span>
            </div>
            <div className="numpad">
              {numpadKeys.map(key => (
                <button
                  key={key}
                  className={`numpad-key ${key === 'del' ? 'key-del' : ''}`}
                  onClick={() => handleNumpad(key)}
                >
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={!amount || !selectedCategory}
            >
              保存
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
    </div>
  );
}
