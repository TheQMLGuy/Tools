"""Similarity widget displaying distance and similarity matrices."""
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QTabWidget, QLabel,
                                QProgressBar)
from PySide6.QtCore import Qt, QThread, Signal
import pandas as pd
from typing import Optional
from widgets import MatrixViewWidget
from similarity import (
    euclidean_distance_matrix,
    manhattan_distance_matrix,
    cosine_similarity_matrix,
    jaccard_similarity_matrix
)


class SimilarityCalculationThread(QThread):
    """Background thread for calculating similarity/distance matrices."""
    
    finished = Signal(dict)
    progress = Signal(int)
    
    def __init__(self, df: pd.DataFrame):
        super().__init__()
        self.df = df
    
    def run(self):
        """Calculate all similarity/distance matrices."""
        results = {}
        
        self.progress.emit(20)
        results['euclidean'] = euclidean_distance_matrix(self.df)
        
        self.progress.emit(40)
        results['manhattan'] = manhattan_distance_matrix(self.df)
        
        self.progress.emit(60)
        results['cosine'] = cosine_similarity_matrix(self.df)
        
        self.progress.emit(80)
        results['jaccard'] = jaccard_similarity_matrix(self.df)
        
        self.progress.emit(100)
        self.finished.emit(results)


class SimilarityWidget(QWidget):
    """Widget for displaying similarity and distance metrics."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self._init_ui()
        self.current_data: Optional[pd.DataFrame] = None
        self._data_loaded = False
    
    def _init_ui(self):
        """Initialize the UI."""
        layout = QVBoxLayout(self)
        
        # Title
        title = QLabel("<h3>Similarity & Distance</h3>")
        layout.addWidget(title)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)
        
        # Tab widget for different metrics
        self.tabs = QTabWidget()
        
        # Create matrix views
        self.euclidean_view = MatrixViewWidget("Euclidean Distance")
        self.manhattan_view = MatrixViewWidget("Manhattan Distance")
        self.cosine_view = MatrixViewWidget("Cosine Similarity")
        self.jaccard_view = MatrixViewWidget("Jaccard Similarity")
        
        # Add tabs
        self.tabs.addTab(self.euclidean_view, "Euclidean")
        self.tabs.addTab(self.manhattan_view, "Manhattan")
        self.tabs.addTab(self.cosine_view, "Cosine")
        self.tabs.addTab(self.jaccard_view, "Jaccard")
        
        layout.addWidget(self.tabs)
    
    def set_data(self, df: pd.DataFrame):
        """Calculate and display similarity/distance matrices for the given DataFrame.
        
        Args:
            df: DataFrame to analyze
        """
        if df is None or df.empty:
            return
        
        # Don't recalculate if data hasn't changed
        if self._data_loaded and self.current_data is not None:
            if len(df) == len(self.current_data) and (df.columns == self.current_data.columns).all():
                return
        
        self.current_data = df
        self._data_loaded = False
        
        # Show progress bar
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)
        
        # Calculate in background thread
        self.calc_thread = SimilarityCalculationThread(df)
        self.calc_thread.progress.connect(self._update_progress)
        self.calc_thread.finished.connect(self._display_results)
        self.calc_thread.start()
    
    def _update_progress(self, value: int):
        """Update progress bar."""
        self.progress_bar.setValue(value)
    
    def _display_results(self, results: dict):
        """Display calculated results."""
        # Distance metrics (smaller = more similar)
        self.euclidean_view.set_matrix(results['euclidean'], symmetric=False)
        self.manhattan_view.set_matrix(results['manhattan'], symmetric=False)
        
        # Similarity metrics (larger = more similar)
        self.cosine_view.set_matrix(results['cosine'], symmetric=True)
        self.jaccard_view.set_matrix(results['jaccard'], symmetric=False)
        
        # Hide progress bar
        self.progress_bar.setVisible(False)
        self._data_loaded = True
