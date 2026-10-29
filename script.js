const form = document.getElementById("flight-form");
const message = document.getElementById("message");
const table = document.getElementById("flight-table");
const landedTable = document.getElementById("landed-table");
const totalDisplay = document.getElementById("total-flights");
const waitingDisplay = document.getElementById("waiting-flights");
const landedDisplay = document.getElementById("landed-flights");
const eventList = document.getElementById("event-list");
const landButton = document.getElementById("land-button");

const radar = document.getElementById("radar-screen");
const planeLayer = document.getElementById("radar-planes");
const radarCount = document.getElementById("radar-count");
const radarSelection = document.getElementById("radar-selection");

const radarPositions = new Map();
let radarFlights = [];
let selectedFlightId = null;

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Request failed");
    }

    return result;
}

async function loadFlights() {
    try {
        const data = await apiRequest("/api/flights");

        totalDisplay.textContent = data.total;
        waitingDisplay.textContent = data.waiting;
        landedDisplay.textContent = data.landed_count;

        if (data.flights.length === 0) {
            table.innerHTML =
                '<tr><td colspan="6">No flights in the queue.</td></tr>';
        } else {
            table.innerHTML = data.flights.map(flight => `
                <tr>
                    <td>${escapeHTML(flight.id)}</td>
                    <td>${escapeHTML(flight.name)}</td>
                    <td>${escapeHTML(flight.destination)}</td>
                    <td>${flight.fuel}%</td>
                    <td>${flight.priority === 1 ? "EMERGENCY" :
                         flight.priority === 2 ? "HIGH" : "NORMAL"}</td>
                    <td>${escapeHTML(flight.status)}</td>
                </tr>
            `).join("");
        }

        if (data.landed.length === 0) {
            landedTable.innerHTML =
                '<tr><td colspan="4">No landings yet.</td></tr>';
        } else {
            landedTable.innerHTML = data.landed.map(flight => `
                <tr>
                    <td>${escapeHTML(flight.id)}</td>
                    <td>${escapeHTML(flight.name)}</td>
                    <td>${escapeHTML(flight.destination)}</td>
                    <td>${escapeHTML(flight.status)}</td>
                </tr>
            `).join("");
        }

        eventList.innerHTML = data.events.length
            ? data.events.map(event => `
                <li><strong>${escapeHTML(event.time)}</strong>
                — ${escapeHTML(event.message)}</li>
            `).join("")
            : "<li>No events yet.</li>";

        // Only waiting flights appear on this simulated radar.
        radarFlights = data.flights;
        updateRadarMarkers();
    } catch (error) {
        message.textContent = "Unable to load flights: " + error.message;
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const flightData = {
        name: document.getElementById("flight-name").value.trim(),
        destination: document.getElementById("destination").value.trim(),
        fuel: Number(document.getElementById("fuel").value)
    };

    try {
        const result = await apiRequest("/api/add-flight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(flightData)
        });

        message.textContent = result.message;
        form.reset();
        document.getElementById("fuel").value = 65;

        await loadFlights();
    } catch (error) {
        message.textContent = error.message;
    }
});

landButton.addEventListener("click", async () => {
    try {
        const result = await apiRequest("/api/land", {
            method: "POST"
        });

        message.textContent = result.message;
        await loadFlights();
    } catch (error) {
        message.textContent = error.message;
    }
});

function updateRadarMarkers() {
    const activeIds = new Set(radarFlights.map(flight => flight.id));

    for (const [id, marker] of planeMarkers) {
        if (!activeIds.has(id)) {
            marker.remove();
            planeMarkers.delete(id);
            radarPositions.delete(id);
        }
    }

    radarFlights.forEach(flight => {
        if (!radarPositions.has(flight.id)) {
            radarPositions.set(flight.id, {
                x: 15 + Math.random() * 70,
                y: 15 + Math.random() * 70,
                dx: (Math.random() - 0.5) * 0.18,
                dy: (Math.random() - 0.5) * 0.18
            });
        }

        if (!planeMarkers.has(flight.id)) {
            const marker = document.createElement("button");
            marker.className = "radar-plane";
            marker.type = "button";
            marker.textContent = "✈";
            marker.title = flight.id;
            marker.setAttribute("aria-label", "Select " + flight.id);

            marker.addEventListener("click", () => {
                selectedFlightId = flight.id;
                showSelectedFlight();
            });

            planeLayer.appendChild(marker);
            planeMarkers.set(flight.id, marker);
        }
    });

    radarCount.textContent = radarFlights.length;
    showSelectedFlight();
}

const planeMarkers = new Map();

function showSelectedFlight() {
    const flight = radarFlights.find(item => item.id === selectedFlightId);

    if (!flight) {
        radarSelection.textContent =
            radarFlights.length
                ? "Select an aircraft marker to view details."
                : "No waiting aircraft on radar.";
        return;
    }

    radarSelection.textContent =
        `${flight.id} | ${flight.destination} | Fuel ${flight.fuel}% | ` +
        `Priority ${flight.priority}`;
}

function animateRadar() {
    radarFlights.forEach(flight => {
        const position = radarPositions.get(flight.id);
        const marker = planeMarkers.get(flight.id);

        if (!position || !marker) return;

        position.x += position.dx;
        position.y += position.dy;

        if (position.x < 10 || position.x > 90) position.dx *= -1;
        if (position.y < 10 || position.y > 90) position.dy *= -1;

        marker.style.left = position.x + "%";
        marker.style.top = position.y + "%";
    });
}

window.setInterval(animateRadar, 100);
loadFlights();

// Refresh dashboard data periodically.
window.setInterval(loadFlights, 5000);