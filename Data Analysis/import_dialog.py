"""Data import dialog for selecting and loading data."""
from PySide6.QtWidgets import (QDialog, QVBoxLayout, QTabWidget, QWidget,
                                QPushButton, QFileDialog, QComboBox, QLabel,
                                QSpinBox, QDoubleSpinBox, QFormLayout, QLineEdit,
                                QMessageBox, QHBoxLayout, QTextEdit)
from PySide6.QtCore import Qt, Signal
import pandas as pd
from typing import Optional
from data_import import (
    load_file,
    get_available_datasets,
    load_sklearn_dataset,
    get_generation_methods,
    generate_normal
)
try:
    from data_import.kaggle_import import is_available as kaggle_available
except Exception:
    def kaggle_available():
        return False

try:
    from data_import.tensorflow_import import is_available as tfds_available, get_popular_datasets
except Exception:
    def tfds_available():
        return False
from utils import validate_continuous_dataframe


class LocalFileTab(QWidget):
    """Tab for loading local files."""
    
    file_loaded = Signal(pd.DataFrame)
    
    def __init__(self):
        super().__init__()
        self._init_ui()
    
    def _init_ui(self):
        layout = QVBoxLayout(self)
        
        label = QLabel("Load data from local CSV, Excel, or JSON file")
        layout.addWidget(label)
        
        self.file_path_edit = QLineEdit()
        self.file_path_edit.setPlaceholderText("Select a file...")
        layout.addWidget(self.file_path_edit)
        
        browse_btn = QPushButton("Browse...")
        browse_btn.clicked.connect(self._browse_file)
        layout.addWidget(browse_btn)
        
        load_btn = QPushButton("Load File")
        load_btn.clicked.connect(self._load_file)
        layout.addWidget(load_btn)
        
        layout.addStretch()
    
    def _browse_file(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "Select Data File",
            "",
            "Data Files (*.csv *.xlsx *.xls *.json);;All Files (*.*)"
        )
        if file_path:
            self.file_path_edit.setText(file_path)
    
    def _load_file(self):
        file_path = self.file_path_edit.text()
        if not file_path:
            QMessageBox.warning(self, "No File", "Please select a file")
            return
        
        try:
            df = load_file(file_path)
            is_valid, non_continuous = validate_continuous_dataframe(df)
            
            if not is_valid:
                QMessageBox.warning(
                    self,
                    "Invalid Data",
                    f"The following columns are not continuous numerical data: {', '.join(non_continuous)}\n"
                    "Please remove these columns or select a different file."
                )
                return
            
            self.file_loaded.emit(df)
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load file: {str(e)}")


class SklearnTab(QWidget):
    """Tab for loading scikit-learn datasets."""
    
    dataset_loaded = Signal(pd.DataFrame)
    
    def __init__(self):
        super().__init__()
        self._init_ui()
    
    def _init_ui(self):
        layout = QVBoxLayout(self)
        
        label = QLabel("Load built-in scikit-learn dataset")
        layout.addWidget(label)
        
        self.dataset_combo = QComboBox()
        datasets = get_available_datasets()
        self.dataset_combo.addItems(list(datasets.keys()))
        layout.addWidget(self.dataset_combo)
        
        load_btn = QPushButton("Load Dataset")
        load_btn.clicked.connect(self._load_dataset)
        layout.addWidget(load_btn)
        
        layout.addStretch()
    
    def _load_dataset(self):
        dataset_name = self.dataset_combo.currentText()
        try:
            df = load_sklearn_dataset(dataset_name)
            self.dataset_loaded.emit(df)
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load dataset: {str(e)}")


class GeneratorTab(QWidget):
    """Tab for generating custom data."""
    
    data_generated = Signal(pd.DataFrame)
    
    def __init__(self):
        super().__init__()
        self._init_ui()
    
    def _init_ui(self):
        layout = QVBoxLayout(self)
        
        label = QLabel("Generate custom synthetic data")
        layout.addWidget(label)
        
        form = QFormLayout()
        
        self.method_combo = QComboBox()
        methods = get_generation_methods()
        self.method_combo.addItems(list(methods.keys()))
        form.addRow("Method:", self.method_combo)
        
        self.n_samples_spin = QSpinBox()
        self.n_samples_spin.setRange(10, 100000)
        self.n_samples_spin.setValue(1000)
        form.addRow("Samples:", self.n_samples_spin)
        
        self.n_features_spin = QSpinBox()
        self.n_features_spin.setRange(2, 100)
        self.n_features_spin.setValue(5)
        form.addRow("Features:", self.n_features_spin)
        
        self.seed_spin = QSpinBox()
        self.seed_spin.setRange(0, 999999)
        self.seed_spin.setValue(42)
        form.addRow("Random Seed:", self.seed_spin)
        
        layout.addLayout(form)
        
        generate_btn = QPushButton("Generate Data")
        generate_btn.clicked.connect(self._generate_data)
        layout.addWidget(generate_btn)
        
        layout.addStretch()
    
    def _generate_data(self):
        method_name = self.method_combo.currentText()
        n_samples = self.n_samples_spin.value()
        n_features = self.n_features_spin.value()
        seed = self.seed_spin.value()
        
        try:
            methods = get_generation_methods()
            generator = methods[method_name]
            
            # Call with basic parameters
            df = generator(n_samples, n_features, seed=seed)
            self.data_generated.emit(df)
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to generate data: {str(e)}")


class ImportDialog(QDialog):
    """Dialog for importing data from various sources."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.loaded_data: Optional[pd.DataFrame] = None
        self.setWindowTitle("Import Data")
        self.setMinimumSize(600, 400)
        self._init_ui()
    
    def _init_ui(self):
        layout = QVBoxLayout(self)
        
        # Tab widget for different import methods
        self.tabs = QTabWidget()
        
        # Local file tab
        self.local_tab = LocalFileTab()
        self.local_tab.file_loaded.connect(self._on_data_loaded)
        self.tabs.addTab(self.local_tab, "Local File")
        
        # Scikit-learn tab
        self.sklearn_tab = SklearnTab()
        self.sklearn_tab.dataset_loaded.connect(self._on_data_loaded)
        self.tabs.addTab(self.sklearn_tab, "Scikit-learn")
        
        # Generator tab
        self.generator_tab = GeneratorTab()
        self.generator_tab.data_generated.connect(self._on_data_loaded)
        self.tabs.addTab(self.generator_tab, "Generate Data")
        
        # Add TensorFlow tab if available
        if tfds_available():
            note_label = QLabel("TensorFlow Datasets available (not implemented in basic version)")
            self.tabs.addTab(note_label, "TensorFlow")
        
        # Add Kaggle tab if available
        if kaggle_available():
            note_label = QLabel("Kaggle API available (not implemented in basic version)")
            self.tabs.addTab(note_label, "Kaggle")
        
        layout.addWidget(self.tabs)
    
    def _on_data_loaded(self, df: pd.DataFrame):
        """Handle successful data loading."""
        self.loaded_data = df
        
        # Show success message with data info
        msg = QMessageBox(self)
        msg.setIcon(QMessageBox.Icon.Information)
        msg.setWindowTitle("Data Loaded")
        msg.setText(f"Successfully loaded data!\n\n"
                    f"Rows: {len(df)}\n"
                    f"Columns: {len(df.columns)}\n"
                    f"Columns: {', '.join(df.columns)}")
        msg.exec()
        
        # Close dialog
        self.accept()
    
    def get_data(self) -> Optional[pd.DataFrame]:
        """Get the loaded data.
        
        Returns:
            Loaded DataFrame or None if dialog was cancelled
        """
        return self.loaded_data
