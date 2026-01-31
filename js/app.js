let generatedOtp = null;
let otpTimer = null;

async function verifyEnrollment() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const msg = document.getElementById('statusMessage');
    const stepTwo = document.getElementById('stepTwoArea');

    if (!enrollNo) return alert("Please enter Enrollment Number");

    try {
        // !!! IMPORTANT: Ensure this URL matches your current ngrok address !!!
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
            msg.innerHTML = "Enrollment number wrong.";
            stepTwo.style.opacity = "0.5";
            stepTwo.style.pointerEvents = "none";
        }
    } catch (error) {
        msg.style.color = "red";
        msg.innerHTML = "Connection error. Check if VS Code server is running.";
    }
}

async function sendOtp() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const email = document.getElementById('email').value;
    const msg = document.getElementById('statusMessage');

    if (!email.includes('@')) return alert("Please enter a valid email");

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
            console.log("OTP IS:", generatedOtp); // Look in F12 console to see the code
            document.getElementById('otpSection').style.display = "block";
            
            let timeLeft = 120; // 2 Minutes
            clearInterval(otpTimer);
            otpTimer = setInterval(() => {
                timeLeft--;
                msg.style.color = "green";
                msg.innerHTML = `OTP sent! Valid for ${timeLeft}s`;
                if (timeLeft <= 0) {
                    clearInterval(otpTimer);
                    generatedOtp = null;
                    msg.innerHTML = "OTP Expired. Please click Send OTP again.";
                    msg.style.color = "red";
                }
            }, 1000);
        } else {
            msg.style.color = "red";
            msg.innerHTML = data.message;
        }
    } catch (error) {
        msg.innerHTML = "Error connecting to server.";
    }
}

function verifyOtp() {
    const userInput = document.getElementById('otpInput').value;
    if (userInput == generatedOtp && generatedOtp !== null) {
        alert("Verification Successful!");
        window.location.href = 'games.html';
    } else {
        alert("Invalid or Expired OTP");
    }
}
