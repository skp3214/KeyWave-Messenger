import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContextProvider";

const socket = io("http://localhost:8000", { withCredentials: true });

const Chat = () => {
  const { auth } = useAuth();
  const { username } = useParams();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [hasPublicKey, setHasPublicKey] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [requestFrom, setRequestFrom] = useState(null);
  const [toUserId, setToUserId] = useState(null);
  const [userMap, setUserMap] = useState({}); 

  useEffect(() => {
    if (!auth?._id) return;

    socket.emit("join", {
      userId: auth._id,
      username: auth.username,
      fullName: auth.fullName,
    });

    socket.on("onlineUsers", (users) => {
      const targetUser = users.find((u) => u.username === username);
      if (targetUser) setToUserId(targetUser.userId);

      const newUserMap = {};
      users.forEach((user) => {
        newUserMap[user.userId] = user.username;
      });
      setUserMap(newUserMap);
    });

    socket.on("receivePublicKey", ({ fromUserId }) => {
      if (fromUserId === toUserId) {
        setHasPublicKey(true);
      }
    });

    socket.on("publicKeyRequest", ({ fromUserId }) => {
      setRequestFrom(fromUserId);
      setShowModal(true);
    });

    socket.on("receiveMessage", ({ fromUserId, fromUsername, message }) => {
      setMessages((prev) => [...prev, { fromUserId, fromUsername, text: message }]);
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("receivePublicKey");
      socket.off("publicKeyRequest");
      socket.off("receiveMessage");
    };
  }, [auth, username, toUserId]);

  const requestPublicKey = () => {
    if (toUserId) {
      socket.emit("requestPublicKey", { fromUserId: auth._id, toUserId });
    }
  };

  const handleSharePublicKey = (approved) => {
    socket.emit("sharePublicKey", {
      fromUserId: auth._id,
      toUserId: requestFrom,
      approved,
    });
    setShowModal(false);
    setRequestFrom(null);
  };

  const sendMessage = () => {
    if (!messageInput || !toUserId || !hasPublicKey) return;

    socket.emit("sendMessage", {
      fromUserId: auth._id,
      toUserId,
      message: messageInput,
    });
    setMessageInput("");
  };

  return (
    <div className="flex min-h-screen mt-18 bg-gray-100">
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-indigo-600 text-white">
          <h3 className="text-lg font-semibold">Chatting with @{username}</h3>
        </div>
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 flex ${msg.fromUserId === auth._id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg shadow ${
                  msg.fromUserId === auth._id ? "bg-indigo-500 text-white" : "bg-white text-gray-800"
                }`}
              >
                <p className="text-sm">
                  <strong>
                    {msg.fromUserId === auth._id ? "You" : `@${msg.fromUsername}`}:
                  </strong>{" "}
                  {msg.text}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border-t flex space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-200"
            disabled={!hasPublicKey}
          />
          <button
            onClick={requestPublicKey}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Request Key
          </button>
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            disabled={!hasPublicKey}
          >
            Send
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Public Key Request</h3>
            <p className="text-gray-600 mb-4">
              @{userMap[requestFrom] || "User"} wants to chat. Share your public key?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleSharePublicKey(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Okay
              </button>
              <button
                onClick={() => handleSharePublicKey(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;