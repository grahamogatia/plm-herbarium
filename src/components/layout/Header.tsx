import { Leaf } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin, logout } = useAuth();

  const navButtonClass = (isActive: boolean) =>
    `cursor-pointer transition-colors underline-offset-4 ${
      isActive
        ? "font-bold underline text-gray-900"
        : "text-zinc-700 hover:text-gray-900 hover:underline"
    }`;

  const isHomePage = location.pathname === "/home" || location.pathname === "/";
  const isCollectionPage = location.pathname.startsWith("/collections");
  const isAdminPage = location.pathname.startsWith("/admin");

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-50 w-full h-14 px-6 flex items-center justify-between bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
          <Leaf className="h-5 w-5" />
          <div className="text-lg font-semibold">PLM Botanical Herbarium</div>
        </div>
        <div className="text-lg leading-none text-zinc-400">|</div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <button className={navButtonClass(isHomePage)} onClick={() => navigate("/home")}>
            Home
          </button>
          <button className={navButtonClass(isHomePage)} onClick={() => navigate("/home")}>
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
      {currentUser ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">{currentUser.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      ) : (
        <Button className="bg-lime-800 text-zinc-50" onClick={() => navigate("/login")}>
          Login
        </Button>
      )}
    </header>
  );
}

export default Header;
