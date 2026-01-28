import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Teacher from './pages/Teacher';
import Student from './pages/Student';
import { Landing } from './pages/Landing';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/teacher" element={<Teacher />} />
                <Route path="/student" element={<Student />} />
            </Routes>
        </Router>
    );
}

export default App;
