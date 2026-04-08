import "./App.css";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import CollectionDetails from "./components/pages/collection/Specimen.tsx";
import AddSpecimenPage from "./pages/AddSpecimenPage.tsx";
import UpdateSpecimenPage from "./pages/UpdateSpecimenPage.tsx";
import BatchUploadPage from "./pages/BatchUploadPage.tsx";
import UploadImagePage from "./pages/UploadImagePage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";

function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
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
          <Route path="/collections/upload-image/:accessionNo" element={<UploadImagePage />} />
          <Route path="/collections/batch-upload" element={<BatchUploadPage />} />
        </Route>
        {/* Admin-only routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
