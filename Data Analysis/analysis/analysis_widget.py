"""Analysis widget displaying statistical metrics."""
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel
from PySide6.QtCore import Qt
import pandas as pd
from typing import Optional
from widgets import DataTableWidget
from analysis import analyze_dataframe


class AnalysisWidget(QWidget):
    """Widget for displaying statistical analysis results."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self._init_ui()
    
    def _init_ui(self):
        """Initialize the UI."""
        layout = QVBoxLayout(self)
        
        # Title
        title = QLabel("<h3>Statistical Analysis</h3>")
        layout.addWidget(title)
        
        # Description
        desc = QLabel(
            "Statistics calculated per column:\n"
            "• Central Tendency: Arithmetic, Geometric, Harmonic, Trimmed Mean (5%)\n"
            "• Dispersion: Standard Deviation, Range, IQR, MAD, CV, Standard Error\n"
            "• Shape: Skewness, Kurtosis"
        )
        desc.setWordWrap(True)
        layout.addWidget(desc)
        
        # Table
        self.table = DataTableWidget()
        layout.addWidget(self.table)
    
    def set_data(self, df: pd.DataFrame):
        """Calculate and display statistics for the given DataFrame.
        
        Args:
            df: DataFrame to analyze
        """
        if df is None or df.empty:
            return
        
        # Calculate statistics
        stats_df = analyze_dataframe(df)
        
        # Display in table (transpose so columns are columns)
        self.table.set_dataframe(stats_df, format_numbers=True)
