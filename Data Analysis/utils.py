"""Utility functions for the data analysis application."""
import numpy as np
import pandas as pd
from PySide6.QtGui import QColor


def is_continuous_data(series: pd.Series) -> bool:
    """Check if a pandas Series contains continuous numerical data.
    
    Args:
        series: Pandas Series to check
        
    Returns:
        True if data is continuous numerical, False otherwise
    """
    return pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series)


def validate_continuous_dataframe(df: pd.DataFrame) -> tuple[bool, list[str]]:
    """Validate that all columns in a DataFrame are continuous numerical data.
    
    Args:
        df: DataFrame to validate
        
    Returns:
        Tuple of (is_valid, list_of_non_continuous_columns)
    """
    non_continuous = []
    for col in df.columns:
        if not is_continuous_data(df[col]):
            non_continuous.append(col)
    
    return len(non_continuous) == 0, non_continuous


def format_number(value: float, precision: int = 4) -> str:
    """Format a number for display with specified precision.
    
    Args:
        value: Number to format
        precision: Number of decimal places
        
    Returns:
        Formatted string
    """
    if np.isnan(value) or np.isinf(value):
        return str(value)
    
    # Use scientific notation for very large or very small numbers
    if abs(value) < 0.0001 or abs(value) > 10000:
        return f"{value:.{precision}e}"
    else:
        return f"{value:.{precision}f}"


def value_to_color(value: float, min_val: float, max_val: float, 
                   low_color: QColor = None, high_color: QColor = None) -> QColor:
    """Map a value to a color gradient.
    
    Args:
        value: Value to map
        min_val: Minimum value in range
        max_val: Maximum value in range
        low_color: Color for minimum value (default: light blue)
        high_color: Color for maximum value (default: dark red)
        
    Returns:
        QColor corresponding to value position in range
    """
    if low_color is None:
        low_color = QColor(240, 248, 255)  # AliceBlue
    if high_color is None:
        high_color = QColor(178, 34, 34)  # FireBrick
    
    if np.isnan(value) or min_val == max_val:
        return QColor(255, 255, 255)  # White for NaN or constant
    
    # Normalize value to 0-1 range
    normalized = (value - min_val) / (max_val - min_val)
    normalized = max(0, min(1, normalized))  # Clamp to [0, 1]
    
    # Interpolate RGB values
    r = int(low_color.red() + normalized * (high_color.red() - low_color.red()))
    g = int(low_color.green() + normalized * (high_color.green() - low_color.green()))
    b = int(low_color.blue() + normalized * (high_color.blue() - low_color.blue()))
    
    return QColor(r, g, b)


def create_color_gradient(values: np.ndarray, symmetric: bool = False) -> list[QColor]:
    """Create a color gradient for an array of values.
    
    Args:
        values: Array of values
        symmetric: If True, use symmetric gradient around zero
        
    Returns:
        List of QColor objects
    """
    if symmetric:
        max_abs = np.nanmax(np.abs(values))
        min_val, max_val = -max_abs, max_abs
        low_color = QColor(0, 0, 255)  # Blue for negative
        high_color = QColor(255, 0, 0)  # Red for positive
    else:
        min_val, max_val = np.nanmin(values), np.nanmax(values)
        low_color = QColor(240, 248, 255)  # Light blue
        high_color = QColor(178, 34, 34)  # Dark red
    
    return [value_to_color(v, min_val, max_val, low_color, high_color) for v in values]
