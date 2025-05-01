import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";

export default function App() {
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    axios.get(import.meta.env.VITE_API_BASE + "/")
      .then(r => setMessage(r.data.msg))
      .catch(err => console.error("API Error:", err));
      
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      // You could verify the token here or fetch user data
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        setUser(userData);
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  }, []);
  
  return (
    <div className="app">
      <Navbar user={user} setUser={setUser} />
      <main>
        <h1>Kha-Boom!</h1>
        <p>{message || "Loading..."}</p>
        
        {!user && (
          <div className="auth-buttons">
            <button onClick={() => window.location.href = "/login"}>Login</button>
            <button onClick={() => window.location.href = "/register"}>Register</button>
          </div>
        )}
        
        {user && (
          <div className="welcome">
            <h2>Welcome, {user.name}!</h2>
            <button 
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
              }}
            >
              Logout
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
