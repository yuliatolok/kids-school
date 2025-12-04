// src/pages/LoginPage.tsx

import { useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";



export default function LoginPage() {

  const { appUser, login } = useAuth();

  const navigate = useNavigate();



  // When user is logged in -> redirect by role

  useEffect(() => {

    if (!appUser) return;



    if (appUser.role === "parent") {

      navigate("/parent", { replace: true });

    } else {

      navigate("/child", { replace: true });

    }

  }, [appUser, navigate]);



  async function handleLogin() {

    try {

      await login();

      // onAuthStateChanged в AuthContext виставить appUser,

      // useEffect вище зреагує і зробить navigate(...)

    } catch (e: any) {

      console.error("Login error:", e);

      alert("Помилка входу: " + (e.code ?? e.message ?? String(e)));

    }

  }



  return (

    <div style={{ padding: "40px" }}>

      <h1 style={{ fontSize: "32px", marginBottom: "24px" }}>Логін</h1>

      <button

        onClick={handleLogin}

        style={{

          padding: "10px 20px",

          borderRadius: "8px",

          border: "1px solid #222",

          background: "white",

          cursor: "pointer",

        }}

      >

        Увійти через Google

      </button>

    </div>

  );

}
