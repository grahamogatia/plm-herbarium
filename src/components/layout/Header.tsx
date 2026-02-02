import { Leaf } from "lucide-react";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full h-14 px-6 flex items-center justify-start border-b bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5" />
          <div className="text-lg font-semibold">PLM Botanical Herbarium</div>
        </div>
        <div className="text-lg leading-none">|</div>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <a className="hover:text-gray-900" href="#welcome">
            Home
          </a>
          <a className="hover:text-gray-900" href="#statistics">
            Statistics
          </a>
          <a className="hover:text-gray-900" href="#about">
            Collection
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
