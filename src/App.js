import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home'
import Login from './pages/Login';
import Newpost from './pages/Newpost'
import PostDetail from './pages/PostDetail'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/new' element={<Newpost />} />
        <Route path='/posts/:id' element={<PostDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
