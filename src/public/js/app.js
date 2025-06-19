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
        console.log('🚀 Starting AmbientAlert System IoT Dashboard');
        
        try {
            // Initialize services
            await this.initServices();
            
            // Setup UI
            this.setupUI();
            
            // Setup remote controls
            this.setupRemoteControls();
            
            console.log('✅ Dashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing application:', error);
            this.updateConnectionStatus('❌ Connection error', 'danger');
        }
    }

    async initServices() {
        // Connect to MQTT
        this.updateConnectionStatus('🔄 Connecting to MQTT...', 'warning');
        await mqttService.connect();
        
        // Subscribe to data
        mqttService.subscribe((data) => {
            console.log('📨 Data received in app:', data);
            this.handleSensorData(data);
        });
        
        // Initialize charts
        this.initCharts();
        
        this.isConnected = true;
        this.updateConnectionStatus('✅ Connected to ESP32', 'success');
    }

    setupUI() {
        // Setup initial UI elements
        this.updateSystemStatus(); // Call without parameters initially
        
        // Reset values
        document.getElementById('currentTemp').textContent = '--°C';
        document.getElementById('currentHum').textContent = '--%';
        document.getElementById('ledStatus').textContent = '--';
        document.getElementById('servoPosition').textContent = '--°';
        document.getElementById('damperStatus').textContent = '--';
        document.getElementById('threshold').textContent = '--°C';
    }

    setupRemoteControls() {
        console.log('🎮 Setting up remote controls for ESP32...');
        
        // Open Damper Button
        document.getElementById('openDamperBtn').addEventListener('click', () => {
            console.log('🎮 User pressed: Open Damper');
            mqttService.openDamper();
            this.showCommandFeedback('🌬️ "Open Damper" command sent to ESP32');
        });
        
        // Close Damper Button
        document.getElementById('closeDamperBtn').addEventListener('click', () => {
            console.log('🎮 User pressed: Close Damper');
            mqttService.closeDamper();
            this.showCommandFeedback('🚪 "Close Damper" command sent to ESP32');
        });
        
        // Reset System Button
        document.getElementById('resetSystemBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the ESP32 system?')) {
                console.log('🎮 User pressed: Reset System');
                mqttService.resetSystem();
                this.showCommandFeedback('🔄 "Reset System" command sent to ESP32');
            }
        });
        
        console.log('✅ Remote controls configured');
    }

    showCommandFeedback(message) {
        // Show temporary feedback for sent command
        const statusElement = document.getElementById('systemStatus');
        const originalContent = statusElement.innerHTML;
        
        statusElement.innerHTML = `<strong>${message}</strong>`;
        statusElement.className = 'alert alert-warning';
        
        // Restore after 3 seconds
        setTimeout(() => {
            if (this.lastDataReceived) {
                this.updateSystemStatus(this.lastDataReceived);
            } else {
                statusElement.innerHTML = originalContent;
                statusElement.className = 'alert alert-info';
            }
        }, 3000);
    }

    initCharts() {
        console.log('📊 Initializing charts...');
        
        try {
            // Temperature chart
            this.charts.temperature = chartService.createTemperatureChart('temperatureChart');
            
            // Humidity chart
            this.charts.humidity = chartService.createHumidityChart('humidityChart');
            
            // Combined chart
            this.charts.combined = chartService.createCombinedChart('combinedChart');
            
            console.log('✅ Charts initialized');
            
        } catch (error) {
            console.error('❌ Error initializing charts:', error);
        }
    }

    async handleSensorData(data) {
        console.log('📊 Processing data from ESP32-ENV-001:', data);
        
        this.lastDataReceived = data;
        
        try {
            // Update current values
            this.updateCurrentValues(data);
            
            // Update system status
            this.updateSystemStatus(data);
            
            // Update charts
            this.updateCharts(data);
            
            // Save to database
            await this.saveToDatabase(data);
            
            console.log('✅ Data processed successfully');
            
        } catch (error) {
            console.error('❌ Error processing data:', error);
        }
    }

    updateCurrentValues(data) {
        // Update temperature with null check
        const tempElement = document.getElementById('currentTemp');
        if (data && typeof data.temperature === 'number') {
            tempElement.textContent = `${data.temperature.toFixed(1)}°C`;
            
            // Color based on temperature
            if (data.temperature > data.threshold) {
                tempElement.style.color = '#dc3545'; // Red
            } else if (data.temperature > data.threshold - 2) {
                tempElement.style.color = '#fd7e14'; // Orange
            } else {
                tempElement.style.color = '#198754'; // Green
            }
        } else {
            tempElement.textContent = '--°C';
            tempElement.style.color = '';
        }
        
        // Update humidity with null check
        if (data && typeof data.humidity === 'number') {
            document.getElementById('currentHum').textContent = `${data.humidity.toFixed(1)}%`;
        } else {
            document.getElementById('currentHum').textContent = '--%';
        }
        
        // Update technical states with null checks
        if (data) {
            document.getElementById('ledStatus').textContent = data.led_status || '--';
            document.getElementById('ledStatus').className = `badge ${data.led_status === 'ON' ? 'bg-warning' : 'bg-secondary'}`;
            
            document.getElementById('servoPosition').textContent = `${data.servo_position || '--'}°`;
            document.getElementById('servoPosition').className = `badge ${data.servo_position > 0 ? 'bg-info' : 'bg-secondary'}`;
            
            document.getElementById('damperStatus').textContent = data.damper_open ? 'OPEN' : 'CLOSED';
            document.getElementById('damperStatus').className = `badge ${data.damper_open ? 'bg-success' : 'bg-secondary'}`;
            
            document.getElementById('threshold').textContent = `${data.threshold || '--'}°C`;
        }
    }

    updateSystemStatus(data = null) {
        const statusElement = document.getElementById('systemStatus');
        
        if (!data) {
            statusElement.innerHTML = '⏳ Waiting for ESP32 data...';
            statusElement.className = 'alert alert-info';
            return;
        }
        
        let statusText = '';
        let alertClass = 'alert-success';
        
        // Add null checks before using toFixed()
        if (data.alert_active) {
            const tempStr = (typeof data.temperature === 'number') ? data.temperature.toFixed(1) : '--';
            const thresholdStr = (typeof data.threshold === 'number') ? data.threshold.toFixed(1) : '--';
            statusText = `🚨 ALERT ACTIVE - Temperature: ${tempStr}°C > ${thresholdStr}°C`;
            alertClass = 'alert-danger';
        } else if (data.manual_damper_active) {
            statusText = `🔧 Manual Mode Active - Damper manually controlled`;
            alertClass = 'alert-warning';
        } else if (typeof data.temperature === 'number' && typeof data.threshold === 'number' && data.temperature > data.threshold - 3) {
            statusText = `⚠️ Elevated temperature: ${data.temperature.toFixed(1)}°C (Threshold: ${data.threshold}°C)`;
            alertClass = 'alert-warning';
        } else {
            const tempStr = (typeof data.temperature === 'number') ? data.temperature.toFixed(1) : '--';
            statusText = `✅ System Normal - Temperature: ${tempStr}°C`;
            alertClass = 'alert-success';
        }
        
        statusElement.innerHTML = statusText;
        statusElement.className = `alert ${alertClass}`;
    }

    updateCharts(data) {
        const timestamp = new Date();
        
        try {
            // Update temperature chart
            if (this.charts.temperature && typeof data.temperature === 'number') {
                chartService.addDataPoint(this.charts.temperature, timestamp, data.temperature);
            }
            
            // Update humidity chart
            if (this.charts.humidity && typeof data.humidity === 'number') {
                chartService.addDataPoint(this.charts.humidity, timestamp, data.humidity);
            }
            
            // Update combined chart
            if (this.charts.combined && typeof data.temperature === 'number' && typeof data.humidity === 'number') {
                chartService.addCombinedDataPoint(this.charts.combined, timestamp, data.temperature, data.humidity);
            }
            
        } catch (error) {
            console.error('❌ Error updating charts:', error);
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
            
            console.log('💾 Data saved to DB:', response);
            
        } catch (error) {
            console.error('❌ Error saving to DB:', error);
        }
    }

    updateConnectionStatus(message, type = 'secondary') {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = message;
        statusElement.className = `badge bg-${type}`;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM loaded, starting application...');
    new AmbientAlertApp();
});

// Handle global errors
window.addEventListener('error', (error) => {
    console.error('❌ Global error:', error);
});

export default AmbientAlertApp; 