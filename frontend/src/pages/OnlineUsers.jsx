import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContextProvider";

const socket = io("http://localhost:8000", { withCredentials: true });

const OnlineUsers = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!auth?._id) return;

    socket.emit("join", {
      userId: auth._id,
      username: auth.username,
      fullName: auth.fullName,
    });

    socket.on("onlineUsers", (users) => {
      console.log("Online users:", users);
      setOnlineUsers(users.filter((user) => user.userId !== auth._id));
    });

    return () => {
      socket.off("onlineUsers");
    };
  }, [auth]);

  const handleUserClick = (username) => {
    navigate(`/chat/${username}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6" style={{ paddingTop: "80px" }}>
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Online Users</h2>
        {onlineUsers.length > 0 ? (
          <ul className="space-y-3">
            {onlineUsers.map((user) => (
              <li
                key={user.userId}
                onClick={() => handleUserClick(user.username)}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-800">{user.fullName}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No users online</p>
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;