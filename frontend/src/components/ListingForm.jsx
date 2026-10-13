import { useState } from 'react';
import { api } from '../services/api.js';
import { Notice } from './Notice.jsx';

function localDate(date) {
  if (!date) return '';
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

export default function ListingForm({ listing, onSaved, onCancel }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: listing?.title || '', description: listing?.description || '',
    quantity: listing?.quantity || '', allergens: listing?.allergens?.join(', ') || '',
    pickupLocation: listing?.pickupLocation || '',
    pickupStart: localDate(listing?.pickupStart), deadline: localDate(listing?.deadline)
  });
  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setError(''); setSaving(true);
    const body = {
      ...form, quantity: Number(form.quantity),
      allergens: form.allergens.split(',').map(item => item.trim()).filter(Boolean),
      pickupStart: new Date(form.pickupStart).toISOString(), deadline: new Date(form.deadline).toISOString()
    };
    try {
      const result = await api(listing ? `/listings/${listing._id}` : '/listings', { method: listing ? 'PATCH' : 'POST', body });
      onSaved(result.listing);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return <form className="form-grid" onSubmit={submit}>
    <Notice error={error} />
    <label className="field">Food name<input name="title" value={form.title} onChange={change} placeholder="e.g. Fresh produce boxes" required minLength="3" maxLength="120" /></label>
    <label className="field field-wide">Description<textarea name="description" value={form.description} onChange={change} rows="3" required minLength="5" /></label>
    <label className="field">Quantity (meals)<input name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={change} required /></label>
    <label className="field field-wide">Allergens <span className="field-hint">Separate with commas</span><input name="allergens" value={form.allergens} onChange={change} placeholder="Dairy, peanuts..." /></label>
    <label className="field field-wide">Pickup location<input name="pickupLocation" value={form.pickupLocation} onChange={change} placeholder="Building, entrance, or address" required /></label>
    <label className="field">Pickup starts<input name="pickupStart" type="datetime-local" value={form.pickupStart} onChange={change} required /></label>
    <label className="field">Pickup deadline<input name="deadline" type="datetime-local" value={form.deadline} onChange={change} required /></label>
    <div className="form-actions field-wide"><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : listing ? 'Save changes' : 'Publish listing'}</button><button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button></div>
  </form>;
}
