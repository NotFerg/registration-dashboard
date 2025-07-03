import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div
      className="d-flex flex-column p-3 text-white min-vh-100"
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
        {/* <li className="nav-item">
          <NavLink
            to="/placeholder1"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : "text-white"}`
            }
          >
            Placeholder
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/placeholder2"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : "text-white"}`
            }
          >
            Placeholder
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/placeholder3"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : "text-white"}`
            }
          >
            Placeholder
          </NavLink>
        </li> */}
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
          <img
            src="https://github.com/mdo.png"
            alt=""
            width="32"
            height="32"
            className="rounded-circle me-2"
          />
          <strong>mdo</strong>
        </a>
        <ul
          className="dropdown-menu dropdown-menu-dark text-small shadow"
          aria-labelledby="dropdownUser1"
        >
          <li>
            <a className="dropdown-item" href="#">
              New project...
            </a>
          </li>
          <li>
            <a className="dropdown-item" href="#">
              Settings
            </a>
          </li>
          <li>
            <a className="dropdown-item" href="#">
              Profile
            </a>
          </li>
          <li>
            <hr className="dropdown-divider" />
          </li>
          <li>
            <a className="dropdown-item" href="#">
              Sign out
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
