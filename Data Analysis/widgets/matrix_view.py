"""Matrix view widget with heat map visualization."""
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QLabel, QTableWidget,
                                QTableWidgetItem, QHeaderView)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QColor
import pandas as pd
from typing import Optional
from utils import format_number, create_color_gradient
import numpy as np


class MatrixViewWidget(QWidget):
    """Widget for displaying matrix data with heat map colors.
    
    Signals:
        cell_clicked: Emitted when a cell is clicked (row, column, value)
    """
    
    cell_clicked = Signal(int, int, float)
    
    def __init__(self, title: str = "Matrix", parent=None):
        super().__init__(parent)
        self.title = title
        self.df: Optional[pd.DataFrame] = None
        self._init_ui()
    
    def _init_ui(self):
        """Initialize the UI."""
        layout = QVBoxLayout(self)
        
        # Title
        self.title_label = QLabel(f"<h3>{self.title}</h3>")
        layout.addWidget(self.title_label)
        
        # Matrix table
        self.table = QTableWidget()
        self.table.cellClicked.connect(self._on_cell_clicked)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.ResizeToContents)
        layout.addWidget(self.table)
        
        # Info label
        self.info_label = QLabel("")
        layout.addWidget(self.info_label)
    
    def set_matrix(self, df: pd.DataFrame, symmetric: bool = False):
        """Set the matrix data to display.
        
        Args:
            df: DataFrame containing matrix (N x N)
            symmetric: If True, use symmetric color gradient around zero
        """
        self.df = df.copy()
        
        # Set dimensions
        self.table.setRowCount(len(df))
        self.table.setColumnCount(len(df.columns))
        
        # Set headers
        self.table.setHorizontalHeaderLabels([str(col) for col in df.columns])
        self.table.setVerticalHeaderLabels([str(i) for i in df.index])
        
        # Get colors
        values = df.values.flatten()
        colors = create_color_gradient(values, symmetric=symmetric)
        
        # Populate cells
        for i in range(len(df)):
            for j, col in enumerate(df.columns):
                value = df.iloc[i, j]
                text = format_number(value)
                
                item = QTableWidgetItem(text)
                item.setFlags(item.flags() & ~Qt.ItemFlag.ItemIsEditable)
                item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
                
                # Set background color
                idx = i * len(df.columns) + j
                color = colors[idx]
                item.setBackground(color)
                
                # Set text color for readability
                brightness = (color.red() * 299 + color.green() * 587 + color.blue() * 114) / 1000
                if brightness < 128:
                    item.setForeground(QColor(255, 255, 255))
                else:
                    item.setForeground(QColor(0, 0, 0))
                
                self.table.setItem(i, j, item)
        
        # Update info
        self._update_info()
    
    def _on_cell_clicked(self, row: int, col: int):
        """Handle cell click event."""
        if self.df is not None:
            value = self.df.iloc[row, col]
            row_name = self.df.index[row]
            col_name = self.df.columns[col]
            
            self.info_label.setText(
                f"Selected: [{row_name}] vs [{col_name}] = {format_number(value)}"
            )
            
            self.cell_clicked.emit(row, col, value)
    
    def _update_info(self):
        """Update information label with matrix statistics."""
        if self.df is not None:
            values = self.df.values.flatten()
            min_val = np.nanmin(values)
            max_val = np.nanmax(values)
            mean_val = np.nanmean(values)
            
            self.info_label.setText(
                f"Min: {format_number(min_val)} | "
                f"Max: {format_number(max_val)} | "
                f"Mean: {format_number(mean_val)}"
            )
    
    def set_title(self, title: str):
        """Update the title."""
        self.title = title
        self.title_label.setText(f"<h3>{title}</h3>")
