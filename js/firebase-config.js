import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZjH-Nkz8HLRLMVzND_5ZqTerHs2od1xo",
  authDomain: "controle-financeiro-pj.firebaseapp.com",
  projectId: "controle-financeiro-pj",
  storageBucket: "controle-financeiro-pj.firebasestorage.app",
  messagingSenderId: "114231766796",
  appId: "1:114231766796:web:51665865380ce98af9e329"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db };
