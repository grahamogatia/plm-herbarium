import "./App.css";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Header from "./components/layout/Header";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import CollectionDetails from "./components/pages/collection/Specimen.tsx";
import AddSpecimenPage from "./pages/AddSpecimenPage.tsx";
import UpdateSpecimenPage from "./pages/UpdateSpecimenPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";

function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/collections" element={<Collection />} />
        <Route path="/collections/:accessionNo" element={<CollectionDetails />} />
        {/* Protected CRUD routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/collections/add-specimen" element={<AddSpecimenPage />} />
          <Route path="/collections/update/:accessionNo" element={<UpdateSpecimenPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
