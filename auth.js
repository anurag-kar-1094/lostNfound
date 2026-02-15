import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyA3VeADO8eU2KCkzZcXYvX7xSYYu8TkakQ",
  authDomain: "lostnfound-7c2a8.firebaseapp.com",
  projectId: "lostnfound-7c2a8",
  storageBucket: "lostnfound-7c2a8.firebasestorage.app",
  messagingSenderId: "945119754016",
  appId: "1:945119754016:web:c6619ac19291cefa154945"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
window.registerUser = async function () {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const contact = document.getElementById("regContact").value;
  const password = document.getElementById("regPassword").value;
  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }
  try {
    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      contactNumber: contact,
      createdAt: new Date()
    });
    alert("Registration successful!");
    window.location.href = "login.html";
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    if (error.code === "auth/email-already-in-use") {
      alert("This email is already registered.");
    }
    else if (error.code === "auth/invalid-email") {
      alert("Invalid email format.");
    }
    else if (error.code === "auth/weak-password") {
      alert("Password is too weak. Use at least 6 characters.");
    }
    else {
      alert("Registration failed: " + error.code);
    }
  }
};
window.loginUser = async function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    window.location.href = "index.html";
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    if (error.code === "auth/wrong-password") {
      alert("Invalid password!");
    }
    else if (error.code === "auth/user-not-found") {
      alert("No account found. Please register.");
    }
    else if (error.code === "auth/invalid-email") {
      alert("Invalid email format.");
    }
    else if (error.code === "auth/operation-not-allowed") {
      alert("Email/Password login is not enabled in Firebase.");
    }
    else {
      alert("Login failed: " + error.code);
    }
  }
};
window.loginWithGoogle = async function () {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        name: user.displayName || "User",
        email: user.email,
        contactNumber: "",
        createdAt: new Date()
      },
      { merge: true }
    );

    alert("Google Sign-In successful!");
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.data().contactNumber)
      window.location.href = "contact.html";
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);

    if (error.code === "auth/popup-closed-by-user") {
      alert("Popup closed before completing sign-in.");
    } else {
      alert("Google login failed: " + error.message);
    }
  }

};

