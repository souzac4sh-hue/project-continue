import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/context/StoreContext";
import { AuthProvider } from "@/hooks/useAuth";
import { DynamicColors } from "@/components/site/DynamicColors";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import MethodsPage from "./pages/MethodsPage";
import ReferencesPage from "./pages/ReferencesPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import PixCheckoutPage from "./pages/PixCheckoutPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import NotFound from "./pages/NotFound";
import FloatingNinja from "./components/site/FloatingNinja";

function FloatingNinjaGuard() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return <FloatingNinja />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <StoreProvider>
          <DynamicColors />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <FloatingNinjaGuard />
            <Routes>
            <Routes>
              <Route path="/" element={<ShopPage />} />
              <Route path="/produto/:id" element={<ProductPage />} />
              <Route path="/metodos" element={<MethodsPage />} />
              <Route path="/referencias" element={<ReferencesPage />} />
              <Route path="/pedido" element={<OrderTrackingPage />} />
              <Route path="/checkout" element={<PixCheckoutPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
