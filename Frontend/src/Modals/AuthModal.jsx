import { useState, useContext } from "react";
import { MyContext } from "../context/MyContext";
import { clientServer } from "../api/client.js";

export function AuthModal() {
  const { setToken, user, setUser, setIsAuthModalOpen } = useContext(MyContext);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOverlayClick = () => {
    if (user) {
      setIsAuthModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const { data } = await clientServer.post(endpoint, formData);
      const { token, user } = data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setToken(token);
      setUser(user);
      setIsAuthModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    }
    setLoading(false);
  };

  return (
    <div className="search-overlay auth-overlay" onClick={handleOverlayClick}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          {user ? (
            <h3>Add Account</h3>
          ) : (
            <h3>{isLogin ? "Welcome Back" : "Create Account"}</h3>
          )}

          {user && (
            <i
              className="fa-solid fa-xmark close-icon"
              onClick={() => setIsAuthModalOpen(false)}
            ></i>
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          className="auth-body"
          style={{ position: "relative" }}
        >
          {error && <p className="auth-error">{error}</p>}

          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              required
              className="rename-input"
              autoFocus
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            className="rename-input"
            autoFocus
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            className="rename-input"
            style={{ paddingRight: "4rem" }}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "1.5rem",
              top: isLogin ? "6rem" : "9.8rem",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              visibility: formData.password && !error ? "visible" : "hidden",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>

          <button
            type="submit"
            className="btn-confirm auth-btn"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
        <div className="delete-footer auth-footer">
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin
              ? "Need an account? Sign up"
              : "Already have an account? Login"}
          </span>
        </div>
      </div>
    </div>
  );
}
