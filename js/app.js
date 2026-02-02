require('dotenv').config(); 
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

// 1. Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 2. Email Setup (Exactly as you provided)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rajesh.nw.5207@gmail.comv', 
        pass: 'jeum kfef faef xmmc'       
    }
});

// 3. Verify Enrollment Route
app.get('/api/check-status/:enrollNo', async (req, res) => {
    try {
        const { enrollNo } = req.params;
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
        console.error("❌ Database Error:", err.message);
        res.status(500).json({ error: "DB Connection Failed" }); 
    }
});

// 4. Verify Email & SEND OTP Route
app.post('/api/verify-email', async (req, res) => {
    try {
        const { enrollNo, email } = req.body;

        // SAFETY CHECK: Prevents server crash if data is missing from frontend
        if (!enrollNo || !email) {
            console.log("⚠️ Warning: Received request with missing Enrollment or Email");
            return res.status(400).json({ success: false, message: "Invalid Request. Missing data." });
        }

        // Search database using LOWER() for email to handle caps mismatch
        const result = await pool.query(
            'SELECT * FROM bomis_db WHERE enrollment_no = $1 AND LOWER(email) = LOWER($2)', 
            [enrollNo.toUpperCase(), email.trim()]
        );
        
        if (result.rows.length > 0) {
            const student = result.rows[0]; 
            const otp = Math.floor(100000 + Math.random() * 900000);

            // SEND MAIL
            await transporter.sendMail({
                from: '"BOMIS Sports" <rajesh.nw.5207@gmail.comv>', 
                to: email.trim(),
                subject: 'BOMIS Sports Selection OTP',
                text: `Your OTP is: ${otp}. This code is valid for 2 minutes.`
            });

            console.log(`✅ OTP ${otp} sent to ${email}`);
            
            res.json({ 
                success: true, 
                otp: otp, 
                studentClass: student.student_class 
            });
        } else {
            console.log(`❌ Email Mismatch for: ${email}`);
            res.json({ success: false, message: "Email mismatch." });
        }
    } catch (err) {
        console.error("❌ Server Error:", err.message);
        res.status(500).json({ error: "Server Error - Check Terminal" });
    }
});

app.listen(3000, () => { console.log('✅ Server running on 3000'); });

pool.query('SELECT NOW()', (err) => { 
    if (err) {
        console.log('❌ DB Connection Failed! Please check your .env file.');
    } else {
        console.log('✅ Successfully Connected to Supabase!'); 
    }
});
