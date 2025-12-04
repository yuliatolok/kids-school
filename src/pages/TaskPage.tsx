import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { doc, getDoc, addDoc, collection } from "firebase/firestore";

import { db } from "../firebase";

import type { Task } from "../types";

import { useAuth } from "../context/AuthContext";



export default function TaskPage() {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { appUser } = useAuth();



  // защита от отсутствия id в URL

  if (!id) {

    return <div>Завдання не знайдено</div>;

  }



  // защита от null, как и в ParentDashboard

  if (!appUser) {

    return <div>Завантаження...</div>;

  }



  const [task, setTask] = useState<Task | null>(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    // id is already checked at component start
    // Using non-null assertion since we know it's not undefined here
    const taskId = id!;

    async function loadTask() {

      const ref = doc(db, "tasks", taskId);

      const snap = await getDoc(ref);

      if (!snap.exists()) {

        alert("Завдання не знайдено");

        navigate(-1);

        return;

      }

      const data = snap.data() as Task;

      setTask({ ...data, id: snap.id });

      setLoading(false);

    }

    loadTask().catch(err => {

      console.error(err);

      alert("Помилка завантаження завдання");

      setLoading(false);

    });

  }, [id, navigate]);



  // Listen for stats from iframe
  useEffect(() => {

    // id and appUser are already checked at component start
    // Using non-null assertion since we know they're not null/undefined here
    const taskId = id!;
    const currentUser = appUser!;

    function handleMessage(event: MessageEvent) {

      const data = event.data;

      if (!data || data.type !== "taskResult") return;



      const { correct, incorrect, timeMs } = data;



      // Save to Firestore

      addDoc(collection(db, "taskResults"), {

        taskId: taskId,

        userId: currentUser.id,

        correct,

        incorrect,

        timeMs,

        createdAt: Date.now(),

      }).catch(console.error);

    }



    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);

  }, [id, appUser]);



  if (loading) return <div style={{ padding: 40 }}>Завантаження...</div>;

  if (!task) return null;



  return (

    <div style={{ padding: 0, margin: 0, width: "100vw", maxWidth: "100%", overflow: "hidden", position: "relative" }}>

      <div style={{ padding: 16 }}>

        <button onClick={() => navigate(-1)}>← Назад</button>

        <h2>{task.title}</h2>

        <p>{task.description}</p>

      </div>



      {task.htmlUrl ? (

        <div

          style={{

            width: "100vw",

            maxWidth: "100%",

            height: "calc(100vh - 120px)", // почти весь экран

            overflow: "hidden",

            position: "relative",

            margin: 0,

            padding: 0,

            left: 0,

            right: 0,

          }}

        >

          <iframe

            src={task.htmlUrl}

            title={task.title}

            style={{

              width: "100%",

              height: "100%",

              border: "none",

              display: "block",

              margin: 0,

              padding: 0,

            }}

            scrolling="yes"

          />

        </div>

      ) : (

        <div style={{ padding: 16 }}>

          <p>Для цього завдання не задано HTML-сторінку.</p>

        </div>

      )}

    </div>

  );

}
