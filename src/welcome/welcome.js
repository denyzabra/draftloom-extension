// Welcome/Onboarding Screen JavaScript

let currentStep = 1;
const totalSteps = 3;

function updateStepIndicator() {
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
        if (index + 1 === currentStep) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function showStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const stepElement = document.getElementById(`step-${step}`);
    if (stepElement) {
        stepElement.classList.add('active');
    }
    updateStepIndicator();
}

function nextStep() {
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function skipSetup() {
    // Save preference and go to final step
    localStorage.setItem('draftloom_use_demo', 'true');
    currentStep = 3;
    showStep(currentStep);
}

function copyToClipboard(btn, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.select();
    document.execCommand('copy');

    // Visual feedback
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

function finish() {
    // Mark onboarding as complete
    localStorage.setItem('draftloom_onboarding_complete', 'true');

    // Close this tab
    window.close();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Welcome screen loaded');
    updateStepIndicator();

    // Attach event listeners to all buttons
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', nextStep);
    }

    const copyFlagsBtn = document.getElementById('copy-flags-btn');
    if (copyFlagsBtn) {
        copyFlagsBtn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.target;
            copyToClipboard(e.target, targetId);
        });
    }

    const step2BackBtn = document.getElementById('step2-back-btn');
    if (step2BackBtn) {
        step2BackBtn.addEventListener('click', prevStep);
    }

    const skipSetupBtn = document.getElementById('skip-setup-btn');
    if (skipSetupBtn) {
        skipSetupBtn.addEventListener('click', skipSetup);
    }

    const step2NextBtn = document.getElementById('step2-next-btn');
    if (step2NextBtn) {
        step2NextBtn.addEventListener('click', nextStep);
    }

    const step3BackBtn = document.getElementById('step3-back-btn');
    if (step3BackBtn) {
        step3BackBtn.addEventListener('click', prevStep);
    }

    const finishBtn = document.getElementById('finish-btn');
    if (finishBtn) {
        finishBtn.addEventListener('click', finish);
    }
});
