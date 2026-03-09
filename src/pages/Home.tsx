import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Pencil } from "lucide-react";
import dayjs from "dayjs";
import type { Bill, Budget } from "../types";
import { getAllBills, getBudget, setBudget } from "../stores/billStore";
import { getCategoryDisplay } from "../utils/categories";
import { formatAmount, getMonthKey } from "../utils/formatters";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
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

  const recentBills = bills.slice(0, 10);

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
            <div className="home-month-label">
              {currentMonth.format("M")}月 · 支出
            </div>
            <div className="home-total-expense">{totalExpense.toFixed(2)}</div>
            <div className="home-summary-row">
              <span>收入 {totalIncome.toFixed(2)}</span>
              <span>结余 {balance.toFixed(2)}</span>
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
              {budgetAmount.toFixed(2)} <Pencil size={14} />
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
              <span>已消费 {totalExpense.toFixed(2)}</span>
              <span className="budget-remaining">
                剩余额度{" "}
                {budgetRemaining > 0 ? budgetRemaining.toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
          <div className="budget-daily">
            <div className="budget-daily-item">
              <span className="dot orange" />
              <span>本月日均消费</span>
              <span className="budget-daily-amount">{dailyAvg.toFixed(2)}</span>
            </div>
            <div className="budget-daily-item">
              <span className="dot blue" />
              <span>剩余每日可消费</span>
              <span className="budget-daily-amount">
                {dailyBudget > 0 ? dailyBudget.toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
        </div>

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
              {recentBills.map((bill) => {
                const cat = getCategoryDisplay(bill.categoryId);
                return (
                  <div
                    key={bill.id}
                    className="bill-item"
                    onClick={() => navigate(`/bill/${bill.id}`)}
                  >
                    <div
                      className="bill-item-icon"
                      style={{ background: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="bill-item-info">
                      <div className="bill-item-category">{cat.fullName}</div>
                      <div className="bill-item-meta">
                        {bill.note && (
                          <span className="bill-item-note">{bill.note}</span>
                        )}
                        <span className="bill-item-date">
                          {dayjs(bill.date).format("MM/DD HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`bill-item-amount ${bill.type === "expense" ? "amount-expense" : "amount-income"}`}
                    >
                      {formatAmount(bill.amount, bill.type)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
