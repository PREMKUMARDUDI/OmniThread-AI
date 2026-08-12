import { useState, useContext } from "react";
import { MyContext } from "../context/MyContext";
import { clientServer } from "../api/client.js";

export function ProfileModal() {
  const { user, setUser, setIsProfileModalOpen, logout } =
    useContext(MyContext);

  const [view, setView] = useState("edit"); // "edit" | "delete"

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);

    try {
      const { data } = await clientServer.put("/user/profile", {
        username,
        email,
      });
      const updatedUser = {
        ...user,
        username: data.username,
        email: data.email,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await clientServer.delete("/user/profile");

      setIsProfileModalOpen(false);
      logout();
    } catch (err) {
      console.error("Failed to delete account", err);
      setLoading(false);
    }
  };

  return (
    <div
      className="search-overlay"
      onClick={() => setIsProfileModalOpen(false)}
    >
      <div
        className="search-modal profile-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- VIEW 1: EDIT PROFILE --- */}
        {view === "edit" && (
          <>
            <div className="search-header">
              <h3>Edit Profile</h3>
              <i
                className="fa-solid fa-xmark close-icon"
                onClick={() => setIsProfileModalOpen(false)}
              ></i>
            </div>

            <div className="delete-body profile-inputs-wrapper">
              <label className="edit-profile-label" htmlFor="username">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                placeholder="Username"
                className="rename-input"
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <label className="edit-profile-label" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                placeholder="Email Address"
                className="rename-input"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Split Footer Layout */}
            <div className="delete-footer profile-footer-split">
              <button
                className="btn-text-danger"
                onClick={() => setView("delete")}
              >
                Delete account
              </button>

              <div className="action-group-right">
                <button
                  className="btn-cancel"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-confirm"
                  onClick={handleUpdate}
                  disabled={loading}
                >
                  Save
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- VIEW 2: DELETE CONFIRMATION --- */}
        {view === "delete" && (
          <>
            <div className="search-header">
              <h3 className="danger-heading">Delete Account?</h3>
            </div>

            <div className="delete-body">
              <div className="danger-warning-box">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <div className="danger-text-content">
                  <h4>This action is permanent</h4>
                  <p>
                    You are about to delete <strong>{user?.email}</strong>. All
                    of your saved chat threads, custom instructions, and account
                    data will be permanently erased. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="delete-footer">
              <button
                className="btn-cancel"
                onClick={() => setView("edit")}
                disabled={loading}
              >
                Keep Account
              </button>
              <button
                className="btn-confirm btn-danger-fill"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, delete permanently"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
