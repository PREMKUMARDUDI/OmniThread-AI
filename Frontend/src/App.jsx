import "./App.css";
import ChatWindow from "./components/ChatWindow.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { MyContext } from "./context/MyContext";
import { useContext } from "react";

function App() {
  const { isDark } = useContext(MyContext);

  return (
    <div className={`app ${isDark ? "dark" : "light"}`}>
      <Sidebar />
      <ChatWindow />
    </div>
  );
}

export default App;
