import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const Auth = (() => {
  const USER_STORE_KEY = "fluxo_current_user";

  // --- Utilities ---
  async function apiFetch(endpoint, options = {}) {
    // Deprecated for Firebase, but kept for signature compatibility if needed
    console.warn("apiFetch is deprecated. Use Firebase SDK directly.");
    return { ok: false, json: async () => ({ error: "Deprecated" }) };
  }

  function getSessionToken() {
    return localStorage.getItem("firebase-active");
  }

  function setSession(user) {
    localStorage.setItem("firebase-active", "true");
    localStorage.setItem(USER_STORE_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem("firebase-active");
    localStorage.removeItem(USER_STORE_KEY);
  }

  function getAuthHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  // --- Register ---
  async function register(name, email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await firebaseUpdateProfile(user, { displayName: name });

      // Initialize user data in Realtime Database
      await set(ref(db, `users/${user.uid}/profile`), {
        name,
        email,
        salary: 5000,
        aiPersona: "pessoal",
        createdAt: new Date().toISOString()
      });

      const userData = { id: user.uid, name, email };
      setSession(userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error(err);
      let message = "Erro ao registrar.";
      if (err.code === 'auth/email-already-in-use') message = "E-mail já está em uso.";
      if (err.code === 'auth/weak-password') message = "A senha é muito fraca.";
      return { success: false, message };
    }
  }

  // --- Login ---
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userData = { id: user.uid, name: user.displayName, email: user.email };
      setSession(userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error(err);
      let message = "E-mail ou senha incorretos.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') message = "Credenciais inválidas.";
      if (err.code === 'auth/too-many-requests') message = "Muitas tentativas. Tente mais tarde.";
      return { success: false, message };
    }
  }

  // --- Google Sign-In ---
  async function googleSignIn() {
    try {
      const provider = new GoogleAuthProvider();
      // Força a seleção de conta para evitar login automático indesejado
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in DB, if not initialize
      const snapshot = await get(ref(db, `users/${user.uid}/profile`));
      if (!snapshot.exists()) {
        await set(ref(db, `users/${user.uid}/profile`), {
          name: user.displayName,
          email: user.email,
          salary: 5000,
          aiPersona: "pessoal",
          createdAt: new Date().toISOString()
        });
      }

      const userData = { id: user.uid, name: user.displayName, email: user.email };
      setSession(userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error("Google SignIn Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        return { success: false, message: "Login cancelado." };
      }
      if (err.code === 'auth/operation-not-allowed') {
        return { success: false, message: "Login com Google não está ativado no console do Firebase." };
      }
      return { success: false, message: "Erro no login com Google: " + err.message };
    }
  }

  // --- Active Session ---
  function getCurrentUser() {
    const user = auth.currentUser;
    if (user) {
      // Detect auth provider from Firebase providerData
      const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
      const provider = isGoogle ? 'google' : 'local';

      // Merge with any extra profile data stored in localStorage
      let extraData = {};
      try {
        const stored = localStorage.getItem(USER_STORE_KEY);
        if (stored) extraData = JSON.parse(stored);
      } catch (e) { /* ignore */ }

      const merged = {
        id: user.uid,
        name: user.displayName || extraData.name || 'Usuário',
        email: user.email,
        provider,
        // Preserve extra profile fields from DB (phone, birthdate, avatar, createdAt)
        phone: extraData.phone || null,
        birthdate: extraData.birthdate || null,
        avatar: extraData.avatar || null,
        createdAt: extraData.createdAt || user.metadata.creationTime
      };
      return merged;
    }
    // Fallback to local storage for sync checks
    try {
      const userStr = localStorage.getItem(USER_STORE_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    return auth.currentUser !== null || localStorage.getItem("firebase-active") === "true";
  }

  // --- Logout ---
  async function logout() {
    await signOut(auth);
    clearSession();
    window.location.reload();
  }

  // --- Update Profile ---
  async function updateProfile(updates) {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "Não autenticado." };

    try {
      // Prevent saving passwords to Realtime DB
      const dbUpdates = { ...updates };
      delete dbUpdates.currentPassword;
      delete dbUpdates.newPassword;

      if (dbUpdates.name) {
        await firebaseUpdateProfile(user, { displayName: dbUpdates.name });
      }

      await update(ref(db, `users/${user.uid}/profile`), dbUpdates);

      const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
      // Preserve existing extra fields in session when updating profile
      let existingData = {};
      try { const s = localStorage.getItem(USER_STORE_KEY); if (s) existingData = JSON.parse(s); } catch(e) {}
      const userData = { ...existingData, id: user.uid, name: user.displayName, email: user.email, provider: isGoogle ? 'google' : 'local', ...dbUpdates };
      setSession(userData);
      return { success: true, message: "Perfil atualizado!" };
    } catch (err) {
      console.error('Update Profile error:', err);
      return { success: false, message: 'Erro ao atualizar perfil.' };
    }
  }

  // --- Change Password ---
  async function changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "Não autenticado." };

    try {
      // 1. Reauthenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // 2. Update password
      await updatePassword(user, newPassword);
      
      // Remove plain text passwords from DB if they exist (cleanup)
      await update(ref(db, `users/${user.uid}/profile`), {
        currentPassword: null,
        newPassword: null
      });

      return { success: true, message: "Senha alterada com sucesso!" };
    } catch (err) {
      console.error("Change Password error:", err);
      let message = "Erro ao alterar a senha.";
      if (err.code === 'auth/invalid-credential') message = "A senha atual está incorreta.";
      if (err.code === 'auth/weak-password') message = "A nova senha é muito fraca.";
      return { success: false, message };
    }
  }

  // Handle auth state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
      // Preserve existing extra profile fields when auth state changes
      let existingData = {};
      try { const s = localStorage.getItem(USER_STORE_KEY); if (s) existingData = JSON.parse(s); } catch(e) {}
      const userData = { ...existingData, id: user.uid, name: user.displayName, email: user.email, provider: isGoogle ? 'google' : 'local' };
      setSession(userData);
    } else {
      clearSession();
    }
  });

  return {
    register,
    login,
    googleSignIn,
    getCurrentUser,
    isLoggedIn,
    logout,
    updateProfile,
    changePassword,
    getAuthHeaders,
    apiFetch,
    API_URL: './api',
    getSessionToken,
    setSession,
    clearSession
  };
})();

// Expose to window for app.js compatibility
window.Auth = Auth;
export default Auth;
