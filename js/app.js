const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// 1. UPDATED CORS: This allows your specific website to talk to the server
app.use(cors({
    origin: 'https://rajeshnw5207-bomis.github.io',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Setup Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'rajesh.j@bomis-lbnagar.com',
        pass: 'tmuz msvd pixk bhcm' // Verified: This is your 16-digit App Password
    },
    connectionTimeout: 10000 // 10 seconds timeout
});

// 1. Enrollment Check Route
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const enrollNo = req.params.enrollment_no.trim().toUpperCase(); // Make it uppercase
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
        res.status(500).json({ error: "Database error" });
    }
});

// 2. Email Verification & OTP Route
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
            const studentName = result.rows[0].student_name;

            const mailOptions = {
                from: '"BOMIS Sports" <rajesh.j@bomis-lbnagar.com>',
                to: studentEmail,
                subject: 'Your Sports Selection OTP',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #FF9100; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #FF9100; text-align: center;">BOMIS Sports Selection</h2>
                        <p>Hello <strong>${studentName}</strong>,</p>
                        <p>Your verification code is:</p>
                        <div style="text-align: center; font-size: 36px; font-weight: bold; background: #fdf2e9; padding: 20px; border-radius: 8px; color: #002347; letter-spacing: 5px;">
                            ${otp}
                        </div>
                        <p style="margin-top: 20px; color: #666; font-size: 14px; text-align: center;">This code will allow you to proceed to the game selection page.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            res.json({ success: true, otp: otp }); 

        } else {
            res.status(400).json({ success: false, message: "Email mismatch. Please use your registered school email." });
        }
    } catch (err) {
        console.error("Nodemailer Error:", err);
        res.status(500).json({ success: false, error: "Email system error." });
    }
});

// IMPORTANT: Bind to 0.0.0.0 for Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
