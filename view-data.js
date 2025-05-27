// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAtiYuv5EUfaqpTu-lmqqnzhHYJGGvgRMw",
    authDomain: "smartinspectionsys.firebaseapp.com",
    projectId: "smartinspectionsys",
    storageBucket: "smartinspectionsys.firebasestorage.app",
    messagingSenderId: "843325529220",
    appId: "1:843325529220:web:ee41431b4766bd69a136d1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const inspectionsTable = document.getElementById('inspections-table').getElementsByTagName('tbody')[0];
const loadingIndicator = document.getElementById('loading-indicator');
const backBtn = document.getElementById('back-btn');
const exportCsvBtn = document.getElementById('export-csv');
const dateFilter = document.getElementById('date-filter');
const customDateRange = document.getElementById('custom-date-range');
const startDate = document.getElementById('start-date');
const endDate = document.getElementById('end-date');
const applyFiltersBtn = document.getElementById('apply-filters');
const inspectionDetails = document.getElementById('inspection-details');
const closeDetailsBtn = document.getElementById('close-details');
const showGraphBtn = document.getElementById('show-graph');
const transformerInfo = document.getElementById('transformer-info');
const inspectionInfo = document.getElementById('inspection-info');
const resultsTable = document.getElementById('results-table').getElementsByTagName('tbody')[0];
const graphModal = document.getElementById('graph-modal');
const closeModalBtn = document.querySelector('.close-modal');
const currentChartCanvas = document.getElementById('current-chart');
const graphRemarks = document.getElementById('graph-remarks');
const printGraphBtn = document.getElementById('print-graph');
const exportGraphBtn = document.getElementById('export-graph');

// Global variables
let inspectionsData = [];
let currentChart = null;
let currentInspection = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    fetchInspections();
    setupEventListeners();
});

function setupEventListeners() {
    dateFilter.addEventListener('change', toggleCustomDateRange);
    applyFiltersBtn.addEventListener('click', applyFilters);
    backBtn.addEventListener('click', () => window.location.href = 'dashboard.html');
    exportCsvBtn.addEventListener('click', exportToCsv);
    closeDetailsBtn.addEventListener('click', () => inspectionDetails.style.display = 'none');
    showGraphBtn.addEventListener('click', showGraphModal);
    closeModalBtn.addEventListener('click', () => graphModal.style.display = 'none');
    printGraphBtn.addEventListener('click', printGraph);
    exportGraphBtn.addEventListener('click', exportGraphAsImage);
    
    window.addEventListener('click', (event) => {
        if (event.target === graphModal) {
            graphModal.style.display = 'none';
        }
    });
}

function toggleCustomDateRange() {
    customDateRange.style.display = dateFilter.value === 'custom' ? 'flex' : 'none';
}

function fetchInspections(filters = {}) {
    loadingIndicator.style.display = 'flex';
    inspectionsTable.innerHTML = '';
    inspectionsData = [];
    
    let query = db.collection('transformerInspections')
        .orderBy('inspectionDetails.date', 'desc');  // Changed from timestamp to date
    
    if (filters.dateFilter) {
        const dateRange = getDateRange(filters.dateFilter, filters.startDate, filters.endDate);
        if (dateRange.start) {
            query = query.where('inspectionDetails.date', '>=', dateRange.start);
        }
        if (dateRange.end) {
            query = query.where('inspectionDetails.date', '<=', dateRange.end);
        }
    }
    
    query.get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                showNoDataMessage();
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                inspectionsData.push({ id: doc.id, ...data });
                addInspectionToTable(doc.id, data);
            });
            
            loadingIndicator.style.display = 'none';
        })
        .catch((error) => {
            console.error("Error getting inspections: ", error);
            showErrorMessage();
        });
}

function showNoDataMessage() {
    inspectionsTable.innerHTML = '<tr><td colspan="5" style="text-align: center;">No inspections found</td></tr>';
    loadingIndicator.style.display = 'none';
}

function showErrorMessage() {
    inspectionsTable.innerHTML = '<tr><td colspan="5" style="text-align: center;">Error loading inspections</td></tr>';
    loadingIndicator.style.display = 'none';
}

function addInspectionToTable(docId, data) {
    const row = inspectionsTable.insertRow();
    // Changed from timestamp.toDate() to direct date field
    const inspectionDate = data.inspectionDetails.date; 
    const formattedDate = formatDate(inspectionDate); // We'll add this helper function
    
    row.innerHTML = `
        <td>${data.transformerDetails.kks || 'N/A'}</td>
        <td>${data.transformerDetails.name || 'N/A'}</td>
        <td>${formattedDate}</td>
        <td>${data.inspectionDetails.location || 'N/A'}</td>
        <td><button class="view-btn" data-id="${docId}">View</button></td>
    `;
    
    row.addEventListener('click', () => viewInspectionDetails(docId));
    row.querySelector('.view-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        viewInspectionDetails(docId);
    });
}

// Add this helper function
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Get day, month, and year components
    const day = String(date.getDate()).padStart(2, '0');  // Ensure 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-indexed
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;  // Format: "14-02-2023"
}

function viewInspectionDetails(docId) {
    currentInspection = inspectionsData.find(item => item.id === docId);
    if (!currentInspection) return;
    
    populateTransformerInfo();
    populateInspectionInfo();
    populateTestResults();
    
    inspectionDetails.style.display = 'block';
    inspectionDetails.scrollIntoView({ behavior: 'smooth' });
}

function populateTransformerInfo() {
    transformerInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">KKS Code</span>
            <div class="info-value">${currentInspection.transformerDetails.kks || 'N/A'}</div>
        </div>
        <div class="info-item">
            <span class="info-label">Name</span>
            <div class="info-value">${currentInspection.transformerDetails.name || 'N/A'}</div>
        </div>
        <div class="info-item">
            <span class="info-label">Serial No</span>
            <div class="info-value">${currentInspection.transformerDetails.serialNo || 'N/A'}</div>
        </div>
        <div class="info-item">
            <span class="info-label">Manufacturer</span>
            <div class="info-value">${currentInspection.transformerDetails.manufacturer || 'N/A'}</div>
        </div>
        <div class="info-item">
            <span class="info-label">Year</span>
            <div class="info-value">${currentInspection.transformerDetails.yearManufactured || 'N/A'}</div>
        </div>
        <div class="info-item">
            <span class="info-label">Capacity</span>
            <div class="info-value">${currentInspection.transformerDetails.ratedCapacity || 'N/A'}</div>
        </div>
    `;
}

function populateInspectionInfo() {
    // Changed from timestamp.toDate() to direct date field
    const inspectionDate = currentInspection.inspectionDetails.date;
    const formattedDate = formatDate(inspectionDate);
    
    inspectionInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">Date</span>
            <div class="info-value">${formattedDate}</div>
        </div>
        <div class="info-item">
            <span class="info-label">Location</span>
            <div class="info-value">${currentInspection.inspectionDetails.location || 'N/A'}</div>
        </div>
        <div class="info-item">
            <span class="info-label">Temperature</span>
            <div class="info-value">${currentInspection.inspectionDetails.temperature || 'N/A'} °C</div>
        </div>
        <div class="info-item">
            <span class="info-label">Humidity</span>
            <div class="info-value">${currentInspection.inspectionDetails.humidity || 'N/A'} %</div>
        </div>
        <div class="info-item">
            <span class="info-label">Applied Voltage</span>
            <div class="info-value">${currentInspection.inspectionDetails.appliedVoltage || 'N/A'} kV</div>
        </div>
    `;
}

function populateTestResults() {
    resultsTable.innerHTML = '';
    currentInspection.testResults.forEach((test) => {
        const row = resultsTable.insertRow();
        row.innerHTML = `
            <td>${test.tap}</td>
            <td>${test.hvWinding}</td>
            <td>${test.lvWinding}</td>
            <td>${test.rValue}</td>
            <td>${test.yValue}</td>
            <td>${test.bValue}</td>
        `;
    });
}

function getDateRange(filter, customStart, customEnd) {
    const now = new Date();
    let start = null;
    let end = null;
    
    switch (filter) {
        case 'today':
            start = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
            end = new Date(now.setHours(23, 59, 59, 999)).toISOString().split('T')[0];
            break;
        case 'week':
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(now.setDate(diff)).toISOString().split('T')[0];
            end = new Date(start);
            end.setDate(new Date(start).getDate() + 6);
            end = end.toISOString().split('T')[0];
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            break;
        case 'custom':
            if (customStart) {
                start = customStart;
            }
            if (customEnd) {
                end = customEnd;
            }
            break;
        default: // 'all'
            break;
    }
    
    return { start, end }; // Now returning strings instead of Timestamps
}

function applyFilters() {
    const filters = {
        dateFilter: dateFilter.value,
        startDate: startDate.value,
        endDate: endDate.value
    };
    fetchInspections(filters);
}

function exportToCsv() {
    if (inspectionsData.length === 0) {
        alert('No data to export');
        return;
    }
    
    let csvContent = "KKS Code,Transformer Name,Inspection Date,Location,HV Voltage,LV Voltage,Tap,HV winding(V),LV Winding(V),R (mA),Y (mA),B (mA)\n";
    
    inspectionsData.forEach(inspection => {
        // Changed from timestamp.toDate() to direct date field
        const formattedDate = formatDate(inspection.inspectionDetails.date);
        const baseInfo = [
            `"${inspection.transformerDetails.kks || ''}"`,
            `"${inspection.transformerDetails.name || ''}"`,
            `"${formattedDate}"`,
            `"${inspection.inspectionDetails.location || ''}"`,
            inspection.transformerDetails.hvVoltage || '',
            inspection.transformerDetails.lvVoltage || ''
        ].join(',');
        
        inspection.testResults.forEach(test => {
            const testData = [
                test.tap,
                test.hvWinding,
                test.lvWinding,
                test.rValue,
                test.yValue,
                test.bValue
            ].join(',');
            csvContent += `${baseInfo},${testData}\n`;
        });
    });
    
    downloadCsv(csvContent);
}

function downloadCsv(content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transformer_inspections_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showGraphModal() {
    if (!currentInspection) return;
    
    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
    }
    
    // Prepare data for chart
    const tapPositions = currentInspection.testResults.map(test => test.tap);
    const rPhaseData = currentInspection.testResults.map(test => parseFloat(test.rValue));
    const yPhaseData = currentInspection.testResults.map(test => parseFloat(test.yValue));
    const bPhaseData = currentInspection.testResults.map(test => parseFloat(test.bValue));
    
    // Create chart
    currentChart = new Chart(currentChartCanvas, {
        type: 'line',
        data: {
            labels: tapPositions,
            datasets: [
                {
                    label: 'R Phase',
                    data: rPhaseData,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Y Phase',
                    data: yPhaseData,
                    borderColor: '#ffcd56',
                    backgroundColor: 'rgba(255, 205, 86, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'B Phase',
                    data: bPhaseData,
                    borderColor: '#36a2eb',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Current (mA)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    min: Math.min(...rPhaseData, ...yPhaseData, ...bPhaseData) - 20,
                    max: Math.max(...rPhaseData, ...yPhaseData, ...bPhaseData) + 20,
                    ticks: {
                        stepSize: 20
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Tap Position',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
    
    // Set remarks
    graphRemarks.textContent = currentInspection.inspectionDetails.remarks || 'Satisfactorily';
    
    // Show modal
    graphModal.style.display = 'block';
}

function printGraph() {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
            <head>
                <title>Excitation Current Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #2c3e50; }
                    .chart-container { width: 100%; height: 400px; }
                    .legend { display: flex; justify-content: center; gap: 20px; margin: 20px 0; }
                    .legend-item { display: flex; align-items: center; gap: 8px; }
                    .legend-color { width: 20px; height: 20px; border-radius: 4px; }
                    .remarks { margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1>Excitation Current Measurement</h1>
                <div class="chart-container">
                    <canvas id="printChart"></canvas>
                </div>
                <div class="legend">
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: #ff6384;"></span>
                        <span>R Phase</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: #ffcd56;"></span>
                        <span>Y Phase</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: #36a2eb;"></span>
                        <span>B Phase</span>
                    </div>
                </div>
                <div class="remarks">
                    <h3>Remarks</h3>
                    <p>${graphRemarks.textContent}</p>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script>
                    const ctx = document.getElementById('printChart').getContext('2d');
                    new Chart(ctx, ${JSON.stringify(currentChart.config)});
                    window.onload = function() { window.print(); };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function exportGraphAsImage() {
    const link = document.createElement('a');
    link.download = `excitation_current_${currentInspection.transformerDetails.kks || 'report'}.png`;
    link.href = currentChartCanvas.toDataURL('image/png');
    link.click();
}