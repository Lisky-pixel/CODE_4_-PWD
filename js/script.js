let toggleBtn = document.getElementById("toggle-btn");
let body = document.body;
let darkMode = localStorage.getItem("dark-mode");

const enableDarkMode = () => {
  toggleBtn.classList.replace("fa-sun", "fa-moon");
  toggleBtn.setAttribute("aria-label", "Switch to light mode");
  body.classList.add("dark");
  localStorage.setItem("dark-mode", "enabled");
};

const disableDarkMode = () => {
  toggleBtn.classList.replace("fa-moon", "fa-sun");
  toggleBtn.setAttribute("aria-label", "Switch to dark mode");
  body.classList.remove("dark");
  localStorage.setItem("dark-mode", "disabled");
};

if (darkMode === "enabled") {
  enableDarkMode();
}

toggleBtn.onclick = (e) => {
  darkMode = localStorage.getItem("dark-mode");
  if (darkMode === "disabled") {
    enableDarkMode();
  } else {
    disableDarkMode();
  }
};
let profile = document.querySelector(".header .flex .profile");

document.querySelector("#user-btn").onclick = () => {
  profile.classList.toggle("active");
  search.classList.remove("active");
};

let search = document.querySelector(".header .flex .search-form");

document.querySelector("#search-btn").onclick = () => {
  search.classList.toggle("active");
  profile.classList.remove("active");
};

let sideBar = document.querySelector(".side-bar");

document.querySelector("#menu-btn").onclick = () => {
  sideBar.classList.toggle("active");
  body.classList.toggle("active");
};

document.querySelector("#close-btn").onclick = () => {
  sideBar.classList.remove("active");
  body.classList.remove("active");
};

window.onscroll = () => {
  profile.classList.remove("active");
  search.classList.remove("active");

  if (window.innerWidth < 1200) {
    sideBar.classList.remove("active");
    body.classList.remove("active");
  }
};

// Function to show the current tab //
function highlightActiveTab() {
  // Get current page filename (e.g. "dashboard.html")
  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll(".navbar a").forEach((link) => {
    // Get filename from href (e.g. "courses.html")
    const linkPage = link.getAttribute("href").split("/").pop();

    // Compare and toggle 'active' class
    link.classList.toggle("active", linkPage === currentPage);
  });
}

// Initialize on page load and navigation
document.addEventListener("DOMContentLoaded", highlightActiveTab);
window.addEventListener("popstate", highlightActiveTab);

// =============================================
// USER DATA BINDING SYSTEM
// =============================================

/**
 * Fetches authenticated user data from localStorage
 * @returns {Object|null} User object or null if not found
 */
function getCurrentUser() {
  const userData = localStorage.getItem("currentUser");
  return userData ? JSON.parse(userData) : null;
}

/**
 * Updates all UI elements with user data
 * @param {Object} user - The authenticated user object
 */
function bindUserData(user) {
  if (!user) return;

  // 1. Update Profile Elements
  document.querySelectorAll(".user-name").forEach((element) => {
    element.textContent = user.name;
  });

  document.querySelectorAll(".user-role").forEach((element) => {
    element.textContent = user.role || "student"; // Default role
  });

  // 2. Update Profile Images (if available)
  const profileImages = document.querySelectorAll(".profile-image");
  if (user.profileImage) {
    profileImages.forEach((img) => {
      img.src = `images/profiles/${user.profileImage}`;
      img.alt = `${user.name}'s profile picture`;
    });
  }

  // 3. Update Dashboard Stats
  updateLearningProgress(user.progress);
}

/**
 * Updates progress section with user's course data
 * @param {Object} progress - User's course progress data
 */
function updateLearningProgress(progress) {
  if (!progress) return;

  const progressContainer = document.getElementById("learning-progress");
  if (!progressContainer) return;

  // Clear existing content
  progressContainer.innerHTML = "";

  // Add dynamic progress cards
  progress.forEach((course) => {
    progressContainer.appendChild(createProgressCard(course));
  });
}

/**
 * Creates HTML element for a progress card
 * @param {Object} course - Course progress data
 * @returns {HTMLElement} Progress card element
 */
function createProgressCard(course) {
  const card = document.createElement("div");
  card.className = "progress-card";
  card.innerHTML = `
      <h4>${course.title}</h4>
      <div class="progress-bar">
         <div class="progress-fill" style="width: ${course.percentage}%"></div>
      </div>
      <p>${course.percentage}% complete</p>
   `;
  return card;
}

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  // 2. Bind user data if authenticated
  const currentUser = getCurrentUser();
  if (currentUser) {
    bindUserData(currentUser);
  } else {
    // Redirect if not authenticated (matches your existing auth flow)
    window.location.href = "signin.html";
  }
});
