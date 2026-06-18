const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// הגרת סשן יציבה במיוחד עבור localhost
app.use(session({
    secret: 'secret-key-ancient-predators',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // חובה ב-localhost
        httpOnly: true,
        sameSite: 'lax'
    }
}));

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error("שגיאה בחיבור למסד הנתונים:", err.message);
    else console.log("מחובר למסד הנתונים SQLite.");
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        review_text TEXT NOT NULL
    )`);
});

// הרשמה
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.redirect('/register.html?error=missing');
    }

    const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(query, [username, password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.redirect('/register.html?error=exists');
            }
            return res.redirect('/register.html?error=server');
        }
        res.redirect('/login.html');
    });
});

// התחברות
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
    db.get(query, [username, password], (err, user) => {
        if (err || !user) {
            return res.redirect('/login.html?error=true');
        }

        req.session.user = {
            id: user.id,
            username: user.username
        };
        
        req.session.save((saveErr) => {
            if (saveErr) return res.status(500).send("שגיאה בשמירת סשן");
            res.redirect('/index.html');
        });
    });
});

// התנתקות
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login.html');
    });
});

// שליפת פרטי המשתמש המחובר
app.get('/user-info', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ username: req.session.user.username });
    } else {
        res.status(401).json({ error: "אורח" });
    }
});

// קבלת ביקורות
app.get('/reviews', (req, res) => {
    db.all(`SELECT * FROM reviews ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// הוספת ביקורת מוגנת - בלי דפים לבנים!
app.post('/reviews', (req, res) => {
    const { review_text } = req.body;
    
// שינוי ה-redirect בתוך server.js כדי שלא יקפוץ למעלה
if (!req.session || !req.session.user) {
    return res.redirect('/index.html?error=auth_required#reviews-list');
}

if (!review_text) {
    return res.redirect('/index.html?error=empty_review#reviews-list');
}

// ... קוד ה-db.run שלך ...
db.run(query, [username, review_text], function(err) {
    if (err) return res.status(500).send("שגיאה בשמירת הביקורת");
    res.redirect('/index.html#reviews-list'); // מחזיר בדיוק לאזור התגובות!
});
});

app.listen(PORT, () => {
    console.log(`🚀 השרת רץ בכתובת: http://localhost:3000`);
});