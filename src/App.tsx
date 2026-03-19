import "./App.css";
import { useState } from "react";
import Header from "./components/layout/Header";
import Home from "./pages/Home";
import Collection from "./pages/Collection";

function App() {
  const [page, setPage] = useState<"home" | "collection">("home");

  return (
    <div>
      <div className="flex flex-col min-h-dvh">
        <Header onNavigate={setPage} activePage={page} />
        <main>
          {page === "home" ? <Home /> : <Collection />}
        </main>
      </div>
    </div>
  );
}

export default App;
