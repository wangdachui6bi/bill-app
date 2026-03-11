import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Download, Upload, FileText, Info, BarChart3, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { Bill } from "../types";
import { getAllBills } from "../stores/billStore";
import { usePrivacy, maskValue } from "../contexts/PrivacyContext";
import localforage from "localforage";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const { masked } = usePrivacy();
  const mm = (v: string) => maskValue(v, masked);
  const [bills, setBills] = useState<Bill[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const totalExpense = bills
    .filter((b) => b.type === "expense")
    .reduce((s, b) => s + b.amount, 0);
  const totalIncome = bills
    .filter((b) => b.type === "income")
    .reduce((s, b) => s + b.amount, 0);

  const firstBillDate =
    bills.length > 0
      ? dayjs(bills[bills.length - 1].date).format("YYYY-MM-DD")
      : "暂无";

  const handleExport = async () => {
    const allBills = await getAllBills();
    const data = JSON.stringify(allBills, null, 2);
    const fileName = `bills-${dayjs().format("YYYYMMDD")}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
        await Share.share({
          title: "导出账单数据",
          text: `共 ${allBills.length} 条账单`,
          url: result.uri,
          dialogTitle: "保存账单数据",
        });
      } catch (err) {
        if ((err as Error).message?.includes("canceled")) return;
        alert("导出失败: " + (err as Error).message);
      }
    } else {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json,text/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const importedBills: Bill[] = JSON.parse(text);
        if (Array.isArray(importedBills)) {
          const existing = await getAllBills();
          const existingIds = new Set(existing.map((b) => b.id));
          const newBills = importedBills.filter((b) => !existingIds.has(b.id));
          const merged = [...newBills, ...existing];
          await localforage.setItem("bills", merged);
          window.dispatchEvent(new Event("billUpdated"));
          loadData();
          alert(`成功导入 ${newBills.length} 条新账单`);
        }
      } catch {
        alert("文件格式错误");
      }
    };
    input.click();
  };

  const handleClearAll = async () => {
    await localforage.clear();
    window.dispatchEvent(new Event("billUpdated"));
    loadData();
    setShowConfirm(false);
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className="profile-header">
          <div className="profile-avatar">📒</div>
          <div className="profile-title">记账小本</div>
          <div className="profile-sub">本地存储，数据安全</div>
        </div>

        {/* Stats Overview */}
        <div className="card profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{bills.length}</span>
            <span className="profile-stat-label">总账单数</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value amount-expense">
              ¥{mm(totalExpense.toFixed(0))}
            </span>
            <span className="profile-stat-label">累计支出</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value amount-income">
              ¥{mm(totalIncome.toFixed(0))}
            </span>
            <span className="profile-stat-label">累计收入</span>
          </div>
        </div>

        {/* Menu */}
        <div className="card profile-menu">
          <div className="profile-menu-item" onClick={handleExport}>
            <Download size={20} color="var(--primary)" />
            <span>导出数据</span>
            <span className="menu-arrow">›</span>
          </div>
          <div className="profile-menu-item" onClick={handleImport}>
            <Upload size={20} color="#4ECDC4" />
            <span>导入数据</span>
            <span className="menu-arrow">›</span>
          </div>
          <div className="profile-menu-item" onClick={() => navigate("/annual")}>
            <BarChart3 size={20} color="#FF6B6B" />
            <span>年度报告</span>
            <span className="menu-arrow">›</span>
          </div>
          <div className="profile-menu-item" onClick={() => navigate("/recurring")}>
            <RefreshCw size={20} color="#0984E3" />
            <span>周期性记账</span>
            <span className="menu-arrow">›</span>
          </div>
          <div className="profile-menu-item">
            <FileText size={20} color="#6C5CE7" />
            <span>记账天数</span>
            <span className="menu-value">从 {firstBillDate} 开始</span>
          </div>
          <div
            className="profile-menu-item"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 size={20} color="var(--danger)" />
            <span style={{ color: "var(--danger)" }}>清除所有数据</span>
            <span className="menu-arrow">›</span>
          </div>
        </div>

        <div className="card profile-menu">
          <div className="profile-menu-item">
            <Info size={20} color="var(--text-light)" />
            <span>关于</span>
            <span className="menu-value">v1.0.2</span>
          </div>
        </div>

        {/* Confirm Dialog */}
        {showConfirm && (
          <div
            className="confirm-overlay"
            onClick={() => setShowConfirm(false)}
          >
            <div
              className="confirm-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-title">确认清除</div>
              <p className="confirm-msg">
                确定要清除所有数据吗？此操作不可恢复。
              </p>
              <div className="confirm-actions">
                <button
                  className="confirm-cancel"
                  onClick={() => setShowConfirm(false)}
                >
                  取消
                </button>
                <button className="confirm-danger" onClick={handleClearAll}>
                  确认清除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
