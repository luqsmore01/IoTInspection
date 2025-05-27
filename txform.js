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

// DOM elements
const addRowBtn = document.getElementById('add-row');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const backBtns = document.querySelectorAll('.back-btn');
const resultsTable = document.getElementById('results-table').getElementsByTagName('tbody')[0];
const statusMessage = document.getElementById('status-message');

// Add event listeners to back buttons
backBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
});

// Add test result row
addRowBtn.addEventListener('click', () => {
  const rowCount = resultsTable.rows.length + 1;
  const newRow = resultsTable.insertRow();
  
  newRow.innerHTML = `
    <td>${rowCount}</td>
    <td><input type="number" class="hv-winding" placeholder="11550"></td>
    <td><input type="number" class="lv-winding" placeholder="3465"></td>
    <td><input type="number" class="tap" placeholder="1" min="1" max="5"></td>
    <td><input type="number" step="0.0001" class="r-value" placeholder="195.1600"></td>
    <td><input type="number" step="0.0001" class="y-value" placeholder="139.1300"></td>
    <td><input type="number" step="0.0001" class="b-value" placeholder="194.8700"></td>
    <td><button class="remove-row"><i class="fas fa-trash"></i></button></td>
  `;
  
  // Add event listener to the remove button
  newRow.querySelector('.remove-row').addEventListener('click', () => {
    resultsTable.deleteRow(newRow.rowIndex - 1);
    updateRowNumbers();
  });
});

// Update row numbers when a row is removed
function updateRowNumbers() {
  const rows = resultsTable.rows;
  for (let i = 0; i < rows.length; i++) {
    rows[i].cells[0].textContent = i + 1;
  }
}

// Save inspection to Firebase
saveBtn.addEventListener('click', async () => {
  // Collect transformer details
  const transformerDetails = {
    kks: document.getElementById('kks').value,
    name: document.getElementById('name').value,
    serialNo: document.getElementById('serial').value,
    manufacturer: document.getElementById('manufacturer').value,
    yearManufactured: document.getElementById('year').value,
    hvVoltage: document.getElementById('hvv').value,
    lvVoltage: document.getElementById('lvv').value,
    ratedCapacity: document.getElementById('capacity').value,
    ratedFrequency: document.getElementById('frequency').value,
    vectorGroup: document.getElementById('vector').value
  };
  
  // Collect inspection details
  const inspectionDetails = {
    date: document.getElementById('date').value,
    location: document.getElementById('location').value,
    temperature: document.getElementById('temp').value,
    humidity: document.getElementById('humidity').value,
    appliedVoltage: document.getElementById('voltage').value,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  // Collect test results
  const testResults = [];
  const rows = resultsTable.rows;
  
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells;
    testResults.push({
      no: i + 1,
      hvWinding: cells[1].querySelector('input').value,
      lvWinding: cells[2].querySelector('input').value,
      tap: cells[3].querySelector('input').value,
      rValue: cells[4].querySelector('input').value,
      yValue: cells[5].querySelector('input').value,
      bValue: cells[6].querySelector('input').value
    });
  }
  
  // Validate data
  if (!transformerDetails.kks || !inspectionDetails.date || testResults.length === 0) {
    showStatus('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    // Save to Firestore
    const docRef = await db.collection('transformerInspections').add({
      transformerDetails,
      inspectionDetails,
      testResults
    });
    
    showStatus(`Inspection saved successfully with ID: ${docRef.id}`, 'success');
    console.log('Document written with ID: ', docRef.id);
  } catch (error) {
    showStatus(`Error saving inspection: ${error.message}`, 'error');
    console.error('Error adding document: ', error);
  }
});

// Clear form
clearBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the form?')) {
    // Clear input fields
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.value = '';
    });
    
    // Clear test results table
    while (resultsTable.rows.length > 0) {
      resultsTable.deleteRow(0);
    }
    
    statusMessage.style.display = 'none';
  }
});

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

// Initialize date field with today's date
document.getElementById('date').valueAsDate = new Date();