import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FeatureSelection from './pages/FeatureSelection';
import { Toaster } from 'react-hot-toast';
import AnalysisPage from './pages/AnalysisPage'; // ← додай
import BranchedFeatureSelectionPage from './pages/BranchedFeatureSelectionPage';
import HistoryPage from './pages/HistoryPage';
const App = () => (
  <BrowserRouter>
    {/* Навігаційна панель доступна на всіх сторінках */}
    <NavBar />
    <Routes>
      {/* Публічні маршрути */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Приватні маршрути (лише для авторизованих користувачів) */}
      <Route
        path="/analysis"
        element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>}
      />
      <Route
        path="/analysis/history"
        element={<ProtectedRoute><HistoryPage /></ProtectedRoute>}
      />
      <Route
        path="/feature-selection"
        element={<ProtectedRoute><FeatureSelection /></ProtectedRoute>}
      />
      <Route
        path="/branched-feature-selection"
        element={<ProtectedRoute><BranchedFeatureSelectionPage /></ProtectedRoute>}
      />
    </Routes>

    <Toaster position="top-right" />
  </BrowserRouter>
);

export default App;
