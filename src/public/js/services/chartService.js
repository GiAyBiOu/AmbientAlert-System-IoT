class ChartService {
    constructor() {
        this.tempChart = null;
        this.humidityChart = null;
        this.maxDataPoints = 50;
    }

    initializeCharts() {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 5
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        };

        this.tempChart = new Chart('temperatureChart', {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Temperature (°C)',
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    data: []
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        suggestedMax: 50
                    }
                }
            }
        });

        this.humidityChart = new Chart('humidityChart', {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Humidity (%)',
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    data: []
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: {
                        ...commonOptions.scales.y,
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    updateCharts(data) {
        const timestamp = new Date().toLocaleTimeString();
        
        // Update temperature chart
        const tempChart = this.tempChart;
        tempChart.data.labels.push(timestamp);
        tempChart.data.datasets[0].data.push(data.temperature);
        
        if (tempChart.data.labels.length > this.maxDataPoints) {
            tempChart.data.labels.shift();
            tempChart.data.datasets[0].data.shift();
        }
        tempChart.update('none');

        // Update humidity chart
        const humidityChart = this.humidityChart;
        humidityChart.data.labels.push(timestamp);
        humidityChart.data.datasets[0].data.push(data.humidity);
        
        if (humidityChart.data.labels.length > this.maxDataPoints) {
            humidityChart.data.labels.shift();
            humidityChart.data.datasets[0].data.shift();
        }
        humidityChart.update('none');
    }

    loadHistoricalData(data) {
        // Clear existing data
        this.tempChart.data.labels = [];
        this.tempChart.data.datasets[0].data = [];
        this.humidityChart.data.labels = [];
        this.humidityChart.data.datasets[0].data = [];

        // Load historical data
        data.forEach(record => {
            const timestamp = new Date(record.timestamp).toLocaleTimeString();
            this.tempChart.data.labels.push(timestamp);
            this.tempChart.data.datasets[0].data.push(record.temperature);
            this.humidityChart.data.labels.push(timestamp);
            this.humidityChart.data.datasets[0].data.push(record.humidity);
        });

        this.tempChart.update();
        this.humidityChart.update();
    }
}

export const chartService = new ChartService(); 