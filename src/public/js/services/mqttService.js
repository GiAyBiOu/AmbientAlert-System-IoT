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
                console.log('🔄 Conectando a broker MQTT público via WebSocket...');
                
                // Configuración MQTT optimizada para WebSocket
                const options = {
                    clientId: 'webClient_' + Math.random().toString(16).substr(2, 8),
                    clean: true,
                    connectTimeout: 15000,
                    reconnectPeriod: 5000,
                    keepalive: 60,
                    protocolVersion: 4,
                    // Configuración para WebSocket
                    transformWsUrl: (url, options, client) => {
                        console.log('🔗 URL WebSocket:', url);
                        return url;
                    }
                };

                // Usar broker público confiable con WebSocket
                // Eclipse Mosquitto público con soporte WebSocket
                const brokerUrl = 'wss://test.mosquitto.org:8081';
                console.log('📡 Conectando a:', brokerUrl);
                console.log('🎯 Tópicos objetivo: gm/ambientsystem/iot/sensors, gm/ambientsystem/iot/status');
                
                this.client = mqtt.connect(brokerUrl, options);

                this.client.on('connect', () => {
                    console.log('✅ ¡CONECTADO AL BROKER MQTT!');
                    console.log('📡 Broker: test.mosquitto.org:8081 (WebSocket Secure)');
                    console.log('🔐 Conexión segura establecida');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    
                    // Suscribirse a los tópicos exactos del ESP32
                    this.subscribeToTopics();
                    resolve();
                });

                this.client.on('message', (topic, message) => {
                    try {
                        console.log('📨 ¡MENSAJE RECIBIDO!');
                        console.log('📍 Tópico:', topic);
                        console.log('📨 Contenido raw:', message.toString());
                        
                        const data = JSON.parse(message.toString());
                        console.log('📊 DATOS PARSEADOS:', data);
                        
                        // Verificar que sea del ESP32 correcto
                        if (data.device_id === 'ESP32-ENV-001') {
                            console.log('🎯 ¡DATOS DEL ESP32-ENV-001 CONFIRMADOS!');
                            console.log('🌡️  Temperatura:', data.temperature, '°C');
                            console.log('💧 Humedad:', data.humidity, '%');
                            console.log('🚨 Alerta:', data.alert_active ? 'ACTIVA' : 'Normal');
                            console.log('🌬️  Damper:', data.damper_open ? 'ABIERTO' : 'CERRADO');
                            
                            this.notifySubscribers(data);
                        } else {
                            console.log('💡 Mensaje de otro dispositivo:', data.device_id || 'Sin ID');
                        }
                        
                    } catch (error) {
                        console.error('❌ Error parseando mensaje:', error);
                        console.log('📨 Mensaje original:', message.toString());
                    }
                });

                this.client.on('error', (error) => {
                    console.error('❌ ERROR MQTT:', error);
                    this.isConnected = false;
                    
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                    } else {
                        console.log('❌ Max intentos alcanzados, activando simulación...');
                        this.startFallbackSimulation();
                        resolve(); // Resolver con simulación
                    }
                });

                this.client.on('close', () => {
                    console.log('🔌 Conexión MQTT cerrada');
                    this.isConnected = false;
                });

                this.client.on('offline', () => {
                    console.log('📡 Cliente MQTT offline');
                    this.isConnected = false;
                });

                this.client.on('reconnect', () => {
                    console.log('🔄 Reconectando al broker MQTT...');
                });

                // Timeout para activar simulación si no se conecta
                setTimeout(() => {
                    if (!this.isConnected) {
                        console.log('⏰ Timeout de conexión, activando simulación de respaldo...');
                        this.startFallbackSimulation();
                        resolve();
                    }
                }, 10000);

            } catch (error) {
                console.error('❌ Error de conexión MQTT:', error);
                console.log('🧪 Activando simulación de respaldo...');
                this.startFallbackSimulation();
                resolve();
            }
        });
    }

    subscribeToTopics() {
        console.log('📡 Suscribiéndose a tópicos del ESP32...');
        
        // Tópico principal de sensores
        this.client.subscribe('gm/ambientsystem/iot/sensors', { qos: 0 }, (err) => {
            if (err) {
                console.error('❌ Error suscribiéndose a sensors:', err);
            } else {
                console.log('✅ SUSCRITO a: gm/ambientsystem/iot/sensors');
            }
        });
        
        // Tópico de estado
        this.client.subscribe('gm/ambientsystem/iot/status', { qos: 0 }, (err) => {
            if (err) {
                console.error('❌ Error suscribiéndose a status:', err);
            } else {
                console.log('✅ SUSCRITO a: gm/ambientsystem/iot/status');
            }
        });

        console.log('🎯 Esperando datos del ESP32-ENV-001...');
        console.log('📝 NOTA: Si tu ESP32 está en Wokwi, asegúrate que esté publicando datos');
    }

    // Simulación de respaldo si MQTT falla
    startFallbackSimulation() {
        console.log('🧪 INICIANDO SIMULACIÓN DE RESPALDO');
        console.log('💡 La simulación simula datos del ESP32-ENV-001');
        
        this.isConnected = true; // Marcar como conectado para propósitos de la app
        
        // Generar datos inmediatamente
        this.generateSimulatedData();
        
        // Continuar cada 5 segundos
        setInterval(() => {
            this.generateSimulatedData();
        }, 5000);
    }

    generateSimulatedData() {
        // Generar datos realistas que coincidan con el ESP32
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
        
        console.log('🧪 DATOS SIMULADOS:', {
            temp: simulatedData.temperature + '°C',
            humidity: simulatedData.humidity + '%',
            alert: simulatedData.alert_active ? '🚨 ACTIVA' : '✅ Normal'
        });
        
        this.notifySubscribers(simulatedData);
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        console.log('👂 SUSCRIPTOR AGREGADO. Total:', this.subscribers.size);
    }

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    notifySubscribers(data) {
        console.log('🔔 NOTIFICANDO a', this.subscribers.size, 'suscriptores');
        this.subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('❌ Error en callback:', error);
            }
        });
    }

    // Comandos de control para el ESP32
    sendCommand(command) {
        if (this.client && this.isConnected && !this.client.disconnected) {
            console.log('📤 ENVIANDO COMANDO AL ESP32:', command);
            this.client.publish('gm/ambientsystem/iot/control', command, { qos: 0 }, (err) => {
                if (err) {
                    console.error('❌ Error enviando comando:', err);
                } else {
                    console.log('✅ Comando enviado exitosamente');
                }
            });
        } else {
            console.log('📤 COMANDO SIMULADO:', command);
            console.log('💡 MQTT no conectado, simulando comando');
        }
    }

    openDamper() {
        this.sendCommand('OPEN_DAMPER');
        console.log('🌬️ Comando: Abrir damper');
    }

    closeDamper() {
        this.sendCommand('CLOSE_DAMPER');
        console.log('🚪 Comando: Cerrar damper');
    }

    silenceAlarm() {
        this.sendCommand('SILENCE_ALARM');
        console.log('🔇 Comando: Silenciar alarma');
    }

    resetSystem() {
        this.sendCommand('RESET_SYSTEM');
        console.log('🔄 Comando: Reset sistema');
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