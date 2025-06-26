# Car Tracking Web Application

This Node.js application simulates real-time car tracking and publishes location updates to a message broker using either the **STOMP** or **MQTT** protocol.

## 🚀 Features

- Simulates multiple cars with dynamic positions
- Publishes real-time updates over **STOMP** or **MQTT**
- Broker selected dynamically via command line argument
- Structured GeoJSON-like messaging format
- Compatible with **Catalog Explorer** and similar tools

---

## 🛠 Installation

```bash
git clone https://github.com/felipecarrillo100/cartracking.git
cd cartracking
npm install
```

---

## ▶️ Running the Simulation

### STOMP (default):
```bash
node index.js
```

### MQTT:
```bash
node index.js mqtt
```

The broker is instantiated only when selected to minimize memory usage.

---

## ⚙️ Broker Configuration

Defined inside `index.js`:

### STOMP (default):
- Host: `localhost`
- Port: `61613`
- Username: `admin`
- Password: `admin`
- Topic separator: `"."`

### MQTT:
- Host: `localhost`
- Port: `1883`
- Username: `admin`
- Password: `admin`

---

## 📡 Message Topics

### 1. Car Data (`/data` path)

Car positions are sent to:

```
/topic/producers/<serviceName>/data/<company>/<carId>
```

**Example (STOMP):**
```
/topic/producers/cartracking/data/acme/car-1234
```

**MQTT Equivalent:**
```
producers/cartracking/data/acme/car-1234
```

#### ✅ Message Format
```json
{
  "action": "PUT",
  "geometry": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "id": "car-1234",
  "properties": {
    "carId": "car-1234",
    "company": "acme",
    "speed": 35.5,
    "direction": 90,
    "timestamp": 1672531200
  }
}
```

**Catalog Explorer Live Tracks format:**
```json
{
  "action": "...",           // ADD, PUT, DELETE, PATCH
  "geometry": {...},         // GeoJSON Point
  "id": "...",               // Unique vehicle ID
  "properties": {...}        // Any app-specific metadata
}
```

#### Topic Patterns
- `/topic/producers/cars.data.avis.*`
- `/topic/producers/cars.data.*.39`

---

### 2. Control Commands (`/control` path)

Use to clear all vehicle tracks from clients:

```
/topic/producers/<serviceName>/control/
```

**Example:**
```
/topic/producers/cartracking/control/
```

#### 🧹 Clear Command Format
```json
{
  "action": "CLEAR",
  "context": "CLEAR"
}
```

---

## 🔁 STOMP & MQTT Interoperability

> **NOTE:** Catalog Explorer uses STOMP, not MQTT. If you're using **ActiveMQ**, you can enable both protocols and let the broker handle translation.

Example:
- MQTT: `producers/cartracking/data/acme/car-1234`
- STOMP: `/topic/producers/cartracking/data/acme/car-1234`

ActiveMQ automatically maps the MQTT topic to the STOMP topic.

---

## 🧾 License

MIT License

---

## 🚀 Run in Production

We recommend using `pm2` to keep the service alive:

```bash
pm2 start index.js --name cartracking --exp-backoff-restart-delay=100
```
