const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection Pooling
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Gmail Transporter for OTPs
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bomis.sports2026@gmail.com', // UPDATE THIS
        pass: 'jeum kfef faef xmmc'    // UPDATE YOUR APP PASSWORD HERE
    }
});

// 1. Enrollment Check (Open for all classes)
app.get('/api/check-status/:enrollment_no', async (req, res) => {
    try {
        const enrollNo = req.params.enrollment_no.trim().toUpperCase();
        const result = await pool.query(
            'SELECT student_name, indoor_selection, student_class FROM bomis_db WHERE enrollment_no = $1', 
            [enrollNo]
        );

        if (result.rows.length > 0) {
            const student = result.rows[0];
            const alreadyDone = student.indoor_selection !== null;

            res.json({ 
                verified: true, 
                studentName: student.student_name, 
                studentClass: student.student_class, 
                alreadyDone 
            });
        } else {
            res.json({ verified: false, message: "Enrollment number not found." });
        }
    } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// 2. Email Verification + Gmail OTP Send
app.post('/api/verify-email', async (req, res) => {
    const { enrollment_no, email } = req.body;
    try {
        const result = await pool.query(
            'SELECT student_name FROM bomis_db WHERE enrollment_no = $1 AND TRIM(LOWER(email)) = $2',
            [enrollment_no.toUpperCase(), email.trim().toLowerCase()]
        );

        if (result.rows.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            
            const mailOptions = {
                from: '"BOMIS Sports" <your-email@gmail.com>',
                to: email.trim().toLowerCase(),
                subject: 'Your Login OTP',
                html: `<div style="font-family: Arial; padding:20px; border:1px solid #ddd; border-radius:10px;">
                        <h2 style="color: #FF8C00;">BOMIS Sports Selection</h2>
                        <p>Your OTP for the sports selection portal is:</p>
                        <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
                        <p>This OTP is valid for 2 minutes.</p>
                       </div>`
            };

            await transporter.sendMail(mailOptions);
            res.json({ success: true, otp: otp }); 
        } else {
            res.status(400).json({ success: false, message: "Email not registered." });
        }
    } catch (err) { 
        console.error(err);
        res.status(500).json({ success: false, message: "Mail service error." }); 
    }
});

// 3. Live Dashboard Counts (Class-Specific)
app.get('/api/live-counts/:student_class', async (req, res) => {
    try {
        const sClass = req.params.student_class;
        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE indoor_selection = 'Chess') as chess,
                COUNT(*) FILTER (WHERE indoor_selection = 'Table Tennis') as tt,
                COUNT(*) FILTER (WHERE outdoor_selection = 'Cricket') as cricket,
                COUNT(*) FILTER (WHERE outdoor_selection = 'Football') as football
            FROM bomis_db WHERE student_class = $1;
        `;
        const result = await pool.query(query, [sClass]);
        res.json({
            chess: parseInt(result.rows[0].chess || 0),
            tt: parseInt(result.rows[0].tt || 0),
            cricket: parseInt(result.rows[0].cricket || 0),
            football: parseInt(result.rows[0].football || 0)
        });
    } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

// 4. Save Selection with "30-Limit per Class" Safety Check
app.post('/api/save-selection', async (req, res) => {
    const { enrollment_no, indoor_game, outdoor_game } = req.body;
    try {
        const studentRes = await pool.query('SELECT student_class FROM bomis_db WHERE enrollment_no = $1', [enrollment_no]);
        if (studentRes.rows.length === 0) return res.status(404).json({ success: false });
        
        const sClass = studentRes.rows[0].student_class;

        const countQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE indoor_selection = $1) as in_count,
                COUNT(*) FILTER (WHERE outdoor_selection = $2) as out_count
            FROM bomis_db WHERE student_class = $3;
        `;
        const countRes = await pool.query(countQuery, [indoor_game, outdoor_game, sClass]);

        if (parseInt(countRes.rows[0].in_count) >= 30) {
            return res.status(400).json({ success: false, message: `${indoor_game} is full for Class ${sClass}` });
        }
        if (parseInt(countRes.rows[0].out_count) >= 30) {
            return res.status(400).json({ success: false, message: `${outdoor_game} is full for Class ${sClass}` });
        }

        await pool.query(
            'UPDATE bomis_db SET indoor_selection = $1, outdoor_selection = $2, selection_time = NOW() WHERE enrollment_no = $3',
            [indoor_game, outdoor_game, enrollment_no]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));
