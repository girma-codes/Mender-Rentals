import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { ContactPage } from '@/pages/ContactPage';
import { ListItemPage } from '@/pages/ListItemPage';
import { SignInPage } from '@/pages/SignInPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { ItemDetailPage } from '@/pages/ItemDetailPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardPage } from '@/pages/DashboardPage';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="item/:id" element={<ItemDetailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="list-item" element={<ListItemPage />} />
        </Route>
      </Route>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
    </Routes>
  );
}

export default App;
