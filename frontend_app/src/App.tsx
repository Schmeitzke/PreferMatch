import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import StudentPreference from './pages/StudentPreference';
import StudentConfirm from './pages/StudentConfirm';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminDashboard from './pages/AdminDashboard';
import AccountSettings from './pages/AccountSettings';
import ProjectEditor from './pages/ProjectEditor';
import ProjectResults from './pages/ProjectResults';
import SessionManager from './components/SessionManager';

function App() {
  return (
    <Router>
      <SessionManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/student/preference" element={<StudentPreference />} />
        <Route path="/student/confirm" element={<StudentConfirm />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/account" element={<AccountSettings />} />
        <Route path="/admin/project/new" element={<ProjectEditor />} />
        <Route path="/admin/project/edit/:id" element={<ProjectEditor />} />
        <Route path="/admin/project/results/:id" element={<ProjectResults />} />
      </Routes>
    </Router>
  );
}

export default App;
