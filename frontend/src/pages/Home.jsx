import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContextProvider";
import LoginModal from "../pages/LoginModal"; 

function Home() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [isLoginOpen, setLoginOpen] = useState(false); 

  const handleStartChatting = () => {
    if (auth) {
      navigate("/online-users");
    } else {
      setLoginOpen(true); 
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-white flex items-center justify-center p-6">
        <div className="bg-white shadow-2xl rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-indigo-600 mb-4">Welcome to KeyWave</h1>
          <p className="text-gray-600 mb-6 text-lg">
            Connect securely with your friends using end-to-end encrypted messaging. Start chatting now!
          </p>
          <button
            onClick={handleStartChatting}
            className="px-8 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            Start Chatting
          </button>
          {!auth && (
            <p className="mt-4 text-gray-500 text-sm">
              You need to log in to access the chat feature.
            </p>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setLoginOpen(false)}
        onOpenRegister={() => {
          setLoginOpen(false); 
        }}
      />
    </>
  );
}

export default Home;