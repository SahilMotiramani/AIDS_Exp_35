// Initialize variables to store chart instances
let supplyDemandChart, environmentChart, marketChart;

document.getElementById('predictionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const inputData = {
        State: document.getElementById('state').value,
        City: document.getElementById('city').value,
        'Crop Type': document.getElementById('cropType').value,
        Season: document.getElementById('season').value,
        Temperature: parseFloat(document.getElementById('temperature').value),
        Rainfall: parseFloat(document.getElementById('rainfall').value),
        'Supply Volume': parseFloat(document.getElementById('supply').value),
        'Demand Volume': parseFloat(document.getElementById('demand').value),
        'Transportation Cost': parseFloat(document.getElementById('transport').value),
        'Fertilizer Usage': parseFloat(document.getElementById('fertilizer').value),
        'Pest Infestation': parseFloat(document.getElementById('pest').value),
        'Market Competition': parseFloat(document.getElementById('competition').value)
    };
    
    // Make API call
    fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Display basic results
        document.getElementById('predictedPrice').textContent = data.predicted_price.toFixed(2);
        
        // Determine price category and styling
        const price = data.predicted_price;
        let category, categoryClass;
        if (price < 20) {
            category = "Low";
            categoryClass = "category-low";
        } else if (price >= 20 && price < 50) {
            category = "Medium";
            categoryClass = "category-medium";
        } else {
            category = "High";
            categoryClass = "category-high";
        }
        
        const priceCategoryElement = document.getElementById('priceCategory');
        priceCategoryElement.textContent = category;
        priceCategoryElement.className = "price-category " + categoryClass;
        
        // Prepare report data
        prepareReport(inputData, data);
        
        // Show results section
        document.getElementById('result').style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while making the prediction.');
    });
});

function prepareReport(inputData, predictionData) {
    // Set report date
    const now = new Date();
    document.getElementById('reportDate').textContent = now.toLocaleString();
    
    // Fill input parameters
    document.getElementById('reportState').textContent = inputData.State;
    document.getElementById('reportCity').textContent = inputData.City;
    document.getElementById('reportCropType').textContent = inputData['Crop Type'];
    document.getElementById('reportSeason').textContent = inputData.Season;
    document.getElementById('reportTemperature').textContent = inputData.Temperature.toFixed(1) + "°C";
    document.getElementById('reportRainfall').textContent = inputData.Rainfall.toFixed(1) + " mm";
    document.getElementById('reportSupply').textContent = inputData['Supply Volume'].toFixed(2) + " kgs";
    document.getElementById('reportDemand').textContent = inputData['Demand Volume'].toFixed(2) + " kgs";
    document.getElementById('reportTransport').textContent = "₹" + inputData['Transportation Cost'].toFixed(2) + "/kg";
    document.getElementById('reportFertilizer').textContent = inputData['Fertilizer Usage'].toFixed(2) + " kg/hectare";
    document.getElementById('reportPest').textContent = (inputData['Pest Infestation'] * 100).toFixed(0) + "%";
    document.getElementById('reportCompetition').textContent = (inputData['Market Competition'] * 100).toFixed(0) + "%";
    
    // Set predicted price
    const price = predictionData.predicted_price;
    document.getElementById('reportPrice').textContent = price.toFixed(2);
    
    // Set price category with styling
    let category, categoryClass, analysis;
    if (price < 20) {
        category = "Low";
        categoryClass = "category-low";
        analysis = "Prices are currently low, which may indicate oversupply or low demand conditions in the market.";
    } else if (price >= 20 && price < 50) {
        category = "Medium";
        categoryClass = "category-medium";
        analysis = "Prices are at moderate levels, suggesting balanced market conditions.";
    } else {
        category = "High";
        categoryClass = "category-high";
        analysis = "Prices are high, which may indicate strong demand or limited supply in the market.";
    }
    
    const priceCategoryElement = document.getElementById('reportPriceCategory');
    priceCategoryElement.textContent = category;
    priceCategoryElement.className = "price-category " + categoryClass;
    
    // Create charts
    createCharts(inputData, price);
    
    // Generate recommendations
    generateRecommendations(inputData, price);
}

function createCharts(inputData, predictedPrice) {
    // Destroy existing charts if they exist
    if (supplyDemandChart) supplyDemandChart.destroy();
    if (environmentChart) environmentChart.destroy();
    if (marketChart) marketChart.destroy();
    
    // Supply vs Demand Chart
    const supplyDemandCtx = document.getElementById('supplyDemandChart').getContext('2d');
    supplyDemandChart = new Chart(supplyDemandCtx, {
        type: 'bar',
        data: {
            labels: ['Supply (kg)', 'Demand (kg)'],
            datasets: [{
                label: 'Volume',
                data: [inputData['Supply Volume'], inputData['Demand Volume']],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Supply vs Demand Comparison',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume (kg)'
                    }
                }
            }
        }
    });
    
    // Calculate supply-demand ratio for analysis
    const ratio = inputData['Supply Volume'] / inputData['Demand Volume'];
    let analysis = "";
    if (ratio > 1.5) {
        analysis = "The supply significantly exceeds demand (" + ratio.toFixed(2) + "x), which typically puts downward pressure on prices.";
    } else if (ratio < 0.67) {
        analysis = "Demand significantly exceeds supply (" + (1/ratio).toFixed(2) + "x), which typically drives prices upward.";
    } else {
        analysis = "Supply and demand are relatively balanced (ratio: " + ratio.toFixed(2) + "), leading to stable price conditions.";
    }
    document.getElementById('supplyDemandAnalysis').textContent = analysis;
    
    // Environmental Factors Chart
    const environmentCtx = document.getElementById('environmentChart').getContext('2d');
    environmentChart = new Chart(environmentCtx, {
        type: 'radar',
        data: {
            labels: ['Temperature', 'Rainfall', 'Pest Infestation', 'Fertilizer Usage'],
            datasets: [{
                label: 'Environmental Factors',
                data: [
                    normalizeValue(inputData.Temperature, 0, 50),
                    normalizeValue(inputData.Rainfall, 0, 500),
                    inputData['Pest Infestation'] * 100,
                    normalizeValue(inputData['Fertilizer Usage'], 0, 200)
                ],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Environmental Factors',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
    
    // Environmental analysis
    let envAnalysis = "Environmental conditions: ";
    if (inputData.Temperature > 35) {
        envAnalysis += "High temperatures may stress crops. ";
    } else if (inputData.Temperature < 15) {
        envAnalysis += "Low temperatures may slow crop growth. ";
    } else {
        envAnalysis += "Temperatures are in an optimal range. ";
    }
    
    if (inputData.Rainfall > 300) {
        envAnalysis += "Heavy rainfall may impact crop quality. ";
    } else if (inputData.Rainfall < 100) {
        envAnalysis += "Low rainfall may reduce yields. ";
    } else {
        envAnalysis += "Rainfall amounts are favorable. ";
    }
    
    if (inputData['Pest Infestation'] > 0.5) {
        envAnalysis += "High pest infestation levels may significantly reduce yields. ";
    } else if (inputData['Pest Infestation'] > 0.2) {
        envAnalysis += "Moderate pest presence may affect some crops. ";
    } else {
        envAnalysis += "Pest pressure is minimal. ";
    }
    
    document.getElementById('environmentAnalysis').textContent = envAnalysis;
    
    // Market Factors Chart
    const marketCtx = document.getElementById('marketChart').getContext('2d');
    marketChart = new Chart(marketCtx, {
        type: 'doughnut',
        data: {
            labels: ['Transport Cost', 'Market Competition', 'Predicted Price'],
            datasets: [{
                data: [
                    inputData['Transportation Cost'],
                    inputData['Market Competition'] * 100,
                    predictedPrice
                ],
                backgroundColor: [
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(54, 162, 235, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Market Factors',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.label === 'Market Competition') {
                                label += context.raw.toFixed(0) + '%';
                            } else {
                                label += '₹' + context.raw.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    // Market analysis
    let marketAnalysis = "Market conditions: ";
    if (inputData['Transportation Cost'] > predictedPrice * 0.3) {
        marketAnalysis += "High transportation costs are significantly impacting the final price. ";
    } else {
        marketAnalysis += "Transportation costs are at reasonable levels. ";
    }
    
    if (inputData['Market Competition'] > 0.7) {
        marketAnalysis += "The market is highly competitive, which may pressure margins. ";
    } else if (inputData['Market Competition'] > 0.3) {
        marketAnalysis += "Moderate market competition exists. ";
    } else {
        marketAnalysis += "The market has low competition. ";
    }
    
    document.getElementById('marketAnalysis').textContent = marketAnalysis;
}

function generateRecommendations(inputData, predictedPrice) {
    let recommendations = "<ul>";
    
    // Supply-demand recommendations
    const ratio = inputData['Supply Volume'] / inputData['Demand Volume'];
    if (ratio > 1.5) {
        recommendations += "<li>Consider reducing production or finding new markets as supply exceeds demand.</li>";
    } else if (ratio < 0.67) {
        recommendations += "<li>Opportunity to increase production as demand exceeds supply.</li>";
    }
    
    // Price-based recommendations
    if (predictedPrice < 20) {
        recommendations += "<li>Prices are low - consider storing produce for future sale if possible.</li>";
        recommendations += "<li>Explore value-added products to increase revenue.</li>";
    } else if (predictedPrice >= 50) {
        recommendations += "<li>High prices present a good selling opportunity.</li>";
        recommendations += "<li>Consider expanding production if conditions permit.</li>";
    }
    
    // Environmental recommendations
    if (inputData['Pest Infestation'] > 0.5) {
        recommendations += "<li>Implement pest control measures to protect yields.</li>";
    }
    
    if (inputData['Fertilizer Usage'] < 50) {
        recommendations += "<li>Consider increasing fertilizer application to boost yields.</li>";
    } else if (inputData['Fertilizer Usage'] > 150) {
        recommendations += "<li>Review fertilizer application rates to optimize costs.</li>";
    }
    
    // Market recommendations
    if (inputData['Transportation Cost'] > predictedPrice * 0.3) {
        recommendations += "<li>Explore alternative transportation options to reduce costs.</li>";
    }
    
    if (inputData['Market Competition'] > 0.7) {
        recommendations += "<li>Differentiate your product through quality or branding to stand out in a competitive market.</li>";
    }
    
    recommendations += "</ul>";
    document.getElementById('recommendations').innerHTML = recommendations;
}

function normalizeValue(value, min, max) {
    return ((value - min) / (max - min)) * 100;
}

// View Report button
document.getElementById('viewReportBtn').addEventListener('click', function() {
    document.getElementById('reportContent').style.display = 'block';
    document.querySelector('.no-print').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    
    // Scroll to report
    window.scrollTo(0, 0);
    
    // Add print button to report
    const printBtn = document.createElement('button');
    printBtn.textContent = 'Print Report';
    printBtn.className = 'button-secondary';
    printBtn.style.margin = '20px auto';
    printBtn.style.display = 'block';
    printBtn.onclick = function() {
        window.print();
    };
    
    const existingPrintBtn = document.querySelector('#reportContent button');
    if (!existingPrintBtn) {
        document.getElementById('reportContent').appendChild(printBtn);
    }
});

// Download PDF button
document.getElementById('downloadPdfBtn').addEventListener('click', function() {
    // Show report content temporarily
    document.getElementById('reportContent').style.display = 'block';
    const originalDisplay = document.querySelector('.no-print').style.display;
    document.querySelector('.no-print').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    
    // Use html2canvas to capture the report
    html2canvas(document.getElementById('reportContent')).then(canvas => {
        // Hide report content again
        document.getElementById('reportContent').style.display = 'none';
        document.querySelector('.no-print').style.display = originalDisplay;
        document.getElementById('result').style.display = 'block';
        
        // Create PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        pdf.save('Crop_Price_Prediction_Report.pdf');
    });
});