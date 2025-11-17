// background.js (FINAL, VERIFIED CODE)

// 🚨 PASTE YOUR NEW KEY INSIDE THE QUOTES. THE .trim() IS CRUCIAL.
const rawKey = "AIzaSyC5iFpBI3urVW9oX4aYm9dgtro1zIugQfc"; 
const GEMINI_API_KEY = rawKey.trim(); 

const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY;

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.action === "getMathHint") {
            
            const systemInstruction = "You are a concise AI math tutor assisting a student with a college-level problem. Your goal is to provide a single, brief, non-solution hint focusing only on the next step or core concept needed to solve the problem.";
            
            const prompt = `The assignment question is: "${request.question}". The student's current answer is: "${request.userInput}". Provide a hint.`;

            fetch(MODEL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "contents": [{
                        "role": "user",
                        "parts": [{ "text": prompt }]
                    }],
                    "config": {
                         "systemInstruction": systemInstruction,
                         "temperature": 0.5 
                    }
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API Request failed with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const hintText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No hint generated. Check background console.";
                sendResponse({ hint: hintText });
            })
            .catch(error => {
                console.error("Gemini API call error:", error);
                sendResponse({ hint: `Error: Could not get hint. (Check background console)` });
            });
            
            return true; 
        }
    }
);