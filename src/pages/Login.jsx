import { useState } from "react";
import supabase from "../utils/supabase";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../App.css";
import { useNavigate } from "react-router-dom";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("Invalid credentials");
        return false;
      }
      navigate("/");
      return true;
    } catch (error) {
      setError(error.message || "An error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <div
          className="container-fluid d-flex justify-content-center align-items-center vh-100"
          style={{ backgroundColor: "#202030", color: "white" }}
        >
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div
          className="container-fluid"
          style={{ backgroundColor: "#202030", color: "white" }}
        >
          <section className="vh-100">
            <div className="container py-5 h-100">
              <div className="row d-flex align-items-center justify-content-center h-100">
                <div className="col-md-8 col-lg-7 col-xl-6">
                  <img
                    src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.svg"
                    className="img-fluid"
                    alt="Phone image"
                  />
                </div>
                <div className="col-md-7 col-lg-5 col-xl-5 offset-xl-1 p-5">
                  <div className="text-center mb-4">
                    <h1 style={{ fontWeight: 700 }}>Welcome Back!</h1>
                    <p>Please enter your details below.</p>
                  </div>
                  <form onSubmit={handleLogin}>
                    <div className="mb-3">
                      <input
                        type="email"
                        id="form1Example13"
                        className="form-control p-2"
                        placeholder="Username / E-Mail Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-password mb-3 position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="form1Example23"
                        className="form-control p-2"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <span
                        className="position-absolute"
                        style={{
                          top: "50%",
                          right: "15px",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          color: "#6c757d",
                        }}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>

                    {error && <div className="text-danger mb-3">{error}</div>}

                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary btn-md btn-block"
                        style={{ fontWeight: 700 }}
                        disabled={isLoading}
                      >
                        Sign In
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default Login;
