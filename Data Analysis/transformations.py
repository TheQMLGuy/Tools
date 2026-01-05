"""Data transformation functions."""
import numpy as np
import pandas as pd
from scipy import stats


def z_transform(df: pd.DataFrame) -> pd.DataFrame:
    """Apply Z-score standardization: (x - mean) / std_dev.
    
    Args:
        df: Input DataFrame
        
    Returns:
        Z-transformed DataFrame
    """
    result = df.copy()
    for col in df.columns:
        mean = df[col].mean()
        std = df[col].std()
        if std > 0:
            result[col] = (df[col] - mean) / std
        else:
            result[col] = 0  # Constant column
    return result


def minmax_transform(df: pd.DataFrame) -> pd.DataFrame:
    """Apply Min-Max normalization: (x - min) / (max - min).
    
    Args:
        df: Input DataFrame
        
    Returns:
        Min-Max normalized DataFrame (values in [0, 1])
    """
    result = df.copy()
    for col in df.columns:
        min_val = df[col].min()
        max_val = df[col].max()
        if max_val > min_val:
            result[col] = (df[col] - min_val) / (max_val - min_val)
        else:
            result[col] = 0  # Constant column
    return result


def robust_scale(df: pd.DataFrame) -> pd.DataFrame:
    """Apply Robust scaling: (x - median) / IQR.
    
    Uses median instead of mean for robustness to outliers.
    
    Args:
        df: Input DataFrame
        
    Returns:
        Robust scaled DataFrame
    """
    result = df.copy()
    for col in df.columns:
        median = df[col].median()
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        if iqr > 0:
            result[col] = (df[col] - median) / iqr
        else:
            result[col] = 0  # Constant column or no variance
    return result


def maxabs_scale(df: pd.DataFrame) -> pd.DataFrame:
    """Apply Max Absolute scaling: x / max(|x|).
    
    Args:
        df: Input DataFrame
        
    Returns:
        Max absolute scaled DataFrame (values in [-1, 1])
    """
    result = df.copy()
    for col in df.columns:
        max_abs = df[col].abs().max()
        if max_abs > 0:
            result[col] = df[col] / max_abs
        else:
            result[col] = 0  # All zeros
    return result


def log_transform(df: pd.DataFrame, epsilon: float = 1e-10) -> pd.DataFrame:
    """Apply logarithmic transformation: log(x + epsilon).
    
    Adds epsilon to handle zeros. Negative values are handled by
    taking log of absolute value and preserving sign.
    
    Args:
        df: Input DataFrame
        epsilon: Small constant to add to zeros
        
    Returns:
        Log-transformed DataFrame
    """
    result = df.copy()
    for col in df.columns:
        # Handle negative values by preserving sign
        signs = np.sign(df[col])
        abs_vals = np.abs(df[col])
        result[col] = signs * np.log(abs_vals + epsilon)
    return result


def apply_transformation(df: pd.DataFrame, transform_type: str) -> pd.DataFrame:
    """Apply a transformation by name.
    
    Args:
        df: Input DataFrame
        transform_type: One of 'z_transform', 'minmax', 'robust', 'maxabs', 'log'
        
    Returns:
        Transformed DataFrame
        
    Raises:
        ValueError: If transform_type is not recognized
    """
    transformations = {
        'z_transform': z_transform,
        'minmax': minmax_transform,
        'robust': robust_scale,
        'maxabs': maxabs_scale,
        'log': log_transform
    }
    
    if transform_type not in transformations:
        raise ValueError(f"Unknown transformation: {transform_type}")
    
    return transformations[transform_type](df)
