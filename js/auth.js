const users = JSON.parse(localStorage.getItem("users")) || [];

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem("currentUser") !== null;
}

// Register functionality
function registerUser(name, email, password) {
  if (users.find((user) => user.email === email)) {
    showError("Email already registered");
    return false;
  }

  const newUser = { name, email, password };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  return true;
}

// Login functionality
function loginUser(email, password) {
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    return true;
  }
  return false;
}

// Logout functionality
function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  if (isLoggedIn() && !window.location.href.includes("login.html")) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  }

  // Login Form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      if (loginUser(email, password)) {
        window.location.href = "index.html";
      } else {
        showError("Invalid email or password");
      }
    });
  }

  // Register Form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("registerName").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value.trim();

      let errors = [];
      if (name.length < 3) {
        errors.push("Name must be at least 3 characters");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push("Please enter a valid email address");
      }
      if (password.length < 6) {
        errors.push("Password must be at least 6 characters");
      }
      if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
      }
      if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
      }
      if (!/[!@#$%^&*]/.test(password)) {
        errors.push(
          "Password must contain at least one special character (!@#$%^&*)"
        );
      }

      const users = JSON.parse(localStorage.getItem("users")) || [];
      if (users.some((user) => user.email === email)) {
        errors.push("Email already registered");
      }
      if (errors.length > 0) {
        showError(errors.join("<br>"));
        return;
      }

      const newUser = { name, email, password };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      showSuccess("Registration successful! Please login.");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    });
  }

  // Register Link
  const registerLink = document.getElementById("registerLink");
  if (registerLink) {
    registerLink.addEventListener("click", (e) => {
      e.preventDefault();
      const modal = new bootstrap.Modal(
        document.getElementById("registerModal")
      );
      modal.show();
    });
  }
});

// Error handling
function showError(message) {
  const errorAlert = document.createElement("div");
  errorAlert.className = "alert alert-danger alert-dismissible fade show";
  errorAlert.style.position = "fixed";
  errorAlert.style.left = "10px";
  errorAlert.style.top = "10px";
  errorAlert.style.zIndex = "1050";
  errorAlert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
  document.body.appendChild(errorAlert);

  setTimeout(() => {
    errorAlert.remove();
  }, 3000);
}

function showSuccess(message) {
  const successAlert = document.createElement("div");
  successAlert.className = "alert alert-success alert-dismissible fade show";
  successAlert.style.position = "fixed";
  successAlert.style.left = "10px";
  successAlert.style.top = "10px";
  successAlert.style.zIndex = "1050";
  successAlert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
  document.body.appendChild(successAlert);

  setTimeout(() => {
    successAlert.remove();
  }, 3000);
}
