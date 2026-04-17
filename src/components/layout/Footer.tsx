import { Mail, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpg";

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-zinc-900 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src={logo} alt="PLM Herbarium Logo" className="h-9 w-9 rounded-sm object-cover" />
              <span className="text-lg font-semibold text-zinc-50">
                PLM Botanical Herbarium
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">
              The first city university herbarium in Manila, preserving plant
              and fungal specimens since 1983.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-50">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate("/home")}
                  className="transition-colors hover:text-lime-400"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/collections")}
                  className="transition-colors hover:text-lime-400"
                >
                  Collection
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/home#statistics")}
                  className="transition-colors hover:text-lime-400"
                >
                  Statistics
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/home#about")}
                  className="transition-colors hover:text-lime-400"
                >
                  About Us
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-50">
              Contact
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime-500" />
                <span>
                  Pamantasan ng Lungsod ng Maynila, Intramuros, Manila,
                  Philippines
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-lime-500" />
                <span>herbarium@plm.edu.ph</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-lime-500" />
                <span>+63 (2) 1234-5678</span>
              </li>
            </ul>
          </div>

          {/* Social / Extra */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-50">
              Follow Us
            </h3>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors hover:bg-lime-600 hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors hover:bg-lime-600 hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors hover:bg-lime-600 hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.523.99 4.088 4.088 0 01.99 1.524c.163.46.349 1.26.403 2.43.058 1.265.07 1.645.07 4.849s-.012 3.584-.07 4.849c-.054 1.17-.24 1.97-.403 2.43a4.088 4.088 0 01-.99 1.524 4.088 4.088 0 01-1.524.99c-.46.163-1.26.349-2.43.403-1.265.058-1.645.07-4.849.07s-3.584-.012-4.849-.07c-1.17-.054-1.97-.24-2.43-.403a4.088 4.088 0 01-1.524-.99 4.088 4.088 0 01-.99-1.524c-.163-.46-.349-1.26-.403-2.43C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.849c.054-1.17.24-1.97.403-2.43a4.088 4.088 0 01.99-1.524A4.088 4.088 0 015.15 2.207c.46-.163 1.26-.349 2.43-.403C8.845 2.175 9.225 2.163 12 2.163zM12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.902.333 4.14.63a6.21 6.21 0 00-2.245 1.463A6.21 6.21 0 00.432 4.338C.135 5.1-.067 5.973-.008 7.251-.069 8.531-.083 8.939-.083 12.198s.014 3.668.072 4.948c.059 1.277.261 2.15.558 2.912a6.21 6.21 0 001.463 2.245 6.21 6.21 0 002.245 1.463c.762.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.059 2.15-.261 2.912-.558a6.21 6.21 0 002.245-1.463 6.21 6.21 0 001.463-2.245c.297-.762.499-1.635.558-2.912C24.986 15.668 25 15.26 25 12s-.014-3.668-.072-4.948c-.059-1.277-.261-2.15-.558-2.912a6.21 6.21 0 00-1.463-2.245A6.21 6.21 0 0019.662.432C18.9.135 18.027-.067 16.749-.008 15.469-.069 15.061-.083 11.802-.083zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
                </svg>
              </a>
            </div>
            <p className="text-xs text-zinc-500 pt-2">
              Stay connected for updates on new specimens and research.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
          <p>
            &copy; {new Date().getFullYear()} PLM Botanical Herbarium. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
