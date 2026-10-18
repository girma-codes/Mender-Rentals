import { CalendarCheck, PartyPopper, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: Search,
    title: 'Browse',
    description:
      'Explore equipment available in your community. Search by name, filter by category, and find exactly what you need for your event.',
  },
  {
    number: 2,
    icon: CalendarCheck,
    title: 'Request',
    description:
      'Select your rental dates, enter your contact details, and submit a request directly to the owner. Fast, simple, and transparent.',
  },
  {
    number: 3,
    icon: PartyPopper,
    title: 'Enjoy',
    description:
      'Pick up the equipment, use it for your celebration, and return it after the event. Community sharing at its finest.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center space-y-3 mb-16">
          <span className="inline-block text-sm font-semibold text-emerald-400 tracking-wider uppercase">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">How Mender Rentals Works</h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Renting from your neighbors has never been easier. Three simple steps stand between you and
            the perfect equipment for your event.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row gap-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex-1 relative">
                {/* Connector line (desktop only) */}
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-emerald-500/30 to-transparent translate-x-8" />
                )}

                <div className="relative rounded-2xl bg-neutral-900 border border-neutral-800 p-6 hover:border-emerald-500/40 hover:shadow-glow-emerald-sm transition-all duration-300 group">
                  {/* Step number */}
                  <div className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-glow-emerald-sm">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 group-hover:bg-emerald-500/20 transition-colors duration-200">
                    <Icon className="h-6 w-6 text-emerald-400" />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
