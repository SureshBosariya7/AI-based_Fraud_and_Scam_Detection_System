// Main Application Logic
// Handles navigation, state management, and UI interactions

// Global state
let currentScreen = 'splash-screen';
let previousScreen = 'home-screen';
let analysisResult = null;
let analysisTimeout = null;

// Initialize app on load
window.addEventListener('DOMContentLoaded', () => {
    // Animate home screen stats
    animateDashboardStats();

    // Show splash screen for 3 seconds, then navigate to home
    setTimeout(() => {
        // Only navigate if we're still on splash
        if (currentScreen === 'splash-screen') {
            navigateTo('home-screen');
        }
    }, 3000);

    // Periodically update "Fraud Detected Today" to simulate real-time data
    setInterval(updateLiveFraudCount, 5000);
});

/**
 * Navigate between screens
 * @param {string} screenId - ID of the screen to navigate to
 */
function navigateTo(screenId) {
    // Robust way to hide all screens
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });

    // Show new screen
    const newScreen = document.getElementById(screenId);
    if (newScreen) {
        newScreen.classList.add('active');
        currentScreen = screenId;
        console.log('Navigated to:', screenId);

        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

/**
 * Load demo message into textarea
 * @param {string} type - Type of demo: 'safe', 'suspicious', or 'fraud'
 */
function loadDemo(type) {
    const messageInput = document.getElementById('message-input');
    const demoMessage = fraudEngine.getDemoMessage(type);

    messageInput.value = demoMessage;

    // Add a subtle animation
    messageInput.style.transform = 'scale(1.02)';
    setTimeout(() => {
        messageInput.style.transform = 'scale(1)';
    }, 200);
}

/**
 * Analyze message using AI engine
 */
function analyzeMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message) {
        alert('Please enter a message to analyze');
        return;
    }

    // Clear any existing analysis timeout
    if (analysisTimeout) {
        clearTimeout(analysisTimeout);
    }

    // Show loading screen
    navigateTo('loading-screen');

    // Simulate AI processing time (1.5 seconds)
    analysisTimeout = setTimeout(() => {
        // Only proceed if we are still on the loading screen
        if (currentScreen === 'loading-screen') {
            // Analyze message
            analysisResult = fraudEngine.analyze(message);

            // Display results
            displayResults(message, analysisResult);

            // Navigate to result screen
            previousScreen = 'scan-screen';
            navigateTo('result-screen');
        }
        analysisTimeout = null;
    }, 1500);
}

/**
 * Display analysis results on result screen
 * @param {string} message - Original message
 * @param {Object} result - Analysis result from AI engine
 */
function displayResults(message, result) {
    const { classification, riskScore, flags, explanation } = result;

    // Update Back Button based on previous screen
    const backBtn = document.getElementById('result-back-btn');
    const backBtnText = document.getElementById('back-btn-text');

    if (backBtn && backBtnText) {
        if (previousScreen === 'analyze-call-screen') {
            backBtn.onclick = () => navigateTo('analyze-call-screen');
            backBtnText.textContent = ' Back to Simulation';
        } else {
            backBtn.onclick = () => navigateTo('scan-screen');
            backBtnText.textContent = ' Scan Another';
        }
    }

    // Update status card
    const statusCard = document.getElementById('status-card');
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusSubtitle = document.getElementById('status-subtitle');

    // Remove previous classes
    statusCard.className = 'status-card';
    statusIcon.className = 'status-icon';

    // Add classification class
    statusCard.classList.add(classification);
    statusIcon.classList.add(classification);

    // Set title and subtitle
    statusTitle.textContent = classification.toUpperCase();
    statusSubtitle.textContent = explanation;

    // Update risk meter
    updateRiskMeter(riskScore, classification);

    // Display flags
    displayFlags(flags);

    // Display analyzed message
    const analyzedText = document.getElementById('analyzed-text');
    analyzedText.textContent = message;
}

/**
 * Update the circular risk meter
 * @param {number} score - Risk score (0-100)
 * @param {string} classification - Classification type
 */
function updateRiskMeter(score, classification) {
    const riskProgress = document.getElementById('risk-progress');
    const riskScoreElement = document.getElementById('risk-score');

    // Calculate stroke-dashoffset (502.4 is circumference of circle with r=80)
    const circumference = 502.4;
    const offset = circumference - (score / 100) * circumference;

    // Set color based on classification
    let color;
    if (classification === 'safe') {
        color = '#10B981'; // Green
    } else if (classification === 'suspicious') {
        color = '#F59E0B'; // Yellow
    } else {
        color = '#EF4444'; // Red
    }

    riskProgress.style.stroke = color;
    riskProgress.style.strokeDashoffset = offset;

    // Animate the score number
    animateScore(riskScoreElement, 0, score, 1000);
}

/**
 * Animate score counter
 * @param {HTMLElement} element - Element to update
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Animation duration in ms
 */
function animateScore(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * easeOut);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Display fraud detection flags
 * @param {Array} flags - Array of flag objects
 */
function displayFlags(flags) {
    const flagsContainer = document.getElementById('flags-container');
    flagsContainer.innerHTML = '';

    if (flags.length === 0) {
        flagsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No fraud indicators detected</p>';
        return;
    }

    flags.forEach((flag, index) => {
        const flagItem = document.createElement('div');
        flagItem.className = 'flag-item';
        flagItem.style.animationDelay = `${index * 0.1}s`;

        flagItem.innerHTML = `
            <span class="flag-icon">${flag.icon}</span>
            <span class="flag-text">${flag.text}</span>
        `;

        flagsContainer.appendChild(flagItem);
    });
}

/**
 * Simulate a live phone call analysis
 * @param {string} type - 'safe', 'suspicious', or 'fraud'
 */
function simulateCall(type) {
    const simulation = fraudEngine.getCallSimulation(type);
    const transcriptContainer = document.getElementById('live-transcript');
    const callerName = document.getElementById('caller-name');
    const callerStatus = document.getElementById('caller-status');

    // Reset UI
    transcriptContainer.innerHTML = '';
    callerName.textContent = simulation.caller;
    callerStatus.textContent = "Connected";
    callerStatus.style.color = "#10B981"; // Active green

    let stepIndex = 0;

    function showNextStep() {
        if (stepIndex < simulation.steps.length) {
            const step = simulation.steps[stepIndex];
            const messageDiv = document.createElement('div');
            messageDiv.className = `transcript-message ${step.type}`;
            messageDiv.textContent = step.text;

            transcriptContainer.appendChild(messageDiv);
            transcriptContainer.scrollTop = transcriptContainer.scrollHeight;

            stepIndex++;

            // Random delay between messages (1-2 seconds)
            const delay = 1000 + Math.random() * 1000;
            setTimeout(showNextStep, delay);
        } else {
            // End of simulation, show results after a short pause
            setTimeout(() => {
                // Determine classification and message based on simulation type
                let textToAnalyze;
                if (type === 'safe') textToAnalyze = "This call from Mom seems legitimate. No sensitive info requested.";
                else if (type === 'suspicious') textToAnalyze = "Potential impersonation of Microsoft Support requesting remote access.";
                else textToAnalyze = "Urgent call from bank impersonator requesting PIN verification.";

                const result = fraudEngine.analyze(textToAnalyze);

                // Override risk score and classification to match simulation
                if (type === 'safe') {
                    result.classification = 'safe';
                    result.riskScore = 5;
                } else if (type === 'suspicious') {
                    result.classification = 'suspicious';
                    result.riskScore = 55;
                } else {
                    result.classification = 'fraud';
                    result.riskScore = 95;
                }

                displayResults("Live Call: " + simulation.caller, result);
                previousScreen = 'analyze-call-screen';
                navigateTo('result-screen');

                // Reset call UI for next time
                callerStatus.textContent = "Call Ended";
                callerStatus.style.color = "#94A3B8";
            }, 1500);
        }
    }

    showNextStep();
}

/**
 * Analyze a custom call transcript provided by the user
 */
function analyzeCustomCall() {
    const transcriptInput = document.getElementById('call-transcript-input');
    const transcript = transcriptInput.value.trim();

    if (!transcript) {
        alert('Please enter a call transcript to analyze');
        return;
    }

    // Store previous screen for correct navigation
    previousScreen = 'analyze-call-screen';

    // Clear any existing analysis timeout
    if (analysisTimeout) {
        clearTimeout(analysisTimeout);
    }

    // Show loading screen
    navigateTo('loading-screen');

    // Simulate AI processing time (1.5 seconds)
    analysisTimeout = setTimeout(() => {
        // Only proceed if we are still on the loading screen
        if (currentScreen === 'loading-screen') {
            // Analyze transcript
            analysisResult = fraudEngine.analyze(transcript);

            // Display results
            displayResults("User Transcript Analysis", analysisResult);

            // Navigate to result screen
            navigateTo('result-screen');
        }
        analysisTimeout = null;
    }, 1500);
}

/**
 * Clear message input when navigating to scan screen
 */
function clearMessageInput() {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = '';
    }
}

// Add event listeners for Enter key and Audio Upload
document.addEventListener('DOMContentLoaded', () => {
    // Message input enter key
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                analyzeMessage();
            }
        });
    }

    // Audio upload handling
    const dropZone = document.getElementById('drop-zone');
    const audioInput = document.getElementById('audio-input');

    if (dropZone && audioInput) {
        dropZone.onclick = () => audioInput.click();

        dropZone.ondragover = (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        };

        dropZone.ondragleave = () => {
            dropZone.classList.remove('drag-over');
        };

        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleAudioUpload(e.dataTransfer.files[0]);
            }
        };

        audioInput.onchange = (e) => {
            if (e.target.files.length > 0) {
                handleAudioUpload(e.target.files[0]);
            }
        };
    }

    // Explicitly bind bottom buttons (as a backup to inline onclick)
    const safetyBtn = document.querySelector('button[onclick*="awareness-screen"]');

    if (safetyBtn) safetyBtn.addEventListener('click', () => navigateTo('awareness-screen'));
});

/**
 * Handle audio file upload and simulate transcription
 * @param {File} file - The uploaded audio file
 */
function handleAudioUpload(file) {
    const uploadStatus = document.getElementById('upload-status');
    const statusText = document.getElementById('status-text');
    const dropZone = document.getElementById('drop-zone');

    // Show status
    dropZone.style.opacity = '0.5';
    dropZone.style.pointerEvents = 'none';
    uploadStatus.style.display = 'block';

    // Step-by-step simulation
    const steps = [
        { text: "Uploading " + file.name + "...", delay: 1000 },
        { text: "AI is analyzing voice frequency...", delay: 1500 },
        { text: "Transcribing audio to text...", delay: 2000 },
        { text: "Finalizing transcript...", delay: 1000 }
    ];

    let currentStep = 0;

    function processStep() {
        if (currentStep < steps.length) {
            statusText.textContent = steps[currentStep].text;
            setTimeout(() => {
                currentStep++;
                processStep();
            }, steps[currentStep].delay);
        } else {
            // Processing complete
            statusText.textContent = "Transcription Complete!";

            setTimeout(() => {
                // Reset UI
                dropZone.style.opacity = '1';
                dropZone.style.pointerEvents = 'auto';
                uploadStatus.style.display = 'none';

                // Use the file name or a mock transcript based on common scam keywords
                // This makes the demo feel "intelligent"
                let mockTranscript;
                const fileName = file.name.toLowerCase();

                if (fileName.includes('bank') || fileName.includes('security')) {
                    mockTranscript = "Urgent call from Bank Security. Your card has been used for a ₹50,000 transaction. Press 1 to speak to an agent and verify your account details.";
                } else if (fileName.includes('lottery') || fileName.includes('win')) {
                    mockTranscript = "CONGRATULATIONS! You have won the International Mega Lottery of one million dollars. To claim your prize, please provide your personal ID and pay a processing fee.";
                } else {
                    mockTranscript = "Hello, I am calling about your computer's security. We have detected several errors. I need you to grant me remote access to fix these issues immediately.";
                }

                // Analyze the mock transcript
                previousScreen = 'analyze-call-screen';
                navigateTo('loading-screen');

                setTimeout(() => {
                    const result = fraudEngine.analyze(mockTranscript);
                    displayResults("Audio Transcript: " + file.name, result);
                    navigateTo('result-screen');
                }, 1000);
            }, 1000);
        }
    }

    processStep();
}

/**
 * Animate numbers on the home screen dashboard
 */
function animateDashboardStats() {
    const fraudElement = document.getElementById('stat-fraud');
    const accuracyElement = document.getElementById('stat-accuracy');
    const usersElement = document.getElementById('stat-users');

    if (fraudElement) animateScore(fraudElement, 0, 1247, 2000, true);
    if (accuracyElement) animateScore(accuracyElement, 0, 98.5, 2000, false, 1);
    if (usersElement) animateScore(usersElement, 0, 50000, 2000, true);
}

/**
 * Simulate live fraud detection updates
 */
function updateLiveFraudCount() {
    const fraudElement = document.getElementById('stat-fraud');
    if (!fraudElement || currentScreen !== 'home-screen') return;

    const currentCount = parseInt(fraudElement.textContent.replace(/,/g, ''));
    // Randomly increase by 1-3
    const increment = Math.floor(Math.random() * 3) + 1;
    const newCount = currentCount + increment;

    // Smooth transition
    fraudElement.style.transform = 'scale(1.1)';
    fraudElement.style.color = '#10B981';

    setTimeout(() => {
        fraudElement.textContent = newCount.toLocaleString();
        fraudElement.style.transform = 'scale(1)';
        fraudElement.style.color = '';
    }, 200);
}

/**
 * Refined animateScore to handle commas and decimals
 */
function animateScore(element, start, end, duration, useCommas = false, decimals = 0) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);
        let current = start + (end - start) * easeOut;

        if (decimals > 0) {
            element.textContent = current.toFixed(decimals);
        } else {
            const rounded = Math.round(current);
            element.textContent = useCommas ? rounded.toLocaleString() : rounded;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}
