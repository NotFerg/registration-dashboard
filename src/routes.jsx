import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import Trainings from "./pages/Trainings";
import Login from "./pages/Login";
import AuthorizedRoute from "./utils/AuthorizedRoutes";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthorizedRoute />}>
        <Route path="/" element={<App />} />
        <Route path="/trainings" element={<Trainings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRoutes;
