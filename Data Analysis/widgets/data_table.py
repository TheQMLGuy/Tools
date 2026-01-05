"""Reusable data table widget with sorting and filtering."""
from PySide6.QtWidgets import (QTableWidget, QTableWidgetItem, QHeaderView,
                                QVBoxLayout, QWidget, QPushButton, QHBoxLayout,
                                QFileDialog, QMessageBox)
from PySide6.QtCore import Qt
from PySide6.QtGui import QColor
import pandas as pd
from typing import Optional
from utils import format_number


class DataTableWidget(QWidget):
    """Table widget for displaying DataFrames with export functionality."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.df: Optional[pd.DataFrame] = None
        self._init_ui()
    
    def _init_ui(self):
        """Initialize the UI components."""
        layout = QVBoxLayout(self)
        
        # Table
        self.table = QTableWidget()
        self.table.setSortingEnabled(True)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.table.verticalHeader().setVisible(True)
        layout.addWidget(self.table)
        
        # Button bar
        button_layout = QHBoxLayout()
        
        self.export_btn = QPushButton("Export to CSV")
        self.export_btn.clicked.connect(self._export_to_csv)
        button_layout.addWidget(self.export_btn)
        
        button_layout.addStretch()
        layout.addLayout(button_layout)
    
    def set_dataframe(self, df: pd.DataFrame, format_numbers: bool = True):
        """Set the DataFrame to display.
        
        Args:
            df: DataFrame to display
            format_numbers: Whether to format numbers for display
        """
        self.df = df.copy()
        
        # Set dimensions
        self.table.setRowCount(len(df))
        self.table.setColumnCount(len(df.columns))
        
        # Set headers
        self.table.setHorizontalHeaderLabels([str(col) for col in df.columns])
        self.table.setVerticalHeaderLabels([str(i) for i in df.index])
        
        # Populate data
        for i in range(len(df)):
            for j, col in enumerate(df.columns):
                value = df.iloc[i, j]
                if format_numbers and isinstance(value, (int, float)):
                    text = format_number(value)
                else:
                    text = str(value)
                
                item = QTableWidgetItem(text)
                item.setFlags(item.flags() & ~Qt.ItemFlag.ItemIsEditable)  # Read-only
                self.table.setItem(i, j, item)
        
        self.table.resizeColumnsToContents()
    
    def set_matrix(self, df: pd.DataFrame, use_colors: bool = True, symmetric: bool = False):
        """Set a matrix (correlation, covariance, etc.) to display.
        
        Args:
            df: Matrix DataFrame (N x N)
            use_colors: Whether to use color gradient
            symmetric: Whether to use symmetric color gradient around zero
        """
        from utils import create_color_gradient
        import numpy as np
        
        self.df = df.copy()
        
        # Set dimensions
        self.table.setRowCount(len(df))
        self.table.setColumnCount(len(df.columns))
        
        # Set headers
        self.table.setHorizontalHeaderLabels([str(col) for col in df.columns])
        self.table.setVerticalHeaderLabels([str(i) for i in df.index])
        
        # Get color gradient if needed
        if use_colors:
            values = df.values.flatten()
            colors = create_color_gradient(values, symmetric=symmetric)
        
        # Populate data
        for i in range(len(df)):
            for j, col in enumerate(df.columns):
                value = df.iloc[i, j]
                text = format_number(value)
                
                item = QTableWidgetItem(text)
                item.setFlags(item.flags() & ~Qt.ItemFlag.ItemIsEditable)
                
                # Set background color
                if use_colors:
                    idx = i * len(df.columns) + j
                    item.setBackground(colors[idx])
                
                self.table.setItem(i, j, item)
        
        self.table.resizeColumnsToContents()
    
    def _export_to_csv(self):
        """Export the current DataFrame to CSV."""
        if self.df is None:
            QMessageBox.warning(self, "No Data", "No data to export")
            return
        
        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Export to CSV",
            "",
            "CSV Files (*.csv)"
        )
        
        if file_path:
            try:
                self.df.to_csv(file_path)
                QMessageBox.information(self, "Success", f"Data exported to {file_path}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to export: {str(e)}")
