async function verifyEnrollment() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const msg = document.getElementById('statusMessage');
    const stepTwo = document.getElementById('stepTwoArea');
    const emailField = document.getElementById('email');
    const btnProceed = document.getElementById('btnProceed');

    // Reset UI before checking
    msg.innerHTML = "Verifying...";
    msg.style.color = "#3498db"; 
    
    if (!enrollNo) {
        msg.innerHTML = "";
        return alert("Please enter Enrollment Number");
    }

    try {
        // Updated fetch with ngrok skip header to bypass the warning page
        const response = await fetch(`https://arlean-oleoyl-obeisantly.ngrok-free.dev/api/check-status/${enrollNo}`, {
            headers: {
                "ngrok-skip-browser-warning": "69420"
            }
        });

        if (!response.ok) {
            throw new Error('Server response was not ok');
        }

        const data = await response.json();
        console.log("Verification Data:", data);

        if (data.verified) {
            // SCENARIO 1: Valid student, but already submitted sports
            if (data.student.already_selected) {
                msg.style.color = "#c0392b"; // Red
                msg.innerHTML = "Selection already done! You cannot submit again.";
                stepTwo.style.opacity = "0.5";
                stepTwo.style.pointerEvents = "none";
                btnProceed.disabled = true;
            } 
            // SCENARIO 2: Valid student, NOT yet submitted (SUCCESS)
            else {
                msg.style.color = "#27ae60"; // Green
                msg.innerHTML = "Enrollment Verified! Please enter email to continue.";
                
                // Unlock Email Section and Proceed Button
                stepTwo.style.opacity = "1";
                stepTwo.style.pointerEvents = "all";
                emailField.disabled = false;
                btnProceed.disabled = false;
            }
        } else {
            // SCENARIO 3: Enrollment number not found in pgAdmin
            msg.style.color = "#c0392b"; // Red
            msg.innerHTML = "Enrollment number wrong. Please check and try again.";
            stepTwo.style.opacity = "0.5";
            stepTwo.style.pointerEvents = "none";
            btnProceed.disabled = true;
        }
    } catch (error) {
        console.error("Fetch error:", error);
        msg.style.color = "#c0392b";
        msg.innerHTML = "Error connecting to server. Is your backend running and ngrok active?";
    }
}

// Function for the Proceed button
function proceedToGames() {
    const email = document.getElementById('email
