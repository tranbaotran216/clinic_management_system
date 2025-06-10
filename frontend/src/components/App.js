import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from "./HomePage";
import Intro from "./Intro";
import Services from "./Services";
import LoginPage from "./LoginPage";
import ManagerDashboard from "./ManagerDashboard";
import StaffDashboard from "./StaffDashboard";
import PrivateRoute from "./PrivateRoutes"; 

export default function App() {
    return (
        <Router>
            <Routes>
                <Route exact path="/" element={<HomePage />} />
                <Route path="/services" element={<Services />} />
                <Route path="/intro" element={<Intro />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Bảo vệ route cho manager */}
                <Route element={<PrivateRoute allowedRoles={['manager']} />}>
                    <Route path="/managerdashboard" element={<ManagerDashboard />} />
                </Route>
                {/* Bảo vệ route cho staff */}
                <Route element={<PrivateRoute allowedRoles={['med_staff']} />}>
                    <Route path="/staffdashboard" element={<StaffDashboard />} />
                </Route>
            </Routes>
        </Router>
    );
}