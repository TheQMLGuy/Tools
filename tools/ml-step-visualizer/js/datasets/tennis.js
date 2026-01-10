/**
 * Tennis Dataset - Classic Decision Tree Example
 * 14 samples with categorical features
 */

const TennisDataset = {
    name: 'Tennis (Play?)',
    type: 'classification',
    description: 'Classic dataset for decision tree learning - predicting whether to play tennis based on weather conditions.',

    features: ['Outlook', 'Temperature', 'Humidity', 'Wind'],
    target: 'Play',

    featureTypes: {
        'Outlook': 'categorical',
        'Temperature': 'categorical',
        'Humidity': 'categorical',
        'Wind': 'categorical'
    },

    categories: {
        'Outlook': ['Sunny', 'Overcast', 'Rain'],
        'Temperature': ['Hot', 'Mild', 'Cool'],
        'Humidity': ['High', 'Normal'],
        'Wind': ['Weak', 'Strong'],
        'Play': ['No', 'Yes']
    },

    data: [
        { Outlook: 'Sunny', Temperature: 'Hot', Humidity: 'High', Wind: 'Weak', Play: 'No' },
        { Outlook: 'Sunny', Temperature: 'Hot', Humidity: 'High', Wind: 'Strong', Play: 'No' },
        { Outlook: 'Overcast', Temperature: 'Hot', Humidity: 'High', Wind: 'Weak', Play: 'Yes' },
        { Outlook: 'Rain', Temperature: 'Mild', Humidity: 'High', Wind: 'Weak', Play: 'Yes' },
        { Outlook: 'Rain', Temperature: 'Cool', Humidity: 'Normal', Wind: 'Weak', Play: 'Yes' },
        { Outlook: 'Rain', Temperature: 'Cool', Humidity: 'Normal', Wind: 'Strong', Play: 'No' },
        { Outlook: 'Overcast', Temperature: 'Cool', Humidity: 'Normal', Wind: 'Strong', Play: 'Yes' },
        { Outlook: 'Sunny', Temperature: 'Mild', Humidity: 'High', Wind: 'Weak', Play: 'No' },
        { Outlook: 'Sunny', Temperature: 'Cool', Humidity: 'Normal', Wind: 'Weak', Play: 'Yes' },
        { Outlook: 'Rain', Temperature: 'Mild', Humidity: 'Normal', Wind: 'Weak', Play: 'Yes' },
        { Outlook: 'Sunny', Temperature: 'Mild', Humidity: 'Normal', Wind: 'Strong', Play: 'Yes' },
        { Outlook: 'Overcast', Temperature: 'Mild', Humidity: 'High', Wind: 'Strong', Play: 'Yes' },
        { Outlook: 'Overcast', Temperature: 'Hot', Humidity: 'Normal', Wind: 'Weak', Play: 'Yes' },
        { Outlook: 'Rain', Temperature: 'Mild', Humidity: 'High', Wind: 'Strong', Play: 'No' }
    ],

    // Helper methods
    getLabels() {
        return this.data.map(row => row[this.target]);
    },

    getFeatureValues(feature) {
        return this.data.map(row => row[feature]);
    },

    getUniqueValues(feature) {
        return [...new Set(this.getFeatureValues(feature))];
    },

    countByClass() {
        const counts = {};
        this.data.forEach(row => {
            const label = row[this.target];
            counts[label] = (counts[label] || 0) + 1;
        });
        return counts;
    },

    filterByFeatureValue(feature, value) {
        return this.data.filter(row => row[feature] === value);
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TennisDataset;
}
