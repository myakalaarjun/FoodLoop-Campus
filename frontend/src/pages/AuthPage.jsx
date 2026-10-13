import { useState } from 'react';
import { ArrowLeft, ArrowRight, Leaf, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Notice } from '../components/Notice.jsx';

export default function AuthPage({ mode }) {
  const registering = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', password: '', role: 'recipient', organizationName: '', capacity: '20' });
  if (user) return <Navigate to="/dashboard" replace />;
  function change(event) { setValues({ ...values, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (registering) {
        await register({
          name: values.name, email: values.email, password: values.password, role: values.role,
          ...(values.role === 'recipient' ? { organization: { name: values.organizationName, capacity: Number(values.capacity) } } : {})
        });
      } else await login({ email: values.email, password: values.password });
      navigate('/dashboard');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-decoration"><div className="auth-leaf"><Leaf size={42} /></div><span className="auth-note note-a">Good food goes further.</span><span className="auth-note note-b">Share a little. Change a lot.</span></div>
    <section className="auth-card"><Link to="/" className="back-link"><ArrowLeft size={16} /> Back home</Link><span className="eyebrow">{registering ? 'Your place in the loop' : 'Welcome back'}</span><h1>{registering ? 'Let’s make good happen.' : 'Good to see you again.'}</h1><p className="auth-subtitle">{registering ? 'Create your account and help surplus find its way.' : 'Sign in to continue sharing good food.'}</p>
      <Notice error={error} />
      <form onSubmit={submit} className="auth-form">
        {registering && <label className="field">Your name<span className="input-icon"><UserRound size={17} /><input name="name" value={values.name} onChange={change} placeholder="Alex Morgan" required minLength="2" /></span></label>}
        <label className="field">Email address<span className="input-icon"><Mail size={17} /><input name="email" type="email" value={values.email} onChange={change} placeholder="you@example.com" required /></span></label>
        <label className="field">Password<span className="input-icon"><LockKeyhole size={17} /><input name="password" type="password" value={values.password} onChange={change} placeholder="At least 8 characters" minLength="8" required /></span></label>
        {registering && <>
          <label className="field">I’m joining as<select name="role" value={values.role} onChange={change}><option value="recipient">Recipient organization</option><option value="donor">Food donor</option><option value="volunteer">Volunteer</option></select></label>
          {values.role === 'recipient' && <div className="org-fields">
            <label className="field">Organization name<input name="organizationName" value={values.organizationName} onChange={change} placeholder="Community pantry" required /></label>
            <label className="field">Meals capacity<input name="capacity" type="number" min="0" value={values.capacity} onChange={change} required /></label>
          </div>}
        </>}
        <button className="btn btn-primary btn-full btn-large" disabled={busy}>{busy ? 'One moment...' : registering ? 'Create my account' : 'Sign in'} <ArrowRight size={17} /></button>
      </form>
      <p className="auth-switch">{registering ? 'Already have an account?' : 'New to FoodLoop?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create an account'}</Link></p>
      <p className="admin-hint">Administrator accounts are provisioned by your FoodLoop administrator.</p>
    </section>
  </main>;
}
