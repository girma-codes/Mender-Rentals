import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { emoji: '⛺', name: 'Tents & Canopies', count: '40+ listings' },
  { emoji: '🔊', name: 'Audio & Sound', count: '25+ listings' },
  { emoji: '💡', name: 'Lighting & Decor', count: '30+ listings' },
  { emoji: '🍽️', name: 'Catering Gear', count: '35+ listings' },
  { emoji: '👘', name: 'Traditional Attire', count: '20+ listings' },
  { emoji: '⚡', name: 'Generators & Power', count: '15+ listings' },
];

export function FeaturedCategories() {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-28 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
            Popular Categories
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Browse by Category
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Find exactly what you need for your event from our curated rental categories.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              aria-label={`Browse ${cat.name} — ${cat.count}`}
              onClick={() => navigate('/marketplace')}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:shadow-glow-emerald-sm transition-all duration-300"
            >
              <div className="text-4xl mb-3">{cat.emoji}</div>
              <p className="font-semibold text-white text-sm leading-snug mb-1">{cat.name}</p>
              <p className="text-xs text-neutral-400">{cat.count}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
