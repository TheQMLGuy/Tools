/**
 * Housing Dataset - Regression Example
 * Numerical features for linear regression
 */

const HousingDataset = {
    name: 'Housing Prices',
    type: 'regression',
    description: 'Simple housing dataset for linear regression - predicting price from size and features.',

    features: ['Size (sqft)', 'Bedrooms', 'Age (years)', 'Distance to City'],
    target: 'Price ($1000s)',

    featureTypes: {
        'Size (sqft)': 'numerical',
        'Bedrooms': 'numerical',
        'Age (years)': 'numerical',
        'Distance to City': 'numerical'
    },

    // 20 samples for regression visualization
    data: [
        { 'Size (sqft)': 1400, Bedrooms: 3, 'Age (years)': 10, 'Distance to City': 5, 'Price ($1000s)': 245 },
        { 'Size (sqft)': 1600, Bedrooms: 3, 'Age (years)': 5, 'Distance to City': 8, 'Price ($1000s)': 312 },
        { 'Size (sqft)': 1700, Bedrooms: 3, 'Age (years)': 15, 'Distance to City': 3, 'Price ($1000s)': 279 },
        { 'Size (sqft)': 1875, Bedrooms: 4, 'Age (years)': 8, 'Distance to City': 12, 'Price ($1000s)': 308 },
        { 'Size (sqft)': 1100, Bedrooms: 2, 'Age (years)': 20, 'Distance to City': 2, 'Price ($1000s)': 199 },
        { 'Size (sqft)': 1550, Bedrooms: 3, 'Age (years)': 3, 'Distance to City': 6, 'Price ($1000s)': 289 },
        { 'Size (sqft)': 2350, Bedrooms: 4, 'Age (years)': 2, 'Distance to City': 15, 'Price ($1000s)': 399 },
        { 'Size (sqft)': 2450, Bedrooms: 5, 'Age (years)': 7, 'Distance to City': 10, 'Price ($1000s)': 425 },
        { 'Size (sqft)': 1425, Bedrooms: 3, 'Age (years)': 12, 'Distance to City': 4, 'Price ($1000s)': 232 },
        { 'Size (sqft)': 1700, Bedrooms: 3, 'Age (years)': 1, 'Distance to City': 7, 'Price ($1000s)': 335 },
        { 'Size (sqft)': 1200, Bedrooms: 2, 'Age (years)': 25, 'Distance to City': 1, 'Price ($1000s)': 178 },
        { 'Size (sqft)': 1800, Bedrooms: 4, 'Age (years)': 6, 'Distance to City': 9, 'Price ($1000s)': 315 },
        { 'Size (sqft)': 2100, Bedrooms: 4, 'Age (years)': 4, 'Distance to City': 11, 'Price ($1000s)': 368 },
        { 'Size (sqft)': 1650, Bedrooms: 3, 'Age (years)': 18, 'Distance to City': 5, 'Price ($1000s)': 259 },
        { 'Size (sqft)': 1900, Bedrooms: 4, 'Age (years)': 9, 'Distance to City': 8, 'Price ($1000s)': 329 },
        { 'Size (sqft)': 2200, Bedrooms: 4, 'Age (years)': 3, 'Distance to City': 14, 'Price ($1000s)': 379 },
        { 'Size (sqft)': 1300, Bedrooms: 2, 'Age (years)': 22, 'Distance to City': 3, 'Price ($1000s)': 195 },
        { 'Size (sqft)': 1750, Bedrooms: 3, 'Age (years)': 11, 'Distance to City': 6, 'Price ($1000s)': 285 },
        { 'Size (sqft)': 2000, Bedrooms: 4, 'Age (years)': 5, 'Distance to City': 10, 'Price ($1000s)': 349 },
        { 'Size (sqft)': 1500, Bedrooms: 3, 'Age (years)': 14, 'Distance to City': 4, 'Price ($1000s)': 249 }
    ],

    // For simple linear regression (Size vs Price)
    getSimpleData() {
        return this.data.map(row => ({
            x: row['Size (sqft)'],
            y: row['Price ($1000s)']
        }));
    },

    getFeatureValues(feature) {
        return this.data.map(row => row[feature]);
    },

    getTargetValues() {
        return this.data.map(row => row[this.target]);
    },

    // Statistics
    getStats(feature) {
        const values = this.getFeatureValues(feature);
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const std = Math.sqrt(variance);
        const min = Math.min(...values);
        const max = Math.max(...values);

        return { mean, std, min, max, n };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HousingDataset;
}
