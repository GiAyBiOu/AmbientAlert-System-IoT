# AmbientAlert-System-IoT

**Industrial Environmental Monitoring IoT System**

*Author: Gabriel Mendoza*  
*Date: December 2024*

## Overview

AmbientAlert is a complete IoT system for industrial environmental monitoring in smart food warehouses. The system monitors temperature and humidity in real-time, generating automatic alerts when temperature exceeds 37°C to prevent product deterioration and economic losses.

## Features

- **Real-time Monitoring**: Temperature and humidity sensing with DHT22
- **Automatic Alerts**: Visual, audio, and remote alerts at 37°C threshold
- **Remote Control**: Web dashboard for damper control and system management
- **Secure Communication**: mTLS certificates for ESP32, WSS for web clients
- **Multiple Dashboards**: Professional web interface + Node-RED visualization
- **Data Storage**: MongoDB database for historical data and analytics

## Quick Start

### 1. Hardware Setup (Wokwi Simulation)
- Open the Wokwi project link
- Components: ESP32, DHT22, Servo, LED, Buzzer, LCD, Buttons
- Upload the sketch.ino code
- Start simulation

### 2. Backend Services
```bash
# Install dependencies
npm install

# Start MongoDB (Docker)
docker run -d --name mongodb-ambient -p 27017:27017 mongo:latest

# Start Node.js server
npm start
```

### 3. Web Dashboard
- Open browser: `http://localhost:3000`
- Real-time charts and controls
- Remote damper control
- System monitoring

### 4. Node-RED Dashboard
```bash
# Install Node-RED
npm install -g node-red

# Start Node-RED
node-red

# Import flow: http://localhost:1880
# Import node-red-flow.json
# Access dashboard: http://localhost:1880/ui
```

## System Architecture

```
ESP32 (Wokwi) → MQTT Broker → Web Dashboard
                    ↓
              MongoDB Database
                    ↓
              Node-RED Dashboard
```

## Technologies Used

- **Hardware**: ESP32, DHT22, Servo Motor, LCD Display
- **Communication**: MQTT with mTLS/WSS security
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: HTML5, CSS3, JavaScript, Chart.js
- **Visualization**: Node-RED Dashboard
- **Security**: TLS encryption, data validation

## MQTT Topics

- `gm/ambientsystem/iot/sensors` - Sensor data
- `gm/ambientsystem/iot/control` - Remote commands
- `gm/ambientsystem/iot/status` - System status

## Remote Commands

- `OPEN_DAMPER` - Open ventilation damper
- `CLOSE_DAMPER` - Close damper
- `RESET_SYSTEM` - Reset entire system

## Project Structure

```
AmbientAlert-System-IoT/
├── src/
│   ├── server/           # Node.js backend
│   └── public/           # Web dashboard
├── node-red-flow.json    # Node-RED configuration
├── package.json          # Dependencies
└── README.md            # This file
```

## Requirements

- **Node.js** 18+
- **MongoDB** 6+ (Docker recommended)
- **Node-RED** 3+ (optional)
- **Modern Browser** (Chrome, Firefox, Safari)

## Security Features

- mTLS authentication for ESP32
- WebSocket Secure (WSS) for web clients
- Data validation and sanitization
- Rate limiting protection

## Support

For issues and questions, please refer to the complete technical documentation or contact the development team.

---

**Gabriel Mendoza** - IoT Systems Developer  
*Industrial Environmental Monitoring Specialist*