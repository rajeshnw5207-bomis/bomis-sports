const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const otpStore = {}; // Temporary storage for OTP timestamps

app.use(cors({
    origin: 'https://rajeshnw5207-bomis.github.io',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Route 1: Verify Enrollment & Check if already submitted
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const enrollNo = req.params.enrollment_no.trim().toUpperCase();
        const result = await pool.query(
            'SELECT student_name, indoor_selection FROM bomis_db WHERE enrollment_no = $1', [enrollNo]
        );

        if (result.rows.length > 0) {
            if (result.rows[0].indoor_selection) {
                return res.json({ verified: true, alreadyDone: true, studentName: result.rows[0].student_name });
            }
            res.json({ verified: true, alreadyDone: false, studentName: result.rows[0].student_name });
        } else {
            res.json({ verified: false });
        }
    } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// Route 2: Email Match & 2-Minute OTP
app.post('/api/verify-email', async (req, res) => {
    const { enrollment_no, email } = req.body;
    const enrollNo = enrollment_no.trim().toUpperCase();
    try {
        const result = await pool.query(
            'SELECT student_name FROM bomis_db WHERE enrollment_no = $1 AND TRIM(LOWER(email)) = $2',
            [enrollNo, email.trim().toLowerCase()]
        );

        if (result.rows.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            otpStore[enrollNo] = Date.now() + 120000; // Valid for 2 mins
            res.json({ success: true, otp: otp }); 
        } else {
            res.status(400).json({ success: false, message: "Email mismatch." });
        }
    } catch (err) { res.status(500).json({ success: false }); }
});

// Route 3: Save Selection (Single Submission Only)
app.post('/api/save-selection', async (req, res) => {
    const { enrollment_no, indoor, outdoor } = req.body;
    try {
        const check = await pool.query('SELECT indoor_selection FROM bomis_db WHERE enrollment_no = $1', [enrollment_no]);
        if (check.rows[0].indoor_selection) {
            return res.status(400).json({ success: false, message: "Response already recorded!" });
        }
        await pool.query(
            'UPDATE bomis_db SET indoor_selection = $1, outdoor_selection = $2, selection_time = NOW() WHERE enrollment_no = $3',
            [indoor, outdoor, enrollment_no]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Active on ${PORT}`));
