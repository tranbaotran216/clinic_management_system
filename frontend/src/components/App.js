import React from "react"; // dùng tạo component dạng class(1)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from "./HomePage";
import Intro from "./Intro";
import Services from "./Services";
// React: thư viện xây UI = react

export default function App() {
    return (
        <Router>
            <Routes>
                <Route exact path="/" element={<HomePage />} />
                <Route path="/services" element={<Services />} />
                <Route path="/intro" element={<Intro />} />
            </Routes>
        </Router>
    );
}

