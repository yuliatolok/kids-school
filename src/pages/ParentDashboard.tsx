import { useEffect, useState } from "react";

import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";

import { db } from "../firebase";

import { useAuth } from "../context/AuthContext";

import type { Task, TaskResult } from "../types";

import { Link } from "react-router-dom";



export default function ParentDashboard() {

  const { appUser, logout } = useAuth();



  // защита от null, TypeScript перестаёт ругаться

  if (!appUser) {

    return <div>Завантаження...</div>;

  }



  const [title, setTitle] = useState("");

  const [htmlUrl, setHtmlUrl] = useState("/tasks/christmas-trainer.html");

  const [description, setDescription] = useState("");

  const [targetEmails, setTargetEmails] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);

  const [editingTask, setEditingTask] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");

  const [editDescription, setEditDescription] = useState("");

  const [editHtmlUrl, setEditHtmlUrl] = useState("");

  const [editTargetEmails, setEditTargetEmails] = useState("");

  const [loading, setLoading] = useState(false);

  const [taskStats, setTaskStats] = useState<Record<string, {
    totalAttempts: number;
    totalCorrect: number;
    totalIncorrect: number;
    avgTimeMs: number;
  }>>({});

  const [userEmails, setUserEmails] = useState<Record<string, string>>({});



  // Load tasks created by this parent

  useEffect(() => {

    if (!appUser) return;

    const userId = appUser.id; // Store in local variable for TypeScript

    async function loadTasks() {

      const q = query(

        collection(db, "tasks"),

        where("createdBy", "==", userId)

      );

      const snap = await getDocs(q);

      const items: Task[] = [];

      snap.forEach(docSnap => {

        const data = docSnap.data() as Task;

        items.push({ ...data, id: docSnap.id });

      });

      setTasks(items);

    }



    loadTasks().catch(console.error);

  }, [appUser]);



  // Load user emails for targetUserIds

  useEffect(() => {

    if (tasks.length === 0) return;



    async function loadUserEmails() {

      const allUserIds = new Set<string>();

      tasks.forEach(task => {

        task.targetUserIds.forEach(id => allUserIds.add(id));

      });



      if (allUserIds.size === 0) return;



      const emailMap: Record<string, string> = {};

      const usersRef = collection(db, "users");

      const usersSnap = await getDocs(usersRef);



      usersSnap.forEach(docSnap => {

        const userData = docSnap.data();

        if (allUserIds.has(docSnap.id) && userData.email) {

          emailMap[docSnap.id] = userData.email;

        }

      });



      setUserEmails(emailMap);

    }



    loadUserEmails().catch(console.error);

  }, [tasks]);



  // Load stats for all tasks

  useEffect(() => {

    if (tasks.length === 0) return;



    async function loadStats() {

      const statsMap: Record<string, {
        totalAttempts: number;
        totalCorrect: number;
        totalIncorrect: number;
        avgTimeMs: number;
      }> = {};



      // Load results for each task

      for (const task of tasks) {

        const q = query(

          collection(db, "taskResults"),

          where("taskId", "==", task.id)

        );

        const snap = await getDocs(q);

        const results: TaskResult[] = [];

        snap.forEach(docSnap => {

          const data = docSnap.data() as Omit<TaskResult, "id">;

          results.push({ ...data, id: docSnap.id });

        });



        if (results.length > 0) {

          const totalCorrect = results.reduce((sum, r) => sum + r.correct, 0);

          const totalIncorrect = results.reduce((sum, r) => sum + r.incorrect, 0);

          const totalTime = results.reduce((sum, r) => sum + r.timeMs, 0);

          const avgTime = Math.round(totalTime / results.length);



          statsMap[task.id] = {

            totalAttempts: results.length,

            totalCorrect,

            totalIncorrect,

            avgTimeMs: avgTime,

          };

        } else {

          statsMap[task.id] = {

            totalAttempts: 0,

            totalCorrect: 0,

            totalIncorrect: 0,

            avgTimeMs: 0,

          };

        }

      }



      setTaskStats(statsMap);

    }



    loadStats().catch(console.error);

  }, [tasks]);



  async function handleCreateTask(e: React.FormEvent) {

    e.preventDefault();

    if (!appUser) return;

    if (!title.trim() || !htmlUrl.trim()) return;



    setLoading(true);

    try {

      // Find user IDs by emails

      let targetUserIds: string[] = [];

      if (targetEmails.trim()) {

        const emailList = targetEmails.split(",").map(e => e.trim()).filter(e => e);

        const usersRef = collection(db, "users");

        const usersSnap = await getDocs(usersRef);

        const emailToIdMap: Record<string, string> = {};

        usersSnap.forEach(docSnap => {

          const userData = docSnap.data();

          if (userData.email && emailList.includes(userData.email)) {

            emailToIdMap[userData.email] = docSnap.id;

          }

        });

        targetUserIds = emailList.map(email => emailToIdMap[email]).filter(id => id);

      }



      const docRef = await addDoc(collection(db, "tasks"), {

        title,

        description,

        type: "htmlPage",

        htmlUrl,

        targetUserIds,

        createdBy: appUser.id,

        createdAt: Date.now(),

        id: "" // will be overwritten locally

      });



      const newTask: Task = {

        id: docRef.id,

        title,

        description,

        type: "htmlPage",

        htmlUrl,

        targetUserIds,

        createdBy: appUser.id,

        createdAt: Date.now()

      };



      setTasks(prev => [newTask, ...prev]);

      setTitle("");

      setDescription("");

      setTargetEmails("");

    } catch (err) {

      console.error(err);

      alert("Не вдалося створити завдання");

    } finally {

      setLoading(false);

    }

  }



  async function handleDeleteTask(taskId: string) {

    if (!confirm("Ви впевнені, що хочете видалити це завдання?")) {

      return;

    }



    try {

      await deleteDoc(doc(db, "tasks", taskId));

      setTasks(prev => prev.filter(t => t.id !== taskId));

      // Also remove from stats

      setTaskStats(prev => {

        const newStats = { ...prev };

        delete newStats[taskId];

        return newStats;

      });

    } catch (err) {

      console.error(err);

      alert("Не вдалося видалити завдання");

    }

  }



  function startEditTask(task: Task) {

    setEditingTask(task.id);

    setEditTitle(task.title);

    setEditDescription(task.description);

    setEditHtmlUrl(task.htmlUrl || "");

    // Get emails from userEmails map

    const emails = task.targetUserIds.map(id => userEmails[id]).filter(e => e);

    setEditTargetEmails(emails.join(", "));

  }



  function cancelEdit() {

    setEditingTask(null);

    setEditTitle("");

    setEditDescription("");

    setEditHtmlUrl("");

    setEditTargetEmails("");

  }



  async function handleUpdateTask(e: React.FormEvent, taskId: string) {

    e.preventDefault();

    if (!appUser) return;

    if (!editTitle.trim() || !editHtmlUrl.trim()) return;



    setLoading(true);

    try {

      // Find user IDs by emails

      let targetUserIds: string[] = [];

      if (editTargetEmails.trim()) {

        const emailList = editTargetEmails.split(",").map(e => e.trim()).filter(e => e);

        const usersRef = collection(db, "users");

        const usersSnap = await getDocs(usersRef);

        const emailToIdMap: Record<string, string> = {};

        usersSnap.forEach(docSnap => {

          const userData = docSnap.data();

          if (userData.email && emailList.includes(userData.email)) {

            emailToIdMap[userData.email] = docSnap.id;

          }

        });

        targetUserIds = emailList.map(email => emailToIdMap[email]).filter(id => id);

      }



      await updateDoc(doc(db, "tasks", taskId), {

        title: editTitle,

        description: editDescription,

        htmlUrl: editHtmlUrl,

        targetUserIds,

      });



      // Update local state

      setTasks(prev => prev.map(t =>

        t.id === taskId

          ? { ...t, title: editTitle, description: editDescription, htmlUrl: editHtmlUrl, targetUserIds }

          : t

      ));



      cancelEdit();

    } catch (err) {

      console.error(err);

      alert("Не вдалося оновити завдання");

    } finally {

      setLoading(false);

    }

  }



  return (

    <div style={{

      minHeight: "100vh",

      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

      padding: "40px 20px",

      position: "relative",

      overflow: "hidden"

    }}>

      <style>{`

        @keyframes float {

          0%, 100% { transform: translateY(0px); }

          50% { transform: translateY(-20px); }

        }

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

              👨‍👩‍👧 Кабінет батьків

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



        {/* Create Task Form */}

        <div style={{

          background: "rgba(255, 255, 255, 0.95)",

          backdropFilter: "blur(20px)",

          borderRadius: "20px",

          padding: "40px",

          marginBottom: "30px",

          boxShadow: "0 10px 40px rgba(0,0,0,0.2)"

        }}>

          <h2 style={{

            margin: "0 0 25px",

            fontSize: "2em",

            color: "#333",

            display: "flex",

            alignItems: "center",

            gap: "10px"

          }}>

            ➕ Створити нове завдання

          </h2>



          <form onSubmit={handleCreateTask} style={{ maxWidth: "100%" }}>

            <div style={{ marginBottom: "20px" }}>

              <label style={{

                display: "block",

                marginBottom: "8px",

                fontWeight: "600",

                color: "#333",

                fontSize: "1em"

              }}>

                Назва:

              </label>

              <input

                style={{

                  width: "100%",

                  padding: "12px 16px",

                  borderRadius: "10px",

                  border: "2px solid #e0e0e0",

                  fontSize: "1em",

                  transition: "all 0.3s ease",

                  boxSizing: "border-box"

                }}

                value={title}

                onChange={e => setTitle(e.target.value)}

                onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}

                onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}

                required

              />

            </div>



            <div style={{ marginBottom: "20px" }}>

              <label style={{

                display: "block",

                marginBottom: "8px",

                fontWeight: "600",

                color: "#333",

                fontSize: "1em"

              }}>

                Опис (необов'язково):

              </label>

              <input

                style={{

                  width: "100%",

                  padding: "12px 16px",

                  borderRadius: "10px",

                  border: "2px solid #e0e0e0",

                  fontSize: "1em",

                  transition: "all 0.3s ease",

                  boxSizing: "border-box"

                }}

                value={description}

                onChange={e => setDescription(e.target.value)}

                onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}

                onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}

              />

            </div>



            <div style={{ marginBottom: "20px" }}>

              <label style={{

                display: "block",

                marginBottom: "8px",

                fontWeight: "600",

                color: "#333",

                fontSize: "1em"

              }}>

                Посилання на HTML:

              </label>

              <input

                style={{

                  width: "100%",

                  padding: "12px 16px",

                  borderRadius: "10px",

                  border: "2px solid #e0e0e0",

                  fontSize: "1em",

                  transition: "all 0.3s ease",

                  boxSizing: "border-box"

                }}

                value={htmlUrl}

                onChange={e => setHtmlUrl(e.target.value)}

                onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}

                onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}

                required

              />

              <div style={{ fontSize: "0.85em", color: "#666", marginTop: "6px" }}>

                Напр.: <code style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: "4px" }}>/tasks/christmas-trainer.html</code>

              </div>

            </div>



            <div style={{ marginBottom: "25px" }}>

              <label style={{

                display: "block",

                marginBottom: "8px",

                fontWeight: "600",

                color: "#333",

                fontSize: "1em"

              }}>

                Email учнів (необов'язково, через кому):

              </label>

              <input

                style={{

                  width: "100%",

                  padding: "12px 16px",

                  borderRadius: "10px",

                  border: "2px solid #e0e0e0",

                  fontSize: "1em",

                  transition: "all 0.3s ease",

                  boxSizing: "border-box"

                }}

                value={targetEmails}

                onChange={e => setTargetEmails(e.target.value)}

                placeholder="email1@example.com, email2@example.com"

                onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}

                onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}

              />

              <div style={{ fontSize: "0.85em", color: "#666", marginTop: "6px" }}>

                Залиште порожнім, щоб завдання було видиме всім учням

              </div>

            </div>



            <button

              type="submit"

              disabled={loading}

              style={{

                padding: "14px 35px",

                fontSize: "1.1em",

                fontWeight: "600",

                color: "white",

                background: loading

                  ? "linear-gradient(135deg, #999 0%, #777 100%)"

                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

                border: "none",

                borderRadius: "50px",

                cursor: loading ? "not-allowed" : "pointer",

                transition: "all 0.3s ease",

                boxShadow: "0 6px 20px rgba(102, 126, 234, 0.3)"

              }}

              onMouseOver={(e) => {

                if (!loading) {

                  e.currentTarget.style.transform = "translateY(-2px)";

                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.4)";

                }

              }}

              onMouseOut={(e) => {

                if (!loading) {

                  e.currentTarget.style.transform = "translateY(0)";

                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.3)";

                }

              }}

            >

              {loading ? "⏳ Зберігаю..." : "✨ Створити завдання"}

            </button>

          </form>

        </div>



        {/* Tasks List */}

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

            📋 Мої завдання

          </h2>



          {tasks.length === 0 ? (

            <div style={{

              textAlign: "center",

              padding: "60px 20px",

              color: "#999"

            }}>

              <div style={{ fontSize: "4em", marginBottom: "20px" }}>📝</div>

              <p style={{ fontSize: "1.2em", margin: 0 }}>Поки що немає завдань.</p>

              <p style={{ fontSize: "0.9em", marginTop: "10px" }}>Створіть перше завдання вище!</p>

            </div>

          ) : (

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {tasks.map(t => {

                const stats = taskStats[t.id];

                const isEditing = editingTask === t.id;

                return (

                  <div

                    key={t.id}

                    className="task-card"

                    style={{

                      padding: "25px",

                      background: isEditing

                        ? "linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%)"

                        : "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",

                      borderRadius: "15px",

                      border: isEditing ? "2px solid #ff9800" : "2px solid rgba(102, 126, 234, 0.2)",

                      transition: "all 0.3s ease"

                    }}

                  >

              {isEditing ? (

                    <form onSubmit={(e) => handleUpdateTask(e, t.id)} style={{ maxWidth: "100%" }}>

                      <div style={{ marginBottom: "15px" }}>

                        <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#333" }}>

                          Назва:

                        </label>

                        <input

                          style={{

                            width: "100%",

                            padding: "10px 14px",

                            borderRadius: "8px",

                            border: "2px solid #e0e0e0",

                            fontSize: "1em",

                            boxSizing: "border-box"

                          }}

                          value={editTitle}

                          onChange={e => setEditTitle(e.target.value)}

                          required

                        />

                      </div>

                      <div style={{ marginBottom: "15px" }}>

                        <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#333" }}>

                          Опис (необов'язково):

                        </label>

                        <input

                          style={{

                            width: "100%",

                            padding: "10px 14px",

                            borderRadius: "8px",

                            border: "2px solid #e0e0e0",

                            fontSize: "1em",

                            boxSizing: "border-box"

                          }}

                          value={editDescription}

                          onChange={e => setEditDescription(e.target.value)}

                        />

                      </div>

                      <div style={{ marginBottom: "15px" }}>

                        <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#333" }}>

                          Посилання на HTML:

                        </label>

                        <input

                          style={{

                            width: "100%",

                            padding: "10px 14px",

                            borderRadius: "8px",

                            border: "2px solid #e0e0e0",

                            fontSize: "1em",

                            boxSizing: "border-box"

                          }}

                          value={editHtmlUrl}

                          onChange={e => setEditHtmlUrl(e.target.value)}

                          required

                        />

                      </div>

                      <div style={{ marginBottom: "20px" }}>

                        <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#333" }}>

                          Email учнів (необов'язково, через кому):

                        </label>

                        <input

                          style={{

                            width: "100%",

                            padding: "10px 14px",

                            borderRadius: "8px",

                            border: "2px solid #e0e0e0",

                            fontSize: "1em",

                            boxSizing: "border-box"

                          }}

                          value={editTargetEmails}

                          onChange={e => setEditTargetEmails(e.target.value)}

                          placeholder="email1@example.com, email2@example.com"

                        />

                        <div style={{ fontSize: "0.85em", color: "#666", marginTop: "6px" }}>

                          Залиште порожнім, щоб завдання було видиме всім учням

                        </div>

                      </div>

                      <div style={{ display: "flex", gap: "12px" }}>

                        <button

                          type="submit"

                          disabled={loading}

                          style={{

                            padding: "10px 24px",

                            background: loading ? "#999" : "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",

                            color: "white",

                            border: "none",

                            borderRadius: "50px",

                            cursor: loading ? "not-allowed" : "pointer",

                            fontWeight: "600",

                            fontSize: "0.95em",

                            transition: "all 0.3s ease",

                            boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)"

                          }}

                        >

                          {loading ? "⏳ Зберігаю..." : "✅ Зберегти"}

                        </button>

                        <button

                          type="button"

                          onClick={cancelEdit}

                          style={{

                            padding: "10px 24px",

                            background: "#999",

                            color: "white",

                            border: "none",

                            borderRadius: "50px",

                            cursor: "pointer",

                            fontWeight: "600",

                            fontSize: "0.95em",

                            transition: "all 0.3s ease"

                          }}

                          onMouseOver={(e) => e.currentTarget.style.background = "#777"}

                          onMouseOut={(e) => e.currentTarget.style.background = "#999"}

                        >

                          ❌ Скасувати

                        </button>

                      </div>

                    </form>

                  ) : (

                    <>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", flexWrap: "wrap", gap: "15px" }}>

                        <div style={{ flex: 1, minWidth: "250px" }}>

                          <h3 style={{

                            margin: "0 0 10px",

                            fontSize: "1.4em",

                            color: "#333"

                          }}>

                            {t.title}

                          </h3>

                          {t.description && (

                            <p style={{

                              margin: "0 0 10px",

                              color: "#666",

                              fontSize: "0.95em"

                            }}>

                              {t.description}

                            </p>

                          )}

                          {t.targetUserIds.length > 0 ? (

                            <div style={{

                              fontSize: "0.9em",

                              color: "#555",

                              marginBottom: "10px",

                              padding: "8px 12px",

                              background: "rgba(102, 126, 234, 0.1)",

                              borderRadius: "8px",

                              display: "inline-block"

                            }}>

                              <strong>👥 Для учнів:</strong> {t.targetUserIds.map(id => userEmails[id] || id).join(", ") || "Не знайдено"}

                            </div>

                          ) : (

                            <div style={{

                              fontSize: "0.9em",

                              color: "#888",

                              marginBottom: "10px",

                              padding: "8px 12px",

                              background: "rgba(0,0,0,0.05)",

                              borderRadius: "8px",

                              display: "inline-block"

                            }}>

                              🌍 Для всіх учнів

                            </div>

                          )}

                          <Link

                            to={`/task/${t.id}`}

                            style={{

                              display: "inline-block",

                              marginTop: "10px",

                              padding: "8px 20px",

                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

                              color: "white",

                              textDecoration: "none",

                              borderRadius: "50px",

                              fontWeight: "600",

                              fontSize: "0.9em",

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

                            👁️ Відкрити як учень

                          </Link>

                        </div>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>

                          <button

                            onClick={() => startEditTask(t)}

                            style={{

                              padding: "10px 20px",

                              background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",

                              color: "white",

                              border: "none",

                              borderRadius: "50px",

                              cursor: "pointer",

                              fontSize: "0.9em",

                              fontWeight: "600",

                              transition: "all 0.3s ease",

                              boxShadow: "0 4px 15px rgba(33, 150, 243, 0.3)"

                            }}

                            onMouseOver={(e) => {

                              e.currentTarget.style.transform = "translateY(-2px)";

                              e.currentTarget.style.boxShadow = "0 6px 20px rgba(33, 150, 243, 0.4)";

                            }}

                            onMouseOut={(e) => {

                              e.currentTarget.style.transform = "translateY(0)";

                              e.currentTarget.style.boxShadow = "0 4px 15px rgba(33, 150, 243, 0.3)";

                            }}

                          >

                            ✏️ Редагувати

                          </button>

                          <button

                            onClick={() => handleDeleteTask(t.id)}

                            style={{

                              padding: "10px 20px",

                              background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",

                              color: "white",

                              border: "none",

                              borderRadius: "50px",

                              cursor: "pointer",

                              fontSize: "0.9em",

                              fontWeight: "600",

                              transition: "all 0.3s ease",

                              boxShadow: "0 4px 15px rgba(244, 67, 54, 0.3)"

                            }}

                            onMouseOver={(e) => {

                              e.currentTarget.style.transform = "translateY(-2px)";

                              e.currentTarget.style.boxShadow = "0 6px 20px rgba(244, 67, 54, 0.4)";

                            }}

                            onMouseOut={(e) => {

                              e.currentTarget.style.transform = "translateY(0)";

                              e.currentTarget.style.boxShadow = "0 4px 15px rgba(244, 67, 54, 0.3)";

                            }}

                          >

                            🗑️ Видалити

                          </button>

                        </div>

                      </div>

                      {stats && stats.totalAttempts > 0 ? (

                        <div style={{

                          marginTop: "20px",

                          padding: "15px",

                          background: "rgba(102, 126, 234, 0.05)",

                          borderRadius: "10px",

                          border: "1px solid rgba(102, 126, 234, 0.2)"

                        }}>

                          <div style={{ fontSize: "0.95em", color: "#333", marginBottom: "8px", fontWeight: "600" }}>📊 Статистика:</div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", fontSize: "0.9em" }}>

                            <div>Виконано разів: <strong>{stats.totalAttempts}</strong></div>

                            <div>Правильних: <strong style={{ color: "#4caf50" }}>{stats.totalCorrect}</strong></div>

                            <div>Неправильних: <strong style={{ color: "#f44336" }}>{stats.totalIncorrect}</strong></div>

                            <div>Середній час: <strong>{Math.round(stats.avgTimeMs / 1000)} сек</strong></div>

                          </div>

                        </div>

                      ) : (

                        <div style={{

                          marginTop: "15px",

                          fontSize: "0.9em",

                          color: "#999",

                          fontStyle: "italic"

                        }}>

                          📈 Поки що немає результатів

                        </div>

                      )}

                    </>

                  )}

                  </div>

                );

              })}

            </div>

          )}

        </div>

      </div>

    </div>

  );

}
