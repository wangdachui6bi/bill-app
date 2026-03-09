import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import * as echarts from 'echarts/core';
import { PieChart as PieChartComponent, BarChart as BarChartComponent } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { Bill, BillType } from '../types';
import { getAllBills } from '../stores/billStore';
import { getCategoryDisplay, getCategoryById, DEFAULT_CATEGORIES } from '../utils/categories';
import { formatAmount } from '../utils/formatters';
import './Stats.css';

dayjs.extend(isoWeek);
echarts.use([PieChartComponent, BarChartComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

type TimeRange = 'week' | 'month' | 'year' | 'custom';

function getWeekLabel(d: dayjs.Dayjs) {
  const start = d.startOf('isoWeek');
  const end = d.endOf('isoWeek');
  return `${start.format('M.D')} - ${end.format('M.D')}`;
}

export default function Stats() {
  const routerNavigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [billType, setBillType] = useState<BillType>('expense');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [anchor, setAnchor] = useState(dayjs());
  const [customStart, setCustomStart] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [customEnd, setCustomEnd] = useState(dayjs().format('YYYY-MM-DD'));
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pieChart = useRef<echarts.ECharts | null>(null);
  const barChart = useRef<echarts.ECharts | null>(null);

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

  // Compute date range based on mode
  let rangeStart: dayjs.Dayjs;
  let rangeEnd: dayjs.Dayjs;
  let rangeLabel: string;

  switch (timeRange) {
    case 'week':
      rangeStart = anchor.startOf('isoWeek');
      rangeEnd = anchor.endOf('isoWeek');
      rangeLabel = `${anchor.isoWeekYear()}年 第${anchor.isoWeek()}周`;
      break;
    case 'month':
      rangeStart = anchor.startOf('month');
      rangeEnd = anchor.endOf('month');
      rangeLabel = anchor.format('YYYY年M月');
      break;
    case 'year':
      rangeStart = anchor.startOf('year');
      rangeEnd = anchor.endOf('year');
      rangeLabel = anchor.format('YYYY年');
      break;
    case 'custom':
      rangeStart = dayjs(customStart).startOf('day');
      rangeEnd = dayjs(customEnd).endOf('day');
      rangeLabel = `${rangeStart.format('M.D')} - ${rangeEnd.format('M.D')}`;
      break;
  }

  const navigate = (dir: -1 | 1) => {
    if (timeRange === 'custom') return;
    const unit = timeRange === 'week' ? 'week' : timeRange === 'month' ? 'month' : 'year';
    setAnchor(prev => dir === -1 ? prev.subtract(1, unit) : prev.add(1, unit));
  };

  // Filter bills
  const filteredBills = bills.filter(b => {
    const d = dayjs(b.date);
    return d.isAfter(rangeStart.subtract(1, 'millisecond')) && d.isBefore(rangeEnd.add(1, 'millisecond')) && b.type === billType;
  });

  const allFilteredBills = bills.filter(b => {
    const d = dayjs(b.date);
    return d.isAfter(rangeStart.subtract(1, 'millisecond')) && d.isBefore(rangeEnd.add(1, 'millisecond'));
  });

  const totalExpense = allFilteredBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0);
  const totalIncome = allFilteredBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0);
  const total = filteredBills.reduce((s, b) => s + b.amount, 0);
  const billCount = filteredBills.length;
  const daysDiff = rangeEnd.diff(rangeStart, 'day') + 1;
  const dailyAvg = daysDiff > 0 ? total / daysDiff : 0;

  // Category breakdown
  const categoryMap = new Map<string, number>();
  filteredBills.forEach(b => {
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

  const getCategoryBills = (parentCatId: string) => {
    return filteredBills
      .filter(b => {
        const cat = getCategoryById(b.categoryId);
        const pid = cat?.parentId || b.categoryId;
        return pid === parentCatId;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getSubCategoryBreakdown = (parentCatId: string) => {
    const subMap = new Map<string, number>();
    const catBills = getCategoryBills(parentCatId);
    catBills.forEach(b => {
      subMap.set(b.categoryId, (subMap.get(b.categoryId) || 0) + b.amount);
    });
    return Array.from(subMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([catId, amount]) => {
        const display = getCategoryDisplay(catId);
        return { catId, amount, ...display };
      });
  };

  // Bar chart data: daily for week, daily for month, monthly for year
  const barData = useCallback(() => {
    const labels: string[] = [];
    const values: number[] = [];

    if (timeRange === 'week' || timeRange === 'custom') {
      let d = rangeStart;
      while (d.isBefore(rangeEnd) || d.isSame(rangeEnd, 'day')) {
        const dayStr = d.format('YYYY-MM-DD');
        labels.push(d.format('M/D'));
        const dayTotal = filteredBills
          .filter(b => dayjs(b.date).format('YYYY-MM-DD') === dayStr)
          .reduce((s, b) => s + b.amount, 0);
        values.push(Number(dayTotal.toFixed(2)));
        d = d.add(1, 'day');
      }
    } else if (timeRange === 'month') {
      const daysInMonth = anchor.daysInMonth();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = anchor.date(i).format('YYYY-MM-DD');
        labels.push(`${i}`);
        const dayTotal = filteredBills
          .filter(b => dayjs(b.date).format('YYYY-MM-DD') === dayStr)
          .reduce((s, b) => s + b.amount, 0);
        values.push(Number(dayTotal.toFixed(2)));
      }
    } else if (timeRange === 'year') {
      for (let m = 0; m < 12; m++) {
        labels.push(`${m + 1}月`);
        const monthTotal = filteredBills
          .filter(b => dayjs(b.date).month() === m)
          .reduce((s, b) => s + b.amount, 0);
        values.push(Number(monthTotal.toFixed(2)));
      }
    }

    return { labels, values };
  }, [timeRange, anchor, rangeStart, rangeEnd, filteredBills]);

  // Pie chart
  useEffect(() => {
    if (!pieRef.current) return;
    if (!pieChart.current) {
      pieChart.current = echarts.init(pieRef.current);
    }
    if (sortedCategories.length === 0) {
      pieChart.current.clear();
      return;
    }
    pieChart.current.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
        data: sortedCategories.map(c => {
          const parentCat = DEFAULT_CATEGORIES.find(cat => cat.id === c.categoryId);
          return { value: Number(c.amount.toFixed(2)), name: c.name, itemStyle: { color: parentCat?.color || c.color } };
        }),
      }],
    }, true);
    const h = () => pieChart.current?.resize();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [sortedCategories]);

  // Bar chart
  useEffect(() => {
    if (!barRef.current) return;
    if (!barChart.current) {
      barChart.current = echarts.init(barRef.current);
    }
    const { labels, values } = barData();
    if (values.every(v => v === 0)) {
      barChart.current.clear();
      return;
    }
    barChart.current.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0];
          return `${p.name}<br/>¥${p.value.toFixed(2)}`;
        },
      },
      grid: { left: 50, right: 16, top: 16, bottom: 28 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          fontSize: 10,
          interval: timeRange === 'month' ? Math.floor(labels.length / 8) : 0,
          rotate: timeRange === 'custom' && labels.length > 14 ? 45 : 0,
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#E0E0E0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}` },
        splitLine: { lineStyle: { color: '#F0F0F0' } },
      },
      series: [{
        type: 'bar',
        data: values,
        barMaxWidth: 20,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: billType === 'expense'
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#FF6B6B' }, { offset: 1, color: '#FF9F43' }])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#2ED573' }, { offset: 1, color: '#7BED9F' }]),
        },
      }],
    }, true);
    const h = () => barChart.current?.resize();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [barData, billType, timeRange]);

  return (
    <div className="page">
      <div className="page-content">
        <div className="stats-header">
          <span className="stats-title">统计</span>
        </div>

        {/* Time Range Tabs */}
        <div className="stats-range-tabs">
          {([['week', '周'], ['month', '月'], ['year', '年'], ['custom', '自定义']] as [TimeRange, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`range-tab ${timeRange === key ? 'active' : ''}`}
              onClick={() => {
                setTimeRange(key);
                if (key === 'custom') setShowCustomPicker(true);
                else setShowCustomPicker(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        {timeRange !== 'custom' ? (
          <div className="calendar-nav">
            <button onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
            <span className="calendar-month-label">
              {rangeLabel}
              {timeRange === 'week' && <span className="week-detail"> ({getWeekLabel(anchor)})</span>}
            </span>
            <button onClick={() => navigate(1)}><ChevronRight size={20} /></button>
          </div>
        ) : (
          <div className="custom-range-picker">
            <div className="custom-range-row">
              <div className="custom-date-field">
                <Calendar size={14} />
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              </div>
              <span className="custom-range-sep">至</span>
              <div className="custom-date-field">
                <Calendar size={14} />
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
              </div>
            </div>
            {showCustomPicker && <div className="custom-range-label">{rangeLabel}，共{daysDiff}天</div>}
          </div>
        )}

        {/* Type Toggle */}
        <div className="stats-type-toggle">
          <button className={`type-tab ${billType === 'expense' ? 'active' : ''}`} onClick={() => setBillType('expense')}>支出</button>
          <button className={`type-tab ${billType === 'income' ? 'active' : ''}`} onClick={() => setBillType('income')}>收入</button>
        </div>

        {/* Summary Cards */}
        <div className="stats-summary-cards">
          <div className="summary-card">
            <div className="summary-label">总支出</div>
            <div className="summary-value amount-expense">¥{totalExpense.toFixed(2)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">总收入</div>
            <div className="summary-value amount-income">¥{totalIncome.toFixed(2)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">结余</div>
            <div className={`summary-value ${totalIncome - totalExpense >= 0 ? 'amount-income' : 'amount-expense'}`}>
              ¥{(totalIncome - totalExpense).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="stats-detail-row">
          <div className="stats-detail-item">
            <span className="detail-label">笔数</span>
            <span className="detail-value">{billCount}笔</span>
          </div>
          <div className="stats-detail-item">
            <span className="detail-label">日均{billType === 'expense' ? '支出' : '收入'}</span>
            <span className="detail-value">¥{dailyAvg.toFixed(2)}</span>
          </div>
          <div className="stats-detail-item">
            <span className="detail-label">笔均</span>
            <span className="detail-value">¥{billCount > 0 ? (total / billCount).toFixed(2) : '0.00'}</span>
          </div>
        </div>

        {/* Bar Chart - Trend */}
        <div className="card">
          <div className="stats-section-title">
            {timeRange === 'week' ? '每日趋势' : timeRange === 'month' ? '每日趋势' : timeRange === 'year' ? '月度趋势' : '每日趋势'}
          </div>
          <div ref={barRef} className="stats-bar" />
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="stats-section-title">分类占比</div>
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
          {sortedCategories.length === 0 && (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-light)' }}>暂无数据</p>
            </div>
          )}
          {sortedCategories.map(c => {
            const percent = total > 0 ? (c.amount / total) * 100 : 0;
            const isExpanded = expandedCategory === c.categoryId;
            const subBreakdown = isExpanded ? getSubCategoryBreakdown(c.categoryId) : [];
            const catBills = isExpanded ? getCategoryBills(c.categoryId) : [];

            return (
              <div key={c.categoryId} className={`stats-category-group ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="stats-category-item"
                  onClick={() => setExpandedCategory(isExpanded ? null : c.categoryId)}
                >
                  <div className="stats-cat-icon" style={{ background: `${c.color}20` }}>{c.icon}</div>
                  <div className="stats-cat-info">
                    <div className="stats-cat-name">{c.name}</div>
                    <div className="stats-cat-bar">
                      <div className="stats-cat-bar-fill" style={{ width: `${percent}%`, background: c.color }} />
                    </div>
                  </div>
                  <div className="stats-cat-right">
                    <div className="stats-cat-amount">¥{c.amount.toFixed(2)}</div>
                    <div className="stats-cat-percent">{percent.toFixed(1)}%</div>
                  </div>
                  <ChevronDown size={16} className={`stats-cat-arrow ${isExpanded ? 'rotated' : ''}`} />
                </div>

                {isExpanded && (
                  <div className="stats-cat-detail">
                    {subBreakdown.length > 1 && (
                      <div className="stats-sub-categories">
                        {subBreakdown.map(sub => (
                          <div key={sub.catId} className="stats-sub-item">
                            <span className="stats-sub-icon">{sub.icon}</span>
                            <span className="stats-sub-name">{sub.name}</span>
                            <span className="stats-sub-amount">¥{sub.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="stats-cat-bills">
                      {catBills.map(bill => {
                        const billCat = getCategoryDisplay(bill.categoryId);
                        return (
                          <div
                            key={bill.id}
                            className="stats-bill-item"
                            onClick={(e) => { e.stopPropagation(); routerNavigate(`/bill/${bill.id}`); }}
                          >
                            <div className="stats-bill-left">
                              <span className="stats-bill-sub-icon">{billCat.icon}</span>
                              <div className="stats-bill-info">
                                <div className="stats-bill-note">{bill.note || billCat.fullName}</div>
                                <div className="stats-bill-date">{dayjs(bill.date).format('M月D日 HH:mm')}</div>
                              </div>
                            </div>
                            <div className={`stats-bill-amount ${bill.type === 'expense' ? 'amount-expense' : 'amount-income'}`}>
                              {formatAmount(bill.amount, bill.type)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
