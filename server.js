const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ---------------------------
//  DATABASE CONNECTION
// ---------------------------

const db = mysql.createConnection({
    host: "localhost",
    user: "root",      // your database username
    password: "",      // your database password
    database: "nrxdb"  // your database name
});

db.connect((err) => {
    if (err) {
        console.log("Database error:", err);
    } else {
        console.log("Connected to NRX Database");
    }
});

// ---------------------------
//  USER REGISTER
// ---------------------------

app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.json({ status: "error", message: "Missing fields" });

    const hashed = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hashed],
        (err, result) => {
            if (err) return res.json({ status: "error", message: err });

            res.json({ status: "success", message: "User registered" });
        }
    );
});

// ---------------------------
//  USER LOGIN
// ---------------------------

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, rows) => {
            if (err) return res.json({ status: "error", message: err });

            if (rows.length === 0)
                return res.json({ status: "error", message: "User not found" });

            const user = rows[0];

            const match = await bcrypt.compare(password, user.password);

            if (!match)
                return res.json({ status: "error", message: "Wrong password" });

            res.json({
                status: "success",
                userId: user.id,
                message: "Login success"
            });
        }
    );
});

// ---------------------------
//  SAVE MINING PROGRESS
// ---------------------------

app.post("/saveMining", (req, res) => {
    const { userId, minedTokens, miningSpeed } = req.body;

    db.query(
        "UPDATE users SET mined_tokens = ?, mining_speed = ?, last_active = NOW() WHERE id = ?",
        [minedTokens, miningSpeed, userId],
        (err, result) => {
            if (err) return res.json({ status: "error", message: err });

            res.json({ status: "success", message: "Mining updated" });
        }
    );
});

// ---------------------------
//  GET MINING PROGRESS
// ---------------------------

app.post("/getMining", (req, res) => {
    const { userId } = req.body;

    db.query(
        "SELECT mined_tokens, mining_speed FROM users WHERE id = ?",
        [userId],
        (err, rows) => {
            if (err) return res.json({ status: "error", message: err });

            res.json({ status: "success", data: rows[0] });
        }
    );
});

// ---------------------------
//  ADMIN — GET ALL ACTIVE MINERS
// ---------------------------

app.get("/admin/activeUsers", (req, res) => {
    db.query(
        "SELECT email, mined_tokens, mining_speed, last_active FROM users ORDER BY last_active DESC",
        (err, rows) => {
            if (err) return res.json({ status: "error", message: err });

            res.json({
                status: "success",
                totalUsers: rows.length,
                users: rows
            });
        }
    );
});

// ---------------------------
//  START SERVER
// ---------------------------

app.listen(3000, () => {
    console.log("NRX Backend Running on Port 3000");
});
