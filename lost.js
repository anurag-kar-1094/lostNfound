import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists() || !snap.data().contactNumber) {
    window.location.href = "contact.html";
    return;
  }

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      name: user.displayName || "User",
      contactNumber: "",
      createdAt: new Date()
    });
  }
});


async function getLoggedInUserContact() {
  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().contactNumber || "" : "";
}

function combineDateTime(date, time) {
  return new Date(`${date}T${time}`);
}


const dynamicFields = document.getElementById("dynamicFields");

function handleOthers(selectEl, label, placeholder) {
  const id = `${selectEl.id}_other`;
  if (document.getElementById(id)) return;

  const wrapper = document.createElement("div");
  wrapper.style.marginTop = "8px";

  wrapper.innerHTML = `
    <label>${label}</label>
    <input
      type="text"
      id="${id}"
      placeholder="${placeholder}"
      required
    >
  `;

  selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);
}

function removeOthers(selectEl) {
  const other = document.getElementById(`${selectEl.id}_other`);
  if (other) other.parentElement.remove();
}

function getFinalValue(selectId) {
  const select = document.getElementById(selectId);
  const other = document.getElementById(`${selectId}_other`);

  if (select.value === "others" && other) {
    return other.value.trim().toLowerCase();
  }
  return select.value.toLowerCase();
}


const itemTypeEl = document.getElementById("itemType");

const companyOptions = {
  mobile: ["Apple", "Samsung", "MI", "Xiaomi", "Realme", "OnePlus", "Oppo", "Motorola", "Vivo"],
  laptop: ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "MSI", "Motorola"],
  watch: ["Boat", "Fastrack", "Noise", "MI", "Croma", "Titan", "Rolex", "Fire-Boltt", "Apple", "Samsung"],
  bag: ["Wildcraft", "Skybags", "American Tourister", "Puma", "Adidas", "Nike"],
  bottle: ["Milton", "Cello", "Tupperware", "Borosil"],
  umbrella: ["Johns", "Puma", "Nike", "Reebok", "AmazonBasics", "K. C. Paul", "Allen", "Local"]
};

itemTypeEl.addEventListener("change", () => {
  dynamicFields.innerHTML = "";
  removeOthers(itemTypeEl);

  const type = itemTypeEl.value;

  if (type === "others") {
    handleOthers(itemTypeEl, "Describe item", "e.g. specs box");
    return;
  }

  if (type === "idcard") {
    dynamicFields.innerHTML = `
      <label>9-Digit Roll Number</label>
      <input id="rollNumber" type="text" pattern="\\d{9}" maxlength="9" required>
    `;
  }

  if (companyOptions[type]) {
    dynamicFields.innerHTML += `
      <label>Company</label>
      <select id="company" required>
        <option value="">Select Company</option>
        ${companyOptions[type]
          .map(c => `<option value="${c.toLowerCase()}">${c}</option>`)
          .join("")}
        <option value="others">Others</option>
      </select>
    `;
  }
});

document.addEventListener("change", (e) => {
  const el = e.target;

  if (!["company", "color", "location"].includes(el.id)) return;

  removeOthers(el);

  if (el.value === "others") {
    if (el.id === "company")
      handleOthers(el, "Specify company", "e.g. local brand");

    if (el.id === "color")
      handleOthers(el, "Specify color", "e.g. matte black");

    if (el.id === "location")
      handleOthers(el, "Specify location", "e.g. canteen staircase");
  }
});

const form = document.getElementById("itemForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const lostDateTime = combineDateTime(date, time);

  if (lostDateTime > new Date()) {
    alert("❌ Lost date & time cannot be in the future.");
    return;
  }

  const lostItem = {
    userId: currentUser.uid,
    itemType: getFinalValue("itemType"),
    color: getFinalValue("color"),
    nearbyLocation: getFinalValue("location"),
    date,
    time,
    lostDateTime,
    details: {},
    contactNumber: await getLoggedInUserContact(),
    createdAt: new Date()
  };

  const company = document.getElementById("company");
  if (company) lostItem.details.company = getFinalValue("company");

  const roll = document.getElementById("rollNumber");
  if (roll) lostItem.details.rollNumber = roll.value;

  await addDoc(collection(db, "lost_items"), lostItem);

  alert("✅ Lost item reported successfully!");
  form.reset();
  window.location.href = "index.html";
});

document.getElementById("date").max =

  new Date().toISOString().split("T")[0];
