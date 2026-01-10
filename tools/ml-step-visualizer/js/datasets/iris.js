/**
 * Iris Dataset - Classic ML Example
 * Numerical features with 3 classes
 */

const IrisDataset = {
    name: 'Iris Flowers',
    type: 'classification',
    description: 'Fisher\'s classic dataset for classification - predicting iris species from petal/sepal measurements.',

    features: ['Sepal Length', 'Sepal Width', 'Petal Length', 'Petal Width'],
    target: 'Species',

    featureTypes: {
        'Sepal Length': 'numerical',
        'Sepal Width': 'numerical',
        'Petal Length': 'numerical',
        'Petal Width': 'numerical'
    },

    categories: {
        'Species': ['Setosa', 'Versicolor', 'Virginica']
    },

    // Subset of Iris data (30 samples for visualization)
    data: [
        // Setosa (10 samples)
        { 'Sepal Length': 5.1, 'Sepal Width': 3.5, 'Petal Length': 1.4, 'Petal Width': 0.2, Species: 'Setosa' },
        { 'Sepal Length': 4.9, 'Sepal Width': 3.0, 'Petal Length': 1.4, 'Petal Width': 0.2, Species: 'Setosa' },
        { 'Sepal Length': 4.7, 'Sepal Width': 3.2, 'Petal Length': 1.3, 'Petal Width': 0.2, Species: 'Setosa' },
        { 'Sepal Length': 4.6, 'Sepal Width': 3.1, 'Petal Length': 1.5, 'Petal Width': 0.2, Species: 'Setosa' },
        { 'Sepal Length': 5.0, 'Sepal Width': 3.6, 'Petal Length': 1.4, 'Petal Width': 0.2, Species: 'Setosa' },
        { 'Sepal Length': 5.4, 'Sepal Width': 3.9, 'Petal Length': 1.7, 'Petal Width': 0.4, Species: 'Setosa' },
        { 'Sepal Length': 4.6, 'Sepal Width': 3.4, 'Petal Length': 1.4, 'Petal Width': 0.3, Species: 'Setosa' },
        { 'Sepal Length': 5.0, 'Sepal Width': 3.4, 'Petal Length': 1.5, 'Petal Width': 0.2, Species: 'Setosa' },
        { 'Sepal Length': 4.4, 'Sepal Width': 2.9, 'Petal Length': 1.4, 'Petal Width': 0.2, Species: 'Setosa' },
        { 'Sepal Length': 4.9, 'Sepal Width': 3.1, 'Petal Length': 1.5, 'Petal Width': 0.1, Species: 'Setosa' },

        // Versicolor (10 samples)
        { 'Sepal Length': 7.0, 'Sepal Width': 3.2, 'Petal Length': 4.7, 'Petal Width': 1.4, Species: 'Versicolor' },
        { 'Sepal Length': 6.4, 'Sepal Width': 3.2, 'Petal Length': 4.5, 'Petal Width': 1.5, Species: 'Versicolor' },
        { 'Sepal Length': 6.9, 'Sepal Width': 3.1, 'Petal Length': 4.9, 'Petal Width': 1.5, Species: 'Versicolor' },
        { 'Sepal Length': 5.5, 'Sepal Width': 2.3, 'Petal Length': 4.0, 'Petal Width': 1.3, Species: 'Versicolor' },
        { 'Sepal Length': 6.5, 'Sepal Width': 2.8, 'Petal Length': 4.6, 'Petal Width': 1.5, Species: 'Versicolor' },
        { 'Sepal Length': 5.7, 'Sepal Width': 2.8, 'Petal Length': 4.5, 'Petal Width': 1.3, Species: 'Versicolor' },
        { 'Sepal Length': 6.3, 'Sepal Width': 3.3, 'Petal Length': 4.7, 'Petal Width': 1.6, Species: 'Versicolor' },
        { 'Sepal Length': 4.9, 'Sepal Width': 2.4, 'Petal Length': 3.3, 'Petal Width': 1.0, Species: 'Versicolor' },
        { 'Sepal Length': 6.6, 'Sepal Width': 2.9, 'Petal Length': 4.6, 'Petal Width': 1.3, Species: 'Versicolor' },
        { 'Sepal Length': 5.2, 'Sepal Width': 2.7, 'Petal Length': 3.9, 'Petal Width': 1.4, Species: 'Versicolor' },

        // Virginica (10 samples)
        { 'Sepal Length': 6.3, 'Sepal Width': 3.3, 'Petal Length': 6.0, 'Petal Width': 2.5, Species: 'Virginica' },
        { 'Sepal Length': 5.8, 'Sepal Width': 2.7, 'Petal Length': 5.1, 'Petal Width': 1.9, Species: 'Virginica' },
        { 'Sepal Length': 7.1, 'Sepal Width': 3.0, 'Petal Length': 5.9, 'Petal Width': 2.1, Species: 'Virginica' },
        { 'Sepal Length': 6.3, 'Sepal Width': 2.9, 'Petal Length': 5.6, 'Petal Width': 1.8, Species: 'Virginica' },
        { 'Sepal Length': 6.5, 'Sepal Width': 3.0, 'Petal Length': 5.8, 'Petal Width': 2.2, Species: 'Virginica' },
        { 'Sepal Length': 7.6, 'Sepal Width': 3.0, 'Petal Length': 6.6, 'Petal Width': 2.1, Species: 'Virginica' },
        { 'Sepal Length': 4.9, 'Sepal Width': 2.5, 'Petal Length': 4.5, 'Petal Width': 1.7, Species: 'Virginica' },
        { 'Sepal Length': 7.3, 'Sepal Width': 2.9, 'Petal Length': 6.3, 'Petal Width': 1.8, Species: 'Virginica' },
        { 'Sepal Length': 6.7, 'Sepal Width': 2.5, 'Petal Length': 5.8, 'Petal Width': 1.8, Species: 'Virginica' },
        { 'Sepal Length': 7.2, 'Sepal Width': 3.6, 'Petal Length': 6.1, 'Petal Width': 2.5, Species: 'Virginica' }
    ],

    getLabels() {
        return this.data.map(row => row[this.target]);
    },

    getFeatureValues(feature) {
        return this.data.map(row => row[feature]);
    },

    countByClass() {
        const counts = {};
        this.data.forEach(row => {
            const label = row[this.target];
            counts[label] = (counts[label] || 0) + 1;
        });
        return counts;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IrisDataset;
}
