// Firebase Configuration
const firebaseConfig = {
  apiKey: "***",
  authDomain: "****",
  databaseURL: "***",
  projectId: "***",
  storageBucket: "***",
  messagingSenderId: "***",
  appId: "***",
  measurementId: "***",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Centralized DOM Ready Listener
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;

  if (currentPath.includes("newuser.html")) handleRegistration();
  if (currentPath.includes("login.html")) handleLogin();
  if (currentPath.includes("profile.html")) handleProfile();
  if (currentPath.includes("payment.html")) handlePayment();
});

// Handle User Registration
function handleRegistration() {
  const signupForm = document.getElementById("signup-form");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = getFormData(["first-name", "last-name", "dob", "gender", "email", "phone", "address", "password"]);

    if (!formData.email || !formData.password) {
      alert("Email and Password are required!");
      return;
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
      const userId = userCredential.user.uid;

      await database.ref("userAccounts/" + userId).set({
        ...formData,
        createdAt: new Date().toISOString(),
      });

      alert("Account registered successfully!");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Error during registration:", error.message);
      alert(error.message);
    }
  });
}

// Handle User Login
function handleLogin() {
  const loginForm = document.querySelector("form");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = getFormData(["email", "password"]);

    try {
      await auth.signInWithEmailAndPassword(formData.email, formData.password);
      alert("Login successful!");
      window.location.href = "home.html";
    } catch (error) {
      console.error("Error during login:", error.message);
      alert("Login failed. Please check your email and password.");
    }
  });
}

// Handle User Profile
function handleProfile() {
  auth.onAuthStateChanged((user) => {
    if (!user) return redirectToLogin();

    const userId = user.uid;
    const userRef = database.ref("userAccounts/" + userId);

    userRef.once("value", (snapshot) => {
      const userData = snapshot.val();
      populateForm(userData, ["first-name", "last-name", "dob", "gender", "email", "phone", "address"]);
    });

    document.querySelector(".save-btn").addEventListener("click", async (e) => {
      e.preventDefault();

      const updatedData = getFormData(["first-name", "last-name", "dob", "gender", "email", "phone", "address"]);

      try {
        await userRef.update(updatedData);
        alert("Profile updated successfully!");
      } catch (error) {
        console.error("Error updating profile:", error.message);
        alert("Error updating profile: " + error.message);
      }
    });
  });
}

// Handle Payment Management
function handlePayment() {
  auth.onAuthStateChanged((user) => {
    if (!user) return redirectToLogin();

    const userId = user.uid;
    const paymentRef = database.ref("userAccounts/" + userId + "/paymentDetails");

    paymentRef.once("value", (snapshot) => {
      const paymentData = snapshot.val();
      populateForm(paymentData, ["card-holder", "card-number", "expiry-date", "cvv", "billing-address", "payment-method"]);
    });

    const form = document.getElementById("payment-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const paymentData = getFormData(["card-holder", "card-number", "expiry-date", "cvv", "billing-address", "payment-method"]);

      if (!validatePaymentDetails(paymentData)) return;

      try {
        await paymentRef.set(paymentData);
        alert("Payment details saved successfully!");
      } catch (error) {
        console.error("Error saving payment details:", error.message);
        alert("Error saving payment details: " + error.message);
      }
    });
  });
}

// Utility Functions
function getFormData(fields) {
  const data = {};
  fields.forEach((field) => {
    data[field] = document.getElementById(field)?.value.trim() || "";
  });
  return data;
}

function populateForm(data, fields) {
  if (!data) return;
  fields.forEach((field) => {
    if (document.getElementById(field)) {
      document.getElementById(field).value = data[field] || "";
    }
  });
}

function redirectToLogin() {
  alert("You need to log in first!");
  window.location.href = "login.html";
}

function validatePaymentDetails(data) {
  const { cardHolderName, cardNumber, expiryDate, cvv, billingAddress } = data;

  if (!cardHolderName || !cardNumber || !expiryDate || !cvv || !billingAddress) {
    alert("Please fill in all the required fields.");
    return false;
  }

  if (!/^\d{16}$/.test(cardNumber.replace(/\s|-/g, ""))) {
    alert("Card number must be 16 digits.");
    return false;
  }

  if (!/^\d{3}$/.test(cvv)) {
    alert("CVV must be 3 digits.");
    return false;
  }

  const [year, month] = expiryDate.split("-");
  const expiry = new Date(`${year}-${month}-01`);
  if (expiry <= new Date()) {
    alert("Expiry date must be in the future.");
    return false;
  }

  return true;
}
