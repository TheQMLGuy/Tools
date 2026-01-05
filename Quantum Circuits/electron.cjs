/**
 * Electron Main Process
 * Creates the desktop application window
 */

const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    app.quit();
}

let mainWindow;

const createWindow = () => {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        title: 'Quantum Circuit Playground',
        icon: path.join(__dirname, 'public', 'quantum.svg'),
        backgroundColor: '#0a0a0f',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webgl: true,
        },
        titleBarStyle: 'default',
        show: false,
    });

    // Determine URL based on development or production
    const isDev = !app.isPackaged;

    if (isDev) {
        // Development: Load from Vite dev server
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Production: Load built files
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
};

// Create custom menu
const createMenu = () => {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Circuit',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
              window.dispatchEvent(new CustomEvent('clear-circuit'));
            `);
                    }
                },
                { type: 'separator' },
                {
                    label: 'Export...',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
              window.dispatchEvent(new CustomEvent('open-export'));
            `);
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Demos',
            submenu: [
                {
                    label: 'Bell State',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
              window.dispatchEvent(new CustomEvent('load-demo', { detail: 'bell' }));
            `);
                    }
                },
                {
                    label: 'Deutsch-Jozsa',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
              window.dispatchEvent(new CustomEvent('load-demo', { detail: 'deutschJozsa' }));
            `);
                    }
                },
                {
                    label: 'Bernstein-Vazirani',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
              window.dispatchEvent(new CustomEvent('load-demo', { detail: 'bernsteinVazirani' }));
            `);
                    }
                },
                {
                    label: 'Quantum Fourier Transform',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
              window.dispatchEvent(new CustomEvent('load-demo', { detail: 'qft' }));
            `);
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Learn Quantum Computing',
                    click: () => {
                        shell.openExternal('https://qiskit.org/textbook');
                    }
                },
                {
                    label: 'IBM Quantum',
                    click: () => {
                        shell.openExternal('https://quantum-computing.ibm.com');
                    }
                },
                { type: 'separator' },
                {
                    label: 'About',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Quantum Circuit Playground',
                            message: 'Quantum Circuit Playground',
                            detail: 'A high-performance interactive quantum circuit simulator.\n\nVersion 1.0.0\n\nDesign, simulate, and analyze quantum circuits with real-time visualization.',
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

// App ready
app.whenReady().then(() => {
    createWindow();
    createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
