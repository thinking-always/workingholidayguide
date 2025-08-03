import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home'
import Login from './pages/Login';
import Newpost from './pages/Newpost'
import PostDetail from './pages/PostDetail'
import PostEdit from './pages/PostEdit'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/new' element={<Newpost />} />
        <Route path='/posts/:id' element={<PostDetail />} />
        <Route path='/posts/:id/edit' element={<PostEdit />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
