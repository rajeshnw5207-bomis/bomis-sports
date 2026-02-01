const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// 1. CORS Configuration - Explicitly allowing your GitHub frontend
app.use(cors({
    origin: 'https://rajeshnw5207-bomis.github.io',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// 2. Database Connection (Supabase/PostgreSQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 3. UPDATED NODEMAILER: Optimized for Render's Network Environment
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS on port 587
    auth: {
        user: 'rajesh.j@bomis-lbnagar.com',
        pass: 'tmuz msvd pixk bhcm' 
    },
    // Added pooling to keep the connection alive and prevent timeouts
    pool: true, 
    maxConnections: 3,
    tls: {
        rejectUnauthorized: false, // Prevents handshake failures on cloud servers
        minVersion: 'TLSv1.2'
    }
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

// Route 2: Email Match & OTP Generation
app.post('/api/verify-email', async (req, res) => {
    const { enrollment_no, email } = req.body;
    
    try {
        const enrollNo = enrollment_no.trim().toUpperCase();
        const studentEmail = email.trim().toLowerCase();

        // Security Check: Match BOTH Enrollment ID and Email in Database
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
                        <p style="margin-top: 20px; color: #666; font-size: 14px; text-align: center;">Please enter this code on the website to choose your sports.</p>
                    </div>
                `
            };

            // Send the email
            await transporter.sendMail(mailOptions);
            console.log(`SUCCESS: OTP sent to ${studentEmail}`);
            res.json({ success: true, otp: otp }); 

        } else {
            // Error: No record matches that ID + Email combination
            res.status(400).json({ success: false, message: "Email mismatch. Use your registered school email." });
        }
    } catch (err) {
        console.error("Nodemailer System Error:", err);
        res.status(500).json({ success: false, error: "Email system timeout. Please try again." });
    }
});

// 4. Server Initialization
// Binding to 0.0.0.0 is mandatory for Render's health checks
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Active on Port ${PORT}`);
});
