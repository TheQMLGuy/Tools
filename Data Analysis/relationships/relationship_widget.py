"""Relationship widget displaying test and correlation matrices."""
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QTabWidget, QLabel,
                                QProgressBar, QApplication)
from PySide6.QtCore import Qt, QThread, Signal
import pandas as pd
from typing import Optional
from widgets import MatrixViewWidget
from relationships import (
    f_test_matrix,
    t_test_matrix,
    covariance_matrix,
    correlation_matrix,
    r_squared_matrix,
    regression_matrix_1d
)


class RelationshipCalculationThread(QThread):
    """Background thread for calculating relationship matrices."""
    
    finished = Signal(dict)
    progress = Signal(int)
    
    def __init__(self, df: pd.DataFrame):
        super().__init__()
        self.df = df
    
    def run(self):
        """Calculate all relationship matrices."""
        results = {}
        
        self.progress.emit(10)
        results['f_test'] = f_test_matrix(self.df)
        
        self.progress.emit(25)
        t_stat, t_pval = t_test_matrix(self.df)
        results['t_test'] = t_stat
        results['t_test_pval'] = t_pval
        
        self.progress.emit(40)
        results['covariance'] = covariance_matrix(self.df)
        
        self.progress.emit(55)
        results['correlation'] = correlation_matrix(self.df)
        
        self.progress.emit(70)
        results['r_squared'] = r_squared_matrix(self.df)
        
        self.progress.emit(85)
        results['regression_1d'] = regression_matrix_1d(self.df)
        
        self.progress.emit(100)
        self.finished.emit(results)


class RelationshipWidget(QWidget):
    """Widget for displaying relationship tests and correlations."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self._init_ui()
        self.current_data: Optional[pd.DataFrame] = None
    
    def _init_ui(self):
        """Initialize the UI."""
        layout = QVBoxLayout(self)
        
        # Title
        title = QLabel("<h3>Tests & Relationships</h3>")
        layout.addWidget(title)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)
        
        # Tab widget for different tests
        self.tabs = QTabWidget()
        
        # Create matrix views for each test
        self.f_test_view = MatrixViewWidget("F-Test (Variance Ratio)")
        self.t_test_view = MatrixViewWidget("T-Test (Mean Comparison)")
        self.cov_view = MatrixViewWidget("Covariance Matrix")
        self.corr_view = MatrixViewWidget("Correlation Matrix (r)")
        self.r2_view = MatrixViewWidget("R² Matrix")
        self.reg_view = MatrixViewWidget("1D Polynomial Regression R²")
        
        # Add tabs
        self.tabs.addTab(self.f_test_view, "F-Test")
        self.tabs.addTab(self.t_test_view, "T-Test")
        self.tabs.addTab(self.cov_view, "Covariance")
        self.tabs.addTab(self.corr_view, "Correlation")
        self.tabs.addTab(self.r2_view, "R²")
        self.tabs.addTab(self.reg_view, "Regression")
        
        layout.addWidget(self.tabs)
    
    def set_data(self, df: pd.DataFrame):
        """Calculate and display relationship matrices for the given DataFrame.
        
        Args:
            df: DataFrame to analyze
        """
        if df is None or df.empty:
            return
        
        self.current_data = df
        
        # Show progress bar
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)
        
        # Calculate in background thread
        self.calc_thread = RelationshipCalculationThread(df)
        self.calc_thread.progress.connect(self._update_progress)
        self.calc_thread.finished.connect(self._display_results)
        self.calc_thread.start()
    
    def _update_progress(self, value: int):
        """Update progress bar."""
        self.progress_bar.setValue(value)
    
    def _display_results(self, results: dict):
        """Display calculated results."""
        self.f_test_view.set_matrix(results['f_test'], symmetric=False)
        self.t_test_view.set_matrix(results['t_test'], symmetric=True)
        self.cov_view.set_matrix(results['covariance'], symmetric=True)
        self.corr_view.set_matrix(results['correlation'], symmetric=True)
        self.r2_view.set_matrix(results['r_squared'], symmetric=False)
        self.reg_view.set_matrix(results['regression_1d'], symmetric=False)
        
        # Hide progress bar
        self.progress_bar.setVisible(False)
