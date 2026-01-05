"""Scikit-learn datasets import."""
import pandas as pd
from sklearn import datasets
from typing import Tuple


def load_iris() -> pd.DataFrame:
    """Load the Iris dataset."""
    data = datasets.load_iris()
    df = pd.DataFrame(data.data, columns=data.feature_names)
    return df


def load_wine() -> pd.DataFrame:
    """Load the Wine dataset."""
    data = datasets.load_wine()
    df = pd.DataFrame(data.data, columns=data.feature_names)
    return df


def load_breast_cancer() -> pd.DataFrame:
    """Load the Breast Cancer dataset."""
    data = datasets.load_breast_cancer()
    df = pd.DataFrame(data.data, columns=data.feature_names)
    return df


def load_diabetes() -> pd.DataFrame:
    """Load the Diabetes dataset."""
    data = datasets.load_diabetes()
    df = pd.DataFrame(data.data, columns=data.feature_names)
    return df


def load_digits() -> pd.DataFrame:
    """Load the Digits dataset (flattened images)."""
    data = datasets.load_digits()
    # Create column names for each pixel
    n_features = data.data.shape[1]
    columns = [f'pixel_{i}' for i in range(n_features)]
    df = pd.DataFrame(data.data, columns=columns)
    return df


def load_california_housing() -> pd.DataFrame:
    """Load the California Housing dataset."""
    data = datasets.fetch_california_housing()
    df = pd.DataFrame(data.data, columns=data.feature_names)
    return df


def get_available_datasets() -> dict[str, callable]:
    """Get dictionary of available sklearn datasets.
    
    Returns:
        Dictionary mapping dataset names to loader functions
    """
    return {
        'Iris': load_iris,
        'Wine': load_wine,
        'Breast Cancer': load_breast_cancer,
        'Diabetes': load_diabetes,
        'Digits (Flattened)': load_digits,
        'California Housing': load_california_housing
    }


def load_sklearn_dataset(name: str) -> pd.DataFrame:
    """Load a sklearn dataset by name.
    
    Args:
        name: Dataset name
        
    Returns:
        DataFrame containing the dataset
        
    Raises:
        ValueError: If dataset name is not recognized
    """
    datasets_dict = get_available_datasets()
    if name not in datasets_dict:
        raise ValueError(f"Unknown dataset: {name}")
    
    return datasets_dict[name]()
