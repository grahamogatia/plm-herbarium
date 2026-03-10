import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full h-14 px-6 flex items-center justify-between bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5" />
          <div className="text-lg font-semibold">PLM Botanical Herbarium</div>
        </div>
        <div className="text-lg leading-none text-zinc-400">|</div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a className="hover:text-gray-900">
            Home
          </a>
          <a className="hover:text-gray-900">
            Statistics
          </a>
          <a className="hover:text-gray-900" >
            Collection
          </a>
        </nav>
      </div>
      <Button className="bg-lime-800 text-zinc-50">Login</Button>
    </header>
  );
}

export default Header;
