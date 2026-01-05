"""Custom data generation functionality."""
import pandas as pd
import numpy as np
from typing import Optional


def generate_normal(n_samples: int, n_features: int, mean: float = 0.0, 
                   std: float = 1.0, seed: Optional[int] = None) -> pd.DataFrame:
    """Generate data from normal distribution.
    
    Args:
        n_samples: Number of samples
        n_features: Number of features
        mean: Mean of distribution
        std: Standard deviation
        seed: Random seed for reproducibility
        
    Returns:
        DataFrame with normally distributed data
    """
    if seed is not None:
        np.random.seed(seed)
    
    data = np.random.normal(mean, std, size=(n_samples, n_features))
    columns = [f'feature_{i}' for i in range(n_features)]
    return pd.DataFrame(data, columns=columns)


def generate_uniform(n_samples: int, n_features: int, low: float = 0.0,
                    high: float = 1.0, seed: Optional[int] = None) -> pd.DataFrame:
    """Generate data from uniform distribution.
    
    Args:
        n_samples: Number of samples
        n_features: Number of features
        low: Lower bound
        high: Upper bound
        seed: Random seed for reproducibility
        
    Returns:
        DataFrame with uniformly distributed data
    """
    if seed is not None:
        np.random.seed(seed)
    
    data = np.random.uniform(low, high, size=(n_samples, n_features))
    columns = [f'feature_{i}' for i in range(n_features)]
    return pd.DataFrame(data, columns=columns)


def generate_exponential(n_samples: int, n_features: int, scale: float = 1.0,
                        seed: Optional[int] = None) -> pd.DataFrame:
    """Generate data from exponential distribution.
    
    Args:
        n_samples: Number of samples
        n_features: Number of features
        scale: Scale parameter (1/lambda)
        seed: Random seed for reproducibility
        
    Returns:
        DataFrame with exponentially distributed data
    """
    if seed is not None:
        np.random.seed(seed)
    
    data = np.random.exponential(scale, size=(n_samples, n_features))
    columns = [f'feature_{i}' for i in range(n_features)]
    return pd.DataFrame(data, columns=columns)


def generate_multivariate_normal(n_samples: int, n_features: int,
                                 correlation: float = 0.5,
                                 seed: Optional[int] = None) -> pd.DataFrame:
    """Generate correlated data from multivariate normal distribution.
    
    Args:
        n_samples: Number of samples
        n_features: Number of features
        correlation: Correlation between features (0 to 1)
        seed: Random seed for reproducibility
        
    Returns:
        DataFrame with correlated normally distributed data
    """
    if seed is not None:
        np.random.seed(seed)
    
    # Create covariance matrix
    cov = np.full((n_features, n_features), correlation)
    np.fill_diagonal(cov, 1.0)
    
    mean = np.zeros(n_features)
    data = np.random.multivariate_normal(mean, cov, size=n_samples)
    
    columns = [f'feature_{i}' for i in range(n_features)]
    return pd.DataFrame(data, columns=columns)


def generate_polynomial_data(n_samples: int, n_features: int, degree: int = 2,
                            noise_std: float = 0.1, seed: Optional[int] = None) -> pd.DataFrame:
    """Generate data with polynomial relationships.
    
    Args:
        n_samples: Number of samples
        n_features: Number of base features
        degree: Polynomial degree
        noise_std: Standard deviation of noise
        seed: Random seed for reproducibility
        
    Returns:
        DataFrame with polynomial relationships between features
    """
    if seed is not None:
        np.random.seed(seed)
    
    # Generate base feature
    x = np.random.uniform(-10, 10, size=(n_samples, 1))
    
    # Generate polynomial features
    data = []
    for i in range(n_features):
        power = (i % degree) + 1
        y = x ** power + np.random.normal(0, noise_std, size=(n_samples, 1))
        data.append(y)
    
    data = np.hstack(data)
    columns = [f'feature_{i}' for i in range(n_features)]
    return pd.DataFrame(data, columns=columns)


def get_generation_methods() -> dict[str, callable]:
    """Get dictionary of available generation methods.
    
    Returns:
        Dictionary mapping method names to generator functions
    """
    return {
        'Normal Distribution': generate_normal,
        'Uniform Distribution': generate_uniform,
        'Exponential Distribution': generate_exponential,
        'Multivariate Normal (Correlated)': generate_multivariate_normal,
        'Polynomial Relationships': generate_polynomial_data
    }
