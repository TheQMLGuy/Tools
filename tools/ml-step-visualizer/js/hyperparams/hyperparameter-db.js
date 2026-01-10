/**
 * Hyperparameter Database
 * Complete scikit-learn hyperparameters for all major algorithms
 */

const HyperparameterDB = {

    // ============================================
    // Decision Tree Classifier
    // ============================================
    'decision-tree': {
        name: 'DecisionTreeClassifier',
        importPath: 'from sklearn.tree import DecisionTreeClassifier',
        description: 'Decision Tree Classifier - Non-parametric supervised learning method for classification.',
        dataType: 'Classification problems requiring interpretable models, feature importance analysis.',

        parameters: {
            criterion: {
                type: 'select',
                options: ['gini', 'entropy', 'log_loss'],
                default: 'gini',
                label: 'Criterion',
                description: 'Function to measure quality of split',
                details: {
                    'gini': 'Gini impurity - measures probability of misclassification',
                    'entropy': 'Information gain - measures reduction in entropy',
                    'log_loss': 'Log loss - uses probability estimates'
                },
                guidance: {
                    general: 'Minimal difference in practice. Gini is computationally faster.',
                    whenToUse: {
                        'gini': 'General purpose, faster computation',
                        'entropy': 'When you want more balanced splits'
                    }
                }
            },

            splitter: {
                type: 'select',
                options: ['best', 'random'],
                default: 'best',
                label: 'Splitter',
                description: 'Strategy to choose split at each node',
                details: {
                    'best': 'Best split among all features',
                    'random': 'Best split among random subset'
                },
                guidance: {
                    whenToIncrease: 'Use "random" to reduce overfitting',
                    whenToDecrease: 'Use "best" for standard decision tree'
                }
            },

            max_depth: {
                type: 'int',
                range: [1, 30],
                default: null,
                label: 'Max Depth',
                description: 'Maximum depth of tree',
                guidance: {
                    whenToIncrease: 'For more complex patterns, higher accuracy on training data',
                    whenToDecrease: 'To prevent overfitting, improve generalization',
                    tuningRange: '3-10 typically gives good results'
                }
            },

            min_samples_split: {
                type: 'int',
                range: [2, 50],
                default: 2,
                label: 'Min Samples Split',
                description: 'Minimum samples required to split an internal node',
                guidance: {
                    whenToIncrease: 'To create simpler trees, reduce overfitting',
                    whenToDecrease: 'To allow more complex trees',
                    tuningRange: '2-20 typically'
                }
            },

            min_samples_leaf: {
                type: 'int',
                range: [1, 50],
                default: 1,
                label: 'Min Samples Leaf',
                description: 'Minimum samples required at a leaf node',
                guidance: {
                    whenToIncrease: 'For smoother predictions, reduce overfitting',
                    whenToDecrease: 'To allow more specific predictions',
                    tuningRange: '1-20 typically'
                }
            },

            max_features: {
                type: 'select',
                options: ['auto', 'sqrt', 'log2', 'all'],
                default: 'all',
                label: 'Max Features',
                description: 'Number of features to consider for best split',
                details: {
                    'auto': 'Same as sqrt',
                    'sqrt': 'sqrt(n_features)',
                    'log2': 'log2(n_features)',
                    'all': 'Use all features'
                },
                guidance: {
                    whenToDecrease: 'To reduce overfitting and variance',
                    general: 'Use sqrt or log2 for high-dimensional data'
                }
            },

            max_leaf_nodes: {
                type: 'int',
                range: [2, 100],
                default: null,
                label: 'Max Leaf Nodes',
                description: 'Maximum number of leaf nodes',
                guidance: {
                    whenToDecrease: 'To limit tree complexity',
                    general: 'Alternative to max_depth for controlling tree size'
                }
            },

            min_impurity_decrease: {
                type: 'float',
                range: [0, 0.5],
                step: 0.01,
                default: 0.0,
                label: 'Min Impurity Decrease',
                description: 'Minimum impurity decrease required for split',
                guidance: {
                    whenToIncrease: 'To prune nodes with small improvements',
                    tuningRange: '0.0 to 0.01 typically'
                }
            },

            class_weight: {
                type: 'select',
                options: ['none', 'balanced'],
                default: 'none',
                label: 'Class Weight',
                description: 'Weights associated with classes',
                details: {
                    'none': 'All classes have equal weight',
                    'balanced': 'Adjust weights inversely to class frequencies'
                },
                guidance: {
                    whenToUse: {
                        'balanced': 'For imbalanced datasets'
                    }
                }
            },

            ccp_alpha: {
                type: 'float',
                range: [0, 0.1],
                step: 0.001,
                default: 0.0,
                label: 'CCP Alpha',
                description: 'Complexity parameter for Minimal Cost-Complexity Pruning',
                guidance: {
                    whenToIncrease: 'To get simpler trees via post-pruning',
                    tuningRange: '0.0 to 0.1 typically',
                    general: 'Use cost_complexity_pruning_path to find optimal value'
                }
            },

            random_state: {
                type: 'int',
                range: [0, 1000],
                default: 42,
                label: 'Random State',
                description: 'Seed for random number generator',
                guidance: {
                    general: 'Set for reproducible results'
                }
            }
        },

        tamingStrategy: [
            'Start with max_depth=3-10 to prevent overfitting',
            'Use min_samples_split=5-20 and min_samples_leaf=5-20 for robustness',
            'Set class_weight="balanced" for imbalanced datasets',
            'Use ccp_alpha with cost-complexity pruning for optimal tree size',
            'For feature selection, use max_features="sqrt" or "log2"',
            'Set random_state for reproducible results',
            'Monitor overfitting with cross-validation'
        ]
    },

    // ============================================
    // Linear Regression
    // ============================================
    'linear-regression': {
        name: 'LinearRegression',
        importPath: 'from sklearn.linear_model import LinearRegression',
        description: 'Ordinary Least Squares Linear Regression',
        dataType: 'Regression problems with linear relationships between features and target.',

        parameters: {
            fit_intercept: {
                type: 'boolean',
                default: true,
                label: 'Fit Intercept',
                description: 'Whether to calculate the intercept for this model',
                guidance: {
                    whenToDisable: 'When data is already centered',
                    general: 'Almost always keep True'
                }
            },

            copy_X: {
                type: 'boolean',
                default: true,
                label: 'Copy X',
                description: 'If True, X will be copied; else, it may be overwritten',
                guidance: {
                    whenToDisable: 'Memory constraints, don\'t need original data',
                    general: 'Keep True for data safety'
                }
            },

            n_jobs: {
                type: 'int',
                range: [-1, 16],
                default: null,
                label: 'N Jobs',
                description: 'Number of jobs to use for computation',
                guidance: {
                    general: 'Use -1 to use all processors'
                }
            },

            positive: {
                type: 'boolean',
                default: false,
                label: 'Positive',
                description: 'Force coefficients to be positive',
                guidance: {
                    whenToEnable: 'When negative coefficients don\'t make sense in domain'
                }
            }
        },

        // Gradient Descent parameters (for visualization)
        gradientDescent: {
            learning_rate: {
                type: 'float',
                range: [0.0001, 1.0],
                step: 0.001,
                default: 0.01,
                label: 'Learning Rate (α)',
                description: 'Step size for gradient descent updates',
                guidance: {
                    whenToIncrease: 'For faster convergence (may overshoot)',
                    whenToDecrease: 'For more stable but slower convergence'
                }
            },

            n_iterations: {
                type: 'int',
                range: [10, 1000],
                default: 100,
                label: 'Iterations',
                description: 'Number of gradient descent iterations',
                guidance: {
                    whenToIncrease: 'For better convergence',
                    whenToDecrease: 'For faster training'
                }
            }
        },

        tamingStrategy: [
            'Always scale features before fitting for consistent coefficient interpretation',
            'Use fit_intercept=False only if you\'re certain data is centered',
            'For large datasets, use n_jobs=-1 to utilize all CPU cores',
            'Consider Ridge or Lasso for regularization when overfitting'
        ]
    },

    // ============================================
    // K-Nearest Neighbors
    // ============================================
    'knn': {
        name: 'KNeighborsClassifier',
        importPath: 'from sklearn.neighbors import KNeighborsClassifier',
        description: 'k-Nearest Neighbors Classifier - Classifies based on majority vote of k nearest neighbors.',
        dataType: 'Classification problems where decision boundaries are complex.',

        parameters: {
            n_neighbors: {
                type: 'int',
                range: [1, 50],
                default: 5,
                label: 'K (Neighbors)',
                description: 'Number of neighbors to use for classification',
                guidance: {
                    whenToIncrease: 'For smoother decision boundaries, less overfitting',
                    whenToDecrease: 'For more complex boundaries, capture local patterns',
                    tuningRange: 'Typically 3-15, use odd numbers for binary classification'
                }
            },

            weights: {
                type: 'select',
                options: ['uniform', 'distance'],
                default: 'uniform',
                label: 'Weights',
                description: 'Weight function used in prediction',
                details: {
                    'uniform': 'All neighbors weighted equally',
                    'distance': 'Closer neighbors have more influence'
                },
                guidance: {
                    whenToUse: {
                        'distance': 'When closer neighbors should matter more'
                    }
                }
            },

            algorithm: {
                type: 'select',
                options: ['auto', 'ball_tree', 'kd_tree', 'brute'],
                default: 'auto',
                label: 'Algorithm',
                description: 'Algorithm used to compute nearest neighbors',
                details: {
                    'auto': 'Automatically choose best algorithm',
                    'ball_tree': 'BallTree algorithm',
                    'kd_tree': 'KDTree algorithm',
                    'brute': 'Brute-force search'
                },
                guidance: {
                    general: 'Use "auto" for most cases. "brute" for high-dimensional data.'
                }
            },

            metric: {
                type: 'select',
                options: ['euclidean', 'manhattan', 'minkowski', 'cosine'],
                default: 'euclidean',
                label: 'Distance Metric',
                description: 'Distance metric for neighbor calculations',
                guidance: {
                    whenToUse: {
                        'euclidean': 'Standard distance, works well for most cases',
                        'manhattan': 'Better for high-dimensional data',
                        'cosine': 'For text/directional data'
                    }
                }
            },

            p: {
                type: 'int',
                range: [1, 5],
                default: 2,
                label: 'Power Parameter (p)',
                description: 'Power parameter for Minkowski metric',
                guidance: {
                    general: 'p=1 is Manhattan, p=2 is Euclidean'
                }
            },

            leaf_size: {
                type: 'int',
                range: [10, 100],
                default: 30,
                label: 'Leaf Size',
                description: 'Leaf size for tree algorithms',
                guidance: {
                    whenToDecrease: 'Faster queries but slower construction',
                    whenToIncrease: 'Faster construction but slower queries'
                }
            }
        },

        tamingStrategy: [
            'Always scale features before fitting (k-NN is distance-based)',
            'Start with k=5, then tune using cross-validation',
            'Use odd k for binary classification to avoid ties',
            'Try weights="distance" for better performance',
            'For high-dimensional data, consider dimensionality reduction first'
        ]
    },

    // ============================================
    // K-Means Clustering
    // ============================================
    'kmeans': {
        name: 'KMeans',
        importPath: 'from sklearn.cluster import KMeans',
        description: 'K-Means Clustering - Partitions data into k clusters by minimizing within-cluster variance.',
        dataType: 'Unsupervised clustering problems with spherical clusters.',

        parameters: {
            n_clusters: {
                type: 'int',
                range: [2, 20],
                default: 3,
                label: 'K (Clusters)',
                description: 'Number of clusters to form',
                guidance: {
                    whenToIncrease: 'For finer granularity clustering',
                    whenToDecrease: 'For coarser clustering',
                    tuningRange: 'Use elbow method or silhouette analysis'
                }
            },

            init: {
                type: 'select',
                options: ['k-means++', 'random'],
                default: 'k-means++',
                label: 'Initialization',
                description: 'Method for initialization',
                details: {
                    'k-means++': 'Smart initialization for better convergence',
                    'random': 'Random centroid initialization'
                },
                guidance: {
                    general: 'Always use k-means++ for better results'
                }
            },

            n_init: {
                type: 'int',
                range: [1, 20],
                default: 10,
                label: 'N Initializations',
                description: 'Number of times algorithm runs with different seeds',
                guidance: {
                    whenToIncrease: 'For more robust results',
                    whenToDecrease: 'For faster training'
                }
            },

            max_iter: {
                type: 'int',
                range: [100, 1000],
                default: 300,
                label: 'Max Iterations',
                description: 'Maximum iterations per single run',
                guidance: {
                    whenToIncrease: 'If algorithm doesn\'t converge',
                    general: '300 is usually sufficient'
                }
            },

            tol: {
                type: 'float',
                range: [0.00001, 0.01],
                step: 0.00001,
                default: 0.0001,
                label: 'Tolerance',
                description: 'Tolerance for convergence',
                guidance: {
                    whenToDecrease: 'For more precise convergence',
                    whenToIncrease: 'For faster convergence'
                }
            },

            algorithm: {
                type: 'select',
                options: ['lloyd', 'elkan'],
                default: 'lloyd',
                label: 'Algorithm',
                description: 'K-means algorithm to use',
                details: {
                    'lloyd': 'Standard EM-style algorithm',
                    'elkan': 'Uses triangle inequality, faster for well-clustered data'
                }
            },

            random_state: {
                type: 'int',
                range: [0, 1000],
                default: 42,
                label: 'Random State',
                description: 'Seed for random number generator'
            }
        },

        tamingStrategy: [
            'Always scale features before clustering',
            'Use elbow method to determine optimal k',
            'Use init="k-means++" for better initialization',
            'Increase n_init for more robust results',
            'Monitor inertia (within-cluster sum of squares)'
        ]
    },

    // ============================================
    // Naive Bayes (Gaussian)
    // ============================================
    'naive-bayes': {
        name: 'GaussianNB',
        importPath: 'from sklearn.naive_bayes import GaussianNB',
        description: 'Gaussian Naive Bayes - Assumes features follow Gaussian distribution.',
        dataType: 'Classification with continuous features, especially good for high-dimensional data.',

        parameters: {
            var_smoothing: {
                type: 'float',
                range: [1e-12, 1e-3],
                step: 1e-12,
                default: 1e-9,
                label: 'Variance Smoothing',
                description: 'Portion of largest variance added to all variances for stability',
                guidance: {
                    whenToIncrease: 'If getting numerical instability errors',
                    general: 'Default usually works well'
                }
            }
        },

        // For Multinomial/Bernoulli variants
        multinomialParameters: {
            alpha: {
                type: 'float',
                range: [0, 10],
                step: 0.1,
                default: 1.0,
                label: 'Alpha (Smoothing)',
                description: 'Additive (Laplace/Lidstone) smoothing parameter',
                guidance: {
                    whenToIncrease: 'For more smoothing, handling zero probabilities',
                    whenToDecrease: 'For less smoothing, more confident predictions',
                    tuningRange: '0.1-10.0 typically'
                }
            },

            fit_prior: {
                type: 'boolean',
                default: true,
                label: 'Fit Prior',
                description: 'Whether to learn class prior probabilities',
                guidance: {
                    whenToDisable: 'When you want uniform class priors'
                }
            }
        },

        tamingStrategy: [
            'Fast training and prediction - good baseline model',
            'Works well with high-dimensional data',
            'Features should be independent (Naive assumption)',
            'Use MultinomialNB for discrete/count data (text)',
            'Use BernoulliNB for binary features'
        ]
    },

    // ============================================
    // Logistic Regression
    // ============================================
    'logistic-regression': {
        name: 'LogisticRegression',
        importPath: 'from sklearn.linear_model import LogisticRegression',
        description: 'Logistic Regression - Linear model for classification using sigmoid function.',
        dataType: 'Binary and multi-class classification problems.',

        parameters: {
            penalty: {
                type: 'select',
                options: ['l1', 'l2', 'elasticnet', 'none'],
                default: 'l2',
                label: 'Penalty',
                description: 'Type of regularization',
                details: {
                    'l1': 'Lasso regularization - promotes sparsity',
                    'l2': 'Ridge regularization - shrinks coefficients',
                    'elasticnet': 'Combination of L1 and L2',
                    'none': 'No regularization'
                },
                guidance: {
                    whenToUse: {
                        'l1': 'For feature selection',
                        'l2': 'Standard choice for most problems',
                        'elasticnet': 'When you want both feature selection and shrinkage'
                    }
                }
            },

            C: {
                type: 'float',
                range: [0.001, 100],
                step: 0.001,
                default: 1.0,
                label: 'C (Inverse Regularization)',
                description: 'Inverse of regularization strength (smaller = stronger)',
                guidance: {
                    whenToIncrease: 'For weaker regularization, more complex model',
                    whenToDecrease: 'For stronger regularization, simpler model',
                    tuningRange: 'Log scale: 0.001, 0.01, 0.1, 1, 10, 100'
                }
            },

            solver: {
                type: 'select',
                options: ['lbfgs', 'liblinear', 'newton-cg', 'sag', 'saga'],
                default: 'lbfgs',
                label: 'Solver',
                description: 'Algorithm for optimization',
                details: {
                    'lbfgs': 'Good for small datasets, L2 only',
                    'liblinear': 'Good for small datasets, L1/L2',
                    'saga': 'Best for large datasets, supports all penalties'
                }
            },

            max_iter: {
                type: 'int',
                range: [100, 2000],
                default: 100,
                label: 'Max Iterations',
                description: 'Maximum iterations for solver',
                guidance: {
                    whenToIncrease: 'If convergence warnings appear',
                    general: 'Start with 100, increase to 500-1000 if needed'
                }
            },

            class_weight: {
                type: 'select',
                options: ['none', 'balanced'],
                default: 'none',
                label: 'Class Weight',
                description: 'Weights for classes',
                guidance: {
                    whenToUse: {
                        'balanced': 'For imbalanced datasets'
                    }
                }
            },

            random_state: {
                type: 'int',
                range: [0, 1000],
                default: 42,
                label: 'Random State',
                description: 'Seed for random number generator'
            }
        },

        tamingStrategy: [
            'Scale features for faster convergence',
            'Start with C=1.0, tune with cross-validation',
            'Use penalty="l1" for feature selection',
            'Increase max_iter if you get convergence warnings',
            'Use class_weight="balanced" for imbalanced data'
        ]
    },

    // ============================================
    // Support Vector Machine
    // ============================================
    'svm': {
        name: 'SVC',
        importPath: 'from sklearn.svm import SVC',
        description: 'Support Vector Classifier - Finds optimal hyperplane to separate classes.',
        dataType: 'Classification problems with clear margins between classes.',

        parameters: {
            C: {
                type: 'float',
                range: [0.001, 100],
                step: 0.001,
                default: 1.0,
                label: 'C (Regularization)',
                description: 'Regularization parameter - trade-off between margin size and misclassification',
                guidance: {
                    whenToIncrease: 'For smaller margin, less misclassification allowed',
                    whenToDecrease: 'For larger margin, more tolerant to misclassification',
                    tuningRange: 'Log scale: 0.001, 0.01, 0.1, 1, 10, 100'
                }
            },

            kernel: {
                type: 'select',
                options: ['linear', 'poly', 'rbf', 'sigmoid'],
                default: 'rbf',
                label: 'Kernel',
                description: 'Kernel type for algorithm',
                details: {
                    'linear': 'Linear hyperplane',
                    'poly': 'Polynomial kernel',
                    'rbf': 'Radial basis function (Gaussian)',
                    'sigmoid': 'Sigmoid kernel'
                },
                guidance: {
                    whenToUse: {
                        'linear': 'Linearly separable data',
                        'rbf': 'Most cases, good default',
                        'poly': 'When polynomial relationships exist'
                    }
                }
            },

            degree: {
                type: 'int',
                range: [1, 10],
                default: 3,
                label: 'Degree',
                description: 'Degree of polynomial kernel',
                guidance: {
                    general: 'Only used when kernel="poly"'
                }
            },

            gamma: {
                type: 'select',
                options: ['scale', 'auto'],
                default: 'scale',
                label: 'Gamma',
                description: 'Kernel coefficient for rbf, poly, sigmoid',
                details: {
                    'scale': '1 / (n_features * X.var())',
                    'auto': '1 / n_features'
                },
                guidance: {
                    whenToIncrease: 'For tighter decision boundary',
                    whenToDecrease: 'For smoother decision boundary'
                }
            },

            class_weight: {
                type: 'select',
                options: ['none', 'balanced'],
                default: 'none',
                label: 'Class Weight',
                description: 'Weights for classes'
            },

            probability: {
                type: 'boolean',
                default: false,
                label: 'Probability',
                description: 'Enable probability estimates',
                guidance: {
                    whenToEnable: 'When you need predict_proba()',
                    general: 'Slows down training'
                }
            },

            random_state: {
                type: 'int',
                range: [0, 1000],
                default: 42,
                label: 'Random State',
                description: 'Seed for random number generator'
            }
        },

        tamingStrategy: [
            'Always scale features - SVM is sensitive to feature scales',
            'Start with kernel="rbf" and C=1.0',
            'Use GridSearchCV to tune C and gamma together',
            'For large datasets, consider LinearSVC instead',
            'Enable probability=True only if needed (slower)'
        ]
    },

    // ============================================
    // PCA
    // ============================================
    'pca': {
        name: 'PCA',
        importPath: 'from sklearn.decomposition import PCA',
        description: 'Principal Component Analysis - Dimensionality reduction using eigenvalue decomposition.',
        dataType: 'Dimensionality reduction, feature extraction, visualization.',

        parameters: {
            n_components: {
                type: 'int',
                range: [1, 20],
                default: 2,
                label: 'N Components',
                description: 'Number of components to keep',
                guidance: {
                    whenToIncrease: 'To retain more variance',
                    whenToDecrease: 'For more aggressive dimensionality reduction',
                    tuningRange: 'Use explained_variance_ratio_ to decide'
                }
            },

            whiten: {
                type: 'boolean',
                default: false,
                label: 'Whiten',
                description: 'Whether to whiten (decorrelate) components',
                guidance: {
                    whenToEnable: 'When downstream algorithms expect uncorrelated features'
                }
            },

            svd_solver: {
                type: 'select',
                options: ['auto', 'full', 'arpack', 'randomized'],
                default: 'auto',
                label: 'SVD Solver',
                description: 'Algorithm for SVD computation',
                details: {
                    'auto': 'Automatically choose best solver',
                    'full': 'Full SVD, exact solution',
                    'arpack': 'Truncated SVD via ARPACK',
                    'randomized': 'Randomized SVD, faster for large data'
                },
                guidance: {
                    whenToUse: {
                        'full': 'Small datasets, exact solution',
                        'randomized': 'Large datasets, approximate but fast'
                    }
                }
            },

            random_state: {
                type: 'int',
                range: [0, 1000],
                default: 42,
                label: 'Random State',
                description: 'Seed for random number generator'
            }
        },

        tamingStrategy: [
            'Center (and often scale) features before PCA',
            'Use explained_variance_ratio_ to determine n_components',
            'For visualization, use n_components=2 or 3',
            'Check cumulative explained variance to retain 95%+ variance',
            'PCA components may not be interpretable'
        ]
    },

    // ============================================
    // Random Forest
    // ============================================
    'random-forest': {
        name: 'RandomForestClassifier',
        importPath: 'from sklearn.ensemble import RandomForestClassifier',
        description: 'Random Forest - Ensemble of decision trees with bootstrap aggregating.',
        dataType: 'Classification problems requiring high accuracy and feature importance.',

        parameters: {
            n_estimators: {
                type: 'int',
                range: [10, 500],
                default: 100,
                label: 'N Estimators',
                description: 'Number of trees in the forest',
                guidance: {
                    whenToIncrease: 'For better accuracy (diminishing returns)',
                    whenToDecrease: 'For faster training and prediction',
                    tuningRange: '50-500 typically'
                }
            },

            criterion: {
                type: 'select',
                options: ['gini', 'entropy', 'log_loss'],
                default: 'gini',
                label: 'Criterion',
                description: 'Function to measure quality of split'
            },

            max_depth: {
                type: 'int',
                range: [1, 50],
                default: null,
                label: 'Max Depth',
                description: 'Maximum depth of trees',
                guidance: {
                    whenToDecrease: 'To prevent overfitting',
                    general: 'None allows trees to grow fully'
                }
            },

            min_samples_split: {
                type: 'int',
                range: [2, 50],
                default: 2,
                label: 'Min Samples Split',
                description: 'Minimum samples to split an internal node'
            },

            min_samples_leaf: {
                type: 'int',
                range: [1, 50],
                default: 1,
                label: 'Min Samples Leaf',
                description: 'Minimum samples at a leaf node'
            },

            max_features: {
                type: 'select',
                options: ['sqrt', 'log2', 'all'],
                default: 'sqrt',
                label: 'Max Features',
                description: 'Features to consider for best split',
                guidance: {
                    general: 'sqrt is good default for classification'
                }
            },

            bootstrap: {
                type: 'boolean',
                default: true,
                label: 'Bootstrap',
                description: 'Whether to use bootstrap samples',
                guidance: {
                    general: 'Keep True for standard Random Forest'
                }
            },

            oob_score: {
                type: 'boolean',
                default: false,
                label: 'OOB Score',
                description: 'Use out-of-bag samples for validation',
                guidance: {
                    whenToEnable: 'For internal validation without cross-validation'
                }
            },

            class_weight: {
                type: 'select',
                options: ['none', 'balanced', 'balanced_subsample'],
                default: 'none',
                label: 'Class Weight',
                description: 'Weights for classes'
            },

            n_jobs: {
                type: 'int',
                range: [-1, 16],
                default: -1,
                label: 'N Jobs',
                description: 'Parallel jobs (-1 = all processors)'
            },

            random_state: {
                type: 'int',
                range: [0, 1000],
                default: 42,
                label: 'Random State',
                description: 'Seed for random number generator'
            }
        },

        tamingStrategy: [
            'Start with n_estimators=100, increase to 200-500 for better performance',
            'Use max_features="sqrt" for classification, 0.33 for regression',
            'Enable oob_score=True for quick validation',
            'Set n_jobs=-1 to utilize all CPU cores',
            'Use feature_importances_ for feature selection',
            'Monitor overfitting with OOB score vs test score'
        ]
    },

    // ============================================
    // DBSCAN
    // ============================================
    'dbscan': {
        name: 'DBSCAN',
        importPath: 'from sklearn.cluster import DBSCAN',
        description: 'Density-Based Spatial Clustering - Finds clusters based on density and identifies noise.',
        dataType: 'Clustering with irregular shapes, noise detection, spatial data.',

        parameters: {
            eps: {
                type: 'float',
                range: [0.1, 10],
                step: 0.1,
                default: 0.5,
                label: 'Epsilon (ε)',
                description: 'Maximum distance between two samples for neighborhood',
                guidance: {
                    whenToIncrease: 'For fewer, larger clusters',
                    whenToDecrease: 'For more, smaller clusters',
                    tuningRange: 'Use k-distance graph to estimate'
                }
            },

            min_samples: {
                type: 'int',
                range: [2, 50],
                default: 5,
                label: 'Min Samples',
                description: 'Minimum samples for a core point',
                guidance: {
                    whenToIncrease: 'For more robust clusters, more noise detection',
                    whenToDecrease: 'For less restrictive clusters',
                    tuningRange: 'Rule of thumb: dimensions + 1'
                }
            },

            metric: {
                type: 'select',
                options: ['euclidean', 'manhattan', 'cosine', 'precomputed'],
                default: 'euclidean',
                label: 'Distance Metric',
                description: 'Metric for distance computation',
                guidance: {
                    whenToUse: {
                        'euclidean': 'Standard distance',
                        'manhattan': 'High-dimensional data',
                        'cosine': 'Text/directional data'
                    }
                }
            },

            algorithm: {
                type: 'select',
                options: ['auto', 'ball_tree', 'kd_tree', 'brute'],
                default: 'auto',
                label: 'Algorithm',
                description: 'Algorithm for nearest neighbors'
            },

            leaf_size: {
                type: 'int',
                range: [10, 100],
                default: 30,
                label: 'Leaf Size',
                description: 'Leaf size for tree algorithms'
            }
        },

        tamingStrategy: [
            'Scale data before clustering',
            'Use k-distance graph to estimate optimal eps',
            'Start with min_samples = dimensions + 1',
            'Noise points are labeled as -1',
            'Good for arbitrary shape clusters',
            'Monitor number of clusters and noise points to tune parameters'
        ]
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HyperparameterDB;
}
