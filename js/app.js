async function verifyEnrollment() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const msg = document.getElementById('statusMessage');
    const stepTwo = document.getElementById('stepTwoArea');
    const btnProceed = document.getElementById('btnProceed');

    if (!enrollNo) return alert("Please enter Enrollment Number");

    msg.innerHTML = "Verifying...";
    msg.style.color = "blue";

    try {
        // Updated with ngrok skip header and direct data handling
        const response = await fetch(`https://arlean-oleoyl-obeisantly.ngrok-free.dev/api/check-status/${enrollNo}`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });

        const data = await response.json();

        if (data.verified) {
            if (data.student.already_selected) {
                msg.style.color = "red";
                msg.innerHTML = "Selection already done!";
            } else {
                msg.style.color = "green";
                msg.innerHTML = "Enrollment Verified!";
                // Unlock Step 2
                stepTwo.style.opacity = "1";
                stepTwo.style.pointerEvents = "all";
                btnProceed.disabled = false;
            }
        } else {
            msg.style.color = "red";
            msg.innerHTML = "Enrollment number wrong.";
        }
    } catch (error) {
        console.error(error);
        msg.style.color = "red";
        msg.innerHTML = "Connection Error. Check if your VS Code terminal is running.";
    }
}

function proceedToGames() {
    window.location.href = 'games.html';
}
