const BENEFITS = [
  {
    emoji: '🤝',
    title: 'Community Trust',
    desc: 'Join 500+ verified lenders and renters across Ethiopia. Every user is community-verified.',
  },
  {
    emoji: '💰',
    title: 'Affordable Daily Rates',
    desc: 'Pay only for the days you need, starting from ETB 300/day. No hidden fees, ever.',
  },
  {
    emoji: '⚡',
    title: 'Easy Booking',
    desc: 'Browse, connect, and confirm your rental in under 5 minutes. Simple and transparent.',
  },
  {
    emoji: '✅',
    title: 'Verified Equipment',
    desc: 'Every listing is reviewed for quality and accuracy before going live on the platform.',
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Subtle emerald gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/3 via-transparent to-emerald-500/3 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
            Why Mender?
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built for the Community
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Everything we built is designed to make renting and lending event gear simple, safe, and fair.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-emerald-500/40 hover:shadow-glow-emerald-sm transition-all duration-300"
            >
              <div className="text-4xl mb-4">{benefit.emoji}</div>
              <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
