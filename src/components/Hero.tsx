import { ArrowRight, MapPin, Star, Tent, UtensilsCrossed, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface HeroProps {
  onOpenListItemModal: () => void;
}

const MOCK_ITEMS = [
  { icon: Tent, title: 'Large Wedding Tent', price: 2500, location: 'Addis Ababa', category: 'Tents & Canopies' },
  { icon: UtensilsCrossed, title: 'Catering Buffet Set', price: 900, location: 'Hawassa', category: 'Catering' },
  { icon: Music, title: 'PA Sound System', price: 1800, location: 'Bahir Dar', category: 'Sound & Lighting' },
];

export function Hero({ onOpenListItemModal }: HeroProps) {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden"
    >
      {/* Background gradient orb */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Copy + CTAs ── */}
          <div className="space-y-8">
            <div className="space-y-2">
              <Badge>
                <Star className="h-3 w-3" />
                Community-First Platform
              </Badge>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
                Community Equipment{' '}
                <span className="text-emerald-400">Sharing</span> for Local Events &amp; Weddings
              </h1>
              <p className="text-lg text-neutral-400 leading-relaxed max-w-xl">
                Easily rent wedding tents, chairs, sound systems, and tools from your neighbors.
                Built to foster community support and seamless sharing.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="primary" className="text-base px-7 py-3" onClick={() => navigate('/marketplace')}>
                Browse Equipment
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" className="text-base px-7 py-3" onClick={onOpenListItemModal}>
                List Your Item
              </Button>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 pt-2">
              {[
                { value: '500+', label: 'Items Listed' },
                { value: '1,200+', label: 'Community Members' },
                { value: '50+', label: 'Cities Covered' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Mockup Dashboard ── */}
          <div className="hidden md:block">
            <div className="relative rounded-2xl border border-emerald-500/30 bg-neutral-900/80 shadow-glow-emerald-lg p-1 backdrop-blur-sm">
              {/* Window chrome bar */}
              <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-neutral-800">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-3 text-xs text-neutral-500">mender-rentals.app — Marketplace</span>
              </div>

              {/* Mockup header */}
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-neutral-700" />
                </div>
                <div className="flex gap-2">
                  {['All', 'Tents', 'Seating', 'Sound'].map(tab => (
                    <span
                      key={tab}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        tab === 'All'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-neutral-500'
                      }`}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mock item cards */}
              <div className="p-3 space-y-2">
                {MOCK_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50 p-3 hover:border-emerald-500/40 transition-colors duration-200"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Icon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5 text-neutral-500 flex-shrink-0" />
                          <span className="text-[10px] text-neutral-500">{item.location}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-emerald-400">
                          ETB {item.price.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-neutral-500">/day</p>
                      </div>
                    </div>
                  );
                })}

                {/* Glowing CTA row */}
                <div className="pt-1 px-1">
                  <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                    <span className="text-xs text-emerald-400 font-medium">+ 240 more items available</span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
