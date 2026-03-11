import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { PrivacyProvider } from './contexts/PrivacyContext';
import TabBar from './components/TabBar';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import AddBill from './pages/AddBill';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import BillDetail from './pages/BillDetail';
import Search from './pages/Search';
import AnnualReport from './pages/AnnualReport';
import RecurringBills from './pages/RecurringBills';
import { processRecurringBills } from './stores/billStore';

const HIDE_TAB_PATHS = ['/add', '/bill', '/search', '/annual', '/recurring'];

const TAB_PATHS = ['/', '/calendar', '/stats', '/profile'];

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const showTab = !HIDE_TAB_PATHS.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    processRecurringBills().then(count => {
      if (count > 0) window.dispatchEvent(new Event('billUpdated'));
    });
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      const isTabPage = TAB_PATHS.includes(location.pathname);

      if (isTabPage) {
        if (location.pathname === '/') {
          CapApp.minimizeApp();
        } else {
          navigate('/');
        }
      } else if (canGoBack) {
        navigate(-1);
      } else {
        navigate('/');
      }
    });

    return () => { listener.then(h => h.remove()); };
  }, [location.pathname, navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/add" element={<AddBill />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bill/:id" element={<BillDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/annual" element={<AnnualReport />} />
        <Route path="/recurring" element={<RecurringBills />} />
      </Routes>
      {showTab && <TabBar />}
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <PrivacyProvider>
        <AppLayout />
      </PrivacyProvider>
    </HashRouter>
  );
}
