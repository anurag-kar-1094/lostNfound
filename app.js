import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyA3VeADO8eU2KCkzZcXYvX7xSYYu8TkakQ",
  authDomain: "lostnfound-7c2a8.firebaseapp.com",
  projectId: "lostnfound-7c2a8",
  storageBucket: "lostnfound-7c2a8.firebasestorage.app",
  messagingSenderId: "945119754016",
  appId: "1:945119754016:web:c6619ac19291cefa154945"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;
const $ = (id) => document.getElementById(id);
displayRecoveredItems();
onAuthStateChanged(auth, async (user) => {
  const loginBtn = $("loginBtn");
  const logoutBtn = $("logoutBtn");
  const userWelcome = $("userWelcome");
  if (!user) {
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userWelcome) userWelcome.style.display = "none";
    return;
  }
  currentUser = user;
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists() && userWelcome) {
    userWelcome.textContent = `Welcome, ${snap.data().name}`;
    userWelcome.style.display = "block";
  }
  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "block";
  await displayFoundItems();
  await displayMyLostItems();
  await matchLostAndFound();
});
async function displayFoundItems() {
  const container = $("dispFound");
  const noText = $("noFoundText");
  if (!container || !noText) return;
  container.querySelectorAll(".foundItem").forEach(e => e.remove());
  const snap = await getDocs(collection(db, "found_items"));
  let i = 1;
  snap.forEach(d => {
    const f = d.data();
    const div = document.createElement("div");
    div.className = "foundItem";
    div.innerHTML = `<strong>${i++}. ${f.itemType.toUpperCase()}</strong>`;
    container.appendChild(div);
  });
  noText.style.display = snap.size ? "none" : "block";
}
async function isMatch(lost, found) {
  if (found.itemType !== lost.itemType) return false;
  if (found.color && lost.color && found.color !== lost.color) return false;
  if (
    found.nearbyLocation &&
    lost.nearbyLocation &&
    found.nearbyLocation !== lost.nearbyLocation
  ) return false;
  const ld = lost.details || {};
  const fd = found.details || {};
  for (const k in ld) {
    if (fd[k] && fd[k] !== ld[k]) return false;
  }
  return true;
}
async function matchLostAndFound() {
  const container = $("dispMatches");
  const noText = $("noMatchText");
  if (!container || !noText || !currentUser) return;
  container.querySelectorAll(".foundItem").forEach(e => e.remove());
  const foundSnap = await getDocs(collection(db, "found_items"));
  const lostSnap = await getDocs(collection(db, "lost_items"));
  let serial = 1;
  let hasMatch = false;
  for (const lDoc of lostSnap.docs) {
    const lost = lDoc.data();
    if (lost.userId !== currentUser.uid) continue;
    for (const fDoc of foundSnap.docs) {
      const found = fDoc.data();
      if (!(await isMatch(lost, found))) continue;
      hasMatch = true;
      const div = document.createElement("div");
      div.className = "matchItem";
      div.style.cursor = "pointer";
      div.innerHTML = `
        <strong>${serial++}. ${found.itemType.toUpperCase()}</strong><br>
        ✅ Possible match<br>
        📞 Finder Contact: <strong>${found.contactNumber}</strong>
      `;
      div.onclick = async () => {
        if (!confirm("Mark this item as recovered?")) return;
        await addDoc(collection(db, "recovered_items"), {
          itemType: found.itemType,
          details: found.details || {},
          recoveredAt: new Date(),
          lostBy: lost.userId,
          foundBy: found.userId
        });
        await deleteDoc(doc(db, "lost_items", lDoc.id));
        await deleteDoc(doc(db, "found_items", fDoc.id));
        alert("🎉 Item recovered!");
        window.location.reload();
        await displayFoundItems();
        await displayMyLostItems();
        await displayRecoveredItems();
        await matchLostAndFound();
      };
      container.appendChild(div);
    }
  }
  noText.style.display = hasMatch ? "none" : "block";
}
async function displayMyLostItems() {
  const container = $("myLostItems");
  const noText = $("noMyLostText");
  if (!container || !noText || !currentUser) return;
  container.querySelectorAll(".foundItem").forEach(e => e.remove());
  const lostSnap = await getDocs(collection(db, "lost_items"));
  let i = 1;
  let hasAny = false;
  for (const d of lostSnap.docs) {
    const lost = d.data();
    if (lost.userId !== currentUser.uid) continue;
    hasAny = true;
    let statusText = "⏳ Searching";
    let statusColor = "orange";
    const foundSnap = await getDocs(collection(db, "found_items"));
    for (const fDoc of foundSnap.docs) {
      const found = fDoc.data();
      if (await isMatch(lost, found)) {
        statusText = "✅ Found";
        statusColor = "green";
        break;
      }
    }
    const div = document.createElement("div");
    div.className = "myLostItem";
    div.innerHTML = `
      <strong>${i++}. ${lost.itemType.toUpperCase()}</strong><br>
      Status:
      <span style="color:${statusColor}; font-weight:600;">
        ${statusText}
      </span>
    `;
    container.appendChild(div);
  }
  noText.style.display = hasAny ? "none" : "block";
}
async function displayRecoveredItems() {
  const container = $("dispRecovered");
  const noText = $("noRecoveredText");
  if (!container || !noText) return;
  container.innerHTML = "";
  const snap = await getDocs(collection(db, "recovered_items"));
  let i = 1;
  snap.forEach(d => {
    const r = d.data();
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${i++}. ${r.itemType.toUpperCase()}</strong><br>
      <small>Recovered on: ${new Date(r.recoveredAt.seconds * 1000).toDateString()}</small>
    `;
    container.appendChild(div);
  });
  noText.style.display = snap.size ? "none" : "block";
}
$("goLost")?.addEventListener("click", () => window.location.href = "lost.html");
$("goFound")?.addEventListener("click", () => window.location.href = "found.html");
$("loginBtn")?.addEventListener("click", () => window.location.href = "login.html");
$("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  alert("Logged out");
  window.location.href = "index.html";

});
