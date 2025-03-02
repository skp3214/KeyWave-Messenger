import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    RouterProvider,
  } from "react-router-dom";
  import Layout from "./components/Layout";
  import Home from "./pages/Home";
  import { Toaster } from "react-hot-toast";
  import AuthContextProvider from "./contexts/AuthContextProvider";
  import OnlineUsers from "./pages/OnlineUsers";
  import Chat from "./pages/chat";
  
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="online-users" element={<OnlineUsers />} />
          <Route path="chat/:username" element={<Chat />} />
        </Route>
      </Route>
    )
  );
  
  function App() {
    return (
      <AuthContextProvider>
        <Toaster />
        <RouterProvider router={router} />
      </AuthContextProvider>
    );
  }
  
  export default App;