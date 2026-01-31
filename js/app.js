let generatedOtp = null;
let otpTimer = null;

async function verifyEnrollment() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const msg = document.getElementById('statusMessage');
    const stepTwo = document.getElementById('stepTwoArea');

    try {
        const response = await fetch(`https://arlean-oleoyl-obeisantly.ngrok-free.dev/api/check-status/${enrollNo}`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        const data = await response.json();

        if (data.verified) {
            msg.style.color = "green";
            msg.innerHTML = "Enrollment Verified!";
            stepTwo.style.opacity = "1";
            stepTwo.style.pointerEvents = "all";
            // This line only works if the ID in HTML is 'btnProceed'
            document.getElementById('btnProceed').disabled = false;
        } else {
            msg.style.color = "red";
            msg.innerHTML = "Enrollment number not found.";
        }
    } catch (error) {
        msg.innerHTML = "Connection error. Is VS Code running?";
    }
}

async function sendOtp() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const email = document.getElementById('email').value;
    const msg = document.getElementById('statusMessage');

    msg.innerHTML = "Verifying email...";

    try {
        const response = await fetch(`https://arlean-oleoyl-obeisantly.ngrok-free.dev/api/verify-email`, {
            method: 'POST',
            headers: { 
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true" 
            },
            body: JSON.stringify({ enrollNo, email })
        });

        const data = await response.json();

        if (data.success) {
            generatedOtp = Math.floor(100000 + Math.random() * 900000);
            console.log("TESTING OTP:", generatedOtp); 
            
            document.getElementById('otpSection').style.display = "block";
            
            let timeLeft = 120;
            clearInterval(otpTimer);
            otpTimer = setInterval(() => {
                timeLeft--;
                msg.style.color = "green";
                msg.innerHTML = `OTP sent! Valid for ${timeLeft}s`;
                if (timeLeft <= 0) {
                    clearInterval(otpTimer);
                    generatedOtp = null;
                    msg.innerHTML = "OTP Expired. Please try again.";
                    msg.style.color = "red";
                }
            }, 1000);
        } else {
            msg.style.color = "red";
            msg.innerHTML = data.message || "Email mismatch.";
        }
    } catch (error) {
        msg.innerHTML = "Server connection error.";
    }
}
