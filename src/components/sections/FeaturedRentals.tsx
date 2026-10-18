import { useNavigate } from 'react-router-dom';
import { SEED_LISTINGS } from '@/data/seedData';

const FEATURED = SEED_LISTINGS.slice(0, 6);

export function FeaturedRentals() {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-28 bg-neutral-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
            Hot This Week
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trending Rentals
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            The most-viewed rental items in the community right now.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURED.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col hover:border-emerald-500/40 hover:shadow-glow-emerald-sm transition-all duration-300"
            >
              {/* Category badge */}
              <div className="mb-3">
                <span className="inline-block text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                  {item.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-white text-base leading-snug mb-2 flex-1">
                {item.title}
              </h3>

              {/* Location */}
              <p className="text-neutral-400 text-sm mb-3 flex items-center gap-1">
                <span>📍</span>
                {item.location}
              </p>

              {/* Stars */}
              <p className="text-amber-400 text-sm mb-3">★★★★★</p>

              {/* Price + CTA */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-emerald-400 font-bold text-base">
                  ETB {item.pricePerDay.toLocaleString()}<span className="text-neutral-500 font-normal text-sm">/day</span>
                </span>
              </div>
              <button
                onClick={() => navigate('/marketplace')}
                className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 w-full mt-3"
              >
                Rent Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
