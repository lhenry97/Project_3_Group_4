
let myLineChart;
let myPolarChart;
let myDoughnutChart;

// Initialize world map and set its view to a default location and zoom level
var map = L.map('map').setView([20, 0], 2);

// Add a tile layer to the map (using OpenStreetMap tiles)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to determine circle size based on CO2 emission values
function getCircleSize(co2) {
    return co2 * 500 / 1000;  // Adjust this factor to scale the circles as needed
}

// Load country data from CSV and plot circles
d3.csv("Datasets/Country-lat-and-long.csv").then(function(data) {
    data.forEach(function(country) {
        L.circle([country.latitude, country.longitude], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: getCircleSize(500 * country.co2) // Circle size based on CO2
        }).addTo(map)
        .bindPopup('<b>' + country.country + '</b><br>CO2: ' + country.co2);
    });
}).catch(function(error) {
    console.error('Error loading CSV data:', error);
});


// Build the metadata panel using temperature data
function buildMetadata(country) {
  d3.csv("Datasets/contribution-to-temp-rise-by-gas.csv").then((data) => {
    let metadata = data.map(d => ({
      Entity: d.Entity,
      Year: d.Year,
      surface_temp_from_n2o: d.surface_temp_from_n2o,
      surface_temp_from_ch4: d.surface_temp_from_ch4,
      surface_temp_from_co2: d.surface_temp_from_co2,
    }));

    let filteredData = metadata.filter(sampleObj => sampleObj.Entity === country);
    if (filteredData.length === 0) {
      console.error('No metadata found for Country:', country);
      return;
    }

    let panel = d3.select("#metadata-panel");
    panel.html("");
    for (let [key, value] of Object.entries(filteredData[0])) {
      panel.append("h6").text(`${key.toUpperCase()}: ${value}`);
    }
  }).catch(error => console.error('Error loading metadata:', error));
}

// Plot line chart of selected emission data with time
function plotLineChart(country) {
  d3.csv("Datasets/contribution-to-temp-rise-by-gas.csv").then((data) => {
    let filteredData = data.filter(d => d.Entity === country);
    if (filteredData.length === 0) {
      console.error('No data found for Country:', country);
      return;
    }

    const labels = filteredData.map(d => d.Year);
    const dataCO2 = filteredData.map(d => d.surface_temp_from_co2);
    const dataCH4 = filteredData.map(d => d.surface_temp_from_ch4);
    const dataN2O = filteredData.map(d => d.surface_temp_from_n2o);

    // Remove any existing chart instance
    if (myLineChart) {
      myLineChart.destroy();
    }
    //Set height and width of line-chart-2
    const ctx = document.getElementById('line-chart-2').getContext('2d');
    ctx.canvas.parentNode.style.height = '250px'; // Set your desired height

    // Create line chart using Chart.js
    myLineChart = new Chart(document.getElementById('line-chart-2'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'CO₂',
            data: dataCO2,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false
          },
          {
            label: 'CH₄',
            data: dataCH4,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: false
          },
          {
            label: 'N₂O',
            data: dataN2O,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // To allow custom dimensions
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `Temperature Rise Over Time for ${country}`
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Year'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Temperature Rise (°C)'
            },
            beginAtZero: true,
            min: -0.01, // defining minium value for y axis
            max: 0.28 //defining maximum value for y axis
          }
        }
      }
    });
  }).catch(error => console.error('Error loading data for plot:', error));
}

// Plot polar area chart for specific countries
function plotPolarChart() {
  d3.csv("Datasets/contribution-to-temp-rise-by-gas.csv").then((data) => {
    const targetCountries = ["Australia", "United States", "China", "Russia", "South America"];
    
    // Aggregate data for selected countries
    let countryTotals = targetCountries.reduce((acc, country) => {
      const countryData = data.filter(d => d.Entity === country);
      const totalCO2 = countryData.reduce((sum, d) => sum + parseFloat(d.surface_temp_from_co2 || 0), 0);
      acc[country] = totalCO2;
      return acc;
    }, {});

    // Prepare data for the polar chart
    let labels = Object.keys(countryTotals);
    let dataValues = Object.values(countryTotals);

    // Remove any existing chart instance
    if (myPolarChart) {
      myPolarChart.destroy();
    }
    
    //Set height and width of polar-chart
    const ctx = document.getElementById('polar-chart').getContext('2d');
    ctx.canvas.parentNode.style.height = '300px'; // Set desired height

    // Create new Chart.js polar area chart
    myPolarChart = new Chart(document.getElementById('polar-chart'), {
      type: 'polarArea',
      data: {
        labels: labels,
        datasets: [{
          label: 'CO₂ Emissions Contribution',
          data: dataValues,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // To allow custom dimensions
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'CO₂ Emissions Contribution by Selected Countries'
          }
        }
      }
    });
  }).catch(error => console.error('Error loading data for polar chart:', error));
}

// Plot doughnut chart for the world
function plotDoughnutChart() {
  d3.csv("Datasets/contribution-to-temp-rise-by-gas.csv").then((data) => {
    let worldData = data.filter(d => d.Entity === "World");

    if (worldData.length === 0) {
      console.error('No data found for World');
      return;
    }

    // Prepare data for the doughnut chart
    let totalCO2 = worldData.reduce((sum, d) => sum + parseFloat(d.surface_temp_from_co2 || 0), 0);
    let totalCH4 = worldData.reduce((sum, d) => sum + parseFloat(d.surface_temp_from_ch4 || 0), 0);
    let totalN2O = worldData.reduce((sum, d) => sum + parseFloat(d.surface_temp_from_n2o || 0), 0);

    let labels = ['CO₂', 'CH₄', 'N₂O'];
    let dataValues = [totalCO2, totalCH4, totalN2O];

    // Remove any existing chart instance
    if (myDoughnutChart) {
      myDoughnutChart.destroy();
    }

    // Create new Chart.js doughnut chart
    myDoughnutChart = new Chart(document.getElementById('doughnut-chart'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Global Emissions Contribution',
          data: dataValues,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(75, 192, 192, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // To allow custom dimensions
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Global Emissions Contribution (CO₂, CH₄, N₂O)'
          }
        }
      }
    });
  }).catch(error => console.error('Error loading data for doughnut chart:', error));
}



// Build the metadata panel from finalData csv
function buildMetadata(country) {
  d3.csv("Datasets/finalData.csv").then((data) => {
    let metadata = data.map(d => ({
      country: d.country,
      year: d.year,
      isoCode: d.iso_code,
      population: d.population,
      gdp: d.gdp,
      cementCo2: d.cement_co2,
      cementCo2PerCapita: d.cement_co2_per_capita,
      co2: d.co2,
      co2PerCapita: d.co2_per_capita,
      co2PerGdp: d.co2_per_gdp,
      coalCo2: d.coal_co2,
      coalCo2PerCapita: d.coal_co2_per_capita,
      consumptionCo2: d.consumption_co2,
      consumptionCo2PerCapita: d.consumption_co2_per_capita,
      consumptionCo2PerGdp: d.consumption_co2_per_gdp,
      cumulativeCementCo2: d.cumulative_cement_co2,
      oilCo2: d.oil_co2,
      oilCo2PerCapita: d.oil_co2_per_capita,
      otherCo2PerCapita: d.other_co2_per_capita,
      temperatureChangeFromCh4: d.temperature_change_from_ch4,
      temperatureChangeFromCo2: d.temperature_change_from_co2,
      temperatureChangeFromGhg: d.temperature_change_from_ghg,
      temperatureChangeFromN2o: d.temperature_change_from_n2o,
      otherIndustryCo2: d.other_industry_co2
    }));

    let filteredData = metadata.filter(sampleObj => sampleObj.country === country);
    if (filteredData.length === 0) {
      console.error('No metadata found for Country:', country);
      return;
    }
    let panel = d3.select("#metadata-panel");
    panel.html("");
    for (let [key, value] of Object.entries(filteredData[0])) {
      panel.append("h6").text(`${key.toUpperCase()}: ${value}`);
    }
  }).catch(error => console.error('Error loading metadata:', error));
}

// Plot line graph of selected emission data with time
function plotLineGraph(country) {
  d3.csv("Datasets/finalData.csv").then((data) => {
    let filteredData = data.filter(d => d.country === country);
    if (filteredData.length === 0) {
      console.error('No data found for Country:', country);
      return;
    }

    console.log('Filtered Data:', filteredData); // Debugging line

    let emissions = ["cement_co2_per_capita", "coal_co2_per_capita", "oil_co2_per_capita", "other_co2_per_capita"];
    let emissionLabels = {
      "cement_co2_per_capita": "Cement CO2",
      "coal_co2_per_capita": "Coal CO2",
      "oil_co2_per_capita": "Oil CO2",
      "other_co2_per_capita": "Other CO2"
    };
    let traces = emissions.map(emission => ({
      x: filteredData.map(d => d.year),
      y: filteredData.map(d => d[emission]),
      mode: 'lines',
      name: emissionLabels[emission]
    }));

    console.log('Traces:', traces); // Debugging line

    let layout = {
      title: `Emissions Over Time for ${country} Per Capita`,
      xaxis: { title: "Year" },
      yaxis: { title: "Emissions (Tonnes Per Peson)" },
      showlegend: true,
      height: 300
    };

    Plotly.newPlot('line-chart', traces, layout);
  }).catch(error => console.error('Error loading data for plot:', error));
}

function updateCountrySummary(country) {
  d3.csv("Datasets/finalData.csv").then((data) => {
    let filteredData = data.filter(d => d.country === country);
    if (filteredData.length === 0) {
      console.error('No data found for Country:', country);
      return;
    }
    
    let summary = `
    <p><strong>Total CO2 Emissions as of 2020:</strong><br> ${filteredData.reduce((sum, d) => sum + parseFloat(d.co2 || 0), 0).toFixed(2)} Million Tons</p>
`;
document.getElementById('country-summary').innerHTML = summary;
}).catch(error => console.error('Error loading data for summary:', error));
}

// Function for handling dropdown change
function optionChanged(newCountry) {
  buildMetadata(newCountry);
  plotLineGraph(newCountry);
  plotLineChart(newCountry);
  updateCountrySummary(newCountry);
}

// Event listener for dropdown change
d3.select("#category-select").on("change", function() {
  let selectedCountry = d3.select("#category-select").property("value");
  optionChanged(selectedCountry);
});

function init() {
  // Load the first dataset
  d3.csv("Datasets/finalData.csv").then((data1) => {
    let countries1 = Array.from(new Set(data1.map(d => d.country)));
    let dropdown = d3.select("#category-select");

    // Populate dropdown with options
    countries1.forEach(country => {
      dropdown.append("option").text(country).property("value", country);
    });

    // Select the first country to initialize
    let firstCountry1 = countries1[0];
    buildMetadata(firstCountry1);
    plotLineGraph(firstCountry1);
    plotLineChart(firstCountry1);
    updateCountrySummary(firstCountry1);
    plotPolarChart();
    plotDoughnutChart();

  }).catch(error => console.error('Error initializing dashboard:', error));
}
// Helper function to parse CSV data and handle missing values (NaN)
function parseCSV(csv) {
  const [headerLine, ...rows] = csv.split('\n').filter(row => row.trim() !== '');
  const headers = headerLine.split(',');
  return rows.map(row => {
    const values = row.split(',');
    return headers.reduce((obj, header, idx) => {
      // Replace NaN or missing values with '0'
      obj[header.trim()] = values[idx]?.trim() || '0';
      return obj;
    }, {});
  });
}

// Function to update the HTML content dynamically
function updateHTML(data, elementId, unit = '') {
  const list = document.getElementById(elementId);
  list.innerHTML = '';
  data.forEach(item => {
    const listItem = document.createElement('li');
    listItem.textContent = `${item.country || item.source || item.gas}: ${item.value}${unit}`;
    list.appendChild(listItem);
  });
}

// Fetch and analyze CO2 data to find top 5 countries
async function analyzeCO2Data(type) {
  const co2Response = await fetch('https://raw.githubusercontent.com/lhenry97/Project_3_Group_4/main/Datasets/finaldata.csv');
  const co2Data = await co2Response.text();
  const co2ParsedData = parseCSV(co2Data);

  // Filter out duplicate countries to ensure uniqueness
  const uniqueCO2Countries = co2ParsedData
    .filter((item, index, arr) =>
      arr.findIndex(c => c['country'] === item['country']) === index
    );

  let topCountries = [];
  let unit = '';

  // Depending on type, get either total CO2 emissions or CO2 per capita
  if (type === 'total') {
    topCountries = uniqueCO2Countries
      .sort((a, b) => parseFloat(b['co2']) - parseFloat(a['co2']))
      .slice(0, 5)
      .map(row => ({ country: row['country'], value: parseFloat(row['co2']) }));
    unit = ' million tons';
  } else if (type === 'perCapita') {
    topCountries = uniqueCO2Countries
      .sort((a, b) => parseFloat(b['co2_per_capita']) - parseFloat(a['co2_per_capita']))
      .slice(0, 5)
      .map(row => ({ country: row['country'], value: parseFloat(row['co2_per_capita']) }));
    unit = ' tonnes per person';
  }

  updateHTML(topCountries, 'results', unit);
}

// Fetch and analyze data to find the top 2 sources of CO2 by emission
async function analyzeTempSourceData() {
  const tempResponse = await fetch('https://raw.githubusercontent.com/lhenry97/Project_3_Group_4/main/Datasets/finaldata.csv');
  const tempData = await tempResponse.text();
  const tempParsedData = parseCSV(tempData);

  // Filter out rows where all CO2 source columns are NaN (0 after our parse)
  const validSources = tempParsedData.filter(row =>
    parseFloat(row['cement_co2']) > 0 || parseFloat(row['coal_co2']) > 0 ||
    parseFloat(row['oil_co2']) > 0 || parseFloat(row['other_industry_co2']) > 0
  );

  // Aggregate CO2 emissions by source
  const totalEmissionsBySource = validSources.reduce((acc, curr) => {
    acc.cement_co2 += parseFloat(curr['cement_co2']) || 0;
    acc.coal_co2 += parseFloat(curr['coal_co2']) || 0;
    acc.oil_co2 += parseFloat(curr['oil_co2']) || 0;
    acc.other_industry_co2 += parseFloat(curr['other_industry_co2']) || 0;
    return acc;
  }, { cement_co2: 0, coal_co2: 0, oil_co2: 0, other_industry_co2: 0 });

  // Sort the sources by emissions and get the top 2
  const sortedEmissions = Object.entries(totalEmissionsBySource)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([source, value]) => ({ source, value: value.toFixed(2) }));

  updateHTML(sortedEmissions, 'results', ' million tons');
}

// Fetch and analyze data for greenhouse gas temperature change
async function analyzeTempGasData() {
  const tempGasResponse = await fetch('https://raw.githubusercontent.com/lhenry97/Project_3_Group_4/main/Datasets/finaldata.csv');
  const tempGasData = await tempGasResponse.text();
  const tempGasParsedData = parseCSV(tempGasData);

  // Aggregate temperature change by gas
  const temperatureChangeByGas = tempGasParsedData.reduce((acc, curr) => {
    acc.ch4 += parseFloat(curr['temperature_change_from_ch4']) || 0;
    acc.co2 += parseFloat(curr['temperature_change_from_co2']) || 0;
    acc.n2o += parseFloat(curr['temperature_change_from_n2o']) || 0;
    acc.ghg += parseFloat(curr['temperature_change_from_ghg']) || 0;
    return acc;
  }, { ch4: 0, co2: 0, n2o: 0, ghg: 0 });

  // Sort the gases by temperature change and get the top 4
  const sortedGases = Object.entries(temperatureChangeByGas)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([gas, value]) => ({ gas: gas.toUpperCase(), value: value.toFixed(2) }));

  updateHTML(sortedGases, 'results', '°C');
}

// Handle dropdown change for CO2 and temperature data
document.getElementById('data-select').addEventListener('change', function () {
  const selectedValue = this.value;

  if (selectedValue === 'total') {
    analyzeCO2Data('total');
  } else if (selectedValue === 'perCapita') {
    analyzeCO2Data('perCapita');
  } else if (selectedValue === 'tempSource') {
    analyzeTempSourceData();
  } else if (selectedValue === 'tempGas') {
    analyzeTempGasData();
  }
});

// Initial load with default option (Top 5 Countries by CO2 Emission)
analyzeCO2Data('total');

// Call the init function on page load
init();