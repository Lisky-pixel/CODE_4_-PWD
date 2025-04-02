// DOM Elements (UNCHANGED)
const emailField = document.getElementById('email-field');
const passwordField = document.getElementById('password-field');
const confirmPasswordField = document.getElementById('confirm-password-field');
const emailMsg = document.getElementById('email-msg');
const passwordMsg = document.getElementById('password-msg');
const confirmPasswordMsg = document.getElementById('confirm-password-msg');

// ======================
// VALIDATION FUNCTIONS
// ======================

//NormalizeUserData//
function normalizeUserData(user) {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        // Add any other fields you want to store
    };
}

// 1. Email Format Validation (UNCHANGED)
function validateEmailFormat(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const maxLength = 254;

    if (!regex.test(email)) {
        return { valid: false, message: "Invalid email format." };
    }
    if (email.length > maxLength) {
        return { valid: false, message: "Email is too long." };
    }
    if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) {
        return { valid: false, message: "Invalid email (contains double dots or starts/ends with dot)." };
    }
    return { valid: true, message: "Valid email." };
}

// 2. Updated Real Email Check for MailboxValidator
async function validateRealEmail(email) {
    const apiKey = "116ffd5e8fdf7dbff0dc0ef7087e71969cedeb3f"; 
    const apiUrl = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const { data } = await response.json(); // Destructure like your backend
        
        let isValid = false;
        let message = "Email validation failed";

        if (data.status === "valid") {
            if (data.disposable) {
                message = "Disposable emails not allowed";
            } else if (!data.smtp_check) {
                message = "Cannot verify mail reception (SMTP check failed)";
            } else {
                isValid = true;
                message = "Valid email address";
            }
        } else {
            message = "This email cannot receive mail";
        }

        return { 
            valid: isValid,
            message: message
        };
    } catch (error) {
        console.error("API Error:", error);
        return { 
            valid: false, 
            message: "Validation service unavailable. Please try later." 
        };
    }
}

// 3. Password Validation (UNCHANGED)
function validatePassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return { valid: false, message: "Password must be at least 8 characters." };
    }
    if (!hasUpper) {
        return { valid: false, message: "Password needs at least one uppercase letter." };
    }
    if (!hasLower) {
        return { valid: false, message: "Password needs at least one lowercase letter." };
    }
    if (!hasNumber) {
        return { valid: false, message: "Password needs at least one number." };
    }
    if (!hasSpecial) {
        return { valid: false, message: "Password needs at least one special character." };
    }
    return { valid: true, message: "Strong password!" };
}

// ======================
// REAL-TIME VALIDATION (ALL EVENT LISTENERS UNCHANGED)
// ======================

// Email Field (UNCHANGED)
emailField?.addEventListener('input', async function() {
    const email = this.value;
    const formatResult = validateEmailFormat(email);
    
    if (!formatResult.valid) {
        emailMsg.textContent = formatResult.message;
        emailMsg.style.color = "red";
        return;
    }
    
    emailMsg.textContent = "Checking email...";
    emailMsg.style.color = "blue";
    
    const realEmailResult = await validateRealEmail(email);
    emailMsg.textContent = realEmailResult.message;
    emailMsg.style.color = realEmailResult.valid ? "green" : "red";
});

// Password Field (UNCHANGED)
passwordField?.addEventListener('input', function() {
    const result = validatePassword(this.value);
    passwordMsg.textContent = result.message;
    passwordMsg.style.color = result.valid ? "green" : "red";
});

// Confirm Password Field (UNCHANGED)
confirmPasswordField?.addEventListener('input', function() {
    const password = passwordField.value;
    const confirmPassword = this.value;
    
    if (password === confirmPassword) {
        confirmPasswordMsg.textContent = "Passwords match!";
        confirmPasswordMsg.style.color = "green";
    } else {
        confirmPasswordMsg.textContent = "Passwords do not match!";
        confirmPasswordMsg.style.color = "red";
    }
});

// ======================
// FORM SUBMISSION (ALL UNCHANGED)
// ======================

// Registration Form Handler (UNCHANGED)
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        firstName: document.getElementById('firstName-field').value,
        lastName: document.getElementById('lastName-field').value,
        email: document.getElementById('email-field').value,
        password: document.getElementById('password-field').value,
        confirmPassword: document.getElementById('confirm-password-field').value
    };

    // Simple validation
    if (userData.password !== userData.confirmPassword) {
        alert("Passwords don't match!");
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            window.location.href = 'dashboard.html';
        } else {
            throw new Error(result.error || 'Registration failed');
        }
    } catch (error) {
        alert(error.message);
    }
});

// Login Form Handler (UPDATED)
document.getElementById('emailForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const credentials = {
        email: document.getElementById('email-field').value.trim(),
        password: document.getElementById('password-field').value
    };

    // 1. Basic email format validation
    const emailResult = validateEmailFormat(credentials.email);
    if (!emailResult.valid) {
        alert(emailResult.message);
        return;
    }

    try {
        // 2. Email verification check
        const validationResponse = await fetch('http://localhost:3001/validate-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email })
        });
        const validationResult = await validationResponse.json();

        // Handle verification results
        if (!validationResult.valid) {
            if (validationResult.message.includes("Cannot verify mail reception")) {
                // Special case: SMTP check failed but email is formatted correctly
                const shouldProceed = confirm(`${validationResult.message}\n\nContinue with login anyway?`);
                if (!shouldProceed) return;
            } else {
                // Other validation failures
                throw new Error(validationResult.message);
            }
        }

        // 3. Proceed with login
        const loginResponse = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const loginResult = await loginResponse.json();
        
        if (loginResult.success && loginResult.user) {
            // Normalize and store user data
            const normalizedUser = normalizeUserData(loginResult.user);
            localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
            
            console.log("Stored User:", normalizedUser); // Debug
            
            // Redirect with cache-busting to ensure fresh data load
            window.location.href = `dashboard.html?t=${Date.now()}`;
        } else {
            throw new Error(loginResult.error || "Login failed");
        }

    } catch (error) {
        console.error('Login error:', error);
        alert(error.message);
        document.getElementById('email-field').style.border = '1px solid red';
    }
});

// Helper function for email format validation (keep your existing version)
function validateEmailFormat(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return { valid: false, message: "Invalid email format" };
    }
    return { valid: true, message: "Valid email format" };
}