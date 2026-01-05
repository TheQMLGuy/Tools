"""Statistical analysis functions for continuous data."""
import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict


def arithmetic_mean(series: pd.Series) -> float:
    """Calculate arithmetic mean."""
    return series.mean()


def geometric_mean(series: pd.Series) -> float:
    """Calculate geometric mean.
    
    Handles negative values by taking absolute value.
    """
    abs_values = series.abs()
    return stats.gmean(abs_values[abs_values > 0]) if (abs_values > 0).any() else 0


def harmonic_mean(series: pd.Series) -> float:
    """Calculate harmonic mean.
    
    Only uses positive values.
    """
    positive = series[series > 0]
    return stats.hmean(positive) if len(positive) > 0 else 0


def trimmed_mean(series: pd.Series, trim_percent: float = 0.05) -> float:
    """Calculate trimmed mean (5% from each end by default)."""
    return stats.trim_mean(series, trim_percent)


def standard_deviation(series: pd.Series) -> float:
    """Calculate standard deviation."""
    return series.std()


def data_range(series: pd.Series) -> float:
    """Calculate range (max - min)."""
    return series.max() - series.min()


def interquartile_range(series: pd.Series) -> float:
    """Calculate interquartile range (Q3 - Q1)."""
    return series.quantile(0.75) - series.quantile(0.25)


def mean_absolute_deviation(series: pd.Series) -> float:
    """Calculate mean absolute deviation from the mean."""
    return (series - series.mean()).abs().mean()


def coefficient_of_variation(series: pd.Series) -> float:
    """Calculate coefficient of variation (std / mean)."""
    mean = series.mean()
    if mean == 0:
        return np.inf
    return series.std() / abs(mean)


def standard_error(series: pd.Series) -> float:
    """Calculate standard error of the mean."""
    return series.std() / np.sqrt(len(series))


def skewness(series: pd.Series) -> float:
    """Calculate skewness (measure of asymmetry)."""
    return series.skew()


def kurtosis(series: pd.Series) -> float:
    """Calculate kurtosis (measure of tailedness)."""
    return series.kurtosis()


def calculate_all_statistics(series: pd.Series) -> Dict[str, float]:
    """Calculate all statistics for a series.
    
    Args:
        series: Pandas Series to analyze
        
    Returns:
        Dictionary mapping statistic names to values
    """
    return {
        'Arithmetic Mean': arithmetic_mean(series),
        'Geometric Mean': geometric_mean(series),
        'Harmonic Mean': harmonic_mean(series),
        'Trimmed Mean (5%)': trimmed_mean(series),
        'Standard Deviation': standard_deviation(series),
        'Range': data_range(series),
        'IQR': interquartile_range(series),
        'MAD': mean_absolute_deviation(series),
        'CV': coefficient_of_variation(series),
        'Standard Error': standard_error(series),
        'Skewness': skewness(series),
        'Kurtosis': kurtosis(series)
    }


def analyze_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate all statistics for all columns in a DataFrame.
    
    Args:
        df: DataFrame to analyze
        
    Returns:
        DataFrame with statistics as rows and columns as columns
    """
    results = {}
    for col in df.columns:
        results[col] = calculate_all_statistics(df[col])
    
    return pd.DataFrame(results)
