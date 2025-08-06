import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home'
import Login from './pages/Login';
import Newpost from './pages/Newpost'
import PostDetail from './pages/PostDetail'
import PostEdit from './pages/PostEdit'
import { AuthProvider } from './context/AuthContext';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/new' element={<Newpost />} />
          <Route path='/posts/:id' element={<PostDetail />} />
          <Route path='/posts/:id/edit' element={<PostEdit />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
