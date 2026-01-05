"""Data model for managing datasets and transformations."""
import pandas as pd
from PySide6.QtCore import QObject, Signal
from typing import Optional


class DataModel(QObject):
    """Core data model managing original and transformed datasets.
    
    Signals:
        data_changed: Emitted when data is loaded or modified
        transformation_completed: Emitted when a transformation is calculated
    """
    
    data_changed = Signal()
    transformation_completed = Signal(str)  # transformation name
    
    def __init__(self):
        super().__init__()
        self._original_data: Optional[pd.DataFrame] = None
        self._transformations: dict[str, pd.DataFrame] = {
            'original': None,
            'z_transform': None,
            'minmax': None,
            'robust': None,
            'maxabs': None,
            'log': None
        }
        self._metadata = {}
    
    def set_data(self, df: pd.DataFrame) -> None:
        """Set the original dataset.
        
        Args:
            df: DataFrame containing continuous numerical data
        """
        self._original_data = df.copy()
        self._transformations['original'] = df.copy()
        
        # Store metadata
        self._metadata = {
            'n_rows': len(df),
            'n_cols': len(df.columns),
            'columns': list(df.columns),
            'dtypes': df.dtypes.to_dict()
        }
        
        # Clear old transformations
        for key in ['z_transform', 'minmax', 'robust', 'maxabs', 'log']:
            self._transformations[key] = None
        
        self.data_changed.emit()
    
    def get_original_data(self) -> Optional[pd.DataFrame]:
        """Get the original dataset.
        
        Returns:
            Original DataFrame or None if no data loaded
        """
        return self._original_data.copy() if self._original_data is not None else None
    
    def get_transformation(self, name: str) -> Optional[pd.DataFrame]:
        """Get a specific transformation.
        
        Args:
            name: Transformation name ('original', 'z_transform', 'minmax', 'robust', 'maxabs', 'log')
            
        Returns:
            Transformed DataFrame or None if not calculated
        """
        return self._transformations.get(name, None)
    
    def set_transformation(self, name: str, df: pd.DataFrame) -> None:
        """Store a transformed dataset.
        
        Args:
            name: Transformation name
            df: Transformed DataFrame
        """
        self._transformations[name] = df.copy()
        self.transformation_completed.emit(name)
    
    def has_data(self) -> bool:
        """Check if data is loaded.
        
        Returns:
            True if data is loaded, False otherwise
        """
        return self._original_data is not None
    
    def get_column_names(self) -> list[str]:
        """Get list of column names.
        
        Returns:
            List of column names
        """
        return self._metadata.get('columns', [])
    
    def get_n_columns(self) -> int:
        """Get number of columns.
        
        Returns:
            Number of columns
        """
        return self._metadata.get('n_cols', 0)
    
    def get_n_rows(self) -> int:
        """Get number of rows.
        
        Returns:
            Number of rows
        """
        return self._metadata.get('n_rows', 0)
    
    def clear(self) -> None:
        """Clear all data and transformations."""
        self._original_data = None
        for key in self._transformations:
            self._transformations[key] = None
        self._metadata = {}
        self.data_changed.emit()
