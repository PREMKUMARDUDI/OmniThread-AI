import "../styles/ChatWindow.css";
import Chat from "./Chat.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthModal } from "../Modals/AuthModal.jsx";
import { ProfileModal } from "../Modals/ProfileModal.jsx";
import { MyContext } from "../context/MyContext.jsx";
import { clientServer } from "../api/client.js";
import { BeatLoader } from "react-spinners";
import { v1 as uuidv1 } from "uuid";

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    prevChats,
    setPrevChats,
    newChat,
    setNewChat,
    isDark,
    setIsDark,
    user,
    setUser,
    token,
    logout,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    setAllThreads,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [sentPrompt, setSentPrompt] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);

  const submitIconRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const profileImageInputRef = useRef(null);

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert file to Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;

      try {
        const { data } = await clientServer.put("/user/profile", {
          profileImage: base64String,
        });

        // Update global context and local storage immediately
        const updatedUser = { ...user, profileImage: data.profileImage };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (err) {
        console.error("Failed to upload image", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async (e) => {
    e.stopPropagation(); // Prevents the click from triggering the file input
    try {
      // Send an empty string to clear the image
      const { data } = await clientServer.put("/user/profile", {
        profileImage: "",
      });

      const updatedUser = { ...user, profileImage: data.profileImage };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Failed to remove image", err);
    }
  };

  // --- Auto-grow and Auto-scroll effect ---
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to recalculate shrinking if user deletes text
      textareaRef.current.style.height = "auto";

      // Set the height exactly to the scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;

      // Auto-scroll to the bottom so the current typing line is always in view
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [prompt, isExpanded]);

  // --- VOICE TO TEXT LOGIC ---
  const handleVoiceClick = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice to Text.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    let initialPrompt = prompt;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");

      const space = initialPrompt.trim().length > 0 ? " " : "";
      setPrompt(initialPrompt + space + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);

      if (event.error === "no-speech") {
        const previousPrompt = prompt;
        setPrompt("Didn't catch that...");
        setTimeout(() => setPrompt(previousPrompt), 2000);
      }
    };

    recognition.onend = () => setIsListening(false);

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  // --- FILE HANDLING LOGIC ---
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const isTextFile =
        file.type.startsWith("text/") ||
        file.name.match(/\.(js|jsx|json|html|css|md|csv|txt)$/i);

      const reader = new FileReader();

      if (isTextFile) {
        // Read code/text files as raw text and inject directly into the prompt
        reader.onloadend = () => {
          const fileText = reader.result;
          setPrompt(
            (prev) =>
              prev +
              `\n\n--- File: ${file.name} ---\n${fileText}\n-------------------\n`,
          );
        };
        reader.readAsText(file);
      } else {
        // Read images/audio/PDFs as Base64 for the media attachments array
        reader.onloadend = () => {
          const base64Data = reader.result.split(",")[1];
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type,
              data: base64Data,
              previewUrl: URL.createObjectURL(file), // For UI preview
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });

    e.target.value = ""; // Reset input
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = () => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    if (
      submitIconRef.current &&
      (prompt.trim() !== "" || attachments.length > 0)
    ) {
      submitIconRef.current.classList.add("active");
      setTimeout(() => {
        submitIconRef.current?.classList.remove("active");
      }, 200);

      getReply();
    }
  };

  const getReply = async () => {
    if ((!prompt.trim() && attachments.length === 0) || loading) return;
    setLoading(true);

    let activeThreadId = currThreadId;
    if (!activeThreadId) {
      activeThreadId = uuidv1();
      setCurrThreadId(activeThreadId);
    }

    const requestData = {
      threadId: activeThreadId,
      message: prompt,
      media: attachments.map(({ mimeType, data }) => ({ mimeType, data })),
    };

    setSentPrompt(prompt || `Sent ${attachments.length} attachment(s)`);
    setPrompt("");
    setAttachments([]);

    try {
      const response = await clientServer.post("/thread/chat", requestData);
      const result = await response.data;
      setReply(result.reply);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [currThreadId, isDark]);

  //Append new chat to prevChats
  useEffect(() => {
    if (sentPrompt && reply) {
      setPrevChats((prevChats) => [
        ...prevChats,
        {
          role: "user",
          content: sentPrompt,
        },
        {
          role: "assistant",
          content: reply,
        },
      ]);

      setNewChat(false);
    }
  }, [reply]);

  return (
    <div className="chatWindow" onClick={() => setIsDropdownOpen(false)}>
      {isAuthModalOpen && <AuthModal />}
      {isProfileModalOpen && <ProfileModal />}

      <div className="navbar">
        <span>{user ? `${user.username}` : ""}</span>

        <div className="nav-actions">
          <div
            className="theme-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setIsDark(!isDark);
            }}
          >
            {isDark ? (
              <i className="fa-solid fa-sun"></i>
            ) : (
              <i className="fa-solid fa-moon"></i>
            )}
          </div>

          <div className="userProfile" onClick={handleProfileClick}>
            <span className="userIcon" style={{ overflow: "hidden" }}>
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="User"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <i className="fa-solid fa-user"></i>
              )}
            </span>
          </div>
        </div>
      </div>

      {isDropdownOpen && (
        <div className="profile-card" onClick={(e) => e.stopPropagation()}>
          <button
            className="close-profile-btn"
            onClick={() => setIsDropdownOpen(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <span className="profile-email">
            {user?.email || "user@example.com"}
          </span>

          <div
            className="profile-avatar-wrapper"
            onClick={() => profileImageInputRef.current.click()}
          >
            <input
              type="file"
              accept="image/*"
              ref={profileImageInputRef}
              style={{ display: "none" }}
              onChange={handleProfileImageUpload}
            />

            <div
              className="profile-avatar-circle"
              style={{ overflow: "hidden" }}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : user?.username ? (
                user.username.charAt(0).toUpperCase()
              ) : (
                "U"
              )}
            </div>

            <div
              className={`camera-icon-badge ${user?.profileImage ? "delete-mode" : ""}`}
              onClick={(e) => {
                if (user?.profileImage) {
                  handleRemoveImage(e);
                }
              }}
              title={
                user?.profileImage
                  ? "Remove profile picture"
                  : "Add profile picture"
              }
            >
              <i
                className={`fa-solid ${user?.profileImage ? "fa-trash" : "fa-camera"}`}
              ></i>
            </div>
          </div>

          <span className="profile-greeting">
            Hi, {user?.username || user?.name || "User"}!
          </span>

          <button
            className="manage-account-pill"
            onClick={() => {
              setIsProfileModalOpen(true);
              setIsDropdownOpen(false);
            }}
          >
            Manage your account
          </button>

          <div className="profile-action-group">
            <div
              className="profile-action-item one"
              onClick={() => {
                setIsAuthModalOpen(true);
                setIsDropdownOpen(false);
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add account</span>
            </div>

            <div
              className="profile-action-item two"
              onClick={() => {
                logout();
                setIsDropdownOpen(false);
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Sign out</span>
            </div>
          </div>
        </div>
      )}

      <div className="chat-content-area">
        {newChat && !loading && (
          <div className="greeting-container">
            <h1>Start a New Chat!</h1>
            <p>How can I help you today?</p>
          </div>
        )}

        {!newChat && <Chat />}

        <BeatLoader
          color={isDark ? "#fff" : "#000"}
          style={{ marginTop: "2rem", marginBottom: "1rem" }}
          loading={loading}
        />
      </div>

      <div className={newChat ? "newChatInput" : "chatInput"}>
        {/* ATTACHMENT PREVIEW CHIPS */}
        {attachments.length > 0 && (
          <div className="attachments-container">
            {attachments.map((file, idx) => (
              <div className="attachment-chip" key={idx}>
                {file.mimeType.startsWith("image/") ? (
                  <img src={file.previewUrl} alt="preview" />
                ) : (
                  <i className="fa-solid fa-file-lines doc-icon"></i>
                )}
                <span className="file-name">{file.name}</span>
                <i
                  className="fa-solid fa-circle-xmark remove-icon"
                  onClick={() => removeAttachment(idx)}
                ></i>
              </div>
            ))}
          </div>
        )}

        <div className={`inputBox ${isExpanded ? "expanded" : ""}`}>
          {/* HIDDEN INPUTS */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            multiple
          />
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            multiple
          />

          {/* ACTION ICONS (LEFT) */}
          <div className="input-actions-left">
            <i
              className="fa-solid fa-image"
              onClick={() => imageInputRef.current.click()}
              title="Add Image"
            ></i>
            <i
              className="fa-solid fa-paperclip"
              onClick={() => fileInputRef.current.click()}
              title="Add File"
            ></i>
          </div>

          <textarea
            ref={textareaRef}
            placeholder="Ask anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevents a new line when submitting
                handleSubmit();
              }
            }}
          />

          {/* ACTION ICONS (RIGHT) */}
          <div className="input-actions-right">
            <i
              className={`fa-solid ${isExpanded ? "fa-compress" : "fa-expand"}`}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Minimize" : "Expand"}
            ></i>

            <i
              className={`fa-solid fa-microphone ${isListening ? "listening" : ""}`}
              onClick={handleVoiceClick}
              title="Voice to text"
            ></i>

            <i
              className="fa-solid fa-paper-plane"
              ref={submitIconRef}
              title="Submit"
              onClick={handleSubmit}
            ></i>
          </div>
        </div>

        {!newChat && (
          <p className="info">OmniThread is AI and can make mistakes.</p>
        )}
      </div>
    </div>
  );
}

export default ChatWindow;
