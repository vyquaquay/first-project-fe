// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmE9EamHPIDH4F9pNWixngRISuyLumzJk",
  authDomain: "first-project-4947f.firebaseapp.com",
  projectId: "first-project-4947f",
  storageBucket: "first-project-4947f.firebasestorage.app",
  messagingSenderId: "87806757474",
  appId: "1:87806757474:web:0369d9fdab07725d069f3b",
  measurementId: "G-KLZ995N6DF",
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Get the modal
var modal = document.getElementById("myModal");
// Get the button that opens the modal
var btn = document.getElementById("md-btn");
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
var googleBtn = document.querySelector("#google-signin");

if (!googleBtn) {
  console.error("Google sign-in button not found!");
} else {
  console.log("Google sign-in button found and ready");
}

// Only enable modal click handlers if not logged in
const enableModalHandlers = () => {
  btn.onclick = function () {
    modal.style.visibility = "visible";
  };

  span.onclick = function () {
    modal.style.visibility = "hidden";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.visibility = "hidden";
    }
  };
};

// Disable modal click handlers when logged in
const disableModalHandlers = () => {
  btn.onclick = null;
  span.onclick = null;
  window.onclick = null;
};

googleBtn.addEventListener("click", async () => {
  console.log("Google sign-in button clicked");
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  try {
    console.log("Starting Google sign-in popup...");
    const result = await firebase.auth().signInWithPopup(provider);
    console.log("Google sign-in successful:", result);

    const idToken = await result.user.getIdToken();
    console.log("Got ID token from Firebase");

    console.log("Sending token to backend...");
    const response = await fetch("http://2.59.135.31:3000/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      Swal.fire({
        title: "Error",
        text: "Authentication failed",
        icon: "error",
      });
      throw new Error(
        `Authentication failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Backend authentication successful:", data);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    modal.style.visibility = "hidden";
    disableModalHandlers();

    updateUIForLoggedInUser(data.user);
    Swal.fire({
      title: "Success",
      text: "Sign in successful",
      icon: "success",
    });
  } catch (error) {
    console.error("Error during sign in:", error);
    alert(`Failed to sign in: ${error.message}`);
  }
});

function updateUIForLoggedInUser(user) {
  console.log("Updating UI for logged in user:", user);
  const signInBtn = document.getElementById("md-btn");
  signInBtn.style.display = "none";

  // Create profile button with click menu
  const profileBtn = document.createElement("div");
  profileBtn.id = "profile-btn";
  profileBtn.innerHTML = `
    <img src="${user.profilePicture}" alt="Profile">
    <div class="profile-menu" style="display: none;">
      <div class="profile-header">
        <img src="${user.profilePicture}" alt="Profile">
        <div class="profile-info">
          <div class="profile-name">${user.name}</div>
          <div class="profile-email">${user.email}</div>
        </div>
      </div>
      <button class="signout-btn" onclick="signOut()">Sign Out</button>
    </div>
  `;

  // Insert profile button where sign in button was
  signInBtn.parentNode.insertBefore(profileBtn, signInBtn.nextSibling);

  // Add click handler to toggle menu
  const profileMenu = profileBtn.querySelector('.profile-menu');
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.style.display = profileMenu.style.display === 'none' ? 'block' : 'none';
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target)) {
      profileMenu.style.display = 'none';
    }
  });
}

async function signOut() {
  try {
    console.log("Signing out...");
    await firebase.auth().signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const signInBtn = document.getElementById("md-btn");
    const profileBtn = document.getElementById("profile-btn");
    
    // Remove profile button and show sign in button
    if (profileBtn) {
      profileBtn.remove();
    }
    signInBtn.style.display = "block";
    signInBtn.textContent = "Sign in";
    
    enableModalHandlers();
    console.log("Sign out successful");
    Swal.fire({
      title: "Success",
      text: "Sign out successful",
      icon: "success",
    });
  } catch (error) {
    Swal.fire({
      title: "Error", 
      text: "Sign out failed",
      icon: "error",
    });
    console.error("Error signing out:", error);
    alert("Failed to sign out. Please try again.");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("Checking for existing user session...");
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    console.log("Found existing user session:", user);
    updateUIForLoggedInUser(user);
    disableModalHandlers();
  } else {
    enableModalHandlers();
  }
});
