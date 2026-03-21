import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/layout/Header";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import CollectionDetails from "./pages/CollectionDetails.tsx";

function App() {
  return (
    <div>
      <div className="flex flex-col min-h-dvh">
        <Header />
        <main>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/collections" element={<Collection />} />
            <Route path="/collections/:accessionNo" element={<CollectionDetails />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
