import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { appUser } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect to their dashboard
    if (appUser) {
      if (appUser.role === "parent") {
        navigate("/parent", { replace: true });
      } else {
        navigate("/child", { replace: true });
      }
    }
  }, [appUser, navigate]);

  function handleGetStarted() {
    navigate("/login");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden"
    }}>
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
      
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(50px, 50px) rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>

      <div style={{
        maxWidth: "1400px",
        width: "100%",
        textAlign: "center",
        color: "white",
        zIndex: 1,
        position: "relative",
        padding: "0 40px"
      }} className="fade-in-up">
        {/* Logo/Icon */}
        <div style={{
          fontSize: "80px",
          marginBottom: "20px",
          animation: "float 3s ease-in-out infinite"
        }}>
          🎓
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: "clamp(2.5rem, 5vw, 4rem)",
          fontWeight: "700",
          marginBottom: "20px",
          textShadow: "2px 2px 10px rgba(0,0,0,0.3)",
          lineHeight: "1.2"
        }}>
          Kids School
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
          marginBottom: "40px",
          opacity: 0.95,
          lineHeight: "1.6",
          textShadow: "1px 1px 5px rgba(0,0,0,0.2)"
        }}>
          Інтерактивна платформа для навчання дітей<br />
          Створюйте завдання, відстежуйте прогрес, розвивайте навички
        </p>

        {/* Features */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "30px",
          marginBottom: "50px",
          textAlign: "left",
          maxWidth: "1200px",
          margin: "0 auto 50px"
        }}>
          <div style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            padding: "25px",
            borderRadius: "15px",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2.5em", marginBottom: "10px" }}>📚</div>
            <h3 style={{ marginBottom: "10px", fontSize: "1.2em" }}>Різноманітні завдання</h3>
            <p style={{ fontSize: "0.9em", opacity: 0.9 }}>Інтерактивні вправи, тести та ігри</p>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            padding: "25px",
            borderRadius: "15px",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2.5em", marginBottom: "10px" }}>📊</div>
            <h3 style={{ marginBottom: "10px", fontSize: "1.2em" }}>Статистика прогресу</h3>
            <p style={{ fontSize: "0.9em", opacity: 0.9 }}>Відстежуйте успіхи та результати</p>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            padding: "25px",
            borderRadius: "15px",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2.5em", marginBottom: "10px" }}>👨‍👩‍👧</div>
            <h3 style={{ marginBottom: "10px", fontSize: "1.2em" }}>Для батьків та дітей</h3>
            <p style={{ fontSize: "0.9em", opacity: 0.9 }}>Зручний інтерфейс для всієї родини</p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleGetStarted}
          style={{
            padding: "18px 50px",
            fontSize: "1.3em",
            fontWeight: "600",
            color: "#667eea",
            background: "white",
            border: "none",
            borderRadius: "50px",
            cursor: "pointer",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 15px 50px rgba(0,0,0,0.3)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.2)";
          }}
        >
          Почати навчання →
        </button>

        {/* Footer text */}
        <p style={{
          marginTop: "40px",
          fontSize: "0.9em",
          opacity: 0.8,
          fontStyle: "italic"
        }}>
          Безпечна та зручна платформа для навчання
        </p>
      </div>
    </div>
  );
}

