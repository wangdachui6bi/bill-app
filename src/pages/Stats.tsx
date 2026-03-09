import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import * as echarts from 'echarts/core';
import { PieChart as PieChartComponent } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { Bill, BillType } from '../types';
import { getAllBills } from '../stores/billStore';
import { getCategoryDisplay, getCategoryById, DEFAULT_CATEGORIES } from '../utils/categories';
import './Stats.css';

echarts.use([PieChartComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export default function Stats() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [billType, setBillType] = useState<BillType>('expense');
  const pieRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const loadData = useCallback(async () => {
    const allBills = await getAllBills();
    setBills(allBills);
  }, []);

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('billUpdated', handler);
    return () => window.removeEventListener('billUpdated', handler);
  }, [loadData]);

  const monthBills = bills.filter(b => {
    const d = dayjs(b.date);
    return d.year() === currentMonth.year() && d.month() === currentMonth.month() && b.type === billType;
  });

  const total = monthBills.reduce((s, b) => s + b.amount, 0);

  // Group by parent category
  const categoryMap = new Map<string, number>();
  monthBills.forEach(b => {
    const cat = getCategoryById(b.categoryId);
    const parentId = cat?.parentId || b.categoryId;
    categoryMap.set(parentId, (categoryMap.get(parentId) || 0) + b.amount);
  });

  const sortedCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId, amount]) => {
      const cat = getCategoryDisplay(categoryId);
      return { categoryId, amount, ...cat };
    });

  useEffect(() => {
    if (!pieRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(pieRef.current);
    }

    if (sortedCategories.length === 0) {
      chartInstance.current.clear();
      return;
    }

    const option = {
      tooltip: {
        trigger: 'item' as const,
        formatter: '{b}: ¥{c} ({d}%)',
      },
      series: [{
        type: 'pie' as const,
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11,
        },
        data: sortedCategories.map(c => {
          const parentCat = DEFAULT_CATEGORIES.find(cat => cat.id === c.categoryId);
          return {
            value: Number(c.amount.toFixed(2)),
            name: c.name,
            itemStyle: { color: parentCat?.color || c.color },
          };
        }),
      }],
    };

    chartInstance.current.setOption(option, true);

    const resizeHandler = () => chartInstance.current?.resize();
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, [sortedCategories]);

  return (
    <div className="page">
      <div className="page-content">
        <div className="stats-header">
          <span className="stats-title">统计</span>
        </div>

        {/* Month Navigation */}
        <div className="calendar-nav">
          <button onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))}>
            <ChevronLeft size={20} />
          </button>
          <span className="calendar-month-label">
            {currentMonth.format('YYYY年M月')}
          </span>
          <button onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="stats-type-toggle">
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

        {/* Total */}
        <div className="stats-total">
          <span>{billType === 'expense' ? '总支出' : '总收入'}</span>
          <span className={`stats-total-amount ${billType === 'expense' ? 'amount-expense' : 'amount-income'}`}>
            ¥{total.toFixed(2)}
          </span>
        </div>

        {/* Pie Chart */}
        <div className="card">
          {sortedCategories.length > 0 ? (
            <div ref={pieRef} className="stats-pie" />
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-icon">📊</div>
              <p>暂无数据</p>
            </div>
          )}
        </div>

        {/* Category List */}
        <div className="card stats-category-list">
          <div className="stats-category-header">分类明细</div>
          {sortedCategories.map(c => {
            const percent = total > 0 ? (c.amount / total) * 100 : 0;
            return (
              <div key={c.categoryId} className="stats-category-item">
                <div className="stats-cat-icon" style={{ background: `${c.color}20` }}>
                  {c.icon}
                </div>
                <div className="stats-cat-info">
                  <div className="stats-cat-name">{c.name}</div>
                  <div className="stats-cat-bar">
                    <div
                      className="stats-cat-bar-fill"
                      style={{ width: `${percent}%`, background: c.color }}
                    />
                  </div>
                </div>
                <div className="stats-cat-right">
                  <div className="stats-cat-amount">¥{c.amount.toFixed(2)}</div>
                  <div className="stats-cat-percent">{percent.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
