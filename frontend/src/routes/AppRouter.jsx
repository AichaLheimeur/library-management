import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";

import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";

import Navbar from "../components/Navbar";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import CatalogPage from "../pages/CatalogPage";
import DashboardPage from "../pages/DashboardPage";
import AdminPage from "../pages/AdminPage";
import BookDetailPage from "../pages/BookDetailPage";
import NotFoundPage from "../pages/NotFoundPage";

function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      {pathname !== "/dashboard" && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/catalog" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
