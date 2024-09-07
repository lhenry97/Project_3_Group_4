// Build the metadata panel
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
      yaxis: { title: "Emissions" },
      showlegend: true
    };

    Plotly.newPlot('line-chart', traces, layout);
  }).catch(error => console.error('Error loading data for plot:', error));
}

// Function for handling dropdown change
function optionChanged(newCountry) {
  buildMetadata(newCountry);
  plotLineGraph(newCountry);
}

// Event listener for dropdown change
d3.select("#category-select").on("change", function() {
  let selectedCountry = d3.select("#category-select").property("value");
  optionChanged(selectedCountry);
});

// Function to run on page load
function init() {
  d3.csv("Datasets/finalData.csv").then((data) => {
    let countries = Array.from(new Set(data.map(d => d.country)));
    let dropdown = d3.select("#category-select");
    countries.forEach(country => {
      dropdown.append("option").text(country).property("value", country);
    });
    let firstCountry = countries[0];
    buildMetadata(firstCountry);
    plotLineGraph(firstCountry);
  }).catch(error => console.error('Error initializing dashboard:', error));
}

// Initialise the dashboard
init();
