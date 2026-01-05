/**
 * Data Processing Module
 * Handles CSV parsing, normalization, and data transformations
 */

const DataProcessor = {
    /**
     * Sample datasets for testing
     */
    sampleDatasets: {
        'correlation-demo': {
            name: 'Correlation Demo',
            description: '4 features with varying correlations to target',
            data: `Feature_A,Feature_B,Feature_C,Feature_D,Target
0.1,0.95,0.12,0.5,0.15
0.2,0.85,0.22,0.55,0.25
0.3,0.72,0.31,0.48,0.35
0.4,0.62,0.42,0.52,0.45
0.5,0.48,0.51,0.5,0.55
0.6,0.38,0.59,0.47,0.65
0.7,0.28,0.72,0.53,0.75
0.8,0.18,0.81,0.49,0.85
0.9,0.08,0.92,0.51,0.95
0.35,0.68,0.33,0.45,0.38
0.55,0.45,0.57,0.54,0.58
0.75,0.22,0.77,0.48,0.78
0.25,0.78,0.27,0.52,0.28
0.65,0.35,0.67,0.5,0.68
0.45,0.55,0.43,0.47,0.48`
        },
        'multicollinearity': {
            name: 'Multicollinearity Example',
            description: 'Features with high inter-correlation (will collide)',
            data: `Price,SqFt,Rooms,Bathrooms,Age,Quality,Target
250000,1500,3,2,10,7,0.65
320000,1800,4,2,5,8,0.78
180000,1200,2,1,25,5,0.45
420000,2200,5,3,2,9,0.92
280000,1650,3,2,15,6,0.58
350000,1900,4,3,8,8,0.82
220000,1400,3,1,20,5,0.52
380000,2000,4,3,3,9,0.88
290000,1700,3,2,12,7,0.68
410000,2100,5,3,4,9,0.90
195000,1250,2,1,22,4,0.42
330000,1850,4,2,6,8,0.75
260000,1550,3,2,18,6,0.55
370000,1950,4,3,7,8,0.85
205000,1300,2,1,28,4,0.38`
        },
        'mixed': {
            name: 'Mixed Relationships',
            description: 'Various correlation strengths and directions',
            data: `Positive_Strong,Positive_Weak,Negative_Strong,Negative_Weak,No_Corr,Quadratic,Target
0.1,0.3,0.9,0.6,0.42,0.81,0.1
0.2,0.35,0.82,0.58,0.15,0.64,0.2
0.3,0.4,0.72,0.55,0.78,0.49,0.3
0.4,0.42,0.62,0.52,0.33,0.36,0.4
0.5,0.48,0.52,0.5,0.91,0.25,0.5
0.6,0.52,0.42,0.48,0.22,0.16,0.6
0.7,0.58,0.32,0.45,0.67,0.09,0.7
0.8,0.62,0.22,0.42,0.05,0.04,0.8
0.9,0.68,0.12,0.4,0.55,0.01,0.9
0.15,0.32,0.86,0.59,0.28,0.72,0.15
0.45,0.45,0.57,0.51,0.63,0.30,0.45
0.75,0.6,0.27,0.43,0.88,0.06,0.75
0.25,0.37,0.77,0.56,0.11,0.56,0.25
0.55,0.5,0.47,0.49,0.44,0.20,0.55
0.85,0.65,0.17,0.41,0.72,0.02,0.85`
        }
    },

    /**
     * Parse CSV string into structured data
     * @param {string} csvText - Raw CSV text
     * @returns {object} Parsed data with headers and rows
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have at least a header row and one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => {
                const num = parseFloat(v.trim());
                if (isNaN(num)) {
                    throw new Error(`Invalid number at row ${i + 1}: "${v}"`);
                }
                return num;
            });

            if (values.length !== headers.length) {
                throw new Error(`Row ${i + 1} has ${values.length} values, expected ${headers.length}`);
            }

            rows.push(values);
        }

        return { headers, rows };
    },

    /**
     * Get a column of data by index
     * @param {object} data - Parsed data object
     * @param {number} columnIndex - Column index
     * @returns {number[]} Column values
     */
    getColumn(data, columnIndex) {
        return data.rows.map(row => row[columnIndex]);
    },

    /**
     * Get column by name
     * @param {object} data - Parsed data object
     * @param {string} columnName - Column name
     * @returns {number[]} Column values
     */
    getColumnByName(data, columnName) {
        const index = data.headers.indexOf(columnName);
        if (index === -1) {
            throw new Error(`Column "${columnName}" not found`);
        }
        return this.getColumn(data, index);
    },

    /**
     * Apply Min-Max normalization to an array
     * @param {number[]} values - Array of numbers
     * @returns {object} Normalized values and metadata
     */
    minMaxNormalize(values) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;

        if (range === 0) {
            // All values are the same
            return {
                normalized: values.map(() => 0.5),
                min,
                max,
                range: 0
            };
        }

        const normalized = values.map(v => (v - min) / range);

        return {
            normalized,
            min,
            max,
            range
        };
    },

    /**
     * Normalize all columns in a dataset
     * @param {object} data - Parsed data object
     * @returns {object} Normalized data with metadata
     */
    normalizeAllColumns(data) {
        const normalizedData = {
            headers: data.headers,
            columns: {},
            metadata: {}
        };

        data.headers.forEach((header, index) => {
            const columnValues = this.getColumn(data, index);
            const result = this.minMaxNormalize(columnValues);
            
            normalizedData.columns[header] = result.normalized;
            normalizedData.metadata[header] = {
                min: result.min,
                max: result.max,
                range: result.range,
                mean: this.mean(columnValues),
                std: this.standardDeviation(columnValues)
            };
        });

        normalizedData.rowCount = data.rows.length;
        return normalizedData;
    },

    /**
     * Calculate mean of an array
     * @param {number[]} values - Array of numbers
     * @returns {number} Mean value
     */
    mean(values) {
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    },

    /**
     * Calculate standard deviation
     * @param {number[]} values - Array of numbers
     * @returns {number} Standard deviation
     */
    standardDeviation(values) {
        const avg = this.mean(values);
        const squareDiffs = values.map(v => Math.pow(v - avg, 2));
        return Math.sqrt(this.mean(squareDiffs));
    },

    /**
     * Load a sample dataset
     * @param {string} datasetId - Sample dataset ID
     * @returns {object} Parsed data
     */
    loadSampleDataset(datasetId) {
        const dataset = this.sampleDatasets[datasetId];
        if (!dataset) {
            throw new Error(`Unknown sample dataset: ${datasetId}`);
        }
        return this.parseCSV(dataset.data);
    },

    /**
     * Get sample dataset info
     * @returns {object[]} Array of sample dataset info
     */
    getSampleDatasetInfo() {
        return Object.entries(this.sampleDatasets).map(([id, dataset]) => ({
            id,
            name: dataset.name,
            description: dataset.description
        }));
    }
};

// Export for use in other modules
window.DataProcessor = DataProcessor;
