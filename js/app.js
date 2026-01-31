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
            btnProceed.disabled = false; // This unlocks the button
}
        } else {
            msg.style.color = "red";
            msg.innerHTML = "Enrollment number wrong.";
            stepTwo.style.opacity = "0.5";
            stepTwo.style.pointerEvents = "none";
        }
    } catch (error) {
        msg.innerHTML = "Server connection error.";
    }
}
// let generatedOtp = null;
let otpTimer = null;

async function sendOtp() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const email = document.getElementById('email').value;
    const msg = document.getElementById('statusMessage');

    msg.innerHTML = "Verifying email with database...";

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
            console.log("SIMULATED OTP:", generatedOtp); // Check F12 console
            
            document.getElementById('otpSection').style.display = "block";
            msg.style.color = "green";

            // 2-MINUTE TIMER LOGIC
            let secondsLeft = 120;
            clearInterval(otpTimer);
            otpTimer = setInterval(() => {
                secondsLeft--;
                msg.innerHTML = `OTP sent! Valid for ${secondsLeft}s`;
                
                if (secondsLeft <= 0) {
                    clearInterval(otpTimer);
                    generatedOtp = null; // OTP expires
                    msg.innerHTML = "OTP Expired. Please click 'Proceed' again.";
                    msg.style.color = "red";
                }
            }, 1000);

        } else {
            msg.style.color = "red";
            msg.innerHTML = data.message;
        }
    } catch (error) {
        msg.innerHTML = "Connection error. Check ngrok/server.";
    }
}Add your sendOtp() and verifyOtp() functions here below


