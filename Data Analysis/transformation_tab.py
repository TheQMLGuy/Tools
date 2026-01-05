"""Transformation tab containing data view and analysis sub-tabs."""
from PySide6.QtWidgets import QWidget, QVBoxLayout, QTabWidget, QLabel
from PySide6.QtCore import Qt
import pandas as pd
from typing import Optional
from widgets import DataTableWidget
from analysis.analysis_widget import AnalysisWidget
from relationships.relationship_widget import RelationshipWidget
from similarity.similarity_widget import SimilarityWidget


class TransformationTab(QWidget):
    """Tab for a specific transformation with sub-tabs for different views."""
    
    def __init__(self, transformation_name: str, parent=None):
        super().__init__(parent)
        self.transformation_name = transformation_name
        self.data: Optional[pd.DataFrame] = None
        self._init_ui()
    
    def _init_ui(self):
        """Initialize the UI."""
        layout = QVBoxLayout(self)
        
        # Title
        title = QLabel(f"<h2>{self.transformation_name}</h2>")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)
        
        # Sub-tabs
        self.sub_tabs = QTabWidget()
        
        # Data view tab
        self.data_widget = DataTableWidget()
        self.sub_tabs.addTab(self.data_widget, "Data")
        
        # Analysis tab
        self.analysis_widget = AnalysisWidget()
        self.sub_tabs.addTab(self.analysis_widget, "Analysis")
        
        # Relationships tab
        self.relationship_widget = RelationshipWidget()
        self.sub_tabs.addTab(self.relationship_widget, "Relationships")
        
        # Similarity tab
        self.similarity_widget = SimilarityWidget()
        self.sub_tabs.addTab(self.similarity_widget, "Similarity/Distance")
        
        layout.addWidget(self.sub_tabs)
        
        # Connect tab change to lazy loading
        self.sub_tabs.currentChanged.connect(self._on_tab_changed)
    
    def set_data(self, df: pd.DataFrame):
        """Set the data for this transformation.
        
        Args:
            df: Transformed DataFrame
        """
        self.data = df.copy()
        
        # Always load data view
        self.data_widget.set_dataframe(df, format_numbers=True)
        
        # Load current sub-tab if not data view
        current_idx = self.sub_tabs.currentIndex()
        if current_idx > 0:
            self._load_sub_tab(current_idx)
    
    def _on_tab_changed(self, index: int):
        """Handle sub-tab change for lazy loading."""
        self._load_sub_tab(index)
    
    def _load_sub_tab(self, index: int):
        """Load data for a specific sub-tab.
        
        Args:
            index: Sub-tab index
        """
        if self.data is None:
            return
        
        if index == 1:  # Analysis
            self.analysis_widget.set_data(self.data)
        elif index == 2:  # Relationships
            self.relationship_widget.set_data(self.data)
        elif index == 3:  # Similarity
            self.similarity_widget.set_data(self.data)
