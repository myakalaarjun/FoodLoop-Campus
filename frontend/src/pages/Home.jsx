import { ArrowDownRight, ArrowRight, BadgeCheck, HandHeart, Leaf, MapPin, Recycle, Sparkles, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const steps = [
  { number: '01', title: 'Share what you have', text: 'Campus kitchens and stores post good food before it goes to waste.', icon: Utensils },
  { number: '02', title: 'Match with local need', text: 'Community organizations see eligible food ranked by clear, explainable fit.', icon: Sparkles },
  { number: '03', title: 'Pick up & pass it on', text: 'A secure handover code confirms every pickup, from donation to delivery.', icon: HandHeart }
];

export default function Home() {
  const { user } = useAuth();
  return <main>
    <section className="hero">
      <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
      <div className="hero-content">
        <span className="eyebrow"><span className="eyebrow-dot" /> A little less waste. A lot more care.</span>
        <h1>Good food deserves<br />a <span>second destination.</span></h1>
        <p className="hero-copy">FoodLoop Campus connects fresh surplus food with the people and organizations who need it most. Simple for you, meaningful for everyone.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary btn-large" to={user ? '/dashboard' : '/register'}>{user ? 'Go to your dashboard' : 'Join the loop'} <ArrowRight size={18} /></Link>
          <a className="text-link" href="#how-it-works">See how it works <ArrowDownRight size={17} /></a>
        </div>
        <div className="hero-note"><BadgeCheck size={16} /> Verified organizations. Accountable handovers.</div>
      </div>
      <div className="hero-art" aria-label="Illustration of fresh vegetables in a reusable tote">
        <div className="sun-disc" />
        <div className="food-card card-top"><span className="food-icon">🥬</span><div><b>Fresh greens</b><small>Ready to share</small></div><span className="fresh-dot" /></div>
        <div className="produce-bowl"><span className="produce produce-a">🥑</span><span className="produce produce-b">🥕</span><span className="produce produce-c">🍅</span><span className="produce produce-d">🥬</span><div className="bowl-leaf">✳</div></div>
        <div className="food-card card-bottom"><span className="avatar-stack">↔</span><div><b>Purposeful matching</b><small>Pickup · capacity · dietary fit</small></div><span className="match-badge">EXPLAINABLE</span></div>
        <div className="sparkle sparkle-one">✳</div><div className="sparkle sparkle-two">✦</div>
      </div>
      <div className="hero-bottom"><span>MADE FOR CAMPUS COMMUNITIES</span><div><span><Leaf size={15} /> LESS WASTE</span><span><MapPin size={15} /> LOCAL IMPACT</span><span><Recycle size={15} /> MORE SHARED</span></div></div>
    </section>
    <section className="how-section" id="how-it-works">
      <div className="section-heading"><span className="eyebrow">A simple loop</span><h2>From surplus to <span>something good.</span></h2><p>Three thoughtful steps bring good food to nearby tables.</p></div>
      <div className="steps-grid">{steps.map(({ number, title, text, icon: Icon }) => <article className="step-card" key={number}><div className="step-top"><span>{number}</span><span className="step-icon"><Icon size={22} /></span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section className="join-banner"><div><span className="eyebrow eyebrow-light">A better campus, together</span><h2>There’s room for everyone<br />in the loop.</h2></div><Link className="btn btn-white btn-large" to={user ? '/dashboard' : '/register'}>{user ? 'Open dashboard' : 'Get started'} <ArrowRight size={17} /></Link></section>
  </main>;
}
