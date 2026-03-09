import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import TabBar from './components/TabBar';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import AddBill from './pages/AddBill';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import BillDetail from './pages/BillDetail';

const HIDE_TAB_PATHS = ['/add', '/bill'];

function AppLayout() {
  const location = useLocation();
  const showTab = !HIDE_TAB_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/add" element={<AddBill />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bill/:id" element={<BillDetail />} />
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
