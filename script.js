/* ==========================================
   SKYCONTROL - AIR TRAFFIC CONTROL
   GitHub Pages compatible simulation
   ========================================== */

const STORAGE_KEY = "skycontrol_flights_v1";
const EVENT_KEY = "skycontrol_events_v1";

const $ = (id) => document.getElementById(id);

let flights = [];
let events = [];
let selectedFlightId = null;
let nextId = 1;

const demoFlights = [
    { name: "Air India AI101", destination: "Delhi", fuel: 65 },
    { name: "IndiGo 6E202", destination: "Mumbai", fuel: 25 },
    { name: "SpiceJet SG303", destination: "Chandigarh", fuel: 48 },
    { name: "Vistara UK404", destination: "Bengaluru", fuel: 80 },
    { name: "IndiGo 6E505", destination: "Amritsar", fuel: 15 }
];

function calculatePriority(fuel) {
    // Lower number = higher simulated landing priority
    return 101 - Number(fuel);
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
        localStorage.setItem(EVENT_KEY, JSON.stringify(events));
    } catch (error) {
        console.warn("Could not save simulation data.", error);
    }
}

function addEvent(message) {
    const time = new Date().toLocaleTimeString();
    events.unshift(`${time} — ${message}`);
    events = events.slice(0, 30);

    saveData();
    renderEvents();
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function initialiseFlights() {
    try {
        const savedFlights = localStorage.getItem(STORAGE_KEY);
        const savedEvents = localStorage.getItem(EVENT_KEY);

        if (savedFlights !== null) {
            flights = JSON.parse(savedFlights);
        } else {
            flights = demoFlights.map((flight, index) => ({
                id: index + 1,
                name: flight.name,
                destination: flight.destination,
                fuel: flight.fuel,
                status: "Waiting",
                priority: calculatePriority(flight.fuel),
                x: 15 + Math.random() * 70,
                y: 15 + Math.random() * 70
            }));

            localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
        }

        if (!Array.isArray(flights)) flights = [];
        flights = flights.filter(f =>
            f && Number.isFinite(Number(f.id)) &&
            typeof f.name === "string" &&
            typeof f.destination === "string" &&
            Number.isFinite(Number(f.fuel)) &&
            (f.status === "Waiting" || f.status === "Landed")
        );

        events = savedEvents ? JSON.parse(savedEvents) : [];
        if (!Array.isArray(events)) events = [];
    } catch (error) {
        flights = demoFlights.map((flight, index) => ({
            id: index + 1,
            ...flight,
            status: "Waiting",
            priority: calculatePriority(flight.fuel),
            x: 15 + Math.random() * 70,
            y: 15 + Math.random() * 70
        }));
        events = [];
    }

    nextId = flights.reduce(
        (max, flight) => Math.max(max, Number(flight.id) || 0), 0
    ) + 1;

    if (events.length === 0) {
        events.unshift("SkyControl simulation initialized.");
        saveData();
    }
}

function renderStats() {
    const waiting = flights.filter(f => f.status === "Waiting").length;
    const landed = flights.filter(f => f.status === "Landed").length;

    $("total-flights").textContent = flights.length;
    $("waiting-flights").textContent = waiting;
    $("landed-flights").textContent = landed;
    $("radar-count").textContent = waiting;
}

function renderFlightTable() {
    const tbody = $("flight-table");

    const waitingFlights = flights
        .filter(f => f.status === "Waiting")
        .sort((a, b) =>
            a.priority - b.priority || a.id - b.id
        );

    if (waitingFlights.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="6">No flights waiting for landing.</td></tr>';
        return;
    }

    tbody.innerHTML = waitingFlights.map(flight => `
        <tr>
            <td>#${flight.id}</td>
            <td>${escapeHTML(flight.name)}</td>
            <td>${escapeHTML(flight.destination)}</td>
            <td>${Number(flight.fuel)}%</td>
            <td>${flight.priority}</td>
            <td><span class="status-waiting">Waiting</span></td>
        </tr>
    `).join("");
}

function renderLandedTable() {
    const tbody = $("landed-table");

    const landedFlights = flights
        .filter(f => f.status === "Landed")
        .sort((a, b) => (b.landedAt || 0) - (a.landedAt || 0))
        .slice(0, 10);

    if (landedFlights.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="4">No landings yet.</td></tr>';
        return;
    }

    tbody.innerHTML = landedFlights.map(flight => `
        <tr>
            <td>#${flight.id}</td>
            <td>${escapeHTML(flight.name)}</td>
            <td>${escapeHTML(flight.destination)}</td>
            <td><span class="status-landed">Landed</span></td>
        </tr>
    `).join("");
}

function renderEvents() {
    const list = $("event-list");
    if (!list) return;

    if (events.length === 0) {
        list.innerHTML = "<li>Waiting for events...</li>";
        return;
    }

    list.innerHTML = events.slice(0, 12)
        .map(event => `<li>${escapeHTML(event)}</li>`)
        .join("");
}

function renderRadar() {
    const radar = $("radar-planes");
    if (!radar) return;

    const activeFlights = flights.filter(f => f.status === "Waiting");

    radar.innerHTML = activeFlights.map(flight => {
        const x = Number.isFinite(flight.x) ? flight.x : 50;
        const y = Number.isFinite(flight.y) ? flight.y : 50;

        return `
            <button
                type="button"
                class="radar-plane"
                data-flight-id="${flight.id}"
                aria-label="Select ${escapeHTML(flight.name)}"
                title="${escapeHTML(flight.name)}"
                style="left:${x}%; top:${y}%;">
                ✈
            </button>
        `;
    }).join("");

    if (selectedFlightId !== null) {
        const selected = activeFlights.find(
            f => f.id === selectedFlightId
        );

        if (!selected) {
            selectedFlightId = null;
            $("radar-selection").textContent =
                "Select an aircraft marker to view details.";
        }
    }
}

function renderAll() {
    renderStats();
    renderFlightTable();
    renderLandedTable();
    renderEvents();
    renderRadar();
}

function addFlight(event) {
    event.preventDefault();

    const nameInput = $("flight-name");
    const destinationInput = $("destination");
    const fuelInput = $("fuel");
    const message = $("message");

    const name = nameInput.value.trim();
    const destination = destinationInput.value.trim();
    const fuel = Number(fuelInput.value);

    if (!name || !destination) {
        message.textContent = "Please enter flight name and destination.";
        return;
    }

    if (fuelInput.value.trim() === "" ||
        !Number.isFinite(fuel) || fuel < 0 || fuel > 100) {
        message.textContent = "Fuel must be between 0 and 100%.";
        return;
    }

    const flight = {
        id: nextId++,
        name,
        destination,
        fuel,
        priority: calculatePriority(fuel),
        status: "Waiting",
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80
    };

    flights.push(flight);
    selectedFlightId = flight.id;

    saveData();
    renderAll();

    message.textContent =
        `${name} added successfully! Priority: ${flight.priority}`;

    addEvent(`Flight ${name} registered for ${destination}.`);

    $("radar-selection").textContent =
        `${flight.name} | Destination: ${flight.destination} | Fuel: ${flight.fuel}%`;

    event.target.reset();
    fuelInput.value = 65;
}

function processNextLanding() {
    const waitingFlights = flights
        .filter(f => f.status === "Waiting")
        .sort((a, b) =>
            a.priority - b.priority || a.id - b.id
        );

    if (waitingFlights.length === 0) {
        addEvent("No waiting flights available for landing.");
        return;
    }

    const flight = waitingFlights[0];

    flight.status = "Landed";
    flight.landedAt = Date.now();
    selectedFlightId = null;

    saveData();
    renderAll();

    $("radar-selection").textContent =
        `${flight.name} has landed at ${flight.destination}.`;

    addEvent(
        `${flight.name} landed successfully. Fuel: ${flight.fuel}%.`
    );
}

function selectRadarFlight(event) {
    const marker = event.target.closest("[data-flight-id]");
    if (!marker) return;

    selectedFlightId = Number(marker.dataset.flightId);

    const flight = flights.find(f => f.id === selectedFlightId);
    if (!flight) return;

    $("radar-selection").textContent =
        `${flight.name} | Destination: ${flight.destination} | Fuel: ${flight.fuel}% | Priority: ${flight.priority}`;
}

function moveAircraft() {
    flights.forEach(flight => {
        if (flight.status !== "Waiting") return;

        flight.x += (Math.random() - 0.5) * 2;
        flight.y += (Math.random() - 0.5) * 2;

        flight.x = Math.max(5, Math.min(95, flight.x));
        flight.y = Math.max(5, Math.min(95, flight.y));
    });

    renderRadar();
    saveData();
}

document.addEventListener("DOMContentLoaded", () => {
    initialiseFlights();

    $("flight-form").addEventListener("submit", addFlight);
    $("land-button").addEventListener("click", processNextLanding);
    $("radar-planes").addEventListener("click", selectRadarFlight);

    renderAll();
    addEvent("SkyControl is ready. Simulation flights loaded.");

    // Simulated aircraft movement
    setInterval(moveAircraft, 2500);
});
