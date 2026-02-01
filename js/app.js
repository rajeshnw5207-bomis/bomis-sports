<script>
    const BACKEND_URL = "https://bomis-sports-backend.onrender.com";
    let generatedOtp = null;

    async function verifyEnrollment() {
        const enrollNo = document.getElementById('enrollment_no').value.trim().toUpperCase();
        const msg = document.getElementById('statusMessage');
        const enrollBtn = document.getElementById('verifyEnrollBtn');
        
        if(!enrollNo) { alert("Please enter Enrollment Number"); return; }
        
        enrollBtn.disabled = true;
        msg.style.color = "#FF9100";
        msg.innerHTML = "Checking database...";
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/check-status/${enrollNo}`);
            const data = await response.json();
            
            if (data.verified) {
                msg.style.color = "#4CAF50";
                msg.innerHTML = `Welcome, ${data.studentName}! Please enter your email.`;
                document.getElementById('stepTwoArea').style.display = "block";
                document.getElementById('sendOtpBtn').disabled = false;
                localStorage.setItem('enrollment_no', enrollNo);
            } else {
                msg.style.color = "#FF5252";
                msg.innerHTML = "Enrollment not found.";
                enrollBtn.disabled = false;
            }
        } catch (e) { 
            msg.style.color = "#FF5252";
            msg.innerHTML = "Server waking up. Please wait 30s.";
            enrollBtn.disabled = false;
        }
    }

    async function sendOtp() {
        const emailInput = document.getElementById('email').value.trim();
        const enrollment_no = localStorage.getItem('enrollment_no');
        const sendBtn = document.getElementById('sendOtpBtn');
        const msg = document.getElementById('statusMessage');
        
        if(!emailInput) { alert("Please enter email"); return; }
        sendBtn.disabled = true;
        sendBtn.innerHTML = "Verifying...";

        try {
            const response = await fetch(`${BACKEND_URL}/api/verify-email`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enrollment_no, email: emailInput })
            });
            const data = await response.json();
            
            if (data.success) {
                generatedOtp = data.otp;
                
                // DISPLAY THE OTP ON SCREEN IN AN ORANGE BOX
                msg.innerHTML = `
                    <div style="background: #FFF3E0; padding: 15px; border: 2px solid #FF9100; border-radius: 8px; margin-top: 10px; text-align: center;">
                        <p style="color: #333; font-weight: bold;">Your Verification Code:</p>
                        <h2 style="font-size: 32px; color: #002347; letter-spacing: 5px; margin: 5px 0;">${generatedOtp}</h2>
                        <p style="font-size: 12px; color: #666;">Enter this code below to proceed.</p>
                    </div>
                `;
                
                document.getElementById('otpSection').style.display = "block";
                sendBtn.innerHTML = "Verified";
            } else {
                alert(data.message || "Email mismatch.");
                sendBtn.disabled = false;
                sendBtn.innerHTML = "Send OTP";
            }
        } catch (e) { 
            alert("Connection error."); 
            sendBtn.disabled = false;
        }
    }

    function verifyOtp() {
        const inputOtp = document.getElementById('otpInput').value.trim();
        if (inputOtp == generatedOtp) {
            window.location.href = "games.html";
        } else { 
            alert("Invalid OTP. Enter the code shown above."); 
        }
    }
</script>
