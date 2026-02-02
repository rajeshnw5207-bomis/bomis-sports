require('dotenv').config(); // This must be at the very top
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();

// Required to bypass ngrok's manual warning page
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
});

app.use(cors());
app.use(express.json());

// 1. Database Connection (Corrected to use Supabase via .env)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Supabase requires this for external connections
});

// 2. Email Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rajesh.nw.5207@gmail.com',
        pass: 'jfad zhgi eobk znlj' 
    }
});

// 3. Verify Enrollment Route
app.get('/api/check-status/:enrollNo', async (req, res) => {
    try {
        const { enrollNo } = req.params;
        // Updated to use your actual table name: bomis_db
        const result = await pool.query('SELECT * FROM bomis_db WHERE enrollment_no = $1', [enrollNo.trim().toUpperCase()]);
        
        if (result.rows.length > 0) {
            const student = result.rows[0];
            res.json({ 
                verified: true, 
                studentName: student.student_name,
                studentClass: student.student_class 
            });
        } else {
            res.json({ verified: false, message: "Enrollment not found." });
        }
    } catch (err) { 
        console.error("Database Error:", err);
        res.status(500).json({ error: "DB Connection Failed" }); 
    }
});

// 4. Verify Email & SEND OTP Route
app.post('/api/verify-email', async (req, res) => {
    const { enrollNo, email } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM bomis_db WHERE enrollment_no = $1 AND email = $2', 
            [enrollNo.toUpperCase(), email.trim()]
        );
        
        if (result.rows.length > 0) {
            const student = result.rows[0]; 
            const otp = Math.floor(100000 + Math.random() * 900000);

            await transporter.sendMail({
                from: '"BOMIS Sports" <rajesh.nw.5207@gmail.com>',
                to: email,
                subject: 'BOMIS Sports Selection OTP',
                text: `Your OTP is: ${otp}. This code is valid for 2 minutes.`
            });

            res.json({ 
                success: true, 
                otp: otp, 
                studentClass: student.student_class 
            });
        } else {
            res.json({ success: false, message: "Email mismatch." });
        }
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

app.listen(3000, () => { console.log('✅ Server running on 3000'); });

// Test Connection immediately on start
pool.query('SELECT NOW()', (err) => { 
    if (err) {
        console.log('❌ DB Connection Failed! Check your .env file.');
        console.error(err);
    } else {
        console.log('✅ Successfully Connected to Supabase!'); 
    }
});
