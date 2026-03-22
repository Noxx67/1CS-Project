
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
// import { AdminCreateUser } from './pages/AdminCreateUser';
import './App.css';
function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        {/* <Route path="/AdminCreateUser" element={<AdminCreateUser />} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
