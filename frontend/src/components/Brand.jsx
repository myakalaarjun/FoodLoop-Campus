import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Brand({ light = false }) {
  return (
    <Link to="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="FoodLoop home">
      <span className="brand-mark"><Leaf size={20} strokeWidth={2.5} /></span>
      <span>foodloop<span className="brand-campus"> campus</span></span>
    </Link>
  );
}
