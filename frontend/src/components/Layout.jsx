import { useState } from 'react';
import { ArrowRight, Bell, LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Brand from './Brand.jsx';

const roleLinks = {
  donor: [['Overview', '/dashboard', LayoutDashboard], ['My listings', '/dashboard#listings', Bell], ['Profile', '/profile', UserRound]],
  recipient: [['Overview', '/dashboard', LayoutDashboard], ['Find food', '/dashboard#marketplace', Bell], ['Profile', '/profile', UserRound]],
  volunteer: [['Overview', '/dashboard', LayoutDashboard], ['Pickups', '/dashboard#pickups', Bell], ['Profile', '/profile', UserRound]],
  admin: [['Overview', '/dashboard', LayoutDashboard], ['Organizations & users', '/dashboard#users', UserRound], ['Profile', '/profile', UserRound]]
};

function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  async function signOut() {
    try { await logout(); navigate('/'); } catch (error) { window.alert(error.message); }
  }
  return <header className="header">
    <div className="nav-wrap">
      <Brand />
      <nav className={open ? 'nav-links nav-open' : 'nav-links'}>
        {user ? <>
          {(roleLinks[user.role] || []).map(([label, to, Icon]) => <NavLink key={label} to={to} onClick={() => setOpen(false)}><Icon size={16} />{label}</NavLink>)}
          <span className="nav-user">Hi, {user.name.split(' ')[0]}</span>
          <button className="btn btn-quiet btn-small" onClick={signOut}><LogOut size={15} /> Sign out</button>
        </> : <>
          <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
          <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
          <Link to="/register" className="btn btn-primary btn-small" onClick={() => setOpen(false)}>Join FoodLoop <ArrowRight size={15} /></Link>
        </>}
      </nav>
      <button className="mobile-menu" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
  </header>;
}

export default function Layout() {
  return <><Header /><Outlet /></>;
}
