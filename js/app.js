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
// Add your sendOtp() and verifyOtp() functions here below
