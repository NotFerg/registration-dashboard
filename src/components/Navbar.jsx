import React from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/APAFS_logo.png";
import supabase from "../utils/supabase";

const TopNavbar = () => {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login");
    }
  }

  return (
    <Navbar
      // bg="dark"
      variant="dark"
      expand="md"
      className="sticky-top nav-bar"
      style={{ backgroundColor: "#202030", zIndex: 1100 }}
    >
      <Container fluid>
        <Navbar.Brand as={NavLink} to="/" className="d-flex align-items-center">
          <img
            src={logo}
            alt="Logo"
            style={{ maxWidth: 75, height: "auto" }}
            className="me-2"
          />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <ul className="nav nav-pills flex-row mb-auto">
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
          </Nav>

          <Nav className="ms-auto align-items-center">
            <NavDropdown
              title={
                <span className="d-inline-flex align-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
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
                  <strong className="text-white">User</strong>
                </span>
              }
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Item onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i> Sign out
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;
