import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Pencil, Search, Eye, EyeOff } from "lucide-react";
import dayjs from "dayjs";
import type { Bill, Budget } from "../types";
import { getAllBills, getBudget, setBudget } from "../stores/billStore";
import { getMonthKey } from "../utils/formatters";
import { usePrivacy, maskValue } from "../contexts/PrivacyContext";
import SwipeBillItem from "../components/SwipeBillItem";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { masked, toggle: togglePrivacy } = usePrivacy();
  const m = (v: string) => maskValue(v, masked);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budget, setBudgetState] = useState<Budget | null>(null);
  const [currentMonth] = useState(dayjs());
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const loadData = useCallback(async () => {
    const allBills = await getAllBills();
    setBills(allBills);
    const monthKey = getMonthKey(currentMonth.toDate());
    const b = await getBudget(monthKey);
    setBudgetState(b);
  }, [currentMonth]);

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("billUpdated", handler);
    return () => window.removeEventListener("billUpdated", handler);
  }, [loadData]);

  const monthBills = bills.filter((b) => {
    const d = dayjs(b.date);
    return (
      d.year() === currentMonth.year() && d.month() === currentMonth.month()
    );
  });

  const totalExpense = monthBills
    .filter((b) => b.type === "expense")
    .reduce((sum, b) => sum + b.amount, 0);

  const totalIncome = monthBills
    .filter((b) => b.type === "income")
    .reduce((sum, b) => sum + b.amount, 0);

  const balance = totalIncome - totalExpense;

  const recentBills = [...bills]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const lastMonth = currentMonth.subtract(1, "month");
  const lastMonthBills = bills.filter((b) => {
    const d = dayjs(b.date);
    return d.year() === lastMonth.year() && d.month() === lastMonth.month();
  });
  const lastMonthExpense = lastMonthBills
    .filter((b) => b.type === "expense")
    .reduce((s, b) => s + b.amount, 0);
  const lastMonthIncome = lastMonthBills
    .filter((b) => b.type === "income")
    .reduce((s, b) => s + b.amount, 0);
  const expenseDiff = lastMonthExpense > 0
    ? ((totalExpense - lastMonthExpense) / lastMonthExpense) * 100
    : 0;
  const incomeDiff = lastMonthIncome > 0
    ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100
    : 0;

  const budgetAmount = budget?.amount || 0;
  const budgetRemaining = budgetAmount - totalExpense;
  const budgetPercent =
    budgetAmount > 0 ? Math.min((totalExpense / budgetAmount) * 100, 100) : 0;

  const daysInMonth = currentMonth.daysInMonth();
  const currentDay = dayjs().date();
  const dailyAvg = currentDay > 0 ? totalExpense / currentDay : 0;
  const remainingDays = daysInMonth - currentDay;
  const dailyBudget =
    budgetAmount > 0 && remainingDays > 0 ? budgetRemaining / remainingDays : 0;

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount >= 0) {
      const monthKey = getMonthKey(currentMonth.toDate());
      await setBudget({ month: monthKey, amount });
      setBudgetState({ month: monthKey, amount });
      setShowBudgetInput(false);
    }
  };

  return (
    <div className="page">
      <div className="page-content">
        {/* Header */}
        <div className="home-header">
          <div className="home-header-bg" />
          <div className="home-header-content">
            <div className="home-top-row">
              <div className="home-month-label">
                {currentMonth.format("M")}月 · 支出
              </div>
              <div className="home-top-actions">
                <button className="home-privacy-btn" onClick={togglePrivacy}>
                  {masked ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button className="home-search-btn" onClick={() => navigate("/search")}>
                  <Search size={20} />
                </button>
              </div>
            </div>
            <div className="home-total-expense">{m(totalExpense.toFixed(2))}</div>
            <div className="home-summary-row">
              <span>收入 {m(totalIncome.toFixed(2))}</span>
              <span>结余 {m(balance.toFixed(2))}</span>
            </div>
          </div>
        </div>

        {/* Budget Card */}
        <div className="card home-budget-card fade-in">
          <div className="budget-header">
            <span className="budget-title">本月预算</span>
            <button
              className="budget-edit"
              onClick={() => {
                setBudgetInput(budgetAmount.toString());
                setShowBudgetInput(true);
              }}
            >
              {m(budgetAmount.toFixed(2))} <Pencil size={14} />
            </button>
          </div>
          {showBudgetInput && (
            <div className="budget-input-row">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="输入预算金额"
                autoFocus
              />
              <button className="budget-save-btn" onClick={handleSaveBudget}>
                确定
              </button>
              <button
                className="budget-cancel-btn"
                onClick={() => setShowBudgetInput(false)}
              >
                取消
              </button>
            </div>
          )}
          <div className="budget-progress">
            <div className="budget-progress-bar">
              <div
                className="budget-progress-fill"
                style={{
                  width: `${budgetPercent}%`,
                  background:
                    budgetPercent > 80 ? "var(--danger)" : "var(--primary)",
                }}
              />
            </div>
            <div className="budget-progress-labels">
              <span>{budgetPercent.toFixed(0)}%</span>
              <span>已消费 {m(totalExpense.toFixed(2))}</span>
              <span className="budget-remaining">
                剩余额度{" "}
                {m(budgetRemaining > 0 ? budgetRemaining.toFixed(2) : "0.00")}
              </span>
            </div>
          </div>
          <div className="budget-daily">
            <div className="budget-daily-item">
              <span className="dot orange" />
              <span>本月日均消费</span>
              <span className="budget-daily-amount">{m(dailyAvg.toFixed(2))}</span>
            </div>
            <div className="budget-daily-item">
              <span className="dot blue" />
              <span>剩余每日可消费</span>
              <span className="budget-daily-amount">
                {m(dailyBudget > 0 ? dailyBudget.toFixed(2) : "0.00")}
              </span>
            </div>
          </div>
        </div>

        {/* Month Comparison */}
        {(lastMonthExpense > 0 || lastMonthIncome > 0) && (
          <div className="card home-comparison fade-in">
            <div className="comparison-title">对比上月</div>
            <div className="comparison-row">
              <div className="comparison-item">
                <span className="comparison-label">支出</span>
                <span className="comparison-last">上月 ¥{m(lastMonthExpense.toFixed(0))}</span>
                {lastMonthExpense > 0 && (
                  <span className={`comparison-badge ${expenseDiff > 0 ? "up" : "down"}`}>
                    {expenseDiff > 0 ? "↑" : "↓"} {Math.abs(expenseDiff).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="comparison-divider" />
              <div className="comparison-item">
                <span className="comparison-label">收入</span>
                <span className="comparison-last">上月 ¥{m(lastMonthIncome.toFixed(0))}</span>
                {lastMonthIncome > 0 && (
                  <span className={`comparison-badge ${incomeDiff > 0 ? "up green" : "down"}`}>
                    {incomeDiff > 0 ? "↑" : "↓"} {Math.abs(incomeDiff).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Bills */}
        <div className="card home-recent-card fade-in">
          <div className="recent-header">
            <span className="recent-title">近期账单</span>
            <button
              className="recent-more"
              onClick={() => navigate("/calendar")}
            >
              全部账单 <ChevronRight size={16} />
            </button>
          </div>
          {recentBills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>还没有账单记录</p>
              <p className="empty-sub">快去记一笔吧</p>
            </div>
          ) : (
            <div className="recent-list">
              {recentBills.map((bill) => (
                <SwipeBillItem key={bill.id} bill={bill} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
