import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const MOCK_LISTINGS = [
  { emoji: '🔊', label: 'Sound System', price: 'ETB 1,800/day' },
  { emoji: '⛺', label: '10-Person Tent', price: 'ETB 2,500/day' },
];

export function CTABanner() {
  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-900/40 border-y border-emerald-500/20 rounded-3xl px-8 py-12 lg:px-16 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left: Copy + CTA */}
            <div>
              <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Start Earning
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Have unused event gear? Start earning today.
              </h2>
              <p className="text-lg text-neutral-300 mb-8">
                List your items on Mender and reach hundreds of local event planners across Ethiopia.
              </p>
              <button
                onClick={() => {
                  if (!auth.isAuthenticated) {
                    auth.setIntendedPath('/list-item');
                    navigate('/signup');
                    return;
                  }
                  navigate('/list-item');
                }}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors duration-200 shadow-glow-emerald-sm"
              >
                List Your Item →
              </button>
            </div>

            {/* Right: CSS card stack */}
            <div className="relative h-48 w-full">
              {/* Back card */}
              <div className="absolute inset-x-4 top-0 h-28 bg-neutral-800 border border-neutral-700 rounded-2xl rotate-3 opacity-60" />
              {/* Middle card */}
              <div className="absolute inset-x-2 top-4 h-28 bg-neutral-800 border border-neutral-700 rounded-2xl -rotate-1 opacity-80" />
              {/* Front card */}
              <div className="absolute inset-x-0 top-8 bg-neutral-900 border border-emerald-500/30 rounded-2xl p-4 shadow-glow-emerald-sm">
                {MOCK_LISTINGS.map((listing, i) => (
                  <div
                    key={listing.label}
                    className={`flex items-center justify-between py-2 ${i < MOCK_LISTINGS.length - 1 ? 'border-b border-neutral-800' : ''}`}
                  >
                    <span className="text-sm text-neutral-300">
                      {listing.emoji} {listing.label}
                    </span>
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                      {listing.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
