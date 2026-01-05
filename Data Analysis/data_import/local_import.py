"""Local file import functionality."""
import pandas as pd
from pathlib import Path
from typing import Optional


def load_csv(file_path: str, **kwargs) -> pd.DataFrame:
    """Load data from a CSV file.
    
    Args:
        file_path: Path to CSV file
        **kwargs: Additional arguments passed to pd.read_csv
        
    Returns:
        DataFrame containing the data
    """
    return pd.read_csv(file_path, **kwargs)


def load_excel(file_path: str, sheet_name: Optional[str] = None, **kwargs) -> pd.DataFrame:
    """Load data from an Excel file.
    
    Args:
        file_path: Path to Excel file
        sheet_name: Name of sheet to load (default: first sheet)
        **kwargs: Additional arguments passed to pd.read_excel
        
    Returns:
        DataFrame containing the data
    """
    if sheet_name is None:
        return pd.read_excel(file_path, **kwargs)
    return pd.read_excel(file_path, sheet_name=sheet_name, **kwargs)


def load_json(file_path: str, **kwargs) -> pd.DataFrame:
    """Load data from a JSON file.
    
    Args:
        file_path: Path to JSON file
        **kwargs: Additional arguments passed to pd.read_json
        
    Returns:
        DataFrame containing the data
    """
    return pd.read_json(file_path, **kwargs)


def load_file(file_path: str) -> pd.DataFrame:
    """Auto-detect file type and load data.
    
    Args:
        file_path: Path to data file
        
    Returns:
        DataFrame containing the data
        
    Raises:
        ValueError: If file type is not supported
    """
    path = Path(file_path)
    suffix = path.suffix.lower()
    
    if suffix == '.csv':
        return load_csv(file_path)
    elif suffix in ['.xlsx', '.xls']:
        return load_excel(file_path)
    elif suffix == '.json':
        return load_json(file_path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def get_excel_sheet_names(file_path: str) -> list[str]:
    """Get list of sheet names from an Excel file.
    
    Args:
        file_path: Path to Excel file
        
    Returns:
        List of sheet names
    """
    excel_file = pd.ExcelFile(file_path)
    return excel_file.sheet_names
