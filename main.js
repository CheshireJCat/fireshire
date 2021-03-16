const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const ipc_main_connect = require('./ipc_main/index.js');

let mainWindow = null;
const debug = /--debug/.test(process.argv[2]);

function makeSingleInstance(){
  if(process.mas) return;
  app.requestSingleInstanceLock();
  app.on('second-instance', () => {
    if(mainWindow){
      if(mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  })
}

function createWindow() {
  const windowOptions = {
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, '/preload.js'),
    }
  };

  mainWindow = new BrowserWindow(windowOptions);

  if(debug){
    mainWindow.loadURL("http://localhost:3000/");
  }else{
    mainWindow.loadURL(url.format({
      pathname:path.join(__dirname, './build/index.html'), 
      protocol:'file:', 
      slashes:true 
    }))
  }
  
  ipc_main_connect(mainWindow);
  
  mainWindow.webContents.openDevTools();
  if(debug){
    // require('devtron').install();
  }

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

// makeSingleInstance();

app.on('ready', function(event) {
  createWindow();
});

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin'){
    app.quit();
  }
});

app.on('activate', () => {
  if(mainWindow === null){
    createWindow();
  }
});

module.exports = mainWindow;