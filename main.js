const electron = require("electron")
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const ipcMain = electron.ipcMain;



app.commandLine.appendSwitch("enable-web-bluetooth", true);
app.commandLine.appendSwitch('enable-experimental-web-platform-features', true);

const path = require("path")
const url = require("url")

// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		backgroundColor : "#1b262c",
		webPreferences : {
			preload: path.join(__dirname, './preload.js'),
		}

	})

	// required for Dev tools
	devToolsWindow = new BrowserWindow()

	mainWindow.webContents.setDevToolsWebContents(devToolsWindow.webContents)
	mainWindow.webContents.openDevTools({ mode: 'detach' })

	//mainWindow.loadURL("http://google.com") and load the index.html of the app.
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, "/app/index.html"),
		protocol: "file:",
		slashes: true
	}))


	// Open the DevTools. mainWindow.webContents.openDevTools() Emitted when the
	// window is closed.
	mainWindow.on("closed", function () {
		// Dereference the window object, usually you would store windows in an array if
		// your app supports multi windows, this is the time when you should delete the
		// corresponding element.
		mainWindow = null
	})
}


// Quit when all windows are closed.
app.on("window-all-closed", function () {
	// On OS X it is common for applications and their menu bar to stay active until
	// the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit()
	}
})

app.on("activate", function () {
	// On OS X it"s common to re-create a window in the app when the dock icon is
	// clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.


// This method will be called when Electron has finished initialization and is
// ready to create browser windows. Some APIs can only be used after this event
// occurs.


app.on("ready", function(){

	createWindow();

	// Bluetooth

	let bluetooth_mode = "discovery";

	// Discovery Settings
	let discovery_timeout;
	let discovery_callback;
	let discovery_device_list;

	// Pairing Settings
	let pairing_device_id;
	let pairing_callback;
	let pairing_timeout;

	function sendBluetoothDiscovery(isFinal){
		mainWindow.webContents.send("bluetooth-discovery-response", {
			devices : discovery_device_list,
			isFinal : isFinal
		});
	}

	ipcMain.on("bluetooth-pair", (event, args) => {

		console.log("Set bluetooth listener to pairing mode");
		bluetooth_mode = "pairing";
		pairing_device_id = args;
		event.returnValue = 200;

		let timeout = setTimeout(function(){
			if (bluetooth_mode == "pairing" && pairing_timeout == timeout){
				console.log("Bluetooth pairing timed out");
				bluetooth_mode = "none";
				if (pairing_callback){
					pairing_callback("");
				}
				clearTimeout(pairing_timeout);
			}
		}, 30*1000);

	})

	ipcMain.on("bluetooth-discovery", (event, arg) => {

		console.log("Set bluetooth listener to discovery mode");
		bluetooth_mode = "discovery";
		discovery_device_list = [];
		event.returnValue = 200;

		let timeout = setTimeout(function(){
			if (bluetooth_mode == "discovery" && discovery_timeout == timeout){
				console.log("Bluetooth discovery timed out");
				bluetooth_mode = "none";
				if (discovery_callback){
					discovery_callback("");
				}
				sendBluetoothDiscovery(true);
				clearTimeout(discovery_timeout);
			}
		}, 30*1000);

		discovery_timeout = timeout;
	})

	ipcMain.on("bluetooth-discovery-stop", (event, arg) => {
		console.log("Bluetooth discovery stopped");
		bluetooth_mode = "none";
		console.log(typeof discovery_callback);
		if (discovery_callback){
			discovery_callback("");
		}
		sendBluetoothDiscovery(true);
		clearTimeout(discovery_timeout);
	})

	mainWindow.webContents.on("select-bluetooth-device", (event, deviceList, callback) => {

		event.preventDefault();

		console.log("Bluetooth Listener triggered")

		console.log(deviceList);

		if (bluetooth_mode == "discovery"){

			console.log("Discovery Mode");

			discovery_device_list = deviceList;
			discovery_callback = callback;

			sendBluetoothDiscovery();

			// return;

		} else if (bluetooth_mode == "pairing") {

			console.log("Pairing Mode");

			pairing_callback = callback;

			let result_device = deviceList.find((device) => {
				return device.deviceId == pairing_device_id;
			})

			if (result_device) {
				console.log("Found Device");
				console.log(result_device);
				callback(result_device.deviceId);
			}

		} else {
			console.log("No Mode", bluetooth_mode);
			callback("");
		}

		
	})

})