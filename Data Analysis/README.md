# Data Analysis Application

A comprehensive PySide6 desktop application for statistical analysis of continuous numerical data.

## Features

### Data Import
- **Local Files**: CSV, Excel (.xlsx, .xls), JSON
- **Scikit-learn Datasets**: Iris, Wine, Breast Cancer, Diabetes, Digits, California Housing
- **TensorFlow Datasets**: MNIST, Fashion-MNIST, CIFAR-10, etc. (requires tensorflow-datasets)
- **Kaggle Datasets**: Direct download and import (requires kaggle API credentials)
- **Custom Generation**: Normal, Uniform, Exponential, Multivariate Normal, Polynomial distributions

### Data Transformations
Five transformation methods applied to data:
1. **Z-Transform** (Standardization): (x - mean) / std
2. **Min-Max Normalization**: (x - min) / (max - min)
3. **Robust Scaling**: (x - median) / IQR
4. **Max-Abs Scaling**: x / max(|x|)
5. **Log Transform**: log(x + ε)

### Statistical Analysis (per column)
#### Central Tendency
- Arithmetic Mean
- Geometric Mean
- Harmonic Mean
- Trimmed Mean (5%)

#### Dispersion
- Standard Deviation
- Range
- Interquartile Range (IQR)
- Mean Absolute Deviation (MAD)
- Coefficient of Variation
- Standard Error

#### Shape
- Skewness
- Kurtosis

### Relationship Testing
Column-wise matrices for:
- **F-Test**: Variance comparison
- **T-Test**: Mean comparison with p-values
- **Covariance Matrix**: Linear relationship strength
- **Correlation Matrix**: Pearson's r
- **R² Matrix**: Coefficient of determination
- **Polynomial Regression**: 1D (auto-degree selection), 2D, and 3D polynomial fits

### Similarity & Distance
Column-wise distance/similarity matrices:
- **Euclidean Distance**: √(Σ(x-y)²)
- **Manhattan Distance**: Σ|x-y|
- **Cosine Similarity**: (x·y)/(|x||y|)
- **Jaccard Similarity**: Adapted for continuous data using binning

## Installation

### Requirements
- Python 3.8 or higher

### Setup
1. Clone or download this repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Optional Dependencies
For full functionality:
```bash
# For Kaggle datasets
pip install kaggle

# For TensorFlow datasets
pip install tensorflow-datasets
```

## Usage

### Running the Application
```bash
python main.py
```

### Basic Workflow
1. **Import Data**: File → Import Data
   - Choose from local files, built-in datasets, or generate synthetic data
   - Data must contain only continuous numerical values

2. **Explore Tabs**: Navigate through main tabs
   - Original Data
   - Z-Transform
   - Min-Max
   - Robust Scaling
   - Max-Abs Scaling
   - Log Transform

3. **View Analysis**: Within each transformation tab
   - **Data**: View raw transformed values
   - **Analysis**: Statistical metrics per column
   - **Relationships**: Correlation and regression matrices
   - **Similarity/Distance**: Distance and similarity metrics

4. **Export Results**: Use "Export to CSV" buttons to save tables

## Project Structure
```
Data Analysis/
├── main.py                 # Application entry point
├── main_window.py          # Main window and UI coordination
├── data_model.py           # Data storage and management
├── transformations.py      # Transformation functions
├── transformation_tab.py   # Tab widget for each transformation
├── import_dialog.py        # Data import dialog
├── utils.py                # Utility functions
├── requirements.txt        # Python dependencies
├── analysis/
│   ├── __init__.py
│   ├── statistics.py       # Statistical calculations
│   └── analysis_widget.py  # Analysis display widget
├── data_import/
│   ├── __init__.py
│   ├── local_import.py     # Local file loading
│   ├── sklearn_import.py   # Scikit-learn datasets
│   ├── tensorflow_import.py # TensorFlow datasets
│   ├── kaggle_import.py    # Kaggle API integration
│   └── generator.py        # Data generation
├── relationships/
│   ├── __init__.py
│   ├── tests.py            # Statistical tests
│   ├── regression.py       # Polynomial regression
│   └── relationship_widget.py # UI for relationships
├── similarity/
│   ├── __init__.py
│   ├── distance.py         # Distance/similarity metrics
│   └── similarity_widget.py # UI for similarity
└── widgets/
    ├── __init__.py
    ├── data_table.py       # Reusable table widget
    └── matrix_view.py      # Heat map matrix widget
```

## Features & Limitations

### Supported
- ✅ Continuous numerical data only
- ✅ Multiple data sources
- ✅ Interactive heat maps with color coding
- ✅ Background processing for large datasets
- ✅ CSV export functionality

### Not Supported
- ❌ Categorical data analysis
- ❌ Time series analysis
- ❌ Missing value imputation (data must be complete)
- ❌ Real-time data streaming

## Performance Notes

For datasets with many columns (N > 20), matrix calculations (N×N comparisons) may take time:
- Calculations run in background threads
- Progress bars show calculation status
- Sub-tabs use lazy loading for better performance

## Troubleshooting

### Import Errors
- **Kaggle**: Set up API credentials in `~/.kaggle/kaggle.json`
- **TensorFlow Datasets**: Ensure tensorflow-datasets is installed

### Data Validation
- Only continuous numerical columns are accepted
- Remove or convert categorical columns before import
- Handle missing values before import

## License

This project is provided as-is for educational and analysis purposes.

## Contributing

Feel free to submit issues or pull requests for improvements.
