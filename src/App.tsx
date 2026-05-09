import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientProfile from './pages/PatientProfile';
import DietPlanCreator from './pages/DietPlanCreator';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pacientes" 
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pacientes/novo" 
              element={
                <ProtectedRoute>
                  <PatientForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pacientes/editar/:id" 
              element={
                <ProtectedRoute>
                  <PatientForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pacientes/:id" 
              element={
                <ProtectedRoute>
                  <PatientProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pacientes/:id/plano/novo" 
              element={
                <ProtectedRoute>
                  <DietPlanCreator />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
