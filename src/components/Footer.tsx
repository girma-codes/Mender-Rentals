import { Handshake, Mail, Globe, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Contact', to: '/contact' },
  { label: 'List Your Item', to: '/list-item' },
];

export function Footer() {
  return (
    <footer id="contact" className="bg-neutral-900 border-t border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                <Handshake className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                MENDER <span className="text-emerald-400">RENTALS</span>
              </span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
              Connecting communities through equipment sharing. Empowering local events with trusted
              neighbor-to-neighbor rentals.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="mailto:hello@menderrentals.et"
                aria-label="Email us"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all duration-200"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all duration-200"
              >
                <Code2 className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Social"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-neutral-400 hover:text-emerald-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-neutral-400">
                <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <a href="mailto:hello@menderrentals.et" className="hover:text-emerald-400 transition-colors duration-200">
                  hello@menderrentals.et
                </a>
              </li>
            </ul>
            <div className="mt-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
              <p className="text-xs text-emerald-400 font-medium mb-1">Join the community</p>
              <p className="text-xs text-neutral-500">
                List your equipment today and help your neighbors celebrate.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} MENDER RENTALS. All rights reserved.
          </p>
          <p className="text-xs text-neutral-600">
            Built with ❤ for Ethiopian communities
          </p>
        </div>
      </div>
    </footer>
  );
}
