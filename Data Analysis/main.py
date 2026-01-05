"""Main application entry point."""
import sys
from PySide6.QtWidgets import QApplication
from main_window import MainWindow


def main():
    """Run the application."""
    app = QApplication(sys.argv)
    
    # Set application metadata
    app.setApplicationName("Data Analysis Application")
    app.setOrganizationName("Data Analysis")
    app.setApplicationVersion("1.0.0")
    
    # Create and show main window
    window = MainWindow()
    window.show()
    
    # Run application
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
