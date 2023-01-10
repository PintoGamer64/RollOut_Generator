// Node Modules
const { app, BrowserWindow, ipcMain, autoUpdater, dialog, ipcRenderer } = require('electron');
const { homedir } = require('os');
const { join } = require('node:path');

// Local Modules
const { Startup } = require('./Startup');
const { GlobalShortcuts, EventsProcess, MainProcess, FilesTratment, FilesValidator } = require('./Scripts/ExportScripts');

//Imports<
const { FilesDirectory, PoliciesDirectory } = require('./Resources/XMLDataDefault.json');

// Call Classes Preset JS Files
const { UserSettingsFileGenerator, UserSettingsFileDelete, UserSettingsFileReset, __init__ } = new Startup();
const { registerShortcuts, unregisterShortcuts } = new GlobalShortcuts();
const { ViewLocals, LoadXMLSettings } = new EventsProcess();
const { restartApplication } = new MainProcess();
const { TransformXMLToJSON, SendFileToRollOutLocation, DeleteEmptyDirectories, SendFileToRollOutLocationJava } = new FilesTratment();
const { ValidateFiles, TreatmentFilesRoutes } = new FilesValidator();

// Procces Start
__init__(FilesDirectory, PoliciesDirectory);

// Definitions
let Settings,
  FileRouter,
  FilePolicies,
  XMLRouter,
  XMLPolicies,
  CreateDirRouter,
  CreateDirPolicies;

/**
 * UserSettings --> Data from this JSON file
 */
try {
  const { directoryPackage, directoryPolicies, directoryRoutes, status, XMLConfig } = require(join(homedir(), 'AppData\\Roaming\\.UserSettings\\settings.json'));
  Settings = {
    setDirectoryPackage: directoryPackage,
    setDirectoryPolicies: directoryPolicies,
    setDirectoryRoutes: directoryRoutes,
    setStatus: status,
    setXMLConfig: XMLConfig
  };
} catch (err) {
  restartApplication();
};
//Main Process
const createWindow = () => {
  // Create the Main Window.
  const mainWindow = new BrowserWindow({
    icon: join(__dirname, "Resources/MoveFiles_Icon.ico"),
    minWidth: 1000,
    minHeight: 650,
    width: 1000,
    height: 650,
    center: true,
    resizable: false,
    closable: true,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      preload: join(__dirname, 'Preloads/preload.js'),
    }
  });
  // Set UserTask List
  mainWindow.setThumbarButtons([
    {
      icon: join(__dirname, 'Resources/Restart.png'),
      click: () => {
        UserSettingsFileDelete();
        restartApplication();
      }
    }, {
      icon: join(__dirname, 'Resources/Settings.png'),
      click: () => {
        UserSettingsFileGenerator({
          status: true,
          XMLConfig: false,
          directoryPackage: require(join(homedir(), 'AppData\\Roaming\\.UserSettings\\settings.json')).directoryPackage,
          directoryRoutes: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\DEFAULT\\Router.xml'),
          directoryPolicies: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\DEFAULT\\Policies.xml')
        })
        restartApplication();
      }
    }
  ])
  // Configs
  mainWindow.setTitle('NetLogistiK - MoveFiles')
  mainWindow.setMaxListeners(20);
  mainWindow.setMenu(null);
  // and load the index.html of the app.
  mainWindow.loadFile(join(__dirname, '/Interface/Views/index.html'));
  try {
    if (Settings.setXMLConfig === false) {
      const config = new BrowserWindow({
        icon: join(__dirname, "Resources/MoveFiles_Icon.ico"),
        parent: mainWindow,
        width: 800,
        height: 500,
        resizable: false,
        maxWidth: 800,
        maxHeight: 500,
        minimizable: false,
        maximizable: false,
        closable: false,
        center: true,
        modal: true,
        webPreferences: {
          devTools: true,
          nodeIntegration: true,
          preload: join(__dirname, 'Preloads/PreloadXML.js')
        }
      })
      config.setMaxListeners(20);
      config.setMenu(null);
      config.loadFile(join(__dirname, 'Interface/Views/WindowXML.html'));
    }
  } catch (err) {
    console.log('Throw JavaScript Node Exception To Create Settings Directory');
  };
  try {
    // Check the user config in settings JSON file
    if (!Settings.setStatus) {
      // Create the Modal Window Settings Setter.
      const child = new BrowserWindow({
        icon: join(__dirname, "Resources/MoveFiles_Icon.ico"),
        parent: mainWindow,
        width: 400,
        height: 400,
        resizable: false,
        maxWidth: 400,
        maxHeight: 400,
        minimizable: false,
        maximizable: false,
        closable: false,
        center: true,
        modal: true,
        movable: true,
        webPreferences: {
          devTools: true,
          nodeIntegration: true,
          preload: join(__dirname, 'Preloads/preloadRoute.js')
        }
      });
      child.setMaxListeners(20);
      child.setMenu(null);
      child.loadFile(join(__dirname, '/Interface/Views/WindowSettings.html'));
    }
  } catch (err) {
    console.log('Throw JavaScript Node Exception To Create Settings Directory');
  };
};
// Disable Hardware Accelaration
app.disableHardwareAcceleration();
// When de app is ready, execute the the window
app.on('ready', () => {
  registerShortcuts('CommandOrControl+R');
  createWindow();
});
// Automatic Update
require('update-electron-app')();
autoUpdater.on('update-downloaded', () => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail:
      'A new version has been downloaded. Restart the application to apply the updates.',
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
})

// When the app is focused or not focused
app.on('browser-window-focus', (event, window) => {
  window.on('focus', () => {
    registerShortcuts('CommandOrControl+R');
  });
  window.on('blur', () => {
    unregisterShortcuts();
  });
});
// Listen Events From Client Side
ipcMain.on('viewLocalFiles', () => ViewLocals());
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on(
  'UpdateRouteSystem',
  (event, inputRouteData) => {
    UserSettingsFileGenerator({
      status: true,
      XMLConfig: true,
      directoryPackage: inputRouteData,
      directoryRoutes: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\DEFAULT\\Router.xml'),
      directoryPolicies: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\DEFAULT\\Policies.xml')
    })
    restartApplication();
  });
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on('RestoreSettingFile', () => {
  UserSettingsFileDelete();
  restartApplication();
});
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on('SetXMLConfigFiles', () => {
  UserSettingsFileGenerator({
    status: true,
    XMLConfig: false,
    directoryPackage: require(join(homedir(), 'AppData\\Roaming\\.UserSettings\\settings.json')).directoryPackage,
    directoryRoutes: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\DEFAULT\\Router.xml'),
    directoryPolicies: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\DEFAULT\\Policies.xml')
  })
  restartApplication();
});
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on('ResetConfig', () => {
  UserSettingsFileReset();
})
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on('SendXMLFiles', (event, { Path, Type }) => {
  LoadXMLSettings(Path, Type);
});
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on(
  'UploadFiles',
  (event, { fileName, Java, fileLocation }) => {
    // Definitions
    XMLRouter = TransformXMLToJSON(Settings.setDirectoryRoutes);
    CreateDirRouter = ValidateFiles(JSON.parse(XMLRouter), Settings.setDirectoryPackage);
    FileRouter = TreatmentFilesRoutes(CreateDirRouter);
    // Definitions
    XMLPolicies = TransformXMLToJSON(Settings.setDirectoryPolicies);
    CreateDirPolicies = ValidateFiles(JSON.parse(XMLPolicies), Settings.setDirectoryPackage);
    FilePolicies = TreatmentFilesRoutes(CreateDirPolicies);
    // Conditional Event To Check The Router CUSTOM Or DEFAULT
    if (fileName.includes('.csv')) {
      // Execution
      SendFileToRollOutLocation(FilePolicies, fileLocation, fileName, Settings.setDirectoryPackage);
    } else if (fileName.includes('.java') || fileName.includes('.properties')) {
      SendFileToRollOutLocationJava(FileRouter, fileLocation, fileName, Settings.setDirectoryPackage, Java);
    } else {
      // Execution
      SendFileToRollOutLocation(FileRouter, fileLocation, fileName, Settings.setDirectoryPackage);
    }
  }
);
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on('DeleteDirectories', () => {
  for (let index = 0; index < 10; index++) {
    DeleteEmptyDirectories(FileRouter, Settings.setDirectoryPackage);
    DeleteEmptyDirectories(FilePolicies, Settings.setDirectoryPackage);
  }
})
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on('Restart', () => {
  UserSettingsFileGenerator({
    status: true,
    XMLConfig: true,
    directoryPackage: require(join(homedir(), 'AppData\\Roaming\\.UserSettings\\settings.json')).directoryPackage,
    directoryRoutes: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\CUSTOM\\Router.xml'),
    directoryPolicies: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\CUSTOM\\Policies.xml')
  });
  restartApplication();
})