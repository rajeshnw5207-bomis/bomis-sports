async function verifyEnrollment() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const msg = document.getElementById('statusMessage');
    const stepTwo = document.getElementById('stepTwoArea');
    const btnProceed = document.getElementById('btnProceed');

    if (!enrollNo) return alert("Please enter Enrollment Number");

    try {
        const response = await fetch(`https://arlean-oleoyl-obeisantly.ngrok-free.dev/api/check-status/${enrollNo}`);
        const data = await response.json();

        if (data.verified) {
            if (data.student.already_selected) {
                // Scenario: Valid student but ALREADY SUBMITTED
                msg.style.color = "#c0392b"; // Red
                msg.innerHTML = "Selection already done! You cannot submit again.";
                stepTwo.style.opacity = "0.5";
                stepTwo.style.pointerEvents = "none";
                btnProceed.disabled = true;
            } else {
                // Scenario: Valid student and NOT SUBMITTED (Success)
                msg.style.color = "#27ae60"; // Green
                msg.innerHTML = "Enrollment Verified! Please enter email to continue.";
                
                // Unlock the email section
                stepTwo.style.opacity = "1";
                stepTwo.style.pointerEvents = "all";
                btnProceed.disabled = false;
            }
        } else {
            // Scenario: Enrollment number NOT in Database
            msg.style.color = "#c0392b"; // Red
            msg.innerHTML = "Enrollment number wrong. Please check and try again.";
            stepTwo.style.opacity = "0.5";
            stepTwo.style.pointerEvents = "none";
            btnProceed.disabled = true;
        }
    } catch (error) {
        msg.style.color = "#c0392b";
        msg.innerHTML = "Error connecting to server. Is your backend running?";
    }
}
