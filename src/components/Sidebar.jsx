import { NavLink } from "react-router-dom";
import supabase from "../utils/supabase";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      localStorage.clear();
    } catch (error) {
      console.log(error);
    } finally {
      navigate("/login");
    }
  }
  return (
    <div
      className="d-flex flex-column p-3 text-white h-100 w-100 min-vh-100"
      style={{ width: "250px", backgroundColor: "#202030" }}
    >
      <h1>logo</h1>
      <hr />

      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : "text-white"}`
            }
            end
          >
            Registrations
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/trainings"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : "text-white"}`
            }
          >
            Trainings
          </NavLink>
        </li>
      </ul>
      <hr />
      <div className="dropdown">
        <a
          href="#"
          className="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
          id="dropdownUser1"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="currentColor"
            className="bi bi-person-circle me-2"
            viewBox="0 0 16 16"
          >
            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            <path
              fill-rule="evenodd"
              d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"
            />
          </svg>
          <strong>User</strong>
        </a>
        <ul
          className="dropdown-menu dropdown-menu-dark text-small shadow"
          aria-labelledby="dropdownUser1"
        >
          <li>
            <a className="dropdown-item" href="#" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Sign out
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
