import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Offcanvas, Button } from "react-bootstrap";
import logo from "../assets/BSA-19th_Logo.png";
import supabase from "../utils/supabase";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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
  const SidebarContent = (
    <>
      <img
        className="d-block img-fluid mx-auto mb-3"
        src={logo}
        style={{ filter: "invert(1)", maxWidth: "150px" }}
        alt="Logo"
      />
      <hr className="border-light" />
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
      <hr className="border-light" />

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
              fillRule="evenodd"
              d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468
              11.37C3.242 11.226 4.805 10 8 10s4.757 1.225
              5.468 2.37A7 7 0 0 0 8 1z"
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
    </>
  );

  return (
    <>
      <div className="d-block d-md-none p-2">
        <Button variant="primary" onClick={handleShow}>
          ☰ Menu
        </Button>
      </div>
      <Offcanvas
        show={show}
        onHide={handleClose}
        className="bg-dark text-white"
      >
        <Offcanvas.Header closeButton closeVariant="white"></Offcanvas.Header>
        <Offcanvas.Body>{SidebarContent}</Offcanvas.Body>
      </Offcanvas>
      <div
        className="d-none d-md-flex flex-column p-3 text-white"
        style={{
          width: "250px",
          backgroundColor: "#202030",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 1000,
        }}
      >
        {SidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
