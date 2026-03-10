import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import * as echarts from 'echarts/core';
import { BarChart as BarChartComponent } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { Bill } from '../types';
import { getAllBills } from '../stores/billStore';
import { getCategoryDisplay, getCategoryById } from '../utils/categories';
import './AnnualReport.css';

echarts.use([BarChartComponent, GridComponent, TooltipComponent, CanvasRenderer]);

export default function AnnualReport() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [year, setYear] = useState(dayjs().year());
  const barRef = useRef<HTMLDivElement>(null);
  const barChart = useRef<echarts.ECharts | null>(null);

  const loadData = useCallback(async () => {
    setBills(await getAllBills());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const yearBills = bills.filter(b => dayjs(b.date).year() === year);
  const totalExpense = yearBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0);
  const totalIncome = yearBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0);
  const billCount = yearBills.length;
  const recordDays = new Set(yearBills.map(b => dayjs(b.date).format('YYYY-MM-DD'))).size;

  const monthlyData = Array.from({ length: 12 }, (_, m) => {
    const mBills = yearBills.filter(b => dayjs(b.date).month() === m);
    return {
      month: m + 1,
      expense: mBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0),
      income: mBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0),
    };
  });

  const maxExpenseMonth = monthlyData.reduce((max, d) => d.expense > max.expense ? d : max, monthlyData[0]);
  const maxIncomeMonth = monthlyData.reduce((max, d) => d.income > max.income ? d : max, monthlyData[0]);

  const catMap = new Map<string, number>();
  yearBills.filter(b => b.type === 'expense').forEach(b => {
    const cat = getCategoryById(b.categoryId);
    const pid = cat?.parentId || b.categoryId;
    catMap.set(pid, (catMap.get(pid) || 0) + b.amount);
  });
  const topCategories = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, amount]) => ({ ...getCategoryDisplay(id), id, amount }));

  const biggestBill = yearBills
    .filter(b => b.type === 'expense')
    .sort((a, b) => b.amount - a.amount)[0];

  useEffect(() => {
    if (!barRef.current) return;
    if (!barChart.current) barChart.current = echarts.init(barRef.current);
    barChart.current.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = params as { name: string; seriesName: string; value: number }[];
          return p.map(s => `${s.name} ${s.seriesName}: ¥${s.value.toFixed(0)}`).join('<br/>');
        },
      },
      grid: { left: 50, right: 16, top: 24, bottom: 28 },
      xAxis: {
        type: 'category',
        data: monthlyData.map(d => `${d.month}月`),
        axisLabel: { fontSize: 10 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#E0E0E0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(0)}w` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}` },
        splitLine: { lineStyle: { color: '#F0F0F0' } },
      },
      series: [
        {
          name: '支出',
          type: 'bar',
          data: monthlyData.map(d => Number(d.expense.toFixed(0))),
          barMaxWidth: 14,
          itemStyle: { borderRadius: [3, 3, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#FF6B6B' }, { offset: 1, color: '#FF9F43' }]) },
        },
        {
          name: '收入',
          type: 'bar',
          data: monthlyData.map(d => Number(d.income.toFixed(0))),
          barMaxWidth: 14,
          itemStyle: { borderRadius: [3, 3, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#2ED573' }, { offset: 1, color: '#7BED9F' }]) },
        },
      ],
    }, true);
    const h = () => barChart.current?.resize();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [monthlyData]);

  return (
    <div className="page annual-page">
      <div className="annual-header">
        <button className="add-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <span className="annual-title">年度报告</span>
      </div>

      <div className="page-content">
        <div className="annual-year-nav">
          <button onClick={() => setYear(y => y - 1)}><ChevronLeft size={20} /></button>
          <span className="annual-year">{year}年</span>
          <button onClick={() => setYear(y => y + 1)} disabled={year >= dayjs().year()}>
            <ChevronRight size={20} />
          </button>
        </div>

        {yearBills.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <div className="empty-icon">📊</div>
            <p>{year}年暂无记账数据</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="annual-overview">
              <div className="annual-card expense-card">
                <div className="annual-card-label">全年支出</div>
                <div className="annual-card-value">¥{totalExpense.toFixed(0)}</div>
                <div className="annual-card-sub">月均 ¥{(totalExpense / 12).toFixed(0)}</div>
              </div>
              <div className="annual-card income-card">
                <div className="annual-card-label">全年收入</div>
                <div className="annual-card-value">¥{totalIncome.toFixed(0)}</div>
                <div className="annual-card-sub">月均 ¥{(totalIncome / 12).toFixed(0)}</div>
              </div>
            </div>

            <div className="annual-stats-row">
              <div className="annual-stat">
                <span className="annual-stat-num">{billCount}</span>
                <span className="annual-stat-label">总笔数</span>
              </div>
              <div className="annual-stat">
                <span className="annual-stat-num">{recordDays}</span>
                <span className="annual-stat-label">记账天数</span>
              </div>
              <div className="annual-stat">
                <span className="annual-stat-num">¥{(totalIncome - totalExpense).toFixed(0)}</span>
                <span className="annual-stat-label">年度结余</span>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="card">
              <div className="annual-section-title">月度趋势</div>
              <div ref={barRef} className="annual-bar" />
            </div>

            {/* Highlights */}
            <div className="card annual-highlights">
              <div className="annual-section-title">年度亮点</div>
              <div className="highlight-item">
                <span className="highlight-emoji">💸</span>
                <div className="highlight-info">
                  <div className="highlight-label">支出最多的月份</div>
                  <div className="highlight-value">{maxExpenseMonth.month}月 · ¥{maxExpenseMonth.expense.toFixed(0)}</div>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-emoji">💰</span>
                <div className="highlight-info">
                  <div className="highlight-label">收入最多的月份</div>
                  <div className="highlight-value">{maxIncomeMonth.month}月 · ¥{maxIncomeMonth.income.toFixed(0)}</div>
                </div>
              </div>
              {biggestBill && (
                <div className="highlight-item">
                  <span className="highlight-emoji">🏆</span>
                  <div className="highlight-info">
                    <div className="highlight-label">单笔最大支出</div>
                    <div className="highlight-value">
                      ¥{biggestBill.amount.toFixed(0)} · {biggestBill.note || getCategoryDisplay(biggestBill.categoryId).fullName}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Categories */}
            <div className="card annual-top-cats">
              <div className="annual-section-title">支出 TOP 5 分类</div>
              {topCategories.map((c, i) => {
                const pct = totalExpense > 0 ? (c.amount / totalExpense) * 100 : 0;
                return (
                  <div key={c.id} className="annual-cat-item">
                    <span className="annual-cat-rank">{i + 1}</span>
                    <span className="annual-cat-icon">{c.icon}</span>
                    <div className="annual-cat-info">
                      <div className="annual-cat-name">{c.name}</div>
                      <div className="annual-cat-bar-wrap">
                        <div className="annual-cat-bar" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                    </div>
                    <div className="annual-cat-right">
                      <div className="annual-cat-amount">¥{c.amount.toFixed(0)}</div>
                      <div className="annual-cat-pct">{pct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
