import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, ClipboardList, HeartHandshake, MapPin, PackageCheck, Plus, RefreshCw, ShieldCheck, Truck, Users, Utensils } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading, Notice } from '../components/Notice.jsx';
import ListingForm from '../components/ListingForm.jsx';

const roleCopy = {
  donor: ['Donor dashboard', 'Every extra meal is an opportunity to nourish your community.'],
  recipient: ['Recipient dashboard', 'Find fresh surplus that fits your needs and pickup capacity.'],
  volunteer: ['Volunteer dashboard', 'Help good food find its way from pickup to people.'],
  admin: ['Community overview', 'Keep organizations verified and the FoodLoop moving safely.']
};
const date = value => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function Stat({ label, value, icon: Icon, tone = '' }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={19} /></span><div><small>{label}</small><strong>{value ?? '—'}</strong></div></article>;
}

function ListingCard({ listing, actions, note }) {
  return <article className="listing-card">
    <div className="listing-head"><span className="category-pill">{listing.category}</span><span className={`status-pill status-${listing.status}`}>{listing.status}</span></div>
    <h3>{listing.title}</h3><p>{listing.description}</p>
    <div className="listing-facts"><span><Utensils size={15} /> {listing.quantityAvailable} / {listing.quantity} {listing.unit}</span><span><MapPin size={15} /> {listing.pickupLocation}</span></div>
    <div className="listing-deadline">Pickup by <b>{date(listing.deadline)}</b></div>
    {listing.allergens?.length > 0 && <div className="allergen-list">Contains: {listing.allergens.join(', ')}</div>}
    {note && <div className="match-detail"><b>{note.score}% match</b>{note.explanation?.map(line => <small key={line}>{line}</small>)}</div>}
    {actions && <div className="listing-actions">{actions}</div>}
  </article>;
}

function ReservationRow({ reservation, user, refresh, notify, volunteers = [] }) {
  const [code, setCode] = useState('');
  const [volunteerId, setVolunteerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function action(path, body = {}) {
    setError(''); setBusy(true);
    try { await api(`/reservations/${reservation._id}/${path}`, { method: 'POST', body }); await refresh(); notify('Reservation updated.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const active = ['reserved', 'assigned'].includes(reservation.status);
  return <article className="reservation-row">
    <div className="reservation-main"><span className="reservation-icon"><PackageCheck size={19} /></span><div><b>{reservation.listing?.title || 'Food pickup'}</b><small>{reservation.quantity} · {reservation.recipient?.organization?.name || reservation.recipient?.name || 'Recipient'} · {date(reservation.listing?.deadline)}</small></div></div>
    <span className={`status-pill status-${reservation.status}`}>{reservation.status.replace('_', ' ')}</span>
    {user.role === 'volunteer' && reservation.status === 'reserved' && <button className="btn btn-outline btn-small" disabled={busy} onClick={() => action('assign')}>Accept pickup</button>}
    {(user.role === 'donor' || user.role === 'admin') && active && !reservation.volunteer && volunteers.length > 0 && <div className="verify-inline">
      <select aria-label="Choose volunteer" value={volunteerId} onChange={event => setVolunteerId(event.target.value)}>
        <option value="">Choose volunteer</option>{volunteers.map(volunteer => <option key={volunteer._id} value={volunteer._id}>{volunteer.name} · {volunteer.email}</option>)}
      </select>
      <button className="btn btn-outline btn-small" disabled={busy || !volunteerId} onClick={() => action('assign', { volunteerId })}>Assign</button>
    </div>}
    {(user.role === 'recipient' || user.role === 'admin') && active && <button className="btn btn-quiet btn-small" disabled={busy} onClick={() => action('cancel')}>Cancel reservation</button>}
    {(user.role === 'volunteer' && String(reservation.volunteer?._id) === user._id || user.role === 'donor' || user.role === 'admin') && active && <div className="verify-inline"><input aria-label="Pickup code" inputMode="numeric" maxLength="6" value={code} onChange={event => setCode(event.target.value)} placeholder="6-digit code" /><button className="btn btn-primary btn-small" disabled={busy || code.length !== 6} onClick={() => action('verify', { pickupCode: code })}>Verify handover</button></div>}
    {error && <small className="row-error">{error}</small>}
  </article>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null); const [listings, setListings] = useState([]);
  const [reservations, setReservations] = useState([]); const [users, setUsers] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const refresh = useCallback(async () => {
    setError('');
    try {
      const tasks = [api('/dashboard'), api('/listings'), api('/reservations')];
      if (user.role === 'admin') tasks.push(api('/admin/users'));
      if (user.role === 'admin' || user.role === 'donor') tasks.push(api('/reservations/volunteers'));
      const results = await Promise.all(tasks);
      setSummary(results[0].data); setListings(results[1].listings); setReservations(results[2].reservations);
      let resultIndex = 3;
      if (user.role === 'admin') setUsers(results[resultIndex++].users);
      if (user.role === 'admin' || user.role === 'donor') setVolunteers(results[resultIndex].volunteers);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => { refresh(); }, [refresh]);

  async function cancelListing(listing) {
    if (!window.confirm(`Cancel “${listing.title}”? Active reservations will also be cancelled.`)) return;
    try { await api(`/listings/${listing._id}/cancel`, { method: 'POST' }); setSuccess('Listing cancelled.'); await refresh(); }
    catch (err) { setError(err.message); }
  }
  async function updateAdmin(url, body, message) {
    try { await api(url, { method: 'PATCH', body }); setSuccess(message); await refresh(); }
    catch (err) { setError(err.message); }
  }
  function listingSaved() { setShowForm(false); setEditing(null); setSuccess('Listing saved.'); refresh(); }

  if (loading) return <Loading />;
  const [title, subtitle] = roleCopy[user.role];
  const stats = user.role === 'donor'
    ? [['Active listings', summary?.available, ClipboardList], ['Reservations', summary?.reserved, HeartHandshake], ['Meals rescued', summary?.mealsRescued, Utensils]]
    : user.role === 'recipient'
      ? [['Active reservations', summary?.activeReservations, ClipboardList], ['Pickups completed', summary?.pickupsCompleted, PackageCheck], ['Meals received', summary?.mealsReceived, Utensils]]
      : user.role === 'volunteer'
        ? [['Active assignments', summary?.activeAssignments, Truck], ['Completed pickups', summary?.completedPickups, PackageCheck], ['Meals delivered', summary?.mealsDelivered, Utensils]]
        : [['Community members', summary?.users, Users], ['Active listings', summary?.activeListings, ClipboardList], ['Meals rescued', summary?.mealsRescued, Utensils]];
  return <main className="dashboard-shell">
    <section className="dashboard-welcome"><div><span className="eyebrow">FOODLOOP / {user.role.toUpperCase()}</span><h1>{title}, {user.name.split(' ')[0]}.</h1><p>{subtitle}</p></div><button className="btn btn-outline btn-small" onClick={refresh}><RefreshCw size={15} /> Refresh</button></section>
    <Notice error={error} success={success} />
    <section className="stats-grid">{stats.map(([label, value, Icon], index) => <Stat key={label} label={label} value={value} icon={Icon} tone={['tone-green', 'tone-orange', 'tone-blue'][index]} />)}</section>
    {user.role === 'donor' && <section className="dashboard-section" id="listings"><div className="section-title"><div><span className="eyebrow">YOUR CONTRIBUTIONS</span><h2>Food listings</h2></div><button className="btn btn-primary btn-small" onClick={() => { setEditing(null); setShowForm(!showForm); }}><Plus size={16} /> Add a listing</button></div>
      {(showForm || editing) && <div className="panel form-panel"><ListingForm listing={editing} onSaved={listingSaved} onCancel={() => { setShowForm(false); setEditing(null); }} /></div>}
      {listings.length ? <div className="listing-grid">{listings.map(listing => <ListingCard key={listing._id} listing={listing} actions={<>
        <button className="btn btn-outline btn-small" disabled={listing.status !== 'available'} onClick={() => { setEditing(listing); setShowForm(false); }}>Edit</button>
        {listing.status !== 'cancelled' && <button className="btn btn-quiet btn-small" onClick={() => cancelListing(listing)}>Cancel listing</button>}
      </>} />)}</div> : <div className="empty-state"><Utensils size={25} /><b>Your first listing starts a loop.</b><p>Share your surplus food and help it find a new home.</p></div>}
      <div className="section-title sub-section-title"><div><span className="eyebrow">COORDINATE HANDOVERS</span><h2>Reservations</h2></div></div>
      <ReservationList reservations={reservations} user={user} refresh={refresh} notify={setSuccess} volunteers={volunteers} />
    </section>}
    {user.role === 'recipient' && <section className="dashboard-section" id="marketplace">
      <div className="section-title"><div><span className="eyebrow">FRESHLY SHARED</span><h2>Available near you</h2><p>Ranked with transparent pickup, capacity, deadline and dietary fit.</p></div></div>
      {!user.organization?.verified && <div className="notice notice-pending"><ShieldCheck size={18} /> Your organization is awaiting administrator verification. You can explore listings; ask your admin about reservation eligibility.</div>}
      {listings.length ? <div className="listing-grid">{listings.map(listing => <ListingCard key={listing._id} listing={listing} note={listing.match} actions={<button className="btn btn-primary btn-small" disabled={!listing.match?.eligible || !user.organization?.verified} onClick={async () => {
        const value = prompt(`How many ${listing.unit} would you like to reserve? (Available: ${listing.quantityAvailable})`);
        if (!value) return;
        try { const result = await api(`/reservations/${listing._id}`, { method: 'POST', body: { quantity: Number(value) } }); setSuccess(`Reserved! Save your one-time pickup code: ${result.pickupCode}`); await refresh(); }
        catch (err) { setError(err.message); }
      }}>Reserve food <ArrowRight size={15} /></button>} />)}</div> : <div className="empty-state"><Utensils size={25} /><b>No available listings just yet.</b><p>Check back soon; new food is shared every day.</p></div>}
      <div className="section-title sub-section-title"><div><span className="eyebrow">YOUR PICKUPS</span><h2>Reservation history</h2></div></div>
      <ReservationList reservations={reservations} user={user} refresh={refresh} notify={setSuccess} />
    </section>}
    {user.role === 'volunteer' && <section className="dashboard-section" id="pickups"><div className="section-title"><div><span className="eyebrow">HELP IT GET THERE</span><h2>Pickup opportunities</h2><p>Accept a reservation to become its assigned volunteer.</p></div></div>
      <ReservationList reservations={reservations.filter(item => item.status === 'reserved' || String(item.volunteer?._id) === user._id)} user={user} refresh={refresh} notify={setSuccess} />
      <div className="section-title sub-section-title"><div><span className="eyebrow">FOOD SHARED ON CAMPUS</span><h2>Available food to contact</h2><p>Contact the donor to coordinate a pickup. A recipient reservation is required before you can accept an assignment.</p></div></div>
      {listings.length ? <div className="listing-grid">{listings.map(listing => <ListingCard key={listing._id} listing={listing} actions={<div className="donor-contact">
        <span>Shared by <b>{listing.donor?.organization?.name || listing.donor?.name || 'Food donor'}</b></span>
        {listing.donor?.email && <a className="btn btn-outline btn-small" href={`mailto:${listing.donor.email}?subject=${encodeURIComponent(`FoodLoop pickup: ${listing.title}`)}`}>Email donor</a>}
        {listing.donor?.phone && <a className="btn btn-outline btn-small" href={`tel:${listing.donor.phone}`}>Call donor</a>}
        {!listing.donor?.email && !listing.donor?.phone && <span className="contact-hint">Donor contact details are not available yet.</span>}
      </div>} />)}</div> : <div className="empty-state"><Utensils size={25} /><b>No available food listings right now.</b><p>When a donor shares food, it will appear here with their contact details.</p></div>}
    </section>}
    {user.role === 'admin' && <section className="dashboard-section" id="users"><div className="section-title"><div><span className="eyebrow">COMMUNITY OVERSIGHT</span><h2>Organizations & members</h2><p>{summary?.organizationsAwaitingVerification ?? 0} recipient organization(s) awaiting verification.</p></div></div>
      <div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Member</th><th>Role</th><th>Organization</th><th>Verification</th><th>Account</th><th>Actions</th></tr></thead><tbody>{users.map(member => <tr key={member._id}><td><b>{member.name}</b><small>{member.email}</small></td><td><select className="role-select" aria-label={`Role for ${member.name}`} value={member.role} disabled={member._id === user._id} onChange={event => updateAdmin(`/admin/users/${member._id}`, { role: event.target.value }, 'Member role updated.')}><option value="donor">Donor</option><option value="recipient">Recipient</option><option value="volunteer">Volunteer</option><option value="admin">Admin</option></select></td><td>{member.organization?.name || '—'}</td><td>{member.role === 'recipient' ? member.organization?.verified ? <span className="verified-tag"><BadgeCheck size={14} /> Verified</span> : <span className="pending-tag">Pending</span> : '—'}</td><td><span className={member.active ? 'account-active' : 'account-inactive'}>{member.active ? 'Active' : 'Disabled'}</span></td><td className="table-actions">{member.role === 'recipient' && <button className="btn btn-outline btn-small" onClick={() => updateAdmin(`/admin/organizations/${member._id}/verification`, { verified: !member.organization?.verified }, 'Organization status updated.')}>{member.organization?.verified ? 'Unverify' : 'Verify'}</button>}<button className="btn btn-quiet btn-small" disabled={member._id === user._id} onClick={() => updateAdmin(`/admin/users/${member._id}`, { active: !member.active }, `Account ${member.active ? 'disabled' : 'enabled'}.`)}>{member.active ? 'Disable' : 'Enable'}</button></td></tr>)}</tbody></table></div></div>
      <div className="section-title sub-section-title"><div><span className="eyebrow">HANDOVER OVERSIGHT</span><h2>All reservations</h2></div></div>
      <ReservationList reservations={reservations} user={user} refresh={refresh} notify={setSuccess} volunteers={volunteers} />
      <div className="section-title sub-section-title"><div><span className="eyebrow">PLATFORM ACTIVITY</span><h2>Recent audit log</h2></div></div>
      <div className="panel audit-list">{(summary?.auditLogs || []).map(log => <div className="audit-row" key={log._id}><span className="step-icon"><ShieldCheck size={17} /></span><div><b>{log.action.replaceAll('.', ' ')}</b><small>{log.actor?.name || 'System'} · {log.entityType} {log.entityId}</small></div><time>{date(log.createdAt)}</time></div>)}</div>
      <div className="section-title sub-section-title"><div><span className="eyebrow">LISTING MONITOR</span><h2>All food listings</h2></div></div>
      <div className="listing-grid">{listings.map(listing => <ListingCard key={listing._id} listing={listing} actions={<button className="btn btn-quiet btn-small" disabled={listing.status === 'cancelled' || listing.status === 'claimed'} onClick={() => cancelListing(listing)}>Cancel listing</button>} />)}</div>
    </section>}
  </main>;
}

function ReservationList({ reservations, user, refresh, notify, volunteers = [] }) {
  if (!reservations.length) return <div className="empty-state compact"><ClipboardList size={23} /><b>No reservations yet.</b><p>They’ll appear here when food has been reserved.</p></div>;
  return <div className="reservation-list">{reservations.map(reservation => <ReservationRow key={reservation._id} reservation={reservation} user={user} refresh={refresh} notify={notify} volunteers={volunteers} />)}</div>;
}
