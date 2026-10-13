import { useState } from 'react';
import { ArrowLeft, BadgeCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { Notice } from '../components/Notice.jsx';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [org, setOrg] = useState({
    name: user.organization?.name || '', description: user.organization?.description || '',
    capacity: user.organization?.capacity || 0, dietaryNeeds: (user.organization?.dietaryNeeds || []).join(', '),
    pickupAvailability: (user.organization?.pickupAvailability || []).join(', ')
  });
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true);
    try {
      await api('/auth/profile', { method: 'PATCH', body: {
        name, phone,
        ...(user.role === 'recipient' ? { organization: {
          ...org, capacity: Number(org.capacity),
          dietaryNeeds: org.dietaryNeeds.split(',').map(value => value.trim()).filter(Boolean),
          pickupAvailability: org.pickupAvailability.split(',').map(value => value.trim()).filter(Boolean)
        } } : {})
      } });
      await refreshUser(); setSuccess('Your profile has been updated.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="page-shell"><div className="page-top"><Link to="/dashboard" className="back-link"><ArrowLeft size={16} /> Dashboard</Link><span className="eyebrow">Your account</span><h1>Profile & preferences</h1><p>Keep your contact details and pickup preferences up to date.</p></div>
    <form className="panel profile-panel" onSubmit={submit}><Notice error={error} success={success} /><div className="profile-id"><span className="profile-avatar"><UserRound /></span><div><b>{user.name}</b><small>{user.email}</small></div><span className="role-pill">{user.role}</span></div>
      <div className="form-grid">
        <label className="field">Full name<input value={name} onChange={event => setName(event.target.value)} required minLength="2" /></label>
        <label className="field">Phone<input value={phone} onChange={event => setPhone(event.target.value)} /></label>
        {user.role === 'recipient' && <>
          <div className="field field-wide org-verified">Organization verification <span className={user.organization?.verified ? 'verified-tag' : 'pending-tag'}>{user.organization?.verified ? <><BadgeCheck size={14} /> Verified</> : 'Verification pending'}</span></div>
          <label className="field field-wide">Organization name<input value={org.name} onChange={event => setOrg({ ...org, name: event.target.value })} /></label>
          <label className="field field-wide">About your organization<textarea rows="3" value={org.description} onChange={event => setOrg({ ...org, description: event.target.value })} /></label>
          <label className="field">Pickup capacity (meals)<input type="number" min="0" value={org.capacity} onChange={event => setOrg({ ...org, capacity: event.target.value })} /></label>
          <label className="field">Dietary needs / allergens to avoid<input value={org.dietaryNeeds} onChange={event => setOrg({ ...org, dietaryNeeds: event.target.value })} placeholder="Comma separated" /></label>
          <label className="field field-wide">Pickup availability<span className="field-hint">Use ISO date-times, comma separated. Blank means flexible.</span><input value={org.pickupAvailability} onChange={event => setOrg({ ...org, pickupAvailability: event.target.value })} placeholder="2026-10-14T14:00:00Z" /></label>
        </>}
        <div className="field-wide form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</button></div>
      </div>
    </form>
  </main>;
}
