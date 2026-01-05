/**
 * Correlation Module
 * Handles statistical calculations and angle mapping
 */

const CorrelationEngine = {
    /**
     * Calculate Pearson correlation coefficient between two arrays
     * @param {number[]} x - First array
     * @param {number[]} y - Second array
     * @returns {number} Correlation coefficient (-1 to 1)
     */
    pearsonCorrelation(x, y) {
        if (x.length !== y.length) {
            throw new Error('Arrays must have the same length');
        }

        const n = x.length;
        if (n < 2) {
            return 0;
        }

        // Calculate means
        const meanX = x.reduce((a, b) => a + b, 0) / n;
        const meanY = y.reduce((a, b) => a + b, 0) / n;

        // Calculate covariance and standard deviations
        let covariance = 0;
        let varX = 0;
        let varY = 0;

        for (let i = 0; i < n; i++) {
            const dx = x[i] - meanX;
            const dy = y[i] - meanY;
            covariance += dx * dy;
            varX += dx * dx;
            varY += dy * dy;
        }

        const stdX = Math.sqrt(varX);
        const stdY = Math.sqrt(varY);

        if (stdX === 0 || stdY === 0) {
            return 0; // No variation in one or both variables
        }

        return covariance / (stdX * stdY);
    },

    /**
     * Map correlation value to angle in degrees using R² similarity
     * Uses the formula: θ = arccos(r²)
     * where r² is the coefficient of determination (squared correlation)
     * 
     * r² = 1.0 → θ = arccos(1) = 0° (perfect correlation, at 0 degrees)
     * r² = 0.5 → θ = arccos(0.5) = 60°
     * r² = 0.0 → θ = arccos(0) = 90° (no correlation, at 90 degrees)
     * 
     * @param {number} correlation - Pearson correlation value (-1 to 1)
     * @returns {number} Angle in degrees (0 to 90)
     */
    correlationToAngle(correlation) {
        // Calculate R² (coefficient of determination)
        // R² is always positive, ranging from 0 to 1
        const rSquared = correlation * correlation;

        // Clamp to valid range for arccos [0, 1]
        const clampedRSquared = Math.max(0, Math.min(1, rSquared));

        // θ = arccos(r²), result in radians, convert to degrees
        const angleRadians = Math.acos(clampedRSquared);
        const angleDegrees = angleRadians * (180 / Math.PI);

        return angleDegrees;
    },

    /**
     * Convert angle to radians
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * Calculate correlations of all input columns with the target
     * @param {object} normalizedData - Normalized data object
     * @param {string} targetColumn - Name of target column
     * @returns {object} Correlations object with column names as keys
     */
    calculateTargetCorrelations(normalizedData, targetColumn) {
        const targetValues = normalizedData.columns[targetColumn];
        const correlations = {};

        for (const header of normalizedData.headers) {
            if (header !== targetColumn) {
                const inputValues = normalizedData.columns[header];
                correlations[header] = this.pearsonCorrelation(inputValues, targetValues);
            }
        }

        return correlations;
    },

    /**
     * Calculate pairwise correlations between all input columns
     * @param {object} normalizedData - Normalized data object
     * @param {string} targetColumn - Name of target column (excluded)
     * @returns {object} Matrix of pairwise correlations
     */
    calculateInputCorrelationMatrix(normalizedData, targetColumn) {
        const inputColumns = normalizedData.headers.filter(h => h !== targetColumn);
        const matrix = {};

        for (const col1 of inputColumns) {
            matrix[col1] = {};
            for (const col2 of inputColumns) {
                if (col1 === col2) {
                    matrix[col1][col2] = 1;
                } else {
                    matrix[col1][col2] = this.pearsonCorrelation(
                        normalizedData.columns[col1],
                        normalizedData.columns[col2]
                    );
                }
            }
        }

        return matrix;
    },

    /**
     * Detect collision groups - features with similar correlations
     * @param {object} correlations - Correlations object
     * @param {number} threshold - Similarity threshold (default 0.05)
     * @returns {object[]} Array of collision groups
     */
    detectCollisions(correlations, threshold = 0.05) {
        const features = Object.keys(correlations);
        const groups = [];
        const assigned = new Set();

        for (let i = 0; i < features.length; i++) {
            const feature1 = features[i];
            if (assigned.has(feature1)) continue;

            const group = {
                features: [feature1],
                correlations: [correlations[feature1]],
                averageCorrelation: correlations[feature1],
                angle: this.correlationToAngle(correlations[feature1]),
                isCollision: false
            };

            for (let j = i + 1; j < features.length; j++) {
                const feature2 = features[j];
                if (assigned.has(feature2)) continue;

                const diff = Math.abs(correlations[feature1] - correlations[feature2]);
                if (diff <= threshold) {
                    group.features.push(feature2);
                    group.correlations.push(correlations[feature2]);
                    assigned.add(feature2);
                }
            }

            assigned.add(feature1);

            // Calculate average correlation for the group
            group.averageCorrelation = group.correlations.reduce((a, b) => a + b, 0) / group.correlations.length;
            group.angle = this.correlationToAngle(group.averageCorrelation);
            group.isCollision = group.features.length > 1;

            groups.push(group);
        }

        return groups;
    },

    /**
     * Get angle assignments for each feature
     * @param {object} correlations - Correlations object
     * @param {number} threshold - Collision threshold
     * @returns {object} Feature angle assignments
     */
    getFeatureAngles(correlations, threshold = 0.05) {
        const collisionGroups = this.detectCollisions(correlations, threshold);
        const angleAssignments = {};

        for (const group of collisionGroups) {
            for (let i = 0; i < group.features.length; i++) {
                const feature = group.features[i];
                angleAssignments[feature] = {
                    angle: group.angle,
                    correlation: correlations[feature],
                    isCollision: group.isCollision,
                    groupSize: group.features.length,
                    groupFeatures: group.features,
                    groupIndex: i
                };
            }
        }

        return angleAssignments;
    },

    /**
     * Calculate angles for cluster-centric view
     * Uses MDS-like approach to position features based on inter-correlations
     * @param {object} correlationMatrix - Pairwise correlation matrix
     * @param {number} threshold - Collision threshold
     * @returns {object} Feature angle assignments
     */
    getClusterCentricAngles(correlationMatrix, threshold = 0.05) {
        const features = Object.keys(correlationMatrix);
        const angleAssignments = {};

        // Sort features by their average correlation with others
        const avgCorrelations = {};
        for (const feature of features) {
            const correlations = Object.values(correlationMatrix[feature]).filter(c => c !== 1);
            avgCorrelations[feature] = correlations.reduce((a, b) => a + b, 0) / correlations.length;
        }

        // Map average correlation to angle
        for (const feature of features) {
            const avgCorr = avgCorrelations[feature];
            const angle = this.correlationToAngle(avgCorr);

            angleAssignments[feature] = {
                angle: angle,
                correlation: avgCorr,
                isCollision: false,
                groupSize: 1,
                groupFeatures: [feature],
                groupIndex: 0
            };
        }

        // Detect collisions in this view
        const groups = [];
        const assigned = new Set();

        for (const feature1 of features) {
            if (assigned.has(feature1)) continue;

            const group = [feature1];

            for (const feature2 of features) {
                if (feature1 === feature2 || assigned.has(feature2)) continue;

                const angleDiff = Math.abs(
                    angleAssignments[feature1].angle - angleAssignments[feature2].angle
                );

                // Convert threshold to angle equivalent
                const angleThreshold = threshold * 90;
                if (angleDiff <= angleThreshold) {
                    group.push(feature2);
                    assigned.add(feature2);
                }
            }

            assigned.add(feature1);

            if (group.length > 1) {
                // Calculate average angle for the group
                const avgAngle = group.reduce((sum, f) => sum + angleAssignments[f].angle, 0) / group.length;

                for (let i = 0; i < group.length; i++) {
                    angleAssignments[group[i]].angle = avgAngle;
                    angleAssignments[group[i]].isCollision = true;
                    angleAssignments[group[i]].groupSize = group.length;
                    angleAssignments[group[i]].groupFeatures = group;
                    angleAssignments[group[i]].groupIndex = i;
                }
            }
        }

        return angleAssignments;
    },

    /**
     * Format correlation value for display
     * @param {number} correlation - Correlation value
     * @returns {string} Formatted string
     */
    formatCorrelation(correlation) {
        const sign = correlation >= 0 ? '+' : '';
        return sign + correlation.toFixed(3);
    },

    /**
     * Get correlation strength label
     * @param {number} correlation - Correlation value
     * @returns {string} Strength label
     */
    getCorrelationStrength(correlation) {
        const abs = Math.abs(correlation);
        if (abs >= 0.8) return 'Very Strong';
        if (abs >= 0.6) return 'Strong';
        if (abs >= 0.4) return 'Moderate';
        if (abs >= 0.2) return 'Weak';
        return 'Very Weak';
    }
};

// Export for use in other modules
window.CorrelationEngine = CorrelationEngine;
