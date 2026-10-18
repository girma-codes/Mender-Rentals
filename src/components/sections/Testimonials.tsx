const TESTIMONIALS = [
  {
    initials: 'AK',
    name: 'Amina K.',
    role: 'Wedding Planner, Addis Ababa',
    quote:
      'Mender made our entire wedding setup so much easier. We rented a tent, chairs, and a sound system all in one place. Will use again!',
    stars: 5,
    avatarClass: 'bg-emerald-500/20 border border-emerald-500/40',
  },
  {
    initials: 'DT',
    name: 'Dawit T.',
    role: 'Event Organizer, Bahir Dar',
    quote:
      'I listed my PA system and earned ETB 4,500 in the first month. The platform is incredibly simple to use and trustworthy.',
    stars: 5,
    avatarClass: 'bg-violet-500/20 border border-violet-500/40',
  },
  {
    initials: 'SM',
    name: 'Selamawit M.',
    role: 'Cultural Event Coordinator, Gondar',
    quote:
      'Finding traditional attire for our annual cultural festival used to be a nightmare. Mender changed everything for us.',
    stars: 5,
    avatarClass: 'bg-amber-500/20 border border-amber-500/40',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
            What People Say
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by Event Organizers
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Hear from the real community members who use Mender to make their events unforgettable.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-emerald-500/40 transition-all duration-300"
            >
              {/* Stars */}
              <p className="text-amber-400 text-base">★★★★★</p>

              {/* Quote */}
              <p className="text-neutral-300 text-sm leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${t.avatarClass}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
