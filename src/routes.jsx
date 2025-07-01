import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import Trainings from "./pages/Trainings";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/trainings" element={<Trainings />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
