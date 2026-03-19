import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  onNavigate: (page: "home" | "collection") => void;
  activePage: "home" | "collection";
};

function Header({ onNavigate, activePage }: HeaderProps) {
  const navButtonClass = (isActive: boolean) =>
    `cursor-pointer transition-colors underline-offset-4 ${
      isActive
        ? "font-bold underline text-gray-900"
        : "text-zinc-700 hover:text-gray-900 hover:underline"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full h-14 px-6 flex items-center justify-between bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5" />
          <div className="text-lg font-semibold">PLM Botanical Herbarium</div>
        </div>
        <div className="text-lg leading-none text-zinc-400">|</div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <button className={navButtonClass(activePage === "home")} onClick={() => onNavigate("home")}>
            Home
          </button>
          <button className={navButtonClass(false)} onClick={() => onNavigate("home")}>
            Statistics
          </button>
          <button className={navButtonClass(activePage === "collection")} onClick={() => onNavigate("collection")}>
            Collection
          </button>
        </nav>
      </div>
      <Button className="bg-lime-800 text-zinc-50">Login</Button>
    </header>
  );
}

export default Header;
