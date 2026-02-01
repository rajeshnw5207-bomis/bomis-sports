const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. CORS Configuration
app.use(cors({
    origin: 'https://rajeshnw5207-bomis.github.io',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// 2. Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Route 1: Enrollment Verification
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const enrollNo = req.params.enrollment_no.trim().toUpperCase();
        const result = await pool.query(
            'SELECT student_name FROM bomis_db WHERE enrollment_no = $1', 
            [enrollNo] 
        );
        if (result.rows.length > 0) {
            res.json({ verified: true, studentName: result.rows[0].student_name });
        } else {
            res.json({ verified: false });
        }
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// Route 2: Verify Email & Generate OTP
app.post('/api/verify-email', async (req, res) => {
    const { enrollment_no, email } = req.body;
    try {
        const result = await pool.query(
            'SELECT student_name FROM bomis_db WHERE enrollment_no = $1 AND TRIM(LOWER(email)) = $2',
            [enrollment_no.trim().toUpperCase(), email.trim().toLowerCase()]
        );
        if (result.rows.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            res.json({ success: true, otp: otp }); 
        } else {
            res.status(400).json({ success: false, message: "Email mismatch." });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// NEW Route 3: Save Sports Selection
// This fixes the "Connection failed" error you saw in your screenshot!
app.post('/api/save-selection', async (req, res) => {
    const { enrollment_no, indoor_game, outdoor_game } = req.body;
    try {
        await pool.query(
            'UPDATE bomis_db SET indoor_selection = $1, outdoor_selection = $2 WHERE enrollment_no = $3',
            [indoor_game, outdoor_game, enrollment_no]
        );
        res.json({ success: true, message: "Selection saved successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to save selection." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Active on Port ${PORT}`);
});
