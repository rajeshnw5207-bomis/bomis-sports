let generatedOtp = null;
let otpTimer = null;

async function verifyEnrollment() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const msg = document.getElementById('statusMessage');
    const stepTwo = document.getElementById('stepTwoArea');

    try {
        // This URL matches your ngrok dashboard screenshot
        const response = await fetch(`https://arlean-oleoyl-obeisantly.ngrok-free.dev/api/check-status/${enrollNo}`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        const data = await response.json();

        if (data.verified) {
            msg.style.color = "green";
            msg.innerHTML = "Enrollment Verified!";
            stepTwo.style.opacity = "1";
            stepTwo.style.pointerEvents = "all";
        } else {
            msg.style.color = "red";
            msg.innerHTML = "Enrollment number not found.";
        }
    } catch (error) {
        msg.innerHTML = "Connection error. Check if VS Code server is running.";
    }
}

async function sendOtp() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const email = document.getElementById('email').value;
    const msg = document.getElementById('statusMessage');

    try {
        const response = await fetch(`https://arlean-oleoyl-obeisantly.ngrok-free.dev/api/verify-email`, {
            method: 'POST',
            headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
            body: JSON.stringify({ enrollNo, email })
        });
        const data = await response.json();

        if (data.success) {
            generatedOtp = Math.floor(100000 + Math.random() * 900000);
            console.log("OTP:", generatedOtp); // Check F12 console
            document.getElementById('otpSection').style.display = "block";
            let timeLeft = 120;
            clearInterval(otpTimer);
            otpTimer = setInterval(() => {
                timeLeft--;
                msg.innerHTML = `OTP sent! Valid for ${timeLeft}s`;
                if (timeLeft <= 0) { clearInterval(otpTimer); generatedOtp = null; msg.innerHTML = "OTP Expired."; }
            }, 1000);
        } else { msg.innerHTML = "Email does not match our records."; }
    } catch (error) { msg.innerHTML = "Error connecting to server."; }
}

function verifyOtp() {
    const input = document.getElementById('otpInput').value;
    if (input == generatedOtp && generatedOtp !== null) {
        alert("Success!");
        window.location.href = 'games.html';
    } else { alert("Invalid OTP"); }
}
