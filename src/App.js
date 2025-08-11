import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home'
import Login from './pages/Login';
import Newpost from './pages/Newpost'
import PostDetail from './pages/PostDetail'
import PostEdit from './pages/PostEdit'
import Headers from './components/Headers';
import { AuthProvider } from './contexts/AuthContext';
import CategoryList from "./pages/CategoryList";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Headers />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />

          <Route path="/basic" element={<CategoryList slug="basic" />} />
          <Route path="/jobs_housing" element={<CategoryList slug="jobs_housing" />} />
          <Route path="/guide" element={<CategoryList slug="guide" />} />
          <Route path="/travel" element={<CategoryList slug="travel" />} />
          <Route path="/qna" element={<CategoryList slug="qna" />} />


          <Route path="/new/:category" element={<Newpost />} />
          <Route path='/posts/:id' element={<PostDetail />} />
          <Route path='/posts/:id/edit' element={<PostEdit />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
