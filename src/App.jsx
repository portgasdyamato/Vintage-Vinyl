import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Play from './components/Play';
import Login from './pages/Login';
import Callback from './pages/Callback';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Play />} />
                <Route path="/login" element={<Login />} />
                <Route path="/callback" element={<Callback />} />
            </Routes>
        </Router>
    );
}
