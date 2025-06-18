class DBService {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api'; // We'll create this API endpoint later
    }

    async saveSensorData(data) {
        try {
            const response = await fetch(`${this.apiUrl}/sensor-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving sensor data:', error);
            throw error;
        }
    }

    async getHistoricalData(hours = 24) {
        try {
            const response = await fetch(`${this.apiUrl}/sensor-data?hours=${hours}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching historical data:', error);
            throw error;
        }
    }
}

export const dbService = new DBService(); 