from flask import Flask, render_template, jsonify, request
import heapq
from datetime import datetime

app = Flask(__name__)

# ==========================================
# AIR TRAFFIC CONTROL - DAA PROJECT
# Priority Queue using Min-Heap
# ==========================================

flights = []
landed_flights = []
events = []

flight_counter = 100

# Ten sample flights for demonstration
DEMO_FLIGHTS = [
    {"name": "AI101", "destination": "Delhi", "fuel": 75},
    {"name": "6E202", "destination": "Mumbai", "fuel": 62},
    {"name": "UK303", "destination": "Chandigarh", "fuel": 12},
    {"name": "AI404", "destination": "Bengaluru", "fuel": 28},
    {"name": "6E505", "destination": "Hyderabad", "fuel": 80},
    {"name": "SG606", "destination": "Jaipur", "fuel": 45},
    {"name": "UK707", "destination": "Kolkata", "fuel": 9},
    {"name": "AI808", "destination": "Amritsar", "fuel": 55},
    {"name": "6E909", "destination": "Pune", "fuel": 33},
    {"name": "SG110", "destination": "Goa", "fuel": 68},
]


def log_event(message):
    """Store recent activity events."""
    events.insert(0, {
        "message": message,
        "time": datetime.now().strftime("%H:%M:%S")
    })
    del events[20:]


def calculate_priority(fuel):
    """
    Educational simulation:
    1 = emergency, 2 = high, 3 = normal.
    Lower number is processed first by the min-heap.
    """
    if fuel <= 15:
        return 1
    elif fuel <= 35:
        return 2
    return 3


def create_flight(name, destination, fuel):
    """Create a flight record with simulated details."""
    global flight_counter

    flight_counter += 1

    return {
        "id": f"SKY{flight_counter}",
        "name": name,
        "destination": destination,
        "fuel": fuel,
        "priority": calculate_priority(fuel),
        "status": "Waiting",
        "speed": 350 + (flight_counter % 100)
    }


def load_demo_flights():
    """Load sample flights only when the queue is empty."""
    if flights or landed_flights:
        return

    for item in DEMO_FLIGHTS:
        flight = create_flight(
            item["name"],
            item["destination"],
            item["fuel"]
        )

        heapq.heappush(
            flights,
            (flight["priority"], flight_counter, flight)
        )

        log_event(f"{flight['id']} added to the demo queue")


def get_waiting_flights():
    """Return waiting flights sorted by priority."""
    return [
        {
            "id": item[2]["id"],
            "name": item[2]["name"],
            "destination": item[2]["destination"],
            "fuel": item[2]["fuel"],
            "priority": item[2]["priority"],
            "status": item[2]["status"],
            "speed": item[2]["speed"]
        }
        for item in sorted(flights)
    ]


# ==========================================
# WEB PAGES
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")


# ==========================================
# API: GET ALL FLIGHT INFORMATION
# ==========================================

@app.route("/api/flights", methods=["GET"])
def get_flights():
    return jsonify({
        "flights": get_waiting_flights(),
        "landed": landed_flights,
        "events": events[:10],
        "total": len(flights) + len(landed_flights),
        "waiting": len(flights),
        "landed_count": len(landed_flights)
    })


# ==========================================
# API: REGISTER A NEW FLIGHT
# ==========================================

@app.route("/api/add-flight", methods=["POST"])
def add_flight():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Please send valid JSON data"}), 400

    name = str(data.get("name", "")).strip()
    destination = str(data.get("destination", "")).strip()

    if not name or not destination:
        return jsonify({
            "error": "Flight name and destination are required"
        }), 400

    if len(name) > 50 or len(destination) > 60:
        return jsonify({
            "error": "Flight name or destination is too long"
        }), 400

    try:
        fuel = int(data.get("fuel", 65))
    except (ValueError, TypeError):
        return jsonify({"error": "Fuel must be a whole number"}), 400

    if not 0 <= fuel <= 100:
        return jsonify({
            "error": "Fuel must be between 0 and 100"
        }), 400

    flight = create_flight(name, destination, fuel)

    heapq.heappush(
        flights,
        (flight["priority"], flight_counter, flight)
    )

    log_event(f"{flight['id']} added to the landing queue")

    return jsonify({
        "message": "Flight added successfully",
        "flight": flight
    }), 201


# ==========================================
# API: PROCESS NEXT LANDING
# ==========================================

@app.route("/api/land", methods=["POST"])
def land_flight():
    if not flights:
        return jsonify({
            "error": "No flights are waiting to land"
        }), 400

    priority, order, flight = heapq.heappop(flights)

    flight["status"] = "Landed"

    landed_flights.insert(0, flight)
    del landed_flights[20:]

    log_event(f"{flight['id']} landed in the simulation")

    return jsonify({
        "message": f"{flight['id']} landed successfully",
        "flight": flight
    })


# ==========================================
# API: SAMPLE FLIGHT
# ==========================================

@app.route("/api/flight", methods=["GET"])
def sample_flight():
    return jsonify({
        "flight_id": "SKY101",
        "destination": "Delhi",
        "speed": 420,
        "fuel": 65,
        "note": "Simulated sample data, not live aircraft data"
    })


# ==========================================
# START APPLICATION
# ==========================================

if __name__ == "__main__":
    load_demo_flights()
    log_event("Air Traffic Control simulation started")

    app.run(debug=True)
