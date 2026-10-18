const STEPS = [
  {
    number: 1,
    emoji: '🔍',
    title: 'Browse Equipment',
    desc: 'Explore hundreds of items available in your community. Filter by category, location, and price.',
  },
  {
    number: 2,
    emoji: '📅',
    title: 'Book & Connect',
    desc: 'Select your rental dates, message the owner, and confirm your booking in minutes.',
  },
  {
    number: 3,
    emoji: '🎉',
    title: 'Enjoy Your Event',
    desc: 'Pick up the gear, use it for your celebration, and return it after the event.',
  },
];

export function HowItWorksVisual() {
  return (
    <section className="py-20 lg:py-28 bg-neutral-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
            Step by Step
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            From browsing to enjoying your event — it takes just three simple steps.
          </p>
        </div>

        {/* Steps + connectors */}
        <div className="flex flex-col md:flex-row items-stretch gap-0 md:gap-0">
          {STEPS.map((step, index) => (
            <>
              {/* Step card */}
              <div
                key={step.number}
                className="relative flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center hover:border-emerald-500/40 transition-all duration-300"
              >
                {/* Step number badge */}
                <div className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                  {step.number}
                </div>
                <span className="text-5xl mb-4 block">{step.emoji}</span>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{step.desc}</p>
              </div>

              {/* Arrow connector between steps */}
              {index < STEPS.length - 1 && (
                <div
                  key={`arrow-${index}`}
                  className="hidden md:flex items-center justify-center px-3 text-2xl text-emerald-500/50 flex-shrink-0"
                >
                  →
                </div>
              )}
            </>
          ))}
        </div>
      </div>
    </section>
  );
}
