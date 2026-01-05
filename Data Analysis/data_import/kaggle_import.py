"""Kaggle datasets import functionality."""
import pandas as pd
from pathlib import Path
from typing import Optional
import os

# Don't import KaggleApi at module level to avoid auto-authentication
try:
    import kaggle
    KAGGLE_INSTALLED = True
except ImportError:
    KAGGLE_INSTALLED = False


def is_available() -> bool:
    """Check if Kaggle API is available and configured."""
    if not KAGGLE_INSTALLED:
        return False
    
    # Check if credentials are configured without triggering authentication error
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()
        return True
    except:
        return False


def download_dataset(dataset_name: str, download_path: str = "./kaggle_data") -> Path:
    """Download a Kaggle dataset.
    
    Args:
        dataset_name: Kaggle dataset identifier (e.g., 'username/dataset-name')
        download_path: Path to download dataset to
        
    Returns:
        Path to downloaded dataset directory
        
    Raises:
        ImportError: If kaggle API is not installed or configured
    """
    if not KAGGLE_INSTALLED:
        raise ImportError("kaggle package is not installed")
    
    from kaggle.api.kaggle_api_extended import KaggleApi
    api = KaggleApi()
    api.authenticate()
    
    # Create download directory
    download_dir = Path(download_path)
    download_dir.mkdir(parents=True, exist_ok=True)
    
    # Download dataset
    api.dataset_download_files(dataset_name, path=str(download_dir), unzip=True)
    
    return download_dir


def load_kaggle_dataset(dataset_name: str, file_name: Optional[str] = None) -> pd.DataFrame:
    """Download and load a Kaggle dataset.
    
    Args:
        dataset_name: Kaggle dataset identifier
        file_name: Specific file to load (if None, loads first CSV found)
        
    Returns:
        DataFrame containing the data
        
    Raises:
        ImportError: If kaggle API is not installed or configured
        FileNotFoundError: If no suitable file is found
    """
    download_dir = download_dataset(dataset_name)
    
    if file_name:
        file_path = download_dir / file_name
    else:
        # Find first CSV file
        csv_files = list(download_dir.glob("*.csv"))
        if not csv_files:
            raise FileNotFoundError(f"No CSV files found in {download_dir}")
        file_path = csv_files[0]
    
    return pd.read_csv(file_path)


def search_datasets(query: str, max_results: int = 20) -> list[dict]:
    """Search for Kaggle datasets.
    
    Args:
        query: Search query
        max_results: Maximum number of results
        
    Returns:
        List of dataset information dictionaries
        
    Raises:
        ImportError: If kaggle API is not installed or configured
    """
    if not KAGGLE_INSTALLED:
        raise ImportError("kaggle package is not installed")
    
    from kaggle.api.kaggle_api_extended import KaggleApi
    api = KaggleApi()
    api.authenticate()
    
    datasets = api.dataset_list(search=query, page_size=max_results)
    
    return [
        {
            'ref': ds.ref,
            'title': ds.title,
            'size': ds.size,
            'downloadCount': ds.downloadCount
        }
        for ds in datasets
    ]
