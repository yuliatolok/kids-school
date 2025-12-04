import React, { createContext, useContext, useEffect, useState } from "react";

import { auth } from "../firebase";

import {

  GoogleAuthProvider,

  onAuthStateChanged,

  signInWithPopup,

  signOut

} from "firebase/auth";

import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase";

export interface AppUser {
  id: string;
  email?: string;
  displayName?: string;
  role: "parent" | "child";
}

export interface AuthContextType {
  appUser: AppUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  appUser: null,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const [loading, setLoading] = useState(true);

  async function login() {

    const provider = new GoogleAuthProvider();

    await signInWithPopup(auth, provider);

  }

  async function logout() {

    await signOut(auth);

  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAppUser(null);
        setLoading(false);
        return;
      }
  
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
  
      if (!snap.exists()) {
        // kttolokik@gmail.com should be a child (Саша)
        const role = user.email === "kttolokik@gmail.com" ? "child" : "parent";
        
        await setDoc(ref, {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: role,
        });

        setAppUser({
          id: user.uid,
          displayName: user.displayName ?? "",
          email: user.email ?? "",
          role: role,
        });
      } else {
        const data = snap.data() as AppUser;
        // Update role if it's kttolokik@gmail.com and currently set as parent
        if (user.email === "kttolokik@gmail.com" && data.role === "parent") {
          await setDoc(ref, {
            ...data,
            role: "child",
          });
          setAppUser({
            ...data,
            role: "child",
          });
        } else {
          setAppUser(data);
        }
      }
  
      setLoading(false);
    });
  }, []);
  

  return (

    <AuthContext.Provider value={{ appUser, login, logout }}>

      {!loading && children}

    </AuthContext.Provider>

  );

}

export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error("useAuth must be used within AuthProvider");

  }

  return context;

}
