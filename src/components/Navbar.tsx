import { Handshake, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onOpenListItemModal: () => void;
}

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Contact', to: '/contact' },
];

export function Navbar({ onOpenListItemModal }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Skip-nav link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-white focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 w-full bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 group-hover:bg-emerald-500/25 transition-colors duration-200">
                <Handshake className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                MENDER <span className="text-emerald-400">RENTALS</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {auth.isAuthenticated && auth.user ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Avatar trigger */}
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-neutral-800 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs">
                      {auth.user.avatarInitials}
                    </span>
                    <span className="text-sm text-white">{auth.user.name.split(' ')[0]}</span>
                    <svg
                      className="h-3.5 w-3.5 text-neutral-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-50">
                      <div className="p-3">
                        <p className="text-sm text-white font-medium">{auth.user.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{auth.user.email}</p>
                      </div>
                      <div className="border-t border-neutral-800" />
                      <div className="p-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/dashboard?tab=bookings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          My Rentals
                        </Link>
                        <Link
                          to="/dashboard?tab=equipment"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          My Listings
                        </Link>
                      </div>
                      <div className="border-t border-neutral-800" />
                      <div className="p-1">
                        <button
                          onClick={() => { auth.logout(); setDropdownOpen(false); }}
                          className="w-full text-left flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/signin"
                  className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>
              )}
              <Button variant="primary" onClick={onOpenListItemModal} className="text-sm">
                List Your Item
              </Button>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-neutral-800 bg-neutral-900/98 px-4 py-4 space-y-3">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                to={link.to}
                className="block text-sm text-neutral-400 hover:text-white transition-colors duration-200 py-1"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-neutral-800 flex flex-col gap-3">
              {auth.isAuthenticated && auth.user ? (
                <>
                  {/* Authenticated mobile header */}
                  <div className="flex items-center gap-2 py-1">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex-shrink-0">
                      {auth.user.avatarInitials}
                    </span>
                    <span className="text-sm text-white font-medium">{auth.user.name}</span>
                  </div>
                  {/* Authenticated mobile nav links */}
                  <Link
                    to="/dashboard"
                    className="text-sm text-neutral-400 hover:text-white transition-colors duration-200 py-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard?tab=bookings"
                    className="text-sm text-neutral-400 hover:text-white transition-colors duration-200 py-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Rentals
                  </Link>
                  <Link
                    to="/dashboard?tab=equipment"
                    className="text-sm text-neutral-400 hover:text-white transition-colors duration-200 py-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Listings
                  </Link>
                  <button
                    onClick={() => { auth.logout(); setMenuOpen(false); }}
                    className="text-left text-sm text-red-400 hover:text-red-300 transition-colors duration-200 py-1"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/signin"
                  className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
              <Button
                variant="primary"
                onClick={() => { onOpenListItemModal(); setMenuOpen(false); }}
                className="text-sm w-full"
              >
                List Your Item
              </Button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
