const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001;

// Database file path
const DB_PATH = path.join(__dirname, 'db.json');
console.log(`Using database file at: ${DB_PATH}`);

// Initialize database file if missing
if (!fs.existsSync(DB_PATH)) {
    console.log('Creating new db.json file');
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        status: 'API running',
        endpoints: {
            validateEmail: 'POST /validate-email',
            register: 'POST /register',
            login: 'POST /login'
        }
    });
});

// Helper functions
function readDb() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading db.json:', err);
        return { users: [] };
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing to db.json:', err);
    }
}

// ✅ Email validation endpoint
app.post('/validate-email', async (req, res) => {
    const { email } = req.body;
    const apiKey = "116ffd5e8fdf7dbff0dc0ef7087e71969cedeb3f";
    
    try {
        const apiUrl = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`;
        const response = await fetch(apiUrl);
        const { data } = await response.json(); // Destructure the response

        // Improved validation logic
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
        }

        res.json({ 
            valid: isValid,
            message: message,
            details: data
        });

    } catch (error) {
        console.error("Validation error:", error);
        // Fallback to basic format check
        const isFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        res.json({
            valid: isFormatValid,
            message: isFormatValid ? 
                "Validation service down - accepting formatted email" : 
                "Invalid email format",
            fallback: true
        });
    }
});



// ✅ User Registration
app.post('/register', (req, res) => {
    const db = readDb();

    if (db.users.some(user => user.email === req.body.email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    res.status(201).json({ success: true, user: newUser });
});

// ✅ User Login
// ✅ Updated Login Endpoint
app.post('/login', (req, res) => {
    const db = readDb();

    const user = db.users.find(user => 
        user.email === req.body.email && 
        user.password === req.body.password
    );

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Explicitly include the ID in the response
    const { password, ...userData } = user;
    res.json({ 
        success: true, 
        user: {
            ...userData,
            id: user.id // Explicitly include ID
        }
    });
});

// ✅ Session Validation (Fixed)
// ✅ Session Validation (POST method)
app.post('/validate-session', (req, res) => {
    try {
        const db = readDb();
        const { email, id } = req.body;

        // Debug logging
        console.log('Validation request for:', { email, id });
        console.log('Database contains:', db.users);

        const validUser = db.users.some(user => 
            user.email === email && 
            user.id === Number(id) // Ensure numeric comparison
        );

        res.json({ valid: validUser });
    } catch (error) {
        console.error("Session validation error:", error);
        res.status(500).json({ valid: false });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// ✅ New Enrollment Endpoint
app.post('/enroll', (req, res) => {
    const db = readDb();
    const { userId, courseId, courseTitle } = req.body;

    const user = db.users.find(u => u.id === Number(userId));
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Initialize progress array if missing
    if (!user.progress) user.progress = [];

    // Add course if not already enrolled
    if (!user.progress.some(c => c.courseId === courseId)) {
        user.progress.push({
            courseId,
            title: courseTitle,
            percentage: 0,
            lastAccessed: new Date().toISOString()
        });
        writeDb(db);
    }

    res.json({ success: true });
});