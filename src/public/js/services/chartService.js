class ChartService {
    constructor() {
        this.tempChart = null;
        this.humidityChart = null;
        this.combinedChart = null;
        this.maxDataPoints = 50;
    }

    createTemperatureChart(canvasId) {
        console.log('📊 Creando gráfico de temperatura...');
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.tempChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Temperatura (°C)',
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    data: [],
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        beginAtZero: false,
                        suggestedMin: 10,
                        suggestedMax: 50
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de temperatura creado');
        return this.tempChart;
    }

    createHumidityChart(canvasId) {
        console.log('📊 Creando gráfico de humedad...');
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.humidityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Humedad (%)',
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    data: [],
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de humedad creado');
        return this.humidityChart;
    }

    createCombinedChart(canvasId) {
        console.log('📊 Creando gráfico combinado...');
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.combinedChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Temperatura (°C)',
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        data: [],
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Humedad (%)',
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        data: [],
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: false,
                        suggestedMin: 10,
                        suggestedMax: 50,
                        title: {
                            display: true,
                            text: 'Temperatura (°C)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Humedad (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
        
        console.log('✅ Gráfico combinado creado');
        return this.combinedChart;
    }

    addDataPoint(chart, timestamp, value) {
        if (!chart) return;
        
        const timeLabel = timestamp.toLocaleTimeString();
        
        chart.data.labels.push(timeLabel);
        chart.data.datasets[0].data.push(value);
        
        // Limitar cantidad de puntos
        if (chart.data.labels.length > this.maxDataPoints) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        
        chart.update('none');
    }

    addCombinedDataPoint(chart, timestamp, temperature, humidity) {
        if (!chart) return;
        
        const timeLabel = timestamp.toLocaleTimeString();
        
        chart.data.labels.push(timeLabel);
        chart.data.datasets[0].data.push(temperature); // Temperatura
        chart.data.datasets[1].data.push(humidity);    // Humedad
        
        // Limitar cantidad de puntos
        if (chart.data.labels.length > this.maxDataPoints) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
        }
        
        chart.update('none');
    }

    // Método legacy para compatibilidad
    initializeCharts() {
        console.log('⚠️ Método initializeCharts() está deprecado. Usar createXXXChart()');
    }

    // Método legacy para compatibilidad
    updateCharts(data) {
        console.log('⚠️ Método updateCharts() está deprecado. Usar addDataPoint()');
        const timestamp = new Date();
        
        if (this.tempChart) {
            this.addDataPoint(this.tempChart, timestamp, data.temperature);
        }
        
        if (this.humidityChart) {
            this.addDataPoint(this.humidityChart, timestamp, data.humidity);
        }
        
        if (this.combinedChart) {
            this.addCombinedDataPoint(this.combinedChart, timestamp, data.temperature, data.humidity);
        }
    }

    loadHistoricalData(data) {
        console.log('📊 Cargando datos históricos...');
        
        // Limpiar datos existentes
        if (this.tempChart) {
            this.tempChart.data.labels = [];
            this.tempChart.data.datasets[0].data = [];
        }
        
        if (this.humidityChart) {
            this.humidityChart.data.labels = [];
            this.humidityChart.data.datasets[0].data = [];
        }
        
        if (this.combinedChart) {
            this.combinedChart.data.labels = [];
            this.combinedChart.data.datasets[0].data = [];
            this.combinedChart.data.datasets[1].data = [];
        }

        // Cargar datos históricos
        data.forEach(record => {
            const timestamp = new Date(record.timestamp);
            
            if (this.tempChart) {
                this.addDataPoint(this.tempChart, timestamp, record.temperature);
            }
            
            if (this.humidityChart) {
                this.addDataPoint(this.humidityChart, timestamp, record.humidity);
            }
            
            if (this.combinedChart) {
                this.addCombinedDataPoint(this.combinedChart, timestamp, record.temperature, record.humidity);
            }
        });

        // Actualizar gráficos
        if (this.tempChart) this.tempChart.update();
        if (this.humidityChart) this.humidityChart.update();
        if (this.combinedChart) this.combinedChart.update();
        
        console.log('✅ Datos históricos cargados');
    }
}

export const chartService = new ChartService(); 