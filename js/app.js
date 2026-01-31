async function verifyEnrollment() {
    const enrollNo = document.getElementById('enrollmentNo').value;
    const msg = document.getElementById('statusMessage');
    const stepTwo = document.getElementById('stepTwoArea');
    const btnProceed = document.getElementById('btnProceed');

    if (!enrollNo) return alert("Please enter Enrollment Number");

    // Replace with your real backend URL once hosted
    const response = await fetch(`https://arlean-oleoyl-obeisantly.ngrok-free.dev/api/check-status/${enrollNo}`);
    const data = await response.json();

    if (data.alreadySelected) {
        msg.style.color = "#c0392b"; // Red
        msg.innerHTML = `Selection already done! <br> You picked: ${data.indoor} and ${data.outdoor}`;
        resetStepTwo();
    } else {
        msg.style.color = "#27ae60"; // Green
        msg.innerHTML = "Enrollment Verified! Please enter email to continue.";
        
        // Unlock Step 2
        stepTwo.style.opacity = "1";
        stepTwo.style.pointerEvents = "all";
        btnProceed.disabled = false;
    }
}

function resetStepTwo() {
    const stepTwo = document.getElementById('stepTwoArea');
    const btnProceed = document.getElementById('btnProceed');
    stepTwo.style.opacity = "0.3";
    stepTwo.style.pointerEvents = "none";
    btnProceed.disabled = true;
}



