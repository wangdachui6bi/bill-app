import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
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

function AppLayout() {
  const location = useLocation();
  const showTab = !HIDE_TAB_PATHS.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    processRecurringBills().then(count => {
      if (count > 0) window.dispatchEvent(new Event('billUpdated'));
    });
  }, []);

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
      <AppLayout />
    </HashRouter>
  );
}
