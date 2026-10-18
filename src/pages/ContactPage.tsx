export function ContactPage() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="inline-block text-sm font-semibold text-emerald-400 tracking-wider uppercase">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Contact Us</h1>
        <p className="text-neutral-400 max-w-xl mx-auto">
          Have questions or feedback? Reach us at{' '}
          <a
            href="mailto:hello@menderrentals.et"
            className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
          >
            hello@menderrentals.et
          </a>
          . Full contact form coming soon.
        </p>
      </div>
    </section>
  );
}
