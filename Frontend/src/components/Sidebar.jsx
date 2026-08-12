import "../styles/Sidebar.css";
import { useEffect, useContext, useState, useRef } from "react";
import { MyContext } from "../context/MyContext";
import { clientServer } from "../api/client.js";
import { v1 as uuidv1 } from "uuid";

function Sidebar() {
  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setCurrThreadId,
    setNewChat,
    prevChats,
    setPrevChats,
    setPrompt,
    setReply,
    isDark,
    setIsDark,
    token,
    setIsAuthModalOpen,
  } = useContext(MyContext);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchResultsRef = useRef(null);

  const [activeDropdown, setActiveDropdown] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [threadToRename, setThreadToRename] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  const changeThread = (id) => {
    setCurrThreadId(id);
    setPrevChats(allThreads.find((thread) => thread.threadId === id).messages);
    setNewChat(false);
    setPrompt("");
    setReply(null);
  };

  // --- Global Click & Escape Listener ---
  useEffect(() => {
    if (!isSearchOpen && !isDeleteModalOpen && !isRenameModalOpen) return;

    const handleGlobalInteraction = (e) => {
      // Close dropdown if clicking outside
      if (activeDropdown !== null) setActiveDropdown(null);

      if (e.key === "Escape") {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSelectedIndex(0);
        }
        if (isDeleteModalOpen) {
          setIsDeleteModalOpen(false);
          setThreadToDelete(null);
        }
        if (isRenameModalOpen) {
          setIsRenameModalOpen(false);
          setThreadToRename(null);
        }
        setActiveDropdown(null);
      }
    };

    window.addEventListener("keydown", handleGlobalInteraction);
    window.addEventListener("click", handleGlobalInteraction);

    return () => {
      window.removeEventListener("keydown", handleGlobalInteraction);
      window.removeEventListener("click", handleGlobalInteraction);
    };
  }, [isSearchOpen, isDeleteModalOpen, isRenameModalOpen, activeDropdown]);

  useEffect(() => {
    if (isSearchOpen && searchResultsRef.current) {
      const selectedElement = searchResultsRef.current.children[selectedIndex];

      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "auto",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex, isSearchOpen]);

  const handleSearchThreadClick = (id) => {
    changeThread(id);
    setIsSearchOpen(false);
    setSelectedIndex(0);
    setSearchQuery("");
  };

  const filteredThreads = allThreads?.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSearchKeyDown = (e) => {
    if (filteredThreads?.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        Math.min(prev + 1, filteredThreads.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedThread = filteredThreads[selectedIndex];
      if (selectedThread) {
        handleSearchThreadClick(selectedThread.threadId);
      }
    }
  };

  const deleteThread = async (id) => {
    try {
      const response = await clientServer.delete(`/thread/${id}`);
      console.log(response.data);
      setAllThreads((prev) => prev.filter((thread) => thread.threadId !== id));
      if (currThreadId === id) createNewChat();
    } catch (err) {
      console.log(err);
    }
  };

  const confirmDelete = () => {
    if (threadToDelete) {
      deleteThread(threadToDelete);
    }
    setIsDeleteModalOpen(false);
    setThreadToDelete(null);
  };

  const handleRenameSubmit = async () => {
    if (!newTitle.trim() || !threadToRename) return;

    try {
      await clientServer.patch(`/thread/${threadToRename}`, {
        title: newTitle,
      });

      setAllThreads((prev) =>
        prev.map((thread) =>
          thread.threadId === threadToRename
            ? { ...thread, title: newTitle }
            : thread,
        ),
      );

      setIsRenameModalOpen(false);
      setThreadToRename(null);
    } catch (err) {
      console.log(err);
    }
  };

  const createNewChat = () => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    setCurrThreadId(uuidv1());
    setNewChat(true);
    setPrevChats([]);
    setPrompt("");
    setReply(null);
  };

  const getAllThreads = async () => {
    try {
      const response = await clientServer.get("/thread");
      const result = await response.data;

      console.log(result);
      setAllThreads(result);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (token) {
      getAllThreads();
    } else {
      setAllThreads([]);
    }
  }, [token, currThreadId, prevChats]);

  return (
    <section
      className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
      onClick={() => setActiveDropdown(null)}
    >
      <button>
        <span className="logoAndTitle" onClick={createNewChat}>
          {isDark ? (
            <img src="/whitelogo.png" alt="logo" className="logo" />
          ) : (
            <img src="/blacklogo.png" alt="logo" className="logo" />
          )}
          <span className="title">OmniThread</span>
        </span>
        <span>
          <span className="slider" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isDark ? (
              <img src="/whitelogo.png" alt="icon" className="collapsed-logo" />
            ) : (
              <img src="/blacklogo.png" alt="icon" className="collapsed-logo" />
            )}

            <span className="slider-icons">
              <span className="rod"></span>
              {isCollapsed ? (
                <i className="fa-solid fa-angle-right"> </i>
              ) : (
                <i className="fa-solid fa-angle-left"></i>
              )}
            </span>
          </span>
        </span>
      </button>

      <div className="options">
        <div className="optionItem" onClick={createNewChat}>
          <i className="fa-solid fa-pen-to-square"></i>
          <span>New Chat</span>
        </div>
        <div className="optionItem" onClick={() => setIsSearchOpen(true)}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <span>Search Chat</span>
        </div>
        <div className="optionItem">
          <i className="fa-solid fa-leaf"></i>
          <span>Images</span>
        </div>
        <div className="optionItem">
          <i className="fa-solid fa-clapperboard"></i>
          <span>Videos</span>
        </div>
        <div className="optionItem">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <span>Library</span>
        </div>
      </div>

      <span className="recent">
        {allThreads && allThreads.length > 0 ? "Recent" : ""}
      </span>

      <ul className="history">
        {allThreads?.map((thread, idx) => {
          return (
            <li
              onClick={() => {
                changeThread(thread.threadId);
              }}
              key={idx}
              className={thread.threadId === currThreadId ? "active" : ""}
            >
              <span>{thread.title}</span>

              <div
                className="thread-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <i
                  className="fa-solid fa-ellipsis-vertical action-icon"
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === thread.threadId
                        ? null
                        : thread.threadId,
                    )
                  }
                ></i>

                {activeDropdown === thread.threadId && (
                  <div className="thread-dropdown">
                    <div
                      className="dropdown-menu-item"
                      onClick={() => {
                        setThreadToRename(thread.threadId);
                        setNewTitle(thread.title);
                        setIsRenameModalOpen(true);
                        setActiveDropdown(null);
                      }}
                    >
                      <i className="fa-solid fa-pen"></i> Rename
                    </div>
                    <div
                      className="dropdown-menu-item delete-item"
                      onClick={() => {
                        setThreadToDelete(thread.threadId);
                        setIsDeleteModalOpen(true);
                        setActiveDropdown(null);
                      }}
                    >
                      <i className="fa-solid fa-trash"></i> Delete
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {isSearchOpen && (
        <div
          className="search-overlay"
          onClick={() => {
            setIsSearchOpen(false);
            setSelectedIndex(0);
          }}
        >
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-header">
              <h3>Search Chat</h3>
              <i
                className="fa-solid fa-xmark close-icon"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSelectedIndex(0);
                }}
              ></i>
            </div>

            <div className="search-input-wrapper">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search for a thread..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
            </div>

            <ul className="search-results" ref={searchResultsRef}>
              {filteredThreads?.length > 0 ? (
                filteredThreads.map((thread, idx) => (
                  <li
                    key={thread.threadId}
                    onClick={() => handleSearchThreadClick(thread.threadId)}
                    className={selectedIndex === idx ? "search-selected" : ""}
                  >
                    <i className="fa-regular fa-message"></i>
                    <span>{thread.title}</span>
                  </li>
                ))
              ) : (
                <div className="no-results">
                  <p>No threads found matching "{searchQuery}"</p>
                </div>
              )}
            </ul>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div
          className="search-overlay"
          onClick={() => {
            setIsDeleteModalOpen(false);
            setThreadToDelete(null);
          }}
        >
          <div
            className="search-modal delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-header">
              <h3>Delete Chat</h3>
              <i
                className="fa-solid fa-xmark close-icon"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setThreadToDelete(null);
                }}
              ></i>
            </div>

            <div className="delete-body">
              <p>
                Are you sure you want to delete this chat? <br /> This action
                can't be undone and you will lose <br /> all messages in this
                thread.
              </p>
            </div>

            <div className="delete-footer">
              <button
                className="btn-cancel"
                autoFocus
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setThreadToDelete(null);
                }}
              >
                Cancel
              </button>
              <button className="btn-delete" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isRenameModalOpen && (
        <div
          className="search-overlay"
          onClick={() => {
            setIsRenameModalOpen(false);
            setThreadToRename(null);
          }}
        >
          <div
            className="search-modal delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-header">
              <h3>Rename Chat</h3>
              <i
                className="fa-solid fa-xmark close-icon"
                onClick={() => {
                  setIsRenameModalOpen(false);
                  setThreadToRename(null);
                }}
              ></i>
            </div>

            <div className="delete-body">
              <input
                type="text"
                className="rename-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" ? handleRenameSubmit() : ""
                }
                autoFocus
                onFocus={(e) => e.target.select()} // Auto-selects text for easy replacement
              />
            </div>

            <div className="delete-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setIsRenameModalOpen(false);
                  setThreadToRename(null);
                }}
              >
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleRenameSubmit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Sidebar;
