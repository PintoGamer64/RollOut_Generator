// Node Modules
const { app, BrowserWindow, ipcMain } = require('electron');
const { readdirSync } = require('node:fs');
const { homedir, hostname } = require('os');
const { dirname, join } = require('node:path');

// Local Modules
const { Startup } = require('./Startup');
const { GlobalShortcuts, EventsProcess, MainProcess, GlobalScripts, FilesTratment, UploadFiles } = require('./Scripts/ExportScripts');

//Imports
const { FilesDirectory, PoliciesDirectory } = require('./Resources/XMLDataDefault.json');

// Call Classes Preset JS Files
const { UserSettingsFileGenerator, UserSettingsFileDelete, UserSettingsFileReset, __init__ } = new Startup();
const { registerShortcut } = new GlobalShortcuts();
const { ViewLocals, LoadXMLSettings } = new EventsProcess();
const { restartApplication } = new MainProcess();
const { TransformXMLToJSON, SendFileToRollOutLocation } = new FilesTratment();
const { ValidateFiles, TreatmentFilesRoutes } = new UploadFiles();
const { ParseFile } = new GlobalScripts();

// Procces Start
__init__(FilesDirectory, PoliciesDirectory);

let Settings;

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
  }
} catch (err) {
  restartApplication();
}

//Main Process
const createWindow = () => {
  // Create the Main Window.
  const mainWindow = new BrowserWindow({
    title: 'Move Files of System',
    minWidth: 800,
    minHeight: 525,
    width: 800,
    height: 525,
    x: 0,
    y: 0,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      preload: join(__dirname, 'Preloads/preload.js'),
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(join(__dirname, '/Interface/Views/index.html'));

  try {
    if (Settings.setXMLConfig === false) {
      const config = new BrowserWindow({
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
      config.loadFile(join(__dirname, 'Interface/Views/WindowXML.html'));
    }
  } catch (err) {
    console.log('Throw JavaScript Node Exception To Create Settings Directory');
  }

  try {
    // Check the user config in settings JSON file
    if (!Settings.setStatus) {
      // Create the Modal Window Settings Setter.
      const child = new BrowserWindow({
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
      //child.setMenu(null);
      child.loadFile(join(__dirname, '/Interface/Views/WindowSettings.html'));
    }
  } catch (err) {
    console.log('Throw JavaScript Node Exception To Create Settings Directory');
  }
};

// When de app is ready, execute the the window
app.on('ready', () => {
  registerShortcut('CommandOrControl+R');
  createWindow();
});

// Check the windows count in the app
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() });

// Listen Events From Client Side
ipcMain.on(
  'viewLocalFiles',
  () => ViewLocals()
);
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
  }
);
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on(
  'RestoreSettingFile',
  () => {
    UserSettingsFileDelete();
    restartApplication();
  }
);
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on(
  'SetXMLConfigFiles',
  () => {
    UserSettingsFileGenerator({
      status: true,
      XMLConfig: false,
      directoryPackage: require(join(homedir(), 'AppData\\Roaming\\.UserSettings\\settings.json')).directoryPackage,
      directoryRoutes: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\DEFAULT\\Router.xml'),
      directoryPolicies: join(homedir(), 'AppData\\Roaming\\.UserSettings\\ConfigRouter\\DEFAULT\\Policies.xml')
    })
    restartApplication();
  }
);
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on('ResetConfig', () => {
  UserSettingsFileReset();
})
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on(
  'SendXMLFiles',
  (event, { Path, Type }) => {
    LoadXMLSettings(Path, Type);
  }
);
// -------------------------------------------------- // -------------------------------------------------- //
ipcMain.on(
  'UploadFiles',
  (event, JsonData) => {
    // Definitions
    let XMLRouter, XMLPolicies;
    // Conditional Event To Check The Router CUSTOM Or DEFAULT
    XMLRouter = TransformXMLToJSON(Settings.setDirectoryRoutes);
    let CreateDirRouter = ValidateFiles(JSON.parse(XMLRouter), Settings.setDirectoryPackage);
    XMLPolicies = TransformXMLToJSON(Settings.setDirectoryPolicies);
    let CreateDirPolicies = ValidateFiles(JSON.parse(XMLPolicies), Settings.setDirectoryPackage);
    if (JsonData.fileName.includes('.csv')) {
      let FileRouter = TreatmentFilesRoutes(CreateDirPolicies);
      SendFileToRollOutLocation(FileRouter, JsonData.fileLocation)
    } else {
      let FilePolicies = TreatmentFilesRoutes(CreateDirRouter);
      SendFileToRollOutLocation(FilePolicies, JsonData.fileLocation)
    }
  }
);

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