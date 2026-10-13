import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';

export function Notice({ error, success }) {
  if (!error && !success) return null;
  return <div className={`notice ${error ? 'notice-error' : 'notice-success'}`} role="status">
    {error ? <CircleAlert size={17} /> : <CircleCheck size={17} />}
    <span>{error || success}</span>
  </div>;
}

export function Loading({ label = 'Loading your FoodLoop...' }) {
  return <div className="loading"><LoaderCircle className="spin" size={22} /> {label}</div>;
}
