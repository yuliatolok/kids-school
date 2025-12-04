import { useEffect, useState } from "react";

import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";

import { db } from "../firebase";

import { useAuth } from "../context/AuthContext";

import type { Task, TaskResult } from "../types";

import { Link } from "react-router-dom";



export default function ParentDashboard() {

  const { appUser, logout } = useAuth();

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



    async function loadTasks() {

      const q = query(

        collection(db, "tasks"),

        where("createdBy", "==", appUser.id)

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

    <div style={{ padding: 40 }}>

      <h1>Кабінет батьків</h1>

      <p>Ви увійшли як: {appUser?.displayName ?? appUser?.id}</p>

      <button onClick={logout}>Вийти</button>



      <hr style={{ margin: "20px 0" }} />



      <h2>Створити нове завдання</h2>

      <form onSubmit={handleCreateTask} style={{ maxWidth: 480 }}>

        <div style={{ marginBottom: 8 }}>

          <label>

            Назва:

            <input

              style={{ width: "100%", padding: 6 }}

              value={title}

              onChange={e => setTitle(e.target.value)}

            />

          </label>

        </div>



        <div style={{ marginBottom: 8 }}>

          <label>

            Опис (необов'язково):

            <input

              style={{ width: "100%", padding: 6 }}

              value={description}

              onChange={e => setDescription(e.target.value)}

            />

          </label>

        </div>



        <div style={{ marginBottom: 8 }}>

          <label>

            Посилання на HTML:

            <input

              style={{ width: "100%", padding: 6 }}

              value={htmlUrl}

              onChange={e => setHtmlUrl(e.target.value)}

            />

          </label>

          <div style={{ fontSize: 12 }}>

            Напр.: <code>/tasks/christmas-trainer.html</code>

          </div>

        </div>



        <div style={{ marginBottom: 8 }}>

          <label>

            Email учнів (необов'язково, через кому):

            <input

              style={{ width: "100%", padding: 6 }}

              value={targetEmails}

              onChange={e => setTargetEmails(e.target.value)}

              placeholder="email1@example.com, email2@example.com"

            />

          </label>

          <div style={{ fontSize: 12, color: "#666" }}>

            Залиште порожнім, щоб завдання було видиме всім учням

          </div>

        </div>



        <button type="submit" disabled={loading}>

          {loading ? "Зберігаю..." : "Створити завдання"}

        </button>

      </form>



      <hr style={{ margin: "20px 0" }} />



      <h2>Мої завдання</h2>

      {tasks.length === 0 && <p>Поки що немає завдань.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>

        {tasks.map(t => {

          const stats = taskStats[t.id];

          const isEditing = editingTask === t.id;

          return (

            <li key={t.id} style={{ marginBottom: 16, padding: 16, background: isEditing ? "#fff9e6" : "#f5f5f5", borderRadius: 8, border: isEditing ? "2px solid #ff9800" : "1px solid #ddd" }}>

              {isEditing ? (

                <form onSubmit={(e) => handleUpdateTask(e, t.id)} style={{ maxWidth: "100%" }}>

                  <div style={{ marginBottom: 8 }}>

                    <label>

                      Назва:

                      <input

                        style={{ width: "100%", padding: 6, marginTop: 4 }}

                        value={editTitle}

                        onChange={e => setEditTitle(e.target.value)}

                        required

                      />

                    </label>

                  </div>

                  <div style={{ marginBottom: 8 }}>

                    <label>

                      Опис (необов'язково):

                      <input

                        style={{ width: "100%", padding: 6, marginTop: 4 }}

                        value={editDescription}

                        onChange={e => setEditDescription(e.target.value)}

                      />

                    </label>

                  </div>

                  <div style={{ marginBottom: 8 }}>

                    <label>

                      Посилання на HTML:

                      <input

                        style={{ width: "100%", padding: 6, marginTop: 4 }}

                        value={editHtmlUrl}

                        onChange={e => setEditHtmlUrl(e.target.value)}

                        required

                      />

                    </label>

                  </div>

                  <div style={{ marginBottom: 12 }}>

                    <label>

                      Email учнів (необов'язково, через кому):

                      <input

                        style={{ width: "100%", padding: 6, marginTop: 4 }}

                        value={editTargetEmails}

                        onChange={e => setEditTargetEmails(e.target.value)}

                        placeholder="email1@example.com, email2@example.com"

                      />

                    </label>

                    <div style={{ fontSize: 12, color: "#666" }}>

                      Залиште порожнім, щоб завдання було видиме всім учням

                    </div>

                  </div>

                  <div style={{ display: "flex", gap: 8 }}>

                    <button type="submit" disabled={loading} style={{ padding: "8px 16px", background: "#4caf50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>

                      {loading ? "Зберігаю..." : "Зберегти"}

                    </button>

                    <button type="button" onClick={cancelEdit} style={{ padding: "8px 16px", background: "#999", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>

                      Скасувати

                    </button>

                  </div>

                </form>

              ) : (

                <>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>

                    <div style={{ flex: 1 }}>

                      <div style={{ marginBottom: 8 }}>

                        <strong style={{ fontSize: "1.1em" }}>{t.title}</strong>{" "}

                        <Link to={`/task/${t.id}`} style={{ marginLeft: 10 }}>Відкрити як учень</Link>

                      </div>

                      {t.targetUserIds.length > 0 ? (

                        <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>

                          <strong>Для учнів:</strong> {t.targetUserIds.map(id => userEmails[id] || id).join(", ") || "Не знайдено"}

                        </div>

                      ) : (

                        <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>

                          Для всіх учнів

                        </div>

                      )}

                    </div>

                    <div style={{ display: "flex", gap: 8 }}>

                      <button

                        onClick={() => startEditTask(t)}

                        style={{

                          padding: "6px 12px",

                          background: "#2196f3",

                          color: "white",

                          border: "none",

                          borderRadius: "6px",

                          cursor: "pointer",

                          fontSize: "13px",

                          fontWeight: "600"

                        }}

                        onMouseOver={(e) => e.currentTarget.style.background = "#1976d2"}

                        onMouseOut={(e) => e.currentTarget.style.background = "#2196f3"}

                      >

                        Редагувати

                      </button>

                      <button

                        onClick={() => handleDeleteTask(t.id)}

                        style={{

                          padding: "6px 12px",

                          background: "#f44336",

                          color: "white",

                          border: "none",

                          borderRadius: "6px",

                          cursor: "pointer",

                          fontSize: "13px",

                          fontWeight: "600"

                        }}

                        onMouseOver={(e) => e.currentTarget.style.background = "#d32f2f"}

                        onMouseOut={(e) => e.currentTarget.style.background = "#f44336"}

                      >

                        Видалити

                      </button>

                    </div>

                  </div>

                  {stats && stats.totalAttempts > 0 ? (

                    <div style={{ fontSize: 14, color: "#666" }}>

                      <div>Виконано разів: <strong>{stats.totalAttempts}</strong></div>

                      <div>Правильних відповідей: <strong style={{ color: "#4caf50" }}>{stats.totalCorrect}</strong></div>

                      <div>Неправильних відповідей: <strong style={{ color: "#f44336" }}>{stats.totalIncorrect}</strong></div>

                      <div>Середній час: <strong>{Math.round(stats.avgTimeMs / 1000)} сек</strong></div>

                    </div>

                  ) : (

                    <div style={{ fontSize: 14, color: "#999" }}>Поки що немає результатів</div>

                  )}

                </>

              )}

            </li>

          );

        })}

      </ul>

    </div>

  );

}
