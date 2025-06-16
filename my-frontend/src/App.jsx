import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { Toaster } from 'react-hot-toast';
import AnalysisPage from './pages/AnalysisPage'; 
import HistoryPage from './pages/HistoryPage';
const App = () => (
  <BrowserRouter>
    <NavBar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/analysis"
        element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>}
      />
      <Route
        path="/analysis/history"
        element={<ProtectedRoute><HistoryPage /></ProtectedRoute>}
      />
    </Routes>

    <Toaster position="top-right" />
  </BrowserRouter>
);

export default App;
