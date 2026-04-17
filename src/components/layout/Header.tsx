import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navButtonClass = (isActive: boolean) =>
    `cursor-pointer transition-colors underline-offset-4 ${
      isActive
        ? "font-bold underline text-gray-900"
        : "text-zinc-700 hover:text-gray-900 hover:underline"
    }`;

  const mobileNavClass = (isActive: boolean) =>
    `w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-lime-50 text-lime-800 font-bold"
        : "text-zinc-700 hover:bg-zinc-50"
    }`;

  const isHomePage = location.pathname === "/home" || location.pathname === "/";
  const isStatisticsPage = location.pathname === "/statistics";
  const isCollectionPage = location.pathname.startsWith("/collections");
  const isAdminPage = location.pathname.startsWith("/admin");

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-zinc-100">
      {/* Desktop & mobile top bar */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate("/home")}>
          <img src={logo} alt="PLM Herbarium Logo" className="h-9 w-9 rounded-sm object-cover" />
          <span className="text-base sm:text-lg font-semibold truncate">PLM Botanical Herbarium</span>
        </div>

        {/* Desktop nav */}
        <div className={`hidden md:flex items-center gap-4 ${!currentUser ? "flex-1 justify-center" : ""}`}>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button className={navButtonClass(isHomePage)} onClick={() => navigate("/home")}>
              Home
            </button>
            <button className={navButtonClass(isStatisticsPage)} onClick={() => navigate("/statistics")}>
              Statistics
            </button>
            <button className={navButtonClass(isCollectionPage)} onClick={() => navigate("/collections")}>
              Collection
            </button>
            {isAdmin && (
              <button className={navButtonClass(isAdminPage)} onClick={() => navigate("/admin")}>
                Admin
              </button>
            )}
          </nav>
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {currentUser ? (
            <>
              <span className="text-sm text-zinc-500 truncate max-w-40">{currentUser.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button className="bg-lime-700 hover:bg-lime-800 text-white" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-md text-zinc-700 hover:bg-zinc-100 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white">
          <nav className="flex flex-col py-2">
            <button className={mobileNavClass(isHomePage)} onClick={() => navigate("/home")}>
              Home
            </button>
            <button className={mobileNavClass(isStatisticsPage)} onClick={() => navigate("/statistics")}>
              Statistics
            </button>
            <button className={mobileNavClass(isCollectionPage)} onClick={() => navigate("/collections")}>
              Collection
            </button>
            {isAdmin && (
              <button className={mobileNavClass(isAdminPage)} onClick={() => navigate("/admin")}>
                Admin
              </button>
            )}
          </nav>
          <div className="border-t border-zinc-100 px-4 py-3">
            {currentUser ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-zinc-500 truncate">{currentUser.email}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button className="w-full bg-lime-700 hover:bg-lime-800 text-white" onClick={() => navigate("/login")}>
                Login
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
