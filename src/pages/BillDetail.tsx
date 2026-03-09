import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Check } from 'lucide-react';
import dayjs from 'dayjs';
import type { Bill } from '../types';
import { getAllBills, updateBill, deleteBill } from '../stores/billStore';
import { getCategoryDisplay } from '../utils/categories';
import './BillDetail.css';

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');

  const loadBill = useCallback(async () => {
    const bills = await getAllBills();
    const found = bills.find(b => b.id === id);
    if (found) {
      setBill(found);
      setEditNote(found.note);
      setEditAmount(found.amount.toString());
      setEditDate(dayjs(found.date).format('YYYY-MM-DDTHH:mm'));
    }
  }, [id]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  if (!bill) {
    return (
      <div className="page">
        <div className="detail-header">
          <button onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
          <span>账单详情</span>
          <div />
        </div>
        <div className="empty-state" style={{ marginTop: 60 }}>
          <p>账单不存在</p>
        </div>
      </div>
    );
  }

  const cat = getCategoryDisplay(bill.categoryId);

  const handleDelete = async () => {
    if (confirm('确定删除这笔账单吗？')) {
      await deleteBill(bill.id);
      window.dispatchEvent(new Event('billUpdated'));
      navigate(-1);
    }
  };

  const handleSaveEdit = async () => {
    const amt = parseFloat(editAmount);
    if (!isNaN(amt) && amt > 0) {
      const updated = { ...bill, amount: amt, note: editNote, date: new Date(editDate).toISOString() };
      await updateBill(updated);
      window.dispatchEvent(new Event('billUpdated'));
      setBill(updated);
      setEditing(false);
    }
  };

  return (
    <div className="page">
      <div className="detail-header">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
        <span>账单详情</span>
        <div className="detail-actions">
          {editing ? (
            <button onClick={handleSaveEdit}><Check size={20} color="var(--success)" /></button>
          ) : (
            <button onClick={() => setEditing(true)}><Pencil size={18} /></button>
          )}
          <button onClick={handleDelete}><Trash2 size={18} color="var(--danger)" /></button>
        </div>
      </div>

      <div className="page-content">
        <div className="detail-top">
          <div className="detail-icon" style={{ background: `${cat.color}20` }}>
            {cat.icon}
          </div>
          <div className="detail-category">{cat.fullName}</div>
          {editing ? (
            <div className="detail-edit-amount">
              <span>¥</span>
              <input
                type="number"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <div className={`detail-amount ${bill.type === 'expense' ? 'amount-expense' : 'amount-income'}`}>
              {bill.type === 'expense' ? '-' : '+'}¥{bill.amount.toFixed(2)}
            </div>
          )}
        </div>

        <div className="card detail-info">
          <div className="detail-info-row">
            <span className="detail-label">类型</span>
            <span>{bill.type === 'expense' ? '支出' : '收入'}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-label">分类</span>
            <span>{cat.icon} {cat.fullName}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-label">时间</span>
            {editing ? (
              <input
                type="datetime-local"
                className="detail-edit-date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
              />
            ) : (
              <span>{dayjs(bill.date).format('YYYY-MM-DD HH:mm')}</span>
            )}
          </div>
          <div className="detail-info-row">
            <span className="detail-label">备注</span>
            {editing ? (
              <input
                className="detail-edit-note"
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="添加备注..."
              />
            ) : (
              <span className="detail-note">{bill.note || '无'}</span>
            )}
          </div>
          <div className="detail-info-row">
            <span className="detail-label">创建时间</span>
            <span className="detail-meta">{dayjs(bill.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
