import React, {
  useState,
  useEffect,
  useRef
} from "react";

import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const location = useLocation();   
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [role, setRole] =
    useState("Citizen");

    useEffect(() => {

    const path =
        location.pathname.toLowerCase();

    if (
        path.includes("volunteer") &&
        localStorage.getItem("volunteerId")
    ) {

        setRole("Volunteer");

    }

    else if (
        path.includes("admin") &&
        localStorage.getItem("user")
    ) {

        setRole("Admin");

    }

    else {

        setRole("Citizen");

    }

    }, [location.pathname]);

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("sahayakChat");
    return saved
      ? JSON.parse(saved)
      : [
          {
            sender: "bot",
            text: "Hello! I'm Sahayak AI. How can I help you today?"
          }
        ];
  });

  // Auto-scroll logic triggered whenever message log updates or typing loader toggles
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("sahayakChat", JSON.stringify(messages));
  }, [messages]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const sendMessage = async (customMessage = null) => {
    const msg = customMessage || message;
    if (!msg.trim()) return;

    const userMessage = {
      sender: "user",
      text: msg
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      let activeRole = "citizen";
      let userId = null;
      const requestPath = location.pathname;

      if (requestPath.toLowerCase().includes("volunteer")) {
        activeRole = "volunteer";
        userId = localStorage.getItem("volunteerId");
      } else if (requestPath.toLowerCase().includes("admin")) {
        activeRole = "admin";
        const adminUser = localStorage.getItem("user");
        if (adminUser) {
          userId = JSON.parse(adminUser)._id || JSON.parse(adminUser).id;
        }
      }

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: msg,
          role: activeRole,
          userId,
          currentPage: requestPath
        })
      });

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: data.reply
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I am unavailable right now."
        }
      ]);
    } finally {
      setLoading(false);
    }

    setMessage("");
  };

  const handleClearChat = () => {
    localStorage.removeItem("sahayakChat");
    setMessages([
      {
        sender: "bot",
        text: "Hello! I'm Sahayak AI. How can I help you today?"
      }
    ]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          fixed
          bottom-6
          right-6
          z-[9999]
          w-16
          h-16
          rounded-full
          bg-orange-500
          text-white
          shadow-xl
          hover:scale-110
          transition
          flex
          items-center
          justify-center
        "
      >
        <span className="text-xl font-bold">💬</span>
      </button>

      {isOpen && (
        <div
          className="
            fixed
            bottom-24
            right-4
            left-4
            md:left-auto
            md:right-6
            w-auto
            md:w-[420px]
            h-[75vh]
            max-h-[650px]
            bg-[#0A1025]
            border
            border-[#1E2A4A]
            rounded-3xl
            z-[9999]
            flex
            flex-col
            overflow-hidden
            shadow-2xl
          "
        >
          {/* HEADER */}
          <div
            className="
              p-4
              border-b
              border-[#232B4C]
              flex
              justify-between
              items-center
            "
          >
            <div>
              <h2 className="text-white font-bold text-lg">
                🤖 Sahayak AI
              </h2>
              <p className="text-xs text-gray-400">
                Emergency Response Assistant
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-green-400 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online
              </div>
              <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase">
                {role}
              </span>
              <button 
                onClick={handleClearChat}
                className="text-[11px] text-red-400 hover:text-red-300 transition mt-1 underline decoration-dotted"
              >
                Clear Chat
              </button>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div
            className="
              p-3
              flex
              flex-wrap
              gap-2
              border-b
              border-[#232B4C]
              max-h-[110px]
              overflow-y-auto
            "
          >
            {[
                "Flood Safety Guide",
                "Fire Emergency Response",
                "Basic First Aid",
                "How to Report an Incident",
                "Volunteer Equipment and Safety"
            ].map(item => (
              <button
                key={item}
                onClick={() => sendMessage(item)}
                className="
                  text-xs
                  bg-[#050816]
                  text-orange-400
                  px-3
                  py-1.5
                  rounded-full
                  border
                  border-orange-500/40
                  hover:bg-orange-500
                  hover:text-white
                  transition
                "
              >
                {item}
              </button>
            ))}
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={msg.sender === "user" ? "text-right" : "text-left"}
              >
                {/* Meta Sender Name */}
                <div className="text-[11px] text-gray-500 mb-1 px-1">
                  {msg.sender === "user" ? "You" : "Sahayak AI"}
                </div>
                
                <div
                  className={
                    msg.sender === "user"
                      ? "inline-block bg-orange-500 text-white px-4 py-2.5 rounded-2xl max-w-[85%] text-sm text-left break-words"
                      : "inline-block bg-[#050816] text-gray-200 px-4 py-2.5 rounded-2xl max-w-[85%] text-sm text-left break-words border border-[#1E2A4A]"
                  }
                >
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                    <ReactMarkdown>
                        {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-left">
                <div className="text-[11px] text-gray-500 mb-1 px-1">
                  Sahayak AI
                </div>
                <div className="inline-block bg-[#050816] text-gray-400 px-4 py-2.5 rounded-2xl text-sm border border-[#1E2A4A] animate-pulse">
                  🤖 ● ● ●
                </div>
              </div>
            )}
            
            {/* Anchor point for automatic bottom layout anchoring */}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-3 border-t border-[#232B4C] flex gap-2 bg-[#060B1E]">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask Sahayak AI..."
              className="
                flex-1
                bg-[#050816]
                text-white
                px-4
                py-2.5
                rounded-xl
                outline-none
                border
                border-[#1E2A4A]
                focus:border-orange-500
                text-sm
                transition
              "
            />
            <button
              onClick={() => sendMessage()}
              className="
                bg-orange-500
                px-5
                rounded-xl
                text-white
                font-semibold
                text-sm
                hover:bg-orange-600
                transition
              "
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}