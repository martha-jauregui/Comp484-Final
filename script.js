// Your custom constants for consistent UI
const ColorScheme = {
    CORRECT: "#008000", // The green from your log
    WRONG: "#d90000",   // The red from your log
};

let map;
let currentIndex = 0;
let score = 0;
let seconds = 0;
let timerInterval;
let timerStarted = false; 

const locations = [
    { name: "Chaparral Hall", lat: 34.2383, lng: -118.5269, radius: 40 }, 
    { name: "CSUN Campus Store", lat: 34.2373, lng: -118.5283, radius: 50},
    { name: "Bayramian Hall", lat: 34.2403, lng: -118.5310, radius: 45 },
    { name: "Jacaranda Hall", lat: 34.2415, lng: -118.5286, radius: 60 }, 
    { name: "Manzanita Hall", lat: 34.2374, lng: -118.5303, radius: 50 } 
];

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
        styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "landscape.man_made", elementType: "labels", stylers: [{ visibility: "off" }] }
        ]
    });

    displayPastAttempts();

    map.addListener("dblclick", (e) => {
        if (currentIndex < locations.length) {
            if (!timerStarted) {
                startTimer();
                timerStarted = true;
            }
            checkAnswer(e.latLng);
        }
    });

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

    // Update Sidebar Feedback
    const statusClass = isCorrect ? "correct-text" : "incorrect-text";
    $("#score-log").append(`<p><strong>${target.name}:</strong> <span class="${statusClass}">${isCorrect ? 'Correct' : 'Incorrect'}</span></p>`);

    // --- CIRCLE CLASS IMPLEMENTATION ---
    const feedbackCircle = new google.maps.Circle({
        map: map,
        center: targetLatLng,
        radius: target.radius,
        fillColor: isCorrect ? ColorScheme.CORRECT : ColorScheme.WRONG,
        strokeColor: isCorrect ? ColorScheme.CORRECT : ColorScheme.WRONG,
        fillOpacity: 0.35,
        strokeWeight: 1
    });

    // Remove circle after 2 seconds
    setTimeout(() => {
        feedbackCircle.setMap(null);
    }, 2000);

    // Update Score and Move On
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
        
        saveAttempt(score, seconds);
        
        $("#results").html(`<h2>Final Score: ${score}/5</h2><p>Finished in ${seconds}s</p>`);
        $("#retry-btn").show();
    }
}

function saveAttempt(finalScore, finalTime) {
    let history = JSON.parse(localStorage.getItem("quizHistory")) || [];
    history.push({ score: finalScore, time: finalTime });
    localStorage.setItem("quizHistory", JSON.stringify(history));
    displayPastAttempts();
}

function displayPastAttempts() {
    let history = JSON.parse(localStorage.getItem("quizHistory")) || [];
    
    // Sort: Highest Score first, then Fastest Time
    history.sort((a, b) => b.score - a.score || a.time - b.time);

    let html = "<h3>Top 3 Runs</h3><ul>";
    
    if (history.length === 0) {
        html += "<li>No attempts yet!</li>";
    } else {
        history.slice(0, 3).forEach((attempt, index) => {
            html += `<li>Rank #${index + 1}: ${attempt.score}/5 in ${attempt.time}s</li>`;
        });
    }
    
    html += "</ul>";
    $("#past-attempts").html(html);
}