import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, PieChart, User, Plus } from 'lucide-react';
import './TabBar.css';

const tabs = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/calendar', icon: CalendarDays, label: '日历' },
  { path: '/add', icon: Plus, label: '记账', isCenter: true },
  { path: '/stats', icon: PieChart, label: '统计' },
  { path: '/profile', icon: User, label: '我的' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="tab-bar">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;

        if (tab.isCenter) {
          return (
            <button
              key={tab.path}
              className="tab-bar-center"
              onClick={() => navigate(tab.path)}
            >
              <div className="tab-bar-center-btn">
                <Icon size={28} color="#fff" />
              </div>
            </button>
          );
        }

        return (
          <button
            key={tab.path}
            className={`tab-bar-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <Icon size={22} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
