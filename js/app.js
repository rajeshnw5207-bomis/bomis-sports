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

// Route 1: Enrollment Number Verification
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const enrollNo = req.params.enrollment_no.trim().toUpperCase();
        const result = await pool.query(
            'SELECT student_name, student_class, section FROM bomis_db WHERE enrollment_no = $1', 
            [enrollNo] 
        );

        if (result.rows.length > 0) {
            res.json({ 
                verified: true, 
                studentName: result.rows[0].student_name,
                studentClass: result.rows[0].student_class,
                section: result.rows[0].section
            });
        } else {
            res.json({ verified: false });
        }
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: "Database connection failed." });
    }
});

// Route 2: Email Match & Instant OTP Return
app.post('/api/verify-email', async (req, res) => {
    const { enrollment_no, email } = req.body;
    
    try {
        const enrollNo = enrollment_no.trim().toUpperCase();
        const studentEmail = email.trim().toLowerCase();

        const result = await pool.query(
            'SELECT student_name FROM bomis_db WHERE enrollment_no = $1 AND TRIM(LOWER(email)) = $2',
            [enrollNo, studentEmail]
        );

        if (result.rows.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            console.log(`SUCCESS: OTP generated for ${enrollNo}`);
            res.json({ 
                success: true, 
                otp: otp,
                message: "Verification successful!" 
            }); 
        } else {
            res.status(400).json({ success: false, message: "Email mismatch. Use your registered school email." });
        }
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ success: false, error: "Server error." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Active on Port ${PORT}`);
});
