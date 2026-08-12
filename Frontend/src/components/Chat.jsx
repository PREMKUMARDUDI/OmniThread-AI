import "../styles/Chat.css";
import { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "../context/MyContext";
import ReactMarkDown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
  const { prevChats, reply, currThreadId } = useContext(MyContext);

  const [latestReply, setLatestReply] = useState(null);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    const element = chatContainerRef.current;
    if (!element) return;

    let timeout;
    const handleScroll = () => {
      clearTimeout(timeout);
      element.classList.add("is-scrolling");
      timeout = setTimeout(
        () => element.classList.remove("is-scrolling"),
        1000,
      );
    };

    element.addEventListener("scroll", handleScroll);

    return () => element.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [currThreadId, prevChats, latestReply]);

  useEffect(() => {
    if (reply === null) {
      setLatestReply(null);
      return;
    }

    if (!prevChats?.length || !reply) return;

    const content = reply.split(" ");

    let idx = 0;
    const interval = setInterval(() => {
      setLatestReply(content.slice(0, idx + 1).join(" "));

      idx++;
      if (idx >= content.length) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, [prevChats, reply]);

  return (
    <>
      <div className="chats" ref={chatContainerRef}>
        {prevChats?.slice(0, -1).map((chat, idx) => {
          return (
            <div
              className={chat.role === "user" ? "userDiv" : "gptDiv"}
              key={idx}
            >
              {chat.role === "user" ? (
                <p className="userMessage">{chat.content}</p>
              ) : (
                <ReactMarkDown rehypePlugins={[rehypeHighlight]}>
                  {chat.content}
                </ReactMarkDown>
              )}
            </div>
          );
        })}

        {prevChats?.length > 0 && (
          <>
            {latestReply === null ? (
              <div className="gptDiv" key={"non-typing"}>
                <ReactMarkDown rehypePlugins={[rehypeHighlight]}>
                  {prevChats[prevChats.length - 1].content}
                </ReactMarkDown>
              </div>
            ) : (
              <div className="gptDiv" key={"typing"}>
                <ReactMarkDown rehypePlugins={[rehypeHighlight]}>
                  {latestReply}
                </ReactMarkDown>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Chat;
