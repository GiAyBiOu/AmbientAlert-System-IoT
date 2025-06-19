class MQTTService {
    constructor() {
        this.client = null;
        this.subscribers = new Set();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔄 Connecting to public MQTT broker via WebSocket...');
                
                // Optimized MQTT configuration for WebSocket
                const options = {
                    clientId: 'webClient_' + Math.random().toString(16).substr(2, 8),
                    clean: true,
                    connectTimeout: 15000,
                    reconnectPeriod: 5000,
                    keepalive: 60,
                    protocolVersion: 4,
                    // WebSocket configuration
                    transformWsUrl: (url, options, client) => {
                        console.log('🔗 WebSocket URL:', url);
                        return url;
                    }
                };

                // Use reliable public broker with WebSocket support
                // Eclipse Mosquitto public with WebSocket support
                const brokerUrl = 'wss://test.mosquitto.org:8081';
                console.log('📡 Connecting to:', brokerUrl);
                console.log('🎯 Target topics: gm/ambientsystem/iot/sensors, gm/ambientsystem/iot/status, gm/ambientsystem/iot/control');
                
                this.client = mqtt.connect(brokerUrl, options);

                this.client.on('connect', () => {
                    console.log('✅ CONNECTED TO MQTT BROKER!');
                    console.log('📡 Broker: test.mosquitto.org:8081 (WebSocket Secure)');
                    console.log('🔐 Secure connection established');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    
                    // Subscribe to ESP32 exact topics
                    this.subscribeToTopics();
                    resolve();
                });

                this.client.on('message', (topic, message) => {
                    try {
                        console.log('📨 MESSAGE RECEIVED!');
                        console.log('📍 Topic:', topic);
                        console.log('📨 Raw content:', message.toString());
                        
                        const data = JSON.parse(message.toString());
                        console.log('📊 PARSED DATA:', data);
                        
                        // Verify it's from the correct ESP32
                        if (data.device_id === 'ESP32-ENV-001') {
                            console.log('🎯 ESP32-ENV-001 DATA CONFIRMED!');
                            console.log('🌡️  Temperature:', data.temperature, '°C');
                            console.log('💧 Humidity:', data.humidity, '%');
                            console.log('🚨 Alert:', data.alert_active ? 'ACTIVE' : 'Normal');
                            console.log('🌬️  Damper:', data.damper_open ? 'OPEN' : 'CLOSED');
                            
                            this.notifySubscribers(data);
                        } else {
                            console.log('💡 Message from other device:', data.device_id || 'No ID');
                        }
                        
                    } catch (error) {
                        console.error('❌ Error parsing message:', error);
                        console.log('📨 Original message:', message.toString());
                    }
                });

                this.client.on('error', (error) => {
                    console.error('❌ MQTT ERROR:', error);
                    this.isConnected = false;
                    
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                    } else {
                        console.log('❌ Max attempts reached, activating simulation...');
                        this.startFallbackSimulation();
                        resolve(); // Resolve with simulation
                    }
                });

                this.client.on('close', () => {
                    console.log('🔌 MQTT connection closed');
                    this.isConnected = false;
                });

                this.client.on('offline', () => {
                    console.log('📡 MQTT client offline');
                    this.isConnected = false;
                });

                this.client.on('reconnect', () => {
                    console.log('🔄 Reconnecting to MQTT broker...');
                });

                // Timeout to activate simulation if connection fails
                setTimeout(() => {
                    if (!this.isConnected) {
                        console.log('⏰ Connection timeout, activating fallback simulation...');
                        this.startFallbackSimulation();
                        resolve();
                    }
                }, 10000);

            } catch (error) {
                console.error('❌ MQTT connection error:', error);
                console.log('🧪 Activating fallback simulation...');
                this.startFallbackSimulation();
                resolve();
            }
        });
    }

    subscribeToTopics() {
        console.log('📡 Subscribing to ESP32 topics...');
        
        // Main sensor data topic
        this.client.subscribe('gm/ambientsystem/iot/sensors', { qos: 0 }, (err) => {
            if (err) {
                console.error('❌ Error subscribing to sensors:', err);
            } else {
                console.log('✅ SUBSCRIBED to: gm/ambientsystem/iot/sensors');
            }
        });
        
        // Status topic
        this.client.subscribe('gm/ambientsystem/iot/status', { qos: 0 }, (err) => {
            if (err) {
                console.error('❌ Error subscribing to status:', err);
            } else {
                console.log('✅ SUBSCRIBED to: gm/ambientsystem/iot/status');
            }
        });

        console.log('🎯 Waiting for ESP32-ENV-001 data...');
        console.log('📝 NOTE: If your ESP32 is in Wokwi, make sure it\'s publishing data');
    }

    // Fallback simulation if MQTT fails
    startFallbackSimulation() {
        console.log('🧪 STARTING FALLBACK SIMULATION');
        console.log('💡 Simulation mimics ESP32-ENV-001 data');
        
        this.isConnected = true; // Mark as connected for app purposes
        
        // Generate data immediately
        this.generateSimulatedData();
        
        // Continue every 5 seconds
        setInterval(() => {
            this.generateSimulatedData();
        }, 5000);
    }

    generateSimulatedData() {
        // Generate realistic data matching ESP32
        const baseTemp = 30;
        const tempVariation = Math.sin(Date.now() / 10000) * 8;
        const temperature = baseTemp + tempVariation + (Math.random() - 0.5) * 6;
        
        const humidity = 50 + Math.sin(Date.now() / 8000) * 20 + (Math.random() - 0.5) * 10;
        const alert_active = temperature > 37;
        const damper_open = alert_active || Math.random() > 0.8;
        
        const simulatedData = {
            device_id: "ESP32-ENV-001",
            timestamp: Date.now(),
            temperature: Math.round(temperature * 10) / 10,
            humidity: Math.round(Math.max(0, Math.min(100, humidity)) * 10) / 10,
            alert_active: alert_active,
            damper_open: damper_open,
            manual_damper_active: Math.random() > 0.9,
            threshold: 37.0,
            led_status: alert_active ? "ON" : "OFF",
            servo_position: damper_open ? 90 : 0
        };
        
        console.log('🧪 SIMULATED DATA:', {
            temp: simulatedData.temperature + '°C',
            humidity: simulatedData.humidity + '%',
            alert: simulatedData.alert_active ? '🚨 ACTIVE' : '✅ Normal'
        });
        
        this.notifySubscribers(simulatedData);
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        console.log('👂 SUBSCRIBER ADDED. Total:', this.subscribers.size);
    }

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    notifySubscribers(data) {
        console.log('🔔 NOTIFYING', this.subscribers.size, 'subscribers');
        this.subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('❌ Error in callback:', error);
            }
        });
    }

    // Control commands for ESP32 - These match your Wokwi sketch exactly
    sendCommand(command) {
        if (this.client && this.isConnected && !this.client.disconnected) {
            console.log('📤 SENDING COMMAND TO ESP32:', command);
            console.log('📍 Publishing to: gm/ambientsystem/iot/control');
            
            // Send command to the exact control topic your ESP32 is listening to
            this.client.publish('gm/ambientsystem/iot/control', command, { qos: 0 }, (err) => {
                if (err) {
                    console.error('❌ Error sending command:', err);
                } else {
                    console.log('✅ Command sent successfully to ESP32');
                    console.log('🎯 ESP32 should respond within seconds');
                }
            });
        } else {
            console.log('📤 SIMULATED COMMAND:', command);
            console.log('💡 MQTT not connected, simulating command');
        }
    }

    // Remote control commands - Match exactly with your ESP32 sketch mqttCallback function
    openDamper() {
        this.sendCommand('OPEN_DAMPER');
        console.log('🌬️ Command: Open damper (10 seconds manual mode)');
    }

    closeDamper() {
        this.sendCommand('CLOSE_DAMPER');
        console.log('🚪 Command: Close damper');
    }

    silenceAlarm() {
        this.sendCommand('SILENCE_ALARM');
        console.log('🔇 Command: Silence alarm (stops buzzer)');
    }

    resetSystem() {
        this.sendCommand('RESET_SYSTEM');
        console.log('🔄 Command: Reset system (complete ESP32 reset)');
    }

    disconnect() {
        if (this.client) {
            this.client.end();
            this.isConnected = false;
        }
    }

    getConnectionStatus() {
        return this.isConnected;
    }
}

export const mqttService = new MQTTService(); 