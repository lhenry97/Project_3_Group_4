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
        document.getElementById('data-select').addEventListener('change', function() {
            const selectedValue = this.value;
            const resultTitle = document.getElementById('result-title');
            
            if (selectedValue === 'total') {
                resultTitle.textContent = 'Top 5 Countries by CO2 Emission';
                analyzeCO2Data('total');
            } else if (selectedValue === 'perCapita') {
                resultTitle.textContent = 'Top 5 Countries by CO2 per Capita (tonnes per person)';
                analyzeCO2Data('perCapita');
            } else if (selectedValue === 'tempSource') {
                resultTitle.textContent = 'Highest Temperature Change by CO2 Source';
                analyzeTempSourceData();
            } else if (selectedValue === 'tempGas') {
                resultTitle.textContent = 'Highest Temperature Change by Greenhouse Gas Emissions';
                analyzeTempGasData();
            }
        });

        // Initial load with default option (Top 5 Countries by CO2 Emission)
        analyzeCO2Data('total');

