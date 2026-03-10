import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import type { Bill } from "../types";
import { getAllBills } from "../stores/billStore";
import SwipeBillItem from "../components/SwipeBillItem";
import "./Calendar.css";

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export default function Calendar() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(dayjs().year());

  const loadData = useCallback(async () => {
    const allBills = await getAllBills();
    setBills(allBills);
  }, []);

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("billUpdated", handler);
    return () => window.removeEventListener("billUpdated", handler);
  }, [loadData]);

  const yearRange = useMemo(() => {
    if (bills.length === 0) return { min: dayjs().year() - 5, max: dayjs().year() };
    const years = bills.map(b => dayjs(b.date).year());
    return { min: Math.min(...years), max: Math.max(...years, dayjs().year()) };
  }, [bills]);

  const handlePickMonth = (month: number) => {
    setCurrentMonth(dayjs().year(pickerYear).month(month));
    setShowPicker(false);
  };

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfWeek = currentMonth.startOf("month").day();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDayBills = (day: number) => {
    const dateStr = currentMonth.date(day).format("YYYY-MM-DD");
    return bills.filter((b) => dayjs(b.date).format("YYYY-MM-DD") === dateStr);
  };

  const getDayTotal = (day: number) => {
    const dayBills = getDayBills(day);
    return dayBills
      .filter((b) => b.type === "expense")
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const selectedBills = bills.filter(
    (b) => dayjs(b.date).format("YYYY-MM-DD") === selectedDate,
  );

  const monthBills = bills.filter((b) => {
    const d = dayjs(b.date);
    return (
      d.year() === currentMonth.year() && d.month() === currentMonth.month()
    );
  });

  const monthExpense = monthBills
    .filter((b) => b.type === "expense")
    .reduce((s, b) => s + b.amount, 0);
  const monthIncome = monthBills
    .filter((b) => b.type === "income")
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div className="page">
      <div className="page-content">
        {/* Month Navigation */}
        <div className="calendar-nav">
          <button
            onClick={() => setCurrentMonth((prev) => prev.subtract(1, "month"))}
          >
            <ChevronLeft size={20} />
          </button>
          <span
            className="calendar-month-label clickable"
            onClick={() => { setPickerYear(currentMonth.year()); setShowPicker(true); }}
          >
            {currentMonth.format("YYYY年M月")}
            <span className="picker-arrow">▾</span>
          </span>
          <button
            onClick={() => setCurrentMonth((prev) => prev.add(1, "month"))}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Year-Month Picker Overlay */}
        {showPicker && (
          <div className="ym-picker-overlay" onClick={() => setShowPicker(false)}>
            <div className="ym-picker" onClick={e => e.stopPropagation()}>
              <div className="ym-picker-year-nav">
                <button
                  disabled={pickerYear <= yearRange.min}
                  onClick={() => setPickerYear(y => y - 1)}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="ym-picker-year">{pickerYear}年</span>
                <button
                  disabled={pickerYear >= yearRange.max}
                  onClick={() => setPickerYear(y => y + 1)}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="ym-picker-months">
                {MONTHS.map((label, i) => {
                  const isActive = pickerYear === currentMonth.year() && i === currentMonth.month();
                  const isFuture = pickerYear === dayjs().year() && i > dayjs().month();
                  return (
                    <button
                      key={i}
                      className={`ym-month-btn ${isActive ? "active" : ""}`}
                      disabled={isFuture}
                      onClick={() => handlePickMonth(i)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <button className="ym-picker-today" onClick={() => { setCurrentMonth(dayjs()); setShowPicker(false); }}>
                回到今天
              </button>
            </div>
          </div>
        )}

        {/* Month Summary */}
        <div className="calendar-summary">
          <div className="calendar-summary-item">
            <span className="label">支出</span>
            <span className="value expense">¥{monthExpense.toFixed(2)}</span>
          </div>
          <div className="calendar-summary-item">
            <span className="label">收入</span>
            <span className="value income">¥{monthIncome.toFixed(2)}</span>
          </div>
          <div className="calendar-summary-item">
            <span className="label">结余</span>
            <span className="value">
              {(monthIncome - monthExpense).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="card calendar-card">
          <div className="calendar-weekdays">
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <div key={d} className="weekday">
                {d}
              </div>
            ))}
          </div>
          <div className="calendar-days">
            {days.map((day, i) => {
              if (day === null)
                return (
                  <div key={`empty-${i}`} className="calendar-day empty" />
                );
              const dateStr = currentMonth.date(day).format("YYYY-MM-DD");
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === dayjs().format("YYYY-MM-DD");
              const dayTotal = getDayTotal(day);
              const hasBills = getDayBills(day).length > 0;

              return (
                <button
                  key={day}
                  className={`calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <span className="day-num">{day}</span>
                  {hasBills && (
                    <span className="day-amount">
                      {dayTotal > 0
                        ? `-${dayTotal > 999 ? "999+" : dayTotal.toFixed(0)}`
                        : ""}
                    </span>
                  )}
                  {hasBills && !dayTotal && <span className="day-dot" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Bills */}
        <div className="card calendar-bills">
          <div className="calendar-bills-header">
            <span>{dayjs(selectedDate).format("M月D日")} 账单</span>
            <span className="calendar-bills-count">
              {selectedBills.length}笔
            </span>
          </div>
          {selectedBills.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                当日没有账单
              </p>
            </div>
          ) : (
            <div className="recent-list">
              {selectedBills.map((bill) => (
                <SwipeBillItem key={bill.id} bill={bill} dateFormat="HH:mm" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
