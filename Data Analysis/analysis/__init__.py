"""Analysis package for statistical calculations."""
from .statistics import (
    calculate_all_statistics,
    analyze_dataframe,
    arithmetic_mean,
    geometric_mean,
    harmonic_mean,
    trimmed_mean,
    standard_deviation,
    data_range,
    interquartile_range,
    mean_absolute_deviation,
    coefficient_of_variation,
    standard_error,
    skewness,
    kurtosis
)

__all__ = [
    'calculate_all_statistics',
    'analyze_dataframe',
    'arithmetic_mean',
    'geometric_mean',
    'harmonic_mean',
    'trimmed_mean',
    'standard_deviation',
    'data_range',
    'interquartile_range',
    'mean_absolute_deviation',
    'coefficient_of_variation',
    'standard_error',
    'skewness',
    'kurtosis'
]
