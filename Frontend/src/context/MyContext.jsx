import { createContext, useState } from "react";
import { v1 as uuidv1 } from "uuid";

export const MyContext = createContext();

export const MyProvider = ({ children }) => {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(null);
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [isDark, setIsDark] = useState(true);

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(
    !localStorage.getItem("token"),
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setAllThreads([]);
    setPrevChats([]);
    setCurrThreadId(null);
    setNewChat(true);
    setIsAuthModalOpen(true);
  };

  const providerValue = {
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
    allThreads,
    setAllThreads,
    isDark,
    setIsDark,
    token,
    setToken,
    user,
    setUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    logout,
  };

  return (
    <MyContext.Provider value={providerValue}>{children}</MyContext.Provider>
  );
};
