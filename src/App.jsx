// ─── FIREBASE IMPORTS ────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useState, useRef, useEffect, useReducer, useCallback } from "react";

// ─── FIREBASE CONFIG ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "beleza-hub.firebaseapp.com",
  projectId: "beleza-hub",
  storageBucket: "beleza-hub.firebasestorage.app",
  messagingSenderId: "752625992317",
  appId: "1:752625992317:web:1fac364495bbb3c110e714",
};

const firebaseApp = initializeApp(firebaseConfig);
const db   = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const SERVICE_CATEGORIES = ["Cabelo","Unhas","Maquiagem","Skincare","Massagem"];
const STATES_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function uid() {
  return crypto.randomUUID();
}

function validateEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ─── FIRESTORE HELPERS ───────────────────────────────────────────────────────
async function saveDraftFS(userId, data) {
  const clean = { ...data };
  ["password","confirmPassword"].forEach(k => delete clean[k]);

  await setDoc(doc(db,"drafts",userId), {
    ...clean,
    _updatedAt: serverTimestamp()
  }, { merge:true });
}

async function loadDraftFS(userId) {
  const snap = await getDoc(doc(db,"drafts",userId));
  if (!snap.exists()) return null;
  return snap.data();
}

// ─── FORM STATE ──────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  businessName:"",
  email:"",
  phone:"",
  password:"",
  confirmPassword:"",
  emailVerified:false,
  phoneVerified:false
};

function formReducer(state, {key, val}) {
  return {...state,[key]:val};
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function BeautyRegister() {
  const [formData, dispatch] = useReducer(formReducer, INITIAL_FORM);
  const [authUser, setAuthUser] = useState(null);
  const [step, setStep] = useState(1);

  const set = (key,val)=>dispatch({key,val});

  // ── AUTH LISTENER
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, user=>{
      setAuthUser(user);
    });
    return unsub;
  },[]);

  // ── AUTO SAVE
  useEffect(()=>{
    if (!authUser) return;

    const timer = setTimeout(()=>{
      saveDraftFS(authUser.uid, formData);
    },1500);

    return ()=>clearTimeout(timer);
  },[formData,authUser]);

  // ── SUBMIT
  const handleSubmit = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await setDoc(doc(db,"establishments",cred.user.uid), {
        ...formData,
        createdAt: serverTimestamp()
      });

      alert("Cadastro realizado!");
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Cadastro Beauty Hub</h1>

      <input
        value={formData.businessName}
        onChange={e=>set("businessName", e.target.value)}
        placeholder="Nome da empresa"
      />

      <input
        value={formData.email}
        onChange={e=>set("email", e.target.value)}
        placeholder="E-mail"
      />

      <input
        type="password"
        value={formData.password}
        onChange={e=>set("password", e.target.value)}
        placeholder="Senha"
      />

      <button onClick={handleSubmit}>
        Cadastrar
      </button>
    </div>
  );
}
