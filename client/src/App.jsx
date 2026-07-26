import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import ReceiptPage from './pages/ReceiptPage';
import Layout from './layouts/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/receipt/:id" element={<ReceiptPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
