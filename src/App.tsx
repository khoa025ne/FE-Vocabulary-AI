import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { Protected, Guest } from './components/Guards';
import Login from './pages/Login';
import Otp from './pages/Otp';
import Dashboard from './pages/Dashboard';
import Words from './pages/Words';
import WordDetail from './pages/WordDetail';
import Favorites from './pages/Favorites';
import Review from './pages/Review';
import QuizList from './pages/QuizList';
import QuizDo from './pages/QuizDo';
import QuizResult from './pages/QuizResult';
import Grammar from './pages/Grammar';
import Chat from './pages/Chat';
import Speaking from './pages/Speaking';
import SpeakingResult from './pages/SpeakingResult';
import Profile from './pages/Profile';

export default function App() {
  // Demo mode: HashRouter để chạy được trên static hosting không có SPA fallback.
  const Router = import.meta.env.VITE_DEMO === '1' ? HashRouter : BrowserRouter;
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<Guest />}>
            <Route path="/login" element={<Login />} />
            <Route path="/otp" element={<Otp />} />
          </Route>
          <Route element={<Protected />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/words" element={<Words />} />
              <Route path="/words/:id" element={<WordDetail />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/review" element={<Review />} />
              <Route path="/quiz" element={<QuizList />} />
              <Route path="/quiz/:id" element={<QuizDo />} />
              <Route path="/quiz/:id/result" element={<QuizResult />} />
              <Route path="/grammar" element={<Grammar />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/speaking" element={<Speaking />} />
              <Route path="/speaking/result" element={<SpeakingResult />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
