// content.js (FINAL, SURGICAL CLEANING CODE)

// 🚨 STEP 1: DEFINE SELECTORS
const ANSWER_BOX_SELECTOR = '.mathPad input, .mathPad textarea, input[type="text"]'; 

// Regex to remove headers/scores and specific large text blocks
const SCORE_PATTERN = /\d+\.\d+\s?\/\s?\d+\.\d+\s?POINTS?|\[\s*\d+\.\d+\s?\/\s?\d+\.\d+\s?Points?\]|DETAILS|MY NOTES|PREVIOUS ANSWERS|ASK YOUR TEACHER|PRACTICE ANOTHER/gi;

// 🚨 STEP 2: EVENT LISTENER TO DETECT USER FOCUS 
document.addEventListener('focusin', (event) => {
    if (event.target.matches(ANSWER_BOX_SELECTOR)) {
        
        // --- SCRAPING LOGIC: Find the nearest question container ---
        let questionContainer = null;
        
        // Look for the nearest ancestor with a class like 'walpger' (the problem block wrapper)
        let currentElement = event.target.parentElement;
        while (currentElement && currentElement !== document.body) {
            if (currentElement.matches('.walpger') || currentElement.id.startsWith('waQ')) {
                questionContainer = currentElement;
                break;
            }
            if (currentElement.innerText.match(/^\s*\d+\./)) { // Check for problem number
                questionContainer = currentElement;
                break;
            }
            currentElement = currentElement.parentElement;
        }

        // If a container is found, scrape its text; otherwise, use the document body (as a last resort)
        const scrapedText = questionContainer ? questionContainer.innerText : document.body.innerText;
        
        // 1. Clean up whitespace
        let questionText = scrapedText.trim().replace(/\s\s+/g, ' ');
        
        // 2. CRITICAL CLEANING STEPS
        questionText = questionText.replace(SCORE_PATTERN, '');
        questionText = questionText.replace(/Resources READ IT WATCH IT MASTER IT/g, '');
        questionText = questionText.replace(/SKIP TO CONTENT.*?\d+\.\d+\s%\s/g, ''); // Remove header navigation

        // *** THIS IS THE FINAL FIX: Remove verbose graph descriptions and feedback ***
        questionText = questionText.replace(/A curve labeled g\(x\) is graphed.*?|Enhanced Feedback.*$/gs, '');
        
        
        // 3. Check for success 
        const finalQuestionText = (questionText.length > 50) ? questionText : "Question text not found.";
        
        const currentInput = event.target.value.trim();
        
        // ** CRITICAL DEBUGGING LINE **
        console.log("Scraped Question Text (Cleaned):", finalQuestionText); 
        
        // --- MESSAGE SENDING LOGIC (API Call) ---
        chrome.runtime.sendMessage({
            action: "getMathHint",
            question: finalQuestionText,
            userInput: currentInput
        }, (response) => {
            if (response && response.hint) {
                displayHintPopup(event.target, response.hint);
            } else {
                console.error("Failed to receive hint from background script or API.");
                displayHintPopup(event.target, "Error: Could not get hint. (Check background console)");
            }
        });
    } else {
        hideHintPopup();
    }
});


// 🚨 STEP 3: HINT DISPLAY FUNCTIONS (NO CHANGE)
function displayHintPopup(targetElement, hintText) {
    let existingPopup = document.getElementById('academic-hint-popup');
    if (!existingPopup) {
        existingPopup = document.createElement('div');
        existingPopup.id = 'academic-hint-popup';
        document.body.appendChild(existingPopup);
    }
    
    // ... (CSS styles for pop-up) ...
    existingPopup.style.cssText = `
        position: absolute; 
        border: 2px solid #007bff; 
        padding: 10px; 
        background: #e0f7ff; 
        z-index: 10000; 
        max-width: 300px; 
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        font-size: 14px;
        color: #333;
        transition: opacity 0.3s ease-in-out; 
    `;
    
    const rect = targetElement.getBoundingClientRect();
    const topPosition = window.scrollY + rect.top;
    const leftPosition = window.scrollX + rect.right + 15; 
    
    existingPopup.style.top = `${topPosition}px`;
    existingPopup.style.left = `${leftPosition}px`;
    
    existingPopup.innerHTML = `<strong>💡 AI Hint:</strong> <br>${hintText}`;
    existingPopup.style.opacity = '1'; 
    existingPopup.style.display = 'block';
}

function hideHintPopup() {
    const existingPopup = document.getElementById('academic-hint-popup');
    if (existingPopup) {
        existingPopup.style.display = 'none';
    }
}