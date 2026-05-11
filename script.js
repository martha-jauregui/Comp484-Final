const locations = [
    { name: "Chaparral Hall", lat: 34.2383, lng: -118.5269, radius: 40 }, 
    { name: "CSUN Campus Store", lat: 34.2373, lng: -118.5283, radius: 50},
    { name: "Bayramian Hall", lat: 34.2403, lng: -118.5310, radius: 45 },
    { name: "Jacaranda Hall", lat: 34.2415, lng: -118.5286, radius: 60 }, 
    { name: "Manzanita Hall", lat: 34.2374, lng: -118.5303, radius: 50 } 
];
let currentIndex = 0;
let score = 0;
let map;
let seconds = 0;
let timerInterval;
let timerStarted = false; // Flag to track if the timer has begun

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 34.2389, lng: -118.5290 },
        zoom: 17,
        gestureHandling: "none",      
        zoomControl: false,           
        disableDoubleClickZoom: true, 
        minZoom: 17,                  
        maxZoom: 17,                  
        streetViewControl: false,
        mapTypeControl: false,
        // NEW: This style array hides building names and labels
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            },
            {
                featureType: "landscape.man_made",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    });

    // Load history immediately so it shows on the sidebar
    displayPastAttempts();

    map.addListener("dblclick", (e) => {
        if (currentIndex < locations.length) {
            // Start timer only on the very first double-click
            if (!timerStarted) {
                startTimer();
                timerStarted = true;
            }
            checkAnswer(e.latLng);
        }
    });

    // Show the first question
    nextQuestion(); 
}

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        $("#timer").text(`${seconds}s`);
    }, 1000);
}

function checkAnswer(clickedLatLng) {
    const target = locations[currentIndex];
    const targetLatLng = new google.maps.LatLng(target.lat, target.lng);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(clickedLatLng, targetLatLng);
    const isCorrect = distance <= target.radius;

    if (isCorrect) score++;

    const statusClass = isCorrect ? "correct-text" : "incorrect-text";
    $("#score-log").append(`<p><strong>${target.name}:</strong> <span class="${statusClass}">${isCorrect ? 'Correct' : 'Incorrect'}</span></p>`);

    new google.maps.Circle({
        strokeColor: isCorrect ? "#00FF00" : "#FF0000",
        fillColor: isCorrect ? "#00FF00" : "#FF0000",
        fillOpacity: 0.35,
        map: map,
        center: targetLatLng,
        radius: target.radius
    });

    $("#running-total").text(`Score: ${score}/${currentIndex + 1}`);
    currentIndex++;
    setTimeout(nextQuestion, 1000);
}

function nextQuestion() {
    if (currentIndex < locations.length) {
        $("#prompt-text").text(`Where is ${locations[currentIndex].name}?`);
    } else {
        clearInterval(timerInterval);
        $("#quiz-box").hide();
        
        // --- NEW: SAVE ATTEMPT LOGIC ---
        saveAttempt(score, seconds);
        
        let savedBest = localStorage.getItem("quizBestCount") || 0;
        if (score > parseInt(savedBest)) {
            localStorage.setItem("quizBestCount", score);
            savedBest = score;
        }

        $("#results").html(`<h2>Final Score: ${score}/5</h2><p>Finished in ${seconds}s</p>`);
       // $("#high-score-display").text(`All-Time Best: ${savedBest}/5`);
        $("#retry-btn").show();
    }
}

// Function to save the current run to the history array
function saveAttempt(finalScore, finalTime) {
    let history = JSON.parse(localStorage.getItem("quizHistory")) || [];
    
    // Add new attempt to the start of the list
    history.unshift({ score: finalScore, time: finalTime, date: new Date().toLocaleDateString() });
    
    // Keep only the last 5 attempts to keep the sidebar clean
    if (history.length > 5) history.pop();
    
    localStorage.setItem("quizHistory", JSON.stringify(history));
    displayPastAttempts();
}

// Function to render the list in the sidebar
function displayPastAttempts() {
    let history = JSON.parse(localStorage.getItem("quizHistory")) || [];
    
    // Sort by Score (High to Low), then Time (Low to High)
    history.sort((a, b) => b.score - a.score || a.time - b.time);

    let html = "<h3>Top 3 Runs</h3><ul>";
    
    if (history.length === 0) {
        html += "<li>No attempts yet!</li>";
    } else {
        // Show only Top 3
        history.slice(0, 3).forEach((attempt, index) => {
            html += `<li>Rank #${index + 1}: ${attempt.score}/5 in ${attempt.time}s</li>`;
        });
    }
    
    html += "</ul>";
    // Make sure this ID matches your HTML and CSS (#past-attempts)
    $("#past-attempts").html(html);
}