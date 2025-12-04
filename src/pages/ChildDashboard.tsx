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

    <div style={{ padding: 40 }}>

      <h1>Кабінет учня</h1>

      <p>Ви увійшли як: {appUser?.displayName ?? appUser?.id}</p>

      <button onClick={logout}>Вийти</button>



      <hr style={{ margin: "20px 0" }} />



      <h2>Завдання</h2>

      {tasks.length === 0 && <p>Поки що немає завдань.</p>}

      <ul>

        {tasks.map(t => (

          <li key={t.id} style={{ marginBottom: 8 }}>

            <strong>{t.title}</strong>{" "}

            <Link to={`/task/${t.id}`}>Виконати</Link>

          </li>

        ))}

      </ul>

    </div>

  );

}
