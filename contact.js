import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA3VeADO8eU2KCkzZcXYvX7xSYYu8TkakQ",
  authDomain: "lostnfound-7c2a8.firebaseapp.com",
  projectId: "lostnfound-7c2a8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  // Already has contact → skip page
  if (snap.exists() && snap.data().contactNumber) {
    window.location.href = "index.html";
  }
});

window.saveContact = async function () {
  const contact = document.getElementById("contact").value.trim();

  if (!contact || contact.length < 6) {
    alert("Enter a valid contact number");
    return;
  }

  const ref = doc(db, "users", currentUser.uid);
  await updateDoc(ref, {
    contactNumber: contact
  });

  window.location.href = "index.html";
};
