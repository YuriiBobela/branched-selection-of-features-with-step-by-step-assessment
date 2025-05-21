import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Analysis from './pages/Analysis';
import FeatureSelection from './pages/FeatureSelection';
import Train from './pages/Train';
import TrainPage from './pages/TrainPage';
import PredictPage from './pages/PredictPage';
import { Toaster } from 'react-hot-toast';
import AnalysisPage from './pages/AnalysisPage'; // ← додай

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
        element={<ProtectedRoute><Analysis /></ProtectedRoute>} 
      />
      <Route 
        path="/analysis/result" 
        element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} 
      />
      <Route 
        path="/feature-selection" 
        element={<ProtectedRoute><FeatureSelection /></ProtectedRoute>} 
      />
      <Route 
        path="/train" 
        element={<ProtectedRoute><TrainPage/></ProtectedRoute>} 
      />
      <Route path="/predict" element={<ProtectedRoute><PredictPage /></ProtectedRoute>} />
      {/* Редірект на головну для невідомих маршрутів */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {/* Контейнер для toast-повідомлень */}
    <Toaster position="top-right" />
  </BrowserRouter>
);

export default App;
