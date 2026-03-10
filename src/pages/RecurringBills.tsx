import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import type { BillType, RecurringBill, RecurringCycle } from '../types';
import {
  getRecurringBills, addRecurringBill, updateRecurringBill,
  deleteRecurringBill, generateId,
} from '../stores/billStore';
import { getParentCategories, getChildCategories, getCategoryDisplay } from '../utils/categories';
import './RecurringBills.css';

const CYCLE_LABELS: Record<RecurringCycle, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年',
};

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getCycleDesc(r: RecurringBill) {
  if (r.cycle === 'daily') return '每天';
  if (r.cycle === 'weekly') return `每${WEEKDAYS[r.dayOfWeek ?? 1]}`;
  if (r.cycle === 'monthly') return `每月${r.dayOfMonth ?? 1}号`;
  if (r.cycle === 'yearly') return `每年${(r.monthOfYear ?? 0) + 1}月${r.dayOfMonth ?? 1}日`;
  return '';
}

export default function RecurringBillsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<RecurringBill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [billType, setBillType] = useState<BillType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [cycle, setCycle] = useState<RecurringCycle>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [monthOfYear, setMonthOfYear] = useState(0);

  const load = useCallback(async () => {
    setList(await getRecurringBills());
  }, []);

  useEffect(() => { load(); }, [load]);

  const parentCategories = getParentCategories(billType);

  const resetForm = () => {
    setEditId(null);
    setBillType('expense');
    setCategoryId('');
    setAmount('');
    setNote('');
    setCycle('monthly');
    setDayOfMonth(1);
    setDayOfWeek(1);
    setMonthOfYear(0);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (r: RecurringBill) => {
    setEditId(r.id);
    setBillType(r.type);
    setCategoryId(r.categoryId);
    setAmount(r.amount.toString());
    setNote(r.note);
    setCycle(r.cycle);
    setDayOfMonth(r.dayOfMonth ?? 1);
    setDayOfWeek(r.dayOfWeek ?? 1);
    setMonthOfYear(r.monthOfYear ?? 0);
    setShowForm(true);
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || !categoryId) return;

    if (editId) {
      const existing = list.find(x => x.id === editId);
      await updateRecurringBill({
        id: editId,
        amount: amt, type: billType, categoryId, note, cycle,
        dayOfMonth, dayOfWeek, monthOfYear,
        startDate: existing?.startDate || new Date().toISOString(),
        lastGenerated: existing?.lastGenerated,
        enabled: existing?.enabled ?? true,
      });
    } else {
      await addRecurringBill({
        id: generateId(),
        amount: amt, type: billType, categoryId, note, cycle,
        dayOfMonth, dayOfWeek, monthOfYear,
        startDate: new Date().toISOString(),
        enabled: true,
      });
    }
    setShowForm(false);
    resetForm();
    await load();
  };

  const handleToggle = async (r: RecurringBill) => {
    await updateRecurringBill({ ...r, enabled: !r.enabled });
    await load();
  };

  const handleDelete = async (id: string) => {
    await deleteRecurringBill(id);
    await load();
  };

  return (
    <div className="page recurring-page">
      <div className="recurring-header">
        <button className="add-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <span className="recurring-title">周期性记账</span>
        <button className="recurring-add-btn" onClick={handleOpenAdd}>
          <Plus size={20} />
        </button>
      </div>

      <div className="page-content">
        {list.length === 0 && !showForm && (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <div className="empty-icon">🔄</div>
            <p>还没有周期性账单</p>
            <p className="empty-sub">点右上角 + 添加，如房租、工资等固定支出/收入</p>
          </div>
        )}

        {/* List */}
        {list.map(r => {
          const cat = getCategoryDisplay(r.categoryId);
          return (
            <div key={r.id} className={`card recurring-item ${!r.enabled ? 'disabled' : ''}`}>
              <div className="recurring-item-top" onClick={() => handleEdit(r)}>
                <div className="recurring-item-icon" style={{ background: `${cat.color}20` }}>
                  {cat.icon}
                </div>
                <div className="recurring-item-info">
                  <div className="recurring-item-name">{r.note || cat.fullName}</div>
                  <div className="recurring-item-cycle">
                    {getCycleDesc(r)}
                    {r.lastGenerated && (
                      <span className="recurring-item-last"> · 上次: {dayjs(r.lastGenerated).format('MM/DD')}</span>
                    )}
                  </div>
                </div>
                <div className={`recurring-item-amount ${r.type === 'expense' ? 'amount-expense' : 'amount-income'}`}>
                  {r.type === 'expense' ? '-' : '+'}¥{r.amount.toFixed(2)}
                </div>
              </div>
              <div className="recurring-item-actions">
                <label className="recurring-switch">
                  <input type="checkbox" checked={r.enabled} onChange={() => handleToggle(r)} />
                  <span className="switch-slider" />
                </label>
                <button className="recurring-del" onClick={() => handleDelete(r.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="recurring-form-overlay" onClick={() => { setShowForm(false); resetForm(); }}>
            <div className="recurring-form" onClick={e => e.stopPropagation()}>
              <div className="recurring-form-title">{editId ? '编辑' : '添加'}周期性账单</div>

              {/* Type Toggle */}
              <div className="recurring-form-row">
                <div className="add-type-tabs" style={{ margin: 0 }}>
                  <button className={`type-tab ${billType === 'expense' ? 'active' : ''}`} onClick={() => setBillType('expense')}>支出</button>
                  <button className={`type-tab ${billType === 'income' ? 'active' : ''}`} onClick={() => setBillType('income')}>收入</button>
                </div>
              </div>

              {/* Category Selection */}
              <div className="recurring-form-row">
                <label className="recurring-label">分类</label>
                <div className="recurring-cat-grid">
                  {parentCategories.map(parent => {
                    const children = getChildCategories(parent.id);
                    if (children.length === 0) {
                      return (
                        <button key={parent.id}
                          className={`recurring-cat-btn ${categoryId === parent.id ? 'selected' : ''}`}
                          onClick={() => setCategoryId(parent.id)}
                        >
                          <span>{parent.icon}</span>
                          <span>{parent.name}</span>
                        </button>
                      );
                    }
                    return children.map(child => (
                      <button key={child.id}
                        className={`recurring-cat-btn ${categoryId === child.id ? 'selected' : ''}`}
                        onClick={() => setCategoryId(child.id)}
                      >
                        <span>{child.icon}</span>
                        <span>{child.name}</span>
                      </button>
                    ));
                  })}
                </div>
              </div>

              {/* Amount */}
              <div className="recurring-form-row">
                <label className="recurring-label">金额</label>
                <input type="number" className="recurring-input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>

              {/* Note */}
              <div className="recurring-form-row">
                <label className="recurring-label">备注</label>
                <input className="recurring-input" placeholder="如：房租、工资" value={note} onChange={e => setNote(e.target.value)} />
              </div>

              {/* Cycle */}
              <div className="recurring-form-row">
                <label className="recurring-label">周期</label>
                <div className="recurring-cycle-tabs">
                  {(Object.keys(CYCLE_LABELS) as RecurringCycle[]).map(c => (
                    <button key={c} className={`cycle-tab ${cycle === c ? 'active' : ''}`} onClick={() => setCycle(c)}>
                      {CYCLE_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cycle Detail */}
              {cycle === 'weekly' && (
                <div className="recurring-form-row">
                  <label className="recurring-label">星期几</label>
                  <div className="recurring-cycle-tabs">
                    {WEEKDAYS.map((w, i) => (
                      <button key={i} className={`cycle-tab small ${dayOfWeek === i ? 'active' : ''}`} onClick={() => setDayOfWeek(i)}>
                        {w.replace('周', '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(cycle === 'monthly' || cycle === 'yearly') && (
                <div className="recurring-form-row">
                  <label className="recurring-label">{cycle === 'yearly' ? '月份' : '日期'}</label>
                  <div className="recurring-inline">
                    {cycle === 'yearly' && (
                      <select className="recurring-select" value={monthOfYear} onChange={e => setMonthOfYear(Number(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>{i + 1}月</option>
                        ))}
                      </select>
                    )}
                    <select className="recurring-select" value={dayOfMonth} onChange={e => setDayOfMonth(Number(e.target.value))}>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}号</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="recurring-form-actions">
                <button className="recurring-cancel" onClick={() => { setShowForm(false); resetForm(); }}>取消</button>
                <button className="recurring-save" onClick={handleSave} disabled={!amount || !categoryId}>保存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
