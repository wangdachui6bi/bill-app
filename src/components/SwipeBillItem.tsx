import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import type { Bill } from '../types';
import { deleteBill } from '../stores/billStore';
import { getCategoryDisplay } from '../utils/categories';
import { formatAmount } from '../utils/formatters';
import './SwipeBillItem.css';

interface Props {
  bill: Bill;
  dateFormat?: string;
}

export default function SwipeBillItem({ bill, dateFormat = 'MM/DD HH:mm' }: Props) {
  const navigate = useNavigate();
  const itemRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiped, setSwiped] = useState(false);

  const cat = getCategoryDisplay(bill.categoryId);
  const ACTION_WIDTH = 72;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = offset;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startX.current;
    const next = Math.min(0, Math.max(-ACTION_WIDTH, currentX.current + diff));
    setOffset(next);
  };

  const handleTouchEnd = () => {
    if (offset < -ACTION_WIDTH / 2) {
      setOffset(-ACTION_WIDTH);
      setSwiped(true);
    } else {
      setOffset(0);
      setSwiped(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteBill(bill.id);
    window.dispatchEvent(new Event('billUpdated'));
  };

  const handleClick = () => {
    if (swiped) {
      setOffset(0);
      setSwiped(false);
    } else {
      navigate(`/bill/${bill.id}`);
    }
  };

  return (
    <div className="swipe-wrapper">
      <div className="swipe-action-bg" onClick={handleDelete}>
        <Trash2 size={20} />
        <span>删除</span>
      </div>
      <div
        ref={itemRef}
        className="bill-item swipe-content"
        style={{ transform: `translateX(${offset}px)`, transition: offset === 0 || offset === -ACTION_WIDTH ? 'transform 0.25s ease' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <div className="bill-item-icon" style={{ background: `${cat.color}20` }}>
          {cat.icon}
        </div>
        <div className="bill-item-info">
          <div className="bill-item-category">{cat.fullName}</div>
          <div className="bill-item-meta">
            {bill.note && <span className="bill-item-note">{bill.note}</span>}
            <span className="bill-item-date">{dayjs(bill.date).format(dateFormat)}</span>
          </div>
        </div>
        <div className={`bill-item-amount ${bill.type === 'expense' ? 'amount-expense' : 'amount-income'}`}>
          {formatAmount(bill.amount, bill.type)}
        </div>
      </div>
    </div>
  );
}
