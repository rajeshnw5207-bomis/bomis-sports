async function verifyEnrollment() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const msg = document.getElementById('statusMessage');
    const stepTwo = document.getElementById('stepTwoArea');
    const btnProceed = document.getElementById('btnProceed');

    if (!enrollNo) return alert("Please enter Enrollment Number");

    try {
    const response = await fetch(`https://arlean-oleoyl-obeisantly.ngrok-free.dev/api/check-status/${enrollNo}`, {
        headers: {
            "ngrok-skip-browser-warning": "69420"
        }
    });

    // Check if the response is actually okay
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log("Data received:", data); // This helps you see the result in F12 console

    if (data.verified) {
        if (data.student.already_selected) {
            msg.style.color = "#c0392b";
            msg.innerHTML = "Selection already done! You cannot submit again.";
        } else {
            msg.style.color = "#27ae60";
            msg.innerHTML = "Enrollment Verified! Please enter email to continue.";
            stepTwo.style.opacity = "1";
            stepTwo.style.pointerEvents = "all";
            btnProceed.disabled = false;
        }
    } else {
        msg.style.color = "#c0392b";
        msg.innerHTML = "Enrollment number wrong. Please check and try again.";
    }
} catch (error) {
    console.error("Fetch error:", error);
    msg.style.color = "#c0392b";
    msg.innerHTML = "Connection established, but could not read data. Please refresh (Ctrl+F5).";
}
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


