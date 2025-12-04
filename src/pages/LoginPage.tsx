// src/pages/LoginPage.tsx

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";



export default function LoginPage() {

  const { appUser, login } = useAuth();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);



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

    setLoading(true);

    try {

      await login();

      // onAuthStateChanged в AuthContext виставить appUser,

      // useEffect вище зреагує і зробить navigate(...)

    } catch (e: any) {

      console.error("Login error:", e);

      alert("Помилка входу: " + (e.code ?? e.message ?? String(e)));

    } finally {

      setLoading(false);

    }

  }



  return (

    <div style={{

      minHeight: "100vh",

      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "40px 20px",

      position: "relative",

      overflow: "hidden"

    }}>

      <style>{`

        @keyframes float {

          0%, 100% { transform: translateY(0px) rotate(0deg); }

          50% { transform: translateY(-20px) rotate(5deg); }

        }

        @keyframes pulse {

          0%, 100% { opacity: 1; transform: scale(1); }

          50% { opacity: 0.8; transform: scale(1.05); }

        }

        @keyframes fadeIn {

          from { opacity: 0; transform: translateY(20px); }

          to { opacity: 1; transform: translateY(0); }

        }

        .login-container {

          animation: fadeIn 0.6s ease-out;

        }

      `}</style>



      {/* Animated background elements */}

      <div style={{

        position: "absolute",

        top: "-50%",

        left: "-50%",

        width: "200%",

        height: "200%",

        background: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",

        backgroundSize: "50px 50px",

        animation: "float 20s infinite linear",

        pointerEvents: "none"

      }} />



      <div className="login-container" style={{

        maxWidth: "500px",

        width: "100%",

        background: "rgba(255, 255, 255, 0.95)",

        backdropFilter: "blur(20px)",

        borderRadius: "30px",

        padding: "60px 50px",

        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",

        border: "1px solid rgba(255, 255, 255, 0.3)",

        textAlign: "center",

        position: "relative",

        zIndex: 1

      }}>

        {/* Logo/Icon */}

        <div style={{

          fontSize: "80px",

          marginBottom: "20px",

          animation: "float 3s ease-in-out infinite"

        }}>

          🎓

        </div>



        {/* Title */}

        <h1 style={{

          fontSize: "2.5em",

          fontWeight: "700",

          marginBottom: "20px",

          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

          WebkitBackgroundClip: "text",

          WebkitTextFillColor: "transparent",

          backgroundClip: "text"

        }}>

          Kids School

        </h1>



        {/* Subtitle */}

        <p style={{

          fontSize: "1.1em",

          color: "#666",

          marginBottom: "40px",

          lineHeight: "1.6"

        }}>

          Увійдіть, щоб продовжити навчання

        </p>



        {/* Login Button */}

        <button

          onClick={handleLogin}

          disabled={loading}

          style={{

            width: "100%",

            padding: "16px 32px",

            fontSize: "1.1em",

            fontWeight: "600",

            color: "white",

            background: loading 

              ? "linear-gradient(135deg, #999 0%, #777 100%)"

              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

            border: "none",

            borderRadius: "50px",

            cursor: loading ? "not-allowed" : "pointer",

            boxShadow: loading 

              ? "0 5px 15px rgba(0,0,0,0.1)"

              : "0 10px 30px rgba(102, 126, 234, 0.4)",

            transition: "all 0.3s ease",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            gap: "10px",

            marginBottom: "20px"

          }}

          onMouseOver={(e) => {

            if (!loading) {

              e.currentTarget.style.transform = "translateY(-2px)";

              e.currentTarget.style.boxShadow = "0 15px 40px rgba(102, 126, 234, 0.5)";

            }

          }}

          onMouseOut={(e) => {

            if (!loading) {

              e.currentTarget.style.transform = "translateY(0)";

              e.currentTarget.style.boxShadow = "0 10px 30px rgba(102, 126, 234, 0.4)";

            }

          }}

        >

          {loading ? (

            <>

              <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>⏳</span>

              Завантаження...

            </>

          ) : (

            <>

              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">

                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>

                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>

                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>

                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>

              </svg>

              Увійти через Google

            </>

          )}

        </button>



        {/* Info text */}

        <p style={{

          fontSize: "0.85em",

          color: "#999",

          marginTop: "30px",

          lineHeight: "1.5"

        }}>

          Безпечний вхід через Google аккаунт<br />

          Ваші дані захищені

        </p>



        {/* Decorative elements */}

        <div style={{

          position: "absolute",

          top: "-50px",

          right: "-50px",

          width: "200px",

          height: "200px",

          background: "radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%)",

          borderRadius: "50%",

          pointerEvents: "none"

        }} />

        <div style={{

          position: "absolute",

          bottom: "-30px",

          left: "-30px",

          width: "150px",

          height: "150px",

          background: "radial-gradient(circle, rgba(118, 75, 162, 0.2) 0%, transparent 70%)",

          borderRadius: "50%",

          pointerEvents: "none"

        }} />

      </div>

    </div>

  );

}
