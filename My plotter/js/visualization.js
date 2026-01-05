/**
 * 3D Visualization Module
 * Handles Plotly.js rendering of the cylindrical coordinate system
 */

const Visualization = {
    plotDiv: null,
    currentLayout: null,
    ghostingActive: false,
    ghostedGroup: null,

    /**
     * Initialize the visualization container
     * @param {string} containerId - DOM element ID for the plot
     */
    init(containerId) {
        this.plotDiv = document.getElementById(containerId);
    },

    /**
     * Convert cylindrical coordinates to Cartesian
     * @param {number} r - Radius
     * @param {number} theta - Angle in degrees
     * @param {number} z - Height
     * @returns {object} {x, y, z} Cartesian coordinates
     */
    cylindricalToCartesian(r, theta, z) {
        const thetaRad = CorrelationEngine.degreesToRadians(theta);
        return {
            x: r * Math.cos(thetaRad),
            y: r * Math.sin(thetaRad),
            z: z
        };
    },

    /**
     * Generate the central target axis (spine)
     * @param {number} numPoints - Number of points on the axis
     * @returns {object} Plotly trace for the target axis
     */
    createTargetAxis(numPoints = 50) {
        const z = [];
        for (let i = 0; i <= numPoints; i++) {
            z.push(i / numPoints);
        }

        return {
            type: 'scatter3d',
            mode: 'lines',
            x: new Array(z.length).fill(0),
            y: new Array(z.length).fill(0),
            z: z,
            line: {
                color: '#6366f1',
                width: 8
            },
            name: 'Target Axis',
            hoverinfo: 'name',
            showlegend: false
        };
    },

    /**
     * Create a cylinder wireframe for visual reference
     * @param {number} radius - Cylinder radius
     * @param {number} segments - Number of segments
     * @returns {object[]} Array of Plotly traces for the cylinder
     */
    createCylinderWireframe(radius = 1, segments = 36) {
        const traces = [];

        // Create circular rings at different heights
        const heights = [0, 0.25, 0.5, 0.75, 1];

        for (const h of heights) {
            const x = [];
            const y = [];
            const z = [];

            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * 360;
                const point = this.cylindricalToCartesian(radius, theta, h);
                x.push(point.x);
                y.push(point.y);
                z.push(point.z);
            }

            traces.push({
                type: 'scatter3d',
                mode: 'lines',
                x, y, z,
                line: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    width: 1
                },
                hoverinfo: 'skip',
                showlegend: false
            });
        }

        // Add vertical lines at key angles
        const angles = [0, 45, 90, 135, 180, 225, 270, 315];

        for (const angle of angles) {
            const point0 = this.cylindricalToCartesian(radius, angle, 0);
            const point1 = this.cylindricalToCartesian(radius, angle, 1);

            traces.push({
                type: 'scatter3d',
                mode: 'lines',
                x: [point0.x, point1.x],
                y: [point0.y, point1.y],
                z: [point0.z, point1.z],
                line: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    width: 1
                },
                hoverinfo: 'skip',
                showlegend: false
            });
        }

        return traces;
    },

    /**
     * Create feature axis trace
     * @param {string} featureName - Name of the feature
     * @param {number} angle - Angle position in degrees
     * @param {boolean} isCollision - Whether this axis has collided features
     * @param {number} groupSize - Number of features in collision group
     * @returns {object} Plotly trace for the feature axis
     */
    createFeatureAxis(featureName, angle, isCollision, groupSize) {
        const bottom = this.cylindricalToCartesian(1, angle, 0);
        const top = this.cylindricalToCartesian(1, angle, 1);

        let color;
        let width;

        if (!isCollision) {
            // Unique predictor - green
            color = '#00d4aa';
            width = 5;
        } else if (groupSize === 2) {
            // Two collided - yellow/orange
            color = '#fbbf24';
            width = 7;
        } else {
            // Many collided - red
            color = '#ff6b6b';
            width = 8 + (groupSize - 2);
        }

        return {
            type: 'scatter3d',
            mode: 'lines+markers',
            x: [bottom.x, top.x],
            y: [bottom.y, top.y],
            z: [bottom.z, top.z],
            line: {
                color: color,
                width: width
            },
            marker: {
                size: 6,
                color: color
            },
            name: featureName,
            text: featureName,
            hovertemplate: `<b>${featureName}</b><br>Angle: ${angle.toFixed(1)}°<extra></extra>`,
            showlegend: false,
            customdata: { featureName, angle, isCollision, groupSize }
        };
    },

    /**
     * Create data connection lines between feature values and target values
     * @param {object} normalizedData - Normalized data object
     * @param {string} targetColumn - Target column name
     * @param {object} angleAssignments - Angle assignments for features
     * @param {boolean} showConnections - Whether to show connections
     * @returns {object[]} Array of Plotly traces for connections
     */
    createConnectionLines(normalizedData, targetColumn, angleAssignments, showConnections = true) {
        if (!showConnections) return [];

        const traces = [];
        const targetValues = normalizedData.columns[targetColumn];
        const features = Object.keys(angleAssignments);

        // Create line traces for each row of data
        for (let rowIdx = 0; rowIdx < normalizedData.rowCount; rowIdx++) {
            for (const feature of features) {
                const assignment = angleAssignments[feature];
                const featureValue = normalizedData.columns[feature][rowIdx];
                const targetValue = targetValues[rowIdx];

                // Start point on feature axis (at radius 1)
                const start = this.cylindricalToCartesian(1, assignment.angle, featureValue);

                // End point on target axis (at radius 0)
                const end = { x: 0, y: 0, z: targetValue };

                // Color based on value relationship
                const diff = targetValue - featureValue;
                let color;
                if (Math.abs(diff) < 0.1) {
                    color = 'rgba(99, 102, 241, 0.3)'; // Similar values - purple
                } else if (diff > 0) {
                    color = 'rgba(0, 212, 170, 0.25)'; // Target higher - green
                } else {
                    color = 'rgba(255, 107, 107, 0.25)'; // Target lower - red
                }

                traces.push({
                    type: 'scatter3d',
                    mode: 'lines',
                    x: [start.x, end.x],
                    y: [start.y, end.y],
                    z: [start.z, end.z],
                    line: {
                        color: color,
                        width: 1.5
                    },
                    hoverinfo: 'skip',
                    showlegend: false,
                    visible: true,
                    customdata: {
                        feature: feature,
                        rowIndex: rowIdx,
                        groupFeatures: assignment.groupFeatures
                    }
                });
            }
        }

        return traces;
    },

    /**
     * Create data points on feature axes
     * @param {object} normalizedData - Normalized data object
     * @param {string} targetColumn - Target column name
     * @param {object} angleAssignments - Angle assignments for features
     * @returns {object[]} Array of Plotly traces for data points
     */
    createDataPoints(normalizedData, targetColumn, angleAssignments) {
        const traces = [];
        const targetValues = normalizedData.columns[targetColumn];
        const features = Object.keys(angleAssignments);

        // Create points for each feature
        for (const feature of features) {
            const assignment = angleAssignments[feature];
            const featureValues = normalizedData.columns[feature];

            const x = [];
            const y = [];
            const z = [];
            const hoverTexts = [];

            for (let i = 0; i < normalizedData.rowCount; i++) {
                const point = this.cylindricalToCartesian(1, assignment.angle, featureValues[i]);
                x.push(point.x);
                y.push(point.y);
                z.push(point.z);
                hoverTexts.push(
                    `<b>${feature}</b><br>` +
                    `Value: ${featureValues[i].toFixed(3)}<br>` +
                    `Target: ${targetValues[i].toFixed(3)}<br>` +
                    `Row: ${i + 1}`
                );
            }

            traces.push({
                type: 'scatter3d',
                mode: 'markers',
                x, y, z,
                marker: {
                    size: 4,
                    color: assignment.isCollision ? '#ff6b6b' : '#00d4aa',
                    opacity: 0.8
                },
                name: feature,
                hovertemplate: '%{text}<extra></extra>',
                text: hoverTexts,
                showlegend: false,
                customdata: {
                    feature: feature,
                    groupFeatures: assignment.groupFeatures
                }
            });
        }

        // Create points on target axis
        const targetX = [];
        const targetY = [];
        const targetZ = [];
        const targetHovers = [];

        for (let i = 0; i < normalizedData.rowCount; i++) {
            targetX.push(0);
            targetY.push(0);
            targetZ.push(targetValues[i]);
            targetHovers.push(
                `<b>${targetColumn}</b><br>` +
                `Value: ${targetValues[i].toFixed(3)}<br>` +
                `Row: ${i + 1}`
            );
        }

        traces.push({
            type: 'scatter3d',
            mode: 'markers',
            x: targetX,
            y: targetY,
            z: targetZ,
            marker: {
                size: 5,
                color: '#6366f1',
                opacity: 0.9
            },
            name: targetColumn,
            hovertemplate: '%{text}<extra></extra>',
            text: targetHovers,
            showlegend: false
        });

        return traces;
    },

    /**
     * Create angle markers showing correlation values
     * @param {object} angleAssignments - Angle assignments
     * @returns {object[]} Plotly traces for angle markers
     */
    createAngleMarkers(angleAssignments) {
        const traces = [];
        const processedAngles = new Set();

        for (const [feature, assignment] of Object.entries(angleAssignments)) {
            // Only create one marker per unique angle
            const angleKey = assignment.angle.toFixed(1);
            if (processedAngles.has(angleKey)) continue;
            processedAngles.add(angleKey);

            // Place label at the top of the axis
            const labelPos = this.cylindricalToCartesian(1.15, assignment.angle, 1.05);

            const labelText = assignment.isCollision
                ? `${assignment.groupSize} features<br>r=${assignment.correlation.toFixed(2)}`
                : `${feature}<br>r=${assignment.correlation.toFixed(2)}`;

            traces.push({
                type: 'scatter3d',
                mode: 'text',
                x: [labelPos.x],
                y: [labelPos.y],
                z: [labelPos.z],
                text: [labelText],
                textfont: {
                    size: 10,
                    color: assignment.isCollision ? '#ff6b6b' : '#00d4aa'
                },
                hoverinfo: 'skip',
                showlegend: false
            });
        }

        return traces;
    },

    /**
     * Get the 3D layout configuration
     * @returns {object} Plotly layout object
     */
    getLayout() {
        // Get container dimensions for proper sizing
        const container = this.plotDiv;
        const width = container ? container.clientWidth : 800;
        const height = container ? container.clientHeight : 600;

        return {
            autosize: true,
            width: width,
            height: height,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 0, r: 0, t: 0, b: 0 },
            scene: {
                xaxis: {
                    title: '',
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false,
                    range: [-1.5, 1.5],
                    backgroundcolor: 'rgba(0,0,0,0)'
                },
                yaxis: {
                    title: '',
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false,
                    range: [-1.5, 1.5],
                    backgroundcolor: 'rgba(0,0,0,0)'
                },
                zaxis: {
                    title: 'Normalized Value',
                    showgrid: true,
                    zeroline: false,
                    showticklabels: true,
                    range: [-0.1, 1.2],
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickfont: { color: 'rgba(255,255,255,0.6)', size: 10 },
                    titlefont: { color: 'rgba(255,255,255,0.8)', size: 12 },
                    backgroundcolor: 'rgba(0,0,0,0)'
                },
                bgcolor: 'rgba(0,0,0,0)',
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.2 },
                    up: { x: 0, y: 0, z: 1 }
                },
                aspectmode: 'cube'
            },
            showlegend: false,
            hovermode: 'closest'
        };
    },

    /**
     * Render the full visualization
     * @param {object} normalizedData - Normalized data
     * @param {string} targetColumn - Target column name
     * @param {object} angleAssignments - Angle assignments
     * @param {object} options - Visualization options
     */
    render(normalizedData, targetColumn, angleAssignments, options = {}) {
        const {
            showConnections = true,
            showGrid = true
        } = options;

        // Clear existing content
        this.plotDiv.innerHTML = '';

        // Collect all traces
        const traces = [];

        // Add cylinder wireframe if enabled
        if (showGrid) {
            traces.push(...this.createCylinderWireframe());
        }

        // Add target axis
        traces.push(this.createTargetAxis());

        // Add feature axes
        for (const [feature, assignment] of Object.entries(angleAssignments)) {
            traces.push(this.createFeatureAxis(
                feature,
                assignment.angle,
                assignment.isCollision,
                assignment.groupSize
            ));
        }

        // Add connection lines
        traces.push(...this.createConnectionLines(
            normalizedData,
            targetColumn,
            angleAssignments,
            showConnections
        ));

        // Add data points
        traces.push(...this.createDataPoints(normalizedData, targetColumn, angleAssignments));

        // Add angle markers/labels
        traces.push(...this.createAngleMarkers(angleAssignments));

        // Create the plot
        this.currentLayout = this.getLayout();

        Plotly.newPlot(this.plotDiv, traces, this.currentLayout, {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
            displaylogo: false
        });

        // Store traces for ghosting functionality
        this.currentTraces = traces;
    },

    /**
     * Reset the camera to default view
     */
    resetCamera() {
        if (this.plotDiv) {
            Plotly.relayout(this.plotDiv, {
                'scene.camera': {
                    eye: { x: 1.5, y: 1.5, z: 1.2 },
                    up: { x: 0, y: 0, z: 1 }
                }
            });
        }
    },

    /**
     * Apply ghosting effect - dim all traces except those belonging to a specific group
     * @param {string[]} highlightFeatures - Features to keep highlighted
     */
    applyGhosting(highlightFeatures) {
        if (!this.plotDiv || !this.currentTraces) return;

        const updates = { opacity: [] };

        for (let i = 0; i < this.currentTraces.length; i++) {
            const trace = this.currentTraces[i];
            const customdata = trace.customdata;

            if (customdata && customdata.feature) {
                if (highlightFeatures.includes(customdata.feature)) {
                    updates.opacity.push(1);
                } else {
                    updates.opacity.push(0.1);
                }
            } else if (customdata && customdata.groupFeatures) {
                const overlap = customdata.groupFeatures.some(f => highlightFeatures.includes(f));
                updates.opacity.push(overlap ? 1 : 0.1);
            } else {
                updates.opacity.push(0.3);
            }
        }

        // Apply updates to marker and line opacity
        // Note: Plotly doesn't directly support trace-level opacity changes easily
        // We'll use restyle to modify visibility
        this.ghostingActive = true;
        this.ghostedGroup = highlightFeatures;
    },

    /**
     * Remove ghosting effect
     */
    removeGhosting() {
        if (!this.plotDiv) return;
        this.ghostingActive = false;
        this.ghostedGroup = null;
        // Re-render to restore full opacity
    },

    /**
     * Update visualization options without full re-render
     * @param {object} options - Options to update
     */
    updateOptions(options) {
        // For now, this triggers a full re-render
        // A more optimized version could use Plotly.restyle
    }
};

// Export for use in other modules
window.Visualization = Visualization;
