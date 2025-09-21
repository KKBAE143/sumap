import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PassDetailPage from './pages/PassDetailPage';
import ValidatorPage from './pages/ValidatorPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <SupabaseProvider>
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/passes/:id" element={<PassDetailPage />} />
                <Route path="/validator" element={<ValidatorPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </SupabaseProvider>
    </ChakraProvider>
  );
}

export default App;
