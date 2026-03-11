import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import dayjs from 'dayjs';
import type { Bill } from '../types';
import { getAllBills } from '../stores/billStore';
import { getCategoryDisplay } from '../utils/categories';
import { formatAmount } from '../utils/formatters';
import { usePrivacy, maskValue } from '../contexts/PrivacyContext';
import './Search.css';

export default function Search() {
  const navigate = useNavigate();
  const { masked } = usePrivacy();
  const mm = (v: string) => maskValue(v, masked);
  const inputRef = useRef<HTMLInputElement>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [query, setQuery] = useState('');

  const loadData = useCallback(async () => {
    setBills(await getAllBills());
  }, []);

  useEffect(() => {
    loadData();
    inputRef.current?.focus();
  }, [loadData]);

  const results = query.trim()
    ? bills.filter(b => {
        const q = query.trim().toLowerCase();
        const cat = getCategoryDisplay(b.categoryId);
        const amtStr = b.amount.toString();
        return (
          (b.note && b.note.toLowerCase().includes(q)) ||
          cat.name.toLowerCase().includes(q) ||
          cat.fullName.toLowerCase().includes(q) ||
          amtStr.includes(q)
        );
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const totalExpense = results.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0);
  const totalIncome = results.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0);

  return (
    <div className="page search-page">
      <div className="search-header">
        <button className="add-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <div className="search-input-wrap">
          <SearchIcon size={16} className="search-input-icon" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="搜索备注、分类、金额..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {query.trim() && results.length > 0 && (
          <div className="search-summary">
            <span>找到 {results.length} 条结果</span>
            <span className="search-summary-amounts">
              {totalExpense > 0 && <span className="amount-expense">支出 ¥{mm(totalExpense.toFixed(2))}</span>}
              {totalIncome > 0 && <span className="amount-income">收入 ¥{mm(totalIncome.toFixed(2))}</span>}
            </span>
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <div className="empty-icon">🔍</div>
            <p>没有找到相关账单</p>
          </div>
        )}

        {!query.trim() && (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <div className="empty-icon">🔍</div>
            <p>输入关键词搜索账单</p>
            <p className="empty-sub">支持搜索备注、分类名、金额</p>
          </div>
        )}

        <div className="recent-list" style={{ padding: '0 16px' }}>
          {results.map(bill => {
            const cat = getCategoryDisplay(bill.categoryId);
            return (
              <div key={bill.id} className="bill-item" onClick={() => navigate(`/bill/${bill.id}`)}>
                <div className="bill-item-icon" style={{ background: `${cat.color}20` }}>
                  {cat.icon}
                </div>
                <div className="bill-item-info">
                  <div className="bill-item-category">{cat.fullName}</div>
                  <div className="bill-item-meta">
                    {bill.note && <span className="bill-item-note">{bill.note}</span>}
                    <span className="bill-item-date">{dayjs(bill.date).format('YYYY/MM/DD HH:mm')}</span>
                  </div>
                </div>
                <div className={`bill-item-amount ${bill.type === 'expense' ? 'amount-expense' : 'amount-income'}`}>
                  {mm(formatAmount(bill.amount, bill.type))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
