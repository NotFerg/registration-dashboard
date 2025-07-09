import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import Trainings from "./pages/Trainings";
import Login from "./pages/Login";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/trainings" element={<Trainings />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
