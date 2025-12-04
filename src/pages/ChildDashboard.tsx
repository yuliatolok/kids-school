import { useEffect, useState } from "react";

import { collection, getDocs } from "firebase/firestore";

import { db } from "../firebase";

import { useAuth } from "../context/AuthContext";

import type { Task } from "../types";

import { Link } from "react-router-dom";



export default function ChildDashboard() {

  const { appUser, logout } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);



  useEffect(() => {

    async function loadTasks() {

      const snap = await getDocs(collection(db, "tasks"));

      const items: Task[] = [];

      snap.forEach(docSnap => {

        const data = docSnap.data() as Task;

        items.push({ ...data, id: docSnap.id });

      });

      setTasks(items);

    }

    loadTasks().catch(console.error);

  }, []);



  return (

    <div style={{

      minHeight: "100vh",

      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

      padding: "40px 20px",

      position: "relative",

      overflow: "hidden"

    }}>

      <style>{`

        @keyframes fadeIn {

          from { opacity: 0; transform: translateY(20px); }

          to { opacity: 1; transform: translateY(0); }

        }

        .task-card {

          animation: fadeIn 0.4s ease-out;

        }

      `}</style>



      {/* Animated background */}

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



      <div style={{

        maxWidth: "1200px",

        margin: "0 auto",

        position: "relative",

        zIndex: 1

      }}>

        {/* Header */}

        <div style={{

          background: "rgba(255, 255, 255, 0.95)",

          backdropFilter: "blur(20px)",

          borderRadius: "20px",

          padding: "30px 40px",

          marginBottom: "30px",

          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          flexWrap: "wrap",

          gap: "20px"

        }}>

          <div>

            <h1 style={{

              margin: 0,

              fontSize: "2.5em",

              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

              WebkitBackgroundClip: "text",

              WebkitTextFillColor: "transparent",

              backgroundClip: "text"

            }}>

              🎓 Кабінет учня

            </h1>

            <p style={{

              margin: "10px 0 0",

              color: "#666",

              fontSize: "1.1em"

            }}>

              Привіт, {appUser?.displayName ?? appUser?.id}! 👋

            </p>

          </div>

          <button

            onClick={logout}

            style={{

              padding: "12px 30px",

              fontSize: "1em",

              fontWeight: "600",

              color: "#667eea",

              background: "white",

              border: "2px solid #667eea",

              borderRadius: "50px",

              cursor: "pointer",

              transition: "all 0.3s ease",

              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.2)"

            }}

            onMouseOver={(e) => {

              e.currentTarget.style.background = "#667eea";

              e.currentTarget.style.color = "white";

              e.currentTarget.style.transform = "translateY(-2px)";

            }}

            onMouseOut={(e) => {

              e.currentTarget.style.background = "white";

              e.currentTarget.style.color = "#667eea";

              e.currentTarget.style.transform = "translateY(0)";

            }}

          >

            Вийти

          </button>

        </div>



        {/* Tasks Section */}

        <div style={{

          background: "rgba(255, 255, 255, 0.95)",

          backdropFilter: "blur(20px)",

          borderRadius: "20px",

          padding: "40px",

          boxShadow: "0 10px 40px rgba(0,0,0,0.2)"

        }}>

          <h2 style={{

            margin: "0 0 30px",

            fontSize: "2em",

            color: "#333",

            display: "flex",

            alignItems: "center",

            gap: "10px"

          }}>

            📚 Мої завдання

          </h2>



          {tasks.length === 0 ? (

            <div style={{

              textAlign: "center",

              padding: "60px 20px",

              color: "#999"

            }}>

              <div style={{ fontSize: "4em", marginBottom: "20px" }}>📝</div>

              <p style={{ fontSize: "1.2em", margin: 0 }}>Поки що немає завдань.</p>

              <p style={{ fontSize: "0.9em", marginTop: "10px" }}>Зачекайте, поки батьки створять завдання для вас!</p>

            </div>

          ) : (

            <div style={{

              display: "grid",

              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",

              gap: "20px"

            }}>

              {tasks.map(t => (

                <div

                  key={t.id}

                  className="task-card"

                  style={{

                    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",

                    border: "2px solid rgba(102, 126, 234, 0.2)",

                    borderRadius: "15px",

                    padding: "25px",

                    transition: "all 0.3s ease",

                    cursor: "pointer"

                  }}

                  onMouseOver={(e) => {

                    e.currentTarget.style.transform = "translateY(-5px)";

                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(102, 126, 234, 0.3)";

                    e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.5)";

                  }}

                  onMouseOut={(e) => {

                    e.currentTarget.style.transform = "translateY(0)";

                    e.currentTarget.style.boxShadow = "none";

                    e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.2)";

                  }}

                >

                  <h3 style={{

                    margin: "0 0 10px",

                    fontSize: "1.3em",

                    color: "#333"

                  }}>

                    {t.title}

                  </h3>

                  {t.description && (

                    <p style={{

                      margin: "0 0 15px",

                      color: "#666",

                      fontSize: "0.95em",

                      lineHeight: "1.5"

                    }}>

                      {t.description}

                    </p>

                  )}

                  <Link

                    to={`/task/${t.id}`}

                    style={{

                      display: "inline-block",

                      padding: "10px 25px",

                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

                      color: "white",

                      textDecoration: "none",

                      borderRadius: "50px",

                      fontWeight: "600",

                      fontSize: "0.95em",

                      transition: "all 0.3s ease",

                      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"

                    }}

                    onMouseOver={(e) => {

                      e.currentTarget.style.transform = "scale(1.05)";

                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";

                    }}

                    onMouseOut={(e) => {

                      e.currentTarget.style.transform = "scale(1)";

                      e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";

                    }}

                  >

                    Виконати завдання →

                  </Link>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>

  );

}
