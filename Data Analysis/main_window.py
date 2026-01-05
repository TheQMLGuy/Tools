"""Main application window."""
from PySide6.QtWidgets import (QMainWindow, QTabWidget, QWidget, QVBoxLayout,
                                QMenuBar, QMenu, QMessageBox, QLabel, QStatusBar,
                                QProgressDialog)
from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtGui import QAction
import pandas as pd
from typing import Optional
from data_model import DataModel
from transformations import apply_transformation
from transformation_tab import TransformationTab
from import_dialog import ImportDialog


class TransformationThread(QThread):
    """Background thread for calculating transformations."""
    
    finished = Signal(str, pd.DataFrame)
    progress = Signal(int, str)
    
    def __init__(self, df: pd.DataFrame, transformations: list[str]):
        super().__init__()
        self.df = df
        self.transformations = transformations
    
    def run(self):
        """Calculate all transformations."""
        total = len(self.transformations)
        for i, trans_name in enumerate(self.transformations):
            self.progress.emit(int((i / total) * 100), f"Calculating {trans_name}...")
            transformed_df = apply_transformation(self.df, trans_name)
            self.finished.emit(trans_name, transformed_df)
        
        self.progress.emit(100, "Complete")


class MainWindow(QMainWindow):
    """Main application window."""
    
    def __init__(self):
        super().__init__()
        self.data_model = DataModel()
        self.transformation_tabs = {}
        self.setWindowTitle("Data Analysis Application")
        self.setMinimumSize(1200, 800)
        self._init_ui()
        self._create_menu()
    
    def _init_ui(self):
        """Initialize the UI."""
        # Central widget with tabs
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        
        layout = QVBoxLayout(self.central_widget)
        
        # Welcome message
        self.welcome_label = QLabel(
            "<h2>Welcome to Data Analysis Application</h2>"
            "<p>Import data using <b>File → Import Data</b> to begin analysis.</p>"
            "<p>This application performs statistical analysis on continuous numerical data only.</p>"
        )
        self.welcome_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.welcome_label.setWordWrap(True)
        layout.addWidget(self.welcome_label)
        
        # Main tab widget (will be populated after data import)
        self.main_tabs = QTabWidget()
        self.main_tabs.setVisible(False)
        layout.addWidget(self.main_tabs)
        
        # Status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Ready")
    
    def _create_menu(self):
        """Create menu bar."""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("&File")
        
        import_action = QAction("&Import Data", self)
        import_action.setShortcut("Ctrl+O")
        import_action.triggered.connect(self._import_data)
        file_menu.addAction(import_action)
        
        file_menu.addSeparator()
        
        exit_action = QAction("E&xit", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # Help menu
        help_menu = menubar.addMenu("&Help")
        
        about_action = QAction("&About", self)
        about_action.triggered.connect(self._show_about)
        help_menu.addAction(about_action)
    
    def _import_data(self):
        """Open import dialog and load data."""
        dialog = ImportDialog(self)
        if dialog.exec():
            df = dialog.get_data()
            if df is not None:
                self._load_data(df)
    
    def _load_data(self, df: pd.DataFrame):
        """Load data into the application.
        
        Args:
            df: DataFrame to load
        """
        # Set data in model
        self.data_model.set_data(df)
        
        # Hide welcome message, show tabs
        self.welcome_label.setVisible(False)
        self.main_tabs.setVisible(True)
        
        # Clear existing tabs
        self.main_tabs.clear()
        self.transformation_tabs.clear()
        
        # Create tabs for each transformation
        transformations = [
            ('Original Data', 'original'),
            ('Z-Transform', 'z_transform'),
            ('Min-Max', 'minmax'),
            ('Robust Scaling', 'robust'),
            ('Max-Abs Scaling', 'maxabs'),
            ('Log Transform', 'log')
        ]
        
        # Create transformation tabs
        for display_name, trans_key in transformations:
            tab = TransformationTab(display_name)
            self.transformation_tabs[trans_key] = tab
            self.main_tabs.addTab(tab, display_name)
        
        # Load original data immediately
        self.transformation_tabs['original'].set_data(df)
        
        # Calculate transformations in background
        self._calculate_transformations(df)
        
        self.status_bar.showMessage(f"Loaded data: {len(df)} rows, {len(df.columns)} columns")
    
    def _calculate_transformations(self, df: pd.DataFrame):
        """Calculate all transformations in background.
        
        Args:
            df: Original DataFrame
        """
        transformations = ['z_transform', 'minmax', 'robust', 'maxabs', 'log']
        
        # Create progress dialog
        self.progress_dialog = QProgressDialog(
            "Calculating transformations...",
            "Cancel",
            0,
            100,
            self
        )
        self.progress_dialog.setWindowModality(Qt.WindowModality.WindowModal)
        self.progress_dialog.show()
        
        # Start calculation thread
        self.trans_thread = TransformationThread(df, transformations)
        self.trans_thread.progress.connect(self._update_transform_progress)
        self.trans_thread.finished.connect(self._on_transformation_complete)
        self.trans_thread.start()
    
    def _update_transform_progress(self, value: int, message: str):
        """Update transformation progress."""
        self.progress_dialog.setValue(value)
        self.progress_dialog.setLabelText(message)
        self.status_bar.showMessage(message)
    
    def _on_transformation_complete(self, trans_name: str, df: pd.DataFrame):
        """Handle completion of a transformation.
        
        Args:
            trans_name: Transformation name
            df: Transformed DataFrame
        """
        # Store in model
        self.data_model.set_transformation(trans_name, df)
        
        # Update tab
        if trans_name in self.transformation_tabs:
            self.transformation_tabs[trans_name].set_data(df)
    
    def _show_about(self):
        """Show about dialog."""
        QMessageBox.about(
            self,
            "About Data Analysis Application",
            "<h3>Data Analysis Application</h3>"
            "<p>A comprehensive tool for analyzing continuous numerical data.</p>"
            "<p><b>Features:</b></p>"
            "<ul>"
            "<li>Multiple data import methods</li>"
            "<li>5 data transformations</li>"
            "<li>12 statistical metrics per column</li>"
            "<li>Statistical tests and correlations</li>"
            "<li>Polynomial regression analysis</li>"
            "<li>Distance and similarity metrics</li>"
            "</ul>"
            "<p>Built with PySide6, pandas, numpy, and scipy.</p>"
        )
