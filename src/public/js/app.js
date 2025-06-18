import { mqttService } from './services/mqttService.js';
import { dbService } from './services/dbService.js';
import { chartService } from './services/chartService.js';

class AmbientAlertApp {
    constructor() {
        this.lastDataReceived = null;
        this.charts = {};
        this.isConnected = false;
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando AmbientAlert System IoT Dashboard');
        
        try {
            // Inicializar servicios
            await this.initServices();
            
            // Configurar UI
            this.setupUI();
            
            // Configurar controles remotos
            this.setupRemoteControls();
            
            console.log('✅ Dashboard inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
            this.updateConnectionStatus('❌ Error de conexión', 'danger');
        }
    }

    async initServices() {
        // Conectar a MQTT
        this.updateConnectionStatus('🔄 Conectando a MQTT...', 'warning');
        await mqttService.connect();
        
        // Suscribirse a datos
        mqttService.subscribe((data) => {
            console.log('📨 Datos recibidos en app:', data);
            this.handleSensorData(data);
        });
        
        // Inicializar gráficos
        this.initCharts();
        
        this.isConnected = true;
        this.updateConnectionStatus('✅ Conectado al ESP32', 'success');
    }

    setupUI() {
        // Configurar elementos UI iniciales
        this.updateSystemStatus('⏳ Esperando datos del ESP32...', 'info');
        
        // Resetear valores
        document.getElementById('currentTemp').textContent = '--°C';
        document.getElementById('currentHum').textContent = '--%';
        document.getElementById('ledStatus').textContent = '--';
        document.getElementById('servoPosition').textContent = '--°';
        document.getElementById('damperStatus').textContent = '--';
        document.getElementById('threshold').textContent = '--°C';
    }

    setupRemoteControls() {
        console.log('🎮 Configurando controles remotos para ESP32...');
        
        // Botón Abrir Damper
        document.getElementById('openDamperBtn').addEventListener('click', () => {
            console.log('🎮 Usuario presiona: Abrir Damper');
            mqttService.openDamper();
            this.showCommandFeedback('🌬️ Comando "Abrir Damper" enviado al ESP32');
        });
        
        // Botón Cerrar Damper
        document.getElementById('closeDamperBtn').addEventListener('click', () => {
            console.log('🎮 Usuario presiona: Cerrar Damper');
            mqttService.closeDamper();
            this.showCommandFeedback('🚪 Comando "Cerrar Damper" enviado al ESP32');
        });
        
        // Botón Silenciar Alarma
        document.getElementById('silenceAlarmBtn').addEventListener('click', () => {
            console.log('🎮 Usuario presiona: Silenciar Alarma');
            mqttService.silenceAlarm();
            this.showCommandFeedback('🔇 Comando "Silenciar Alarma" enviado al ESP32');
        });
        
        // Botón Reset Sistema
        document.getElementById('resetSystemBtn').addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres resetear el sistema ESP32?')) {
                console.log('🎮 Usuario presiona: Reset Sistema');
                mqttService.resetSystem();
                this.showCommandFeedback('🔄 Comando "Reset Sistema" enviado al ESP32');
            }
        });
        
        console.log('✅ Controles remotos configurados');
    }

    showCommandFeedback(message) {
        // Mostrar feedback temporal del comando enviado
        const statusElement = document.getElementById('systemStatus');
        const originalContent = statusElement.innerHTML;
        
        statusElement.innerHTML = `<strong>${message}</strong>`;
        statusElement.className = 'alert alert-warning';
        
        // Restaurar después de 3 segundos
        setTimeout(() => {
            if (this.lastDataReceived) {
                this.updateSystemStatus();
            } else {
                statusElement.innerHTML = originalContent;
                statusElement.className = 'alert alert-info';
            }
        }, 3000);
    }

    initCharts() {
        console.log('📊 Inicializando gráficos...');
        
        try {
            // Gráfico de temperatura
            this.charts.temperature = chartService.createTemperatureChart('temperatureChart');
            
            // Gráfico de humedad
            this.charts.humidity = chartService.createHumidityChart('humidityChart');
            
            // Gráfico combinado
            this.charts.combined = chartService.createCombinedChart('combinedChart');
            
            console.log('✅ Gráficos inicializados');
            
        } catch (error) {
            console.error('❌ Error inicializando gráficos:', error);
        }
    }

    async handleSensorData(data) {
        console.log('📊 Procesando datos del ESP32-ENV-001:', data);
        
        this.lastDataReceived = data;
        
        try {
            // Actualizar valores actuales
            this.updateCurrentValues(data);
            
            // Actualizar estado del sistema
            this.updateSystemStatus(data);
            
            // Actualizar gráficos
            this.updateCharts(data);
            
            // Guardar en base de datos
            await this.saveToDatabase(data);
            
            console.log('✅ Datos procesados correctamente');
            
        } catch (error) {
            console.error('❌ Error procesando datos:', error);
        }
    }

    updateCurrentValues(data) {
        // Actualizar temperatura
        const tempElement = document.getElementById('currentTemp');
        tempElement.textContent = `${data.temperature.toFixed(1)}°C`;
        
        // Color según temperatura
        if (data.temperature > data.threshold) {
            tempElement.style.color = '#dc3545'; // Rojo
        } else if (data.temperature > data.threshold - 2) {
            tempElement.style.color = '#fd7e14'; // Naranja
        } else {
            tempElement.style.color = '#198754'; // Verde
        }
        
        // Actualizar humedad
        document.getElementById('currentHum').textContent = `${data.humidity.toFixed(1)}%`;
        
        // Actualizar estados técnicos
        document.getElementById('ledStatus').textContent = data.led_status;
        document.getElementById('ledStatus').className = `badge ${data.led_status === 'ON' ? 'bg-warning' : 'bg-secondary'}`;
        
        document.getElementById('servoPosition').textContent = `${data.servo_position}°`;
        document.getElementById('servoPosition').className = `badge ${data.servo_position > 0 ? 'bg-info' : 'bg-secondary'}`;
        
        document.getElementById('damperStatus').textContent = data.damper_open ? 'ABIERTO' : 'CERRADO';
        document.getElementById('damperStatus').className = `badge ${data.damper_open ? 'bg-success' : 'bg-secondary'}`;
        
        document.getElementById('threshold').textContent = `${data.threshold}°C`;
    }

    updateSystemStatus(data = null) {
        const statusElement = document.getElementById('systemStatus');
        
        if (!data) {
            statusElement.innerHTML = '⏳ Esperando datos del ESP32...';
            statusElement.className = 'alert alert-info';
            return;
        }
        
        let statusText = '';
        let alertClass = 'alert-success';
        
        if (data.alert_active) {
            statusText = `🚨 ALERTA ACTIVA - Temperatura: ${data.temperature.toFixed(1)}°C > ${data.threshold}°C`;
            alertClass = 'alert-danger';
        } else if (data.manual_damper_active) {
            statusText = `🔧 Modo Manual Activo - Damper controlado manualmente`;
            alertClass = 'alert-warning';
        } else if (data.temperature > data.threshold - 3) {
            statusText = `⚠️ Temperatura elevada: ${data.temperature.toFixed(1)}°C (Umbral: ${data.threshold}°C)`;
            alertClass = 'alert-warning';
        } else {
            statusText = `✅ Sistema Normal - Temperatura: ${data.temperature.toFixed(1)}°C`;
            alertClass = 'alert-success';
        }
        
        statusElement.innerHTML = statusText;
        statusElement.className = `alert ${alertClass}`;
    }

    updateCharts(data) {
        const timestamp = new Date();
        
        try {
            // Actualizar gráfico de temperatura
            if (this.charts.temperature) {
                chartService.addDataPoint(this.charts.temperature, timestamp, data.temperature);
            }
            
            // Actualizar gráfico de humedad
            if (this.charts.humidity) {
                chartService.addDataPoint(this.charts.humidity, timestamp, data.humidity);
            }
            
            // Actualizar gráfico combinado
            if (this.charts.combined) {
                chartService.addCombinedDataPoint(this.charts.combined, timestamp, data.temperature, data.humidity);
            }
            
        } catch (error) {
            console.error('❌ Error actualizando gráficos:', error);
        }
    }

    async saveToDatabase(data) {
        try {
            const response = await dbService.saveSensorData({
                device_id: data.device_id,
                timestamp: new Date().toISOString(),
                temperature: data.temperature,
                humidity: data.humidity,
                alert_active: data.alert_active,
                damper_open: data.damper_open,
                manual_damper_active: data.manual_damper_active,
                threshold: data.threshold,
                led_status: data.led_status,
                servo_position: data.servo_position
            });
            
            console.log('💾 Datos guardados en BD:', response);
            
        } catch (error) {
            console.error('❌ Error guardando en BD:', error);
        }
    }

    updateConnectionStatus(message, type = 'secondary') {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = message;
        statusElement.className = `badge bg-${type}`;
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM cargado, iniciando aplicación...');
    new AmbientAlertApp();
});

// Manejar errores globales
window.addEventListener('error', (error) => {
    console.error('❌ Error global:', error);
});

export default AmbientAlertApp; 