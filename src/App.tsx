import "./App.css";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";
import { Spinner } from "./components/ui/spinner";

const Home = lazy(() => import("./pages/Home"));
const Collection = lazy(() => import("./pages/Collection"));
const CollectionDetails = lazy(() => import("./components/pages/collection/Specimen"));
const AddSpecimenPage = lazy(() => import("./pages/AddSpecimenPage"));
const UpdateSpecimenPage = lazy(() => import("./pages/UpdateSpecimenPage"));
const BatchUploadPage = lazy(() => import("./pages/BatchUploadPage"));
const UploadImagePage = lazy(() => import("./pages/UploadImagePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage"));

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
    <>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-dvh">
            <Spinner className="size-8 text-lime-700" />
          </div>
        }
      >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/statistics" element={<StatisticsPage />} />
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
      </Suspense>
      <Analytics />
    </>
  );
}

export default App;
