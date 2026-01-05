"""TensorFlow Datasets import functionality."""
import pandas as pd
import numpy as np
from typing import Optional

try:
    import tensorflow_datasets as tfds
    TFDS_AVAILABLE = True
except ImportError:
    TFDS_AVAILABLE = False


def is_available() -> bool:
    """Check if TensorFlow Datasets is available."""
    return TFDS_AVAILABLE


def load_tfds_dataset(name: str, split: str = 'train', max_samples: Optional[int] = None) -> pd.DataFrame:
    """Load a TensorFlow dataset and convert to DataFrame.
    
    Args:
        name: Dataset name (e.g., 'mnist', 'cifar10')
        split: Dataset split ('train', 'test', etc.)
        max_samples: Maximum number of samples to load (None for all)
        
    Returns:
        DataFrame with flattened features
        
    Raises:
        ImportError: If tensorflow_datasets is not installed
        ValueError: If dataset cannot be loaded or has no numeric features
    """
    if not TFDS_AVAILABLE:
        raise ImportError("tensorflow_datasets is not installed")
    
    # Load dataset
    ds = tfds.load(name, split=split, as_supervised=False)
    
    # Convert to numpy
    data_list = []
    for i, example in enumerate(ds):
        if max_samples and i >= max_samples:
            break
        
        # Flatten all numeric features
        flat_features = {}
        for key, value in example.items():
            if isinstance(value, (np.ndarray, int, float)):
                arr = np.array(value)
                if arr.dtype.kind in 'fc':  # float or complex
                    if arr.ndim == 0:
                        flat_features[key] = float(arr)
                    else:
                        # Flatten multi-dimensional arrays
                        flat = arr.flatten()
                        for j, val in enumerate(flat):
                            flat_features[f'{key}_{j}'] = float(val)
        
        data_list.append(flat_features)
    
    if not data_list:
        raise ValueError(f"No numeric data found in dataset {name}")
    
    return pd.DataFrame(data_list)


def get_popular_datasets() -> list[str]:
    """Get list of popular continuous-data TensorFlow datasets.
    
    Returns:
        List of dataset names
    """
    return [
        'mnist',
        'fashion_mnist',
        'cifar10',
        'cifar100',
        'svhn_cropped'
    ]
