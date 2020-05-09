// Main.js ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////

const DEFAULT_BULB_CONFIG = {
	BULB_MAC_QUICK_ADDR 			: "98:5D:AD:25:DB:90",
	BULB_SERVICE_UUID 				: "f000ffa0-0451-4000-b000-000000000000",
	BULB_COLOR_CHARACTERISTIC_UUID 	: "f000ffa5-0451-4000-b000-000000000000",
	BULB_POWER_CHARACTERISTIC_UUID  : "f000ffa3-0451-4000-b000-000000000000"
}

let isElectron;

///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

let last_device_id;

let paired_device = {

	device_reference 	: null,
	device_id 			: null,
	server 				: null,
	service 			: null,
	characteristic_map 	: null,

	reset : function(){

		if (paired_device.device_id !== null && paired_device.device_id.replace(/ /g, "") !== ""){
			last_device_id = paired_device.device_id;
		}

		paired_device.device_reference 		= null;
		paired_device.device_id 			= null;
		paired_device.server 				= null;
		paired_device.service 				= null;
		paired_device.characteristic_map 	= [];
		
	}
}

///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

let color_picker;

let power_state = {
	state : false,
	listeners : [],
	set : function(state){
		power_state.state = state;
		power_state.listeners.forEach(function(listener){
			listener(state);
		})
	},
	get : function(){
		return power_state.state;
	},
	onChange : function(fn){
		power_state.listeners.push(fn);
	}
}

///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

// Initiate UI
// Device between pair via chrome or pair via electron
// If successful pair with, show controller

/*

Preload:

jQuery
Bootstrap
Iro Color Wheel
Notification
Pagination

*/

$(document).ready(() => {

	console.log("Application Ready");

	//

	var userAgent = navigator.userAgent.toLowerCase();
	isElectron = (userAgent.indexOf(' electron/') > -1);

	//

	prepareControlPanelSwapper();
	preparePowerControllers();
	prepareColorControllers();
	Notification.stop();
	goToPage("main");
	handleBluetoothScanner();
	developerPanel();

})

function prepareControlPanelSwapper(){

	$(".tab-buttons > button").click(function(e){
		e.preventDefault();

		let panel_type = $(this).attr("panel");
		let active_panel = $(`.panel-layout.active`).attr("panel-type");

		if (panel_type == active_panel) return;

		console.log(`Switching to panel ${panel_type} from ${active_panel}`);

		$(".tab-buttons > button").removeClass("active");
		$(this).addClass("active");

		$(`.panel-layout.active`).removeClass("active").slideUp(100);
		$(`.panel-layout[panel-type="${panel_type}"]`).addClass("active").slideDown(100);

		return false;
	})
}

function preparePowerControllers(){

	$(".power-button").click(function(e){
		e.preventDefault();

		if (paired_device.device_id){

			power_state.set(!power_state.get());
			setBulbPowerState(power_state.get());

		} else {
			Notification.set("No device paired", "no-device", 3);
		}

		return false;

	})

	power_state.onChange(function(state){
		if (state){
			$(".power-button").addClass("on");
			$(".color-wheel, .color-presets, .slider-container, .temperature-slider-container").removeClass("disabled-ui");
		} else {
			$(".power-button").removeClass("on");
			$(".color-wheel, .color-presets, .slider-container, .temperature-slider-container").addClass("disabled-ui");
		}
	})
}

$(window).resize(function(){

	let color_picker_size = window.getComputedStyle(document.body).getPropertyValue("--color-picker-size");

	if (typeof color_picker_size !== "undefined"){
		color_picker_size = parseInt(color_picker_size.replace("px", ""), 10);
	}

	if (isNaN(color_picker_size)){
		color_picker_size = 256;
	}

	color_picker.resize(color_picker_size);
})

function prepareColorControllers(){

	let color_picker_size = window.getComputedStyle(document.body).getPropertyValue("--color-picker-size");

	if (typeof color_picker_size !== "undefined"){
		color_picker_size = parseInt(color_picker_size.replace("px", ""), 10);
	}

	if (isNaN(color_picker_size)){
		color_picker_size = 256;
	}

	//

	color_picker = new iro.ColorPicker(".color-wheel", {
		width : color_picker_size,
		height : color_picker_size,
		handleRadius : 8,
		wheelLightness : false,
		layout : [
			{
				component : iro.ui.Wheel
			}
		]
	});

	let brightness_slider = new iro.ColorPicker(".brightness-slider", {
		width : color_picker_size,
		layout : [
			{
				component : iro.ui.Slider
			}
		]
	})

	let temperature_slider = new iro.ColorPicker(".temperature-slider", {
		width : color_picker_size,
		layout : [
			{
				component : iro.ui.Slider,
				options : {
					sliderType : "kelvin",
					minTemperature : 1000,
					maxTemperature : 10000
				}
			}
		]
	})

	//

	function setBulbColorFromHandler(color){
		if (paired_device.device_id){
			setBulbColor(color.rgb.r, color.rgb.g, color.rgb.b);
		}
	}

	function updateColorHandler(color){
		color_picker.color.set(color);
		brightness_slider.color.set(color);
		temperature_slider.color.set(color);
	}

	//

	color_picker.on("color:change", updateColorHandler)
	color_picker.on("input:change", setBulbColorFromHandler)

	brightness_slider.on("color:change", updateColorHandler)
	brightness_slider.on("input:change", setBulbColorFromHandler)

	temperature_slider.on("color:change", updateColorHandler)
	temperature_slider.on("input:change", setBulbColorFromHandler)

	//

	$(".color-presets > a").each(function(index){

		$(this).click(function(e){
			e.preventDefault();
			
			let color = $(this).css("background-color");
			console.log(color);
			color_picker.color.set(color);
			
			if (paired_device.device_id){
				setBulbColor(color_picker.color.rgb.r, color_picker.color.rgb.g, color_picker.color.rgb.b);
			}

		})
	})

}

//

function setBulbColor(r, g, b){

	if (!(paired_device.device_id)){
		console.log("Failed to set bulb color - no device paired");
		return
	}

	if (typeof paired_device.characteristic_map[DEFAULT_BULB_CONFIG.BULB_COLOR_CHARACTERISTIC_UUID] == "undefined"){
		console.log("Did not find bluetooth characteristic to set RGB");
		return;
	}

	let array_uint8 = new Uint8Array([r, g, b]);

	paired_device.characteristic_map[DEFAULT_BULB_CONFIG.BULB_COLOR_CHARACTERISTIC_UUID].writeValue(array_uint8.buffer).then(() => {
		console.log(`Pushed bulb color rgb(${r}, ${g}, ${b})`)
	}).catch((e) => {
		console.log("Failure", e);
	});
}

//

function getBulbColor(doUpdateUI){

	if (!(paired_device.device_id)){
		console.log("Failed to get bulb color - no device paired");
		return
	}

	if (typeof paired_device.characteristic_map[DEFAULT_BULB_CONFIG.BULB_COLOR_CHARACTERISTIC_UUID] == "undefined"){
		console.log("Did not find bluetooth characteristic to get RGB");
		return;
	}

	paired_device.characteristic_map[DEFAULT_BULB_CONFIG.BULB_COLOR_CHARACTERISTIC_UUID].readValue().then(value => {
		
		let byteArray = getByteArrayFromDataview(value, "getUint8");

		console.log("Bulb color -> ", byteArray);

		let color_object = {
			r : byteArray[0],
			g : byteArray[1],
			b : byteArray[2]
		}

		if (doUpdateUI){
			color_picker.color.set(color_object)
		}

		return color_object;

	}).catch((e) => {
		console.log(e);
	})
}

///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

function setBulbPowerState(state){

	if (!(paired_device.device_id)){
		console.log("Failed to set bulb power state - no device paired");
		return
	}

	if (typeof paired_device.characteristic_map[DEFAULT_BULB_CONFIG.BULB_POWER_CHARACTERISTIC_UUID] == "undefined"){
		console.log("Did not find bluetooth characteristic to set power state");
		return;
	}

	let array_uint8 = new Uint8Array([83, (state == true) ? 79 : 67]);

	paired_device.characteristic_map[DEFAULT_BULB_CONFIG.BULB_POWER_CHARACTERISTIC_UUID].writeValue(array_uint8.buffer).then(() => {
		console.log(`Pushed bulb power state ${(state == true) ? "true" : "false"}`, array_uint8);
		getBulbPowerState(true);
	}).catch((e) => {
		console.log("Failure", e);
	});

}

function getBulbPowerState(doUpdateUI){

	if (!(paired_device.device_id)){
		console.log("Failed to get bulb power state - no device paired");
		return
	}

	if (typeof paired_device.characteristic_map[DEFAULT_BULB_CONFIG.BULB_POWER_CHARACTERISTIC_UUID] == "undefined"){
		console.log("Did not find bluetooth characteristic to get power state");
		return;
	}

	paired_device.characteristic_map[DEFAULT_BULB_CONFIG.BULB_POWER_CHARACTERISTIC_UUID].readValue().then(value => {
		
		let byteArray = getByteArrayFromDataview(value, "getUint8");

		let state = (byteArray[0] == 79);

		console.log("Bulb power state -> ", state, byteArray);

		

		if (doUpdateUI){
			power_state.set(state);
		}

		return state;

	}).catch((e) => {
		console.log(e);
	})


}

///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

function handleBluetoothScanner(){

	let bluetooth_scanning_state = false;

	// Scan for devices

	$(".scan-btn").mousedown((e) => {

		e.preventDefault();

		if (e.which == 3){
			requestDevicePair(DEFAULT_BULB_CONFIG.BULB_MAC_QUICK_ADDR);
			return;
		}

		$(this).attr("disabled", true);
		$(".scanning-animation-div").fadeIn(100);

		if (isElectron) {

			// Electron-specific code
			// Connect via backend

			if (bluetooth_scanning_state == false){

				bluetooth_scanning_state = true;

				Notification.set("Scanning . . .", "scanning");

				$(".scan-btn").text("Stop Scanning");

				$(".bluetooth-list > .bluetooth-item:not(.template)").remove();

				console.log("Requesting Bluetooth Scan");

				ipcRenderer.sendSync("bluetooth-state", {
					mode : "discovery"
				})

				$(this).removeAttr("disabled");

				navigator.bluetooth.requestDevice({
					acceptAllDevices : true,
					optionalServices : ["generic_access", "battery_service", "device_information", DEFAULT_BULB_CONFIG.BULB_SERVICE_UUID]
				}).then(device => {
					console.log("Bluetooth Discovery Callback");
				}).catch(error => {
					console.log(error);
				}).finally(() => {
					Notification.stop("scanning");
					$(".scanning-animation-div").fadeOut(100);
				})

			} else {

				bluetooth_scanning_state = false;

				Notification.set("Scanning stopped", "scanning-stopped", 2);

				$(".scan-btn").text("Scan");

				ipcRenderer.send("bluetooth-state", {
					mode : "discovery",
					stop : true
				});

				$(this).removeAttr("disabled");
				$(".scanning-animation-div").fadeOut(100);

			}

		} else {

			// Use Chrome's bluetooth picker

			navigator.bluetooth.requestDevice({
				acceptAllDevices : true,
				optionalServices : ["generic_access", "battery_service", "device_information", DEFAULT_BULB_CONFIG.BULB_SERVICE_UUID]
			}).then(device => {
				console.log("Bluetooth Discovery Callback");
			}).catch(error => {
				console.log(error);
			}).finally(() => {
				Notification.stop("scanning");
				$(".scanning-animation-div").fadeOut(100);
			})

			$(".scanning-animation-div").fadeOut(100);

		}

		return false;

	})

	//

	// Display scan results

	if (!isElectron){
		return;
	}

	ipcRenderer.on("bluetooth-discovery-response", (event, response) => {

		let devices = response.devices;

		// console.log(devices);

		let device_map = {};

		devices.forEach((device, index) => {

			// If the item doesn't exist, create it
			// If the item does exist, and the name is different, change it
			// If the item shouldn't exist, remove it
			
			if (typeof device_map[device.deviceId] == "undefined"){
				console.log(`Set ${device.deviceId} to ${device.deviceName} [${typeof device.deviceId}, ${typeof device.deviceName}]`);
				device_map[device.deviceId] = device.deviceName;
			}

			let bluetooth_item = $(`.bluetooth-list > .bluetooth-item[device_id="${device.deviceId}"]`)

			if (bluetooth_item.length == 0){

				// console.log(device);

				console.log(`Created bluetooth item for ${device.deviceId} with name ${device.deviceName}`)

				bluetooth_item = $(".bluetooth-list > .bluetooth-item.template").clone().removeClass("template");

				bluetooth_item.attr("device_id", device.deviceId);
				bluetooth_item.children("span.name").text(`Name : ${(typeof device.deviceName == "undefined" || device.deviceName == null) ? "Unknown" : device.deviceName}`);
				bluetooth_item.children("span.address").html(`Address : <em>${device.deviceId}</em>`);
				bluetooth_item.appendTo($(".bluetooth-list"));

				bluetooth_item.children("button").click(function(e){
					e.preventDefault();

					let device_id = bluetooth_item.attr("device_id");					

					$(".bluetooth-list > .bluetooth-item:not(.template)").each(function(){
						$(this).children("button").attr("disabled", true);
					})

					requestDevicePair(device_id);

				})

			}

			console.log("Check", device.deviceName, device_map[device.deviceId], (device.deviceName == device_map[device.deviceId]))

			if (device.deviceName !== device_map[device.deviceId]){
				console.log(`Updating device ${device.deviceId} from '${device_map[device.deviceId]}' to '${device.deviceName}'`)
				device_map[device.deviceId] = device.deviceName;
				bluetooth_item.children("span.name").text(`Name : ${(typeof device.deviceName == "undefined" || device.deviceName == null) ? "Unknown" : device.deviceName}`);
			}

		})

		$(".bluetooth-list > .bluetooth-item:not(.template)").each(function(){
			let attr_id = $(this).attr("device_id");
			if (typeof device_map[attr_id] == "undefined"){
				console.log(`${attr_id} not available, removing`)
				$(this).remove();
			}
		})

		if (response.isFinal){
			bluetooth_scanning_state = false;

			$(".scan-btn").text("Scan");
			$(".scan-btn").removeAttr("disabled");
		}

	})

}

function requestDevicePair(device_id){

	console.log(`Requesting Bluetooth Pair for ${device_id}`);
	// Notification.set("Pairing . . .", "pairing");

	$(".loading-overlay").fadeIn(100);
	$(".bluetooth-list > .bluetooth-item:not(.template)").remove();

	if (isElectron){

		ipcRenderer.sendSync("bluetooth-state", {
			mode : "pairing",
			deviceId : device_id
		});

	}

	navigator.bluetooth.requestDevice({

		acceptAllDevices : true,
		optionalServices : ["generic_access", "battery_service", "device_information", DEFAULT_BULB_CONFIG.BULB_SERVICE_UUID]
	
	}).then(device => {

		console.log("==================================")
		console.log("Bluetooth Pairing Callback")
		console.log(device);

		paired_device.device_reference 		= device;
		paired_device.device_id 			= device_id;
		last_device_id 						= device_id;
		paired_device.characteristic_map 	= [];

		device.addEventListener("gattserverdisconnected", () => {
			console.log("DEVICE DISCONNECTED - RESET MENUS");
			paired_device.reset();
			$(".device-developer > span.device_name").text(`Device Name: UNPAIRED`)
			Notification.set("Device disconnected", "device-unpaired", 2)
		})

		return device.gatt.connect();

	}).then(server => {

		console.log("Getting light control server. . .");
		console.log(server)

		paired_device.server = server;

		// Notification.set("Paired successfully", "pair-success", 3);

		$(".device-developer span.device_name").text(`Device Name: ${paired_device.device_reference.name}`)
		$(".device-developer > span.device_id").text(`Device ID: ${paired_device.device_reference.id}`)

		server.getPrimaryServices().then(function(services){
			console.log("SERVICES", services);
		})

		return server.getPrimaryService(DEFAULT_BULB_CONFIG.BULB_SERVICE_UUID);

	}).then(service => {

		console.log(`Service ${service.uuid}`);

		// Notification.stop();
		$(".loading-overlay").fadeOut(100);
		goToPage("controller");

		paired_device.service = service;

		service.getCharacteristics().then(characteristics => {

			let doAsyncForEach = async () => {

				await asyncForEach(characteristics, async (characteristic) => {
					
					paired_device.characteristic_map[characteristic.uuid] = characteristic;
					console.log(`Characteristic: ${characteristic.uuid}`, characteristic)

					/*

					try {

						characteristic.startNotifications().then(() => {
							characteristic.addEventListener("characteristicvaluechanged", (e) => {
								console.log(`Characteristic Changed ${characteristic.uuid} :`, getByteArrayFromDataview(e.target.value, "getUint8"));
							})
						}).catch((e) => {
							console.log(e);
						})
						

					} catch (e){
						console.log(e);
						characteristic.addEventListener("characteristicvaluechanged", (e) => {
							console.log(`Characteristic Changed ${characteristic.uuid} :`, getByteArrayFromDataview(e.target.value, "getUint8"));
						})
					}

					try {

						characteristic.readValue().then(value => {
							console.log(`Characteristic Initial ${characteristic.uuid} :`, value)
						}).catch((e) => {
							console.log(e);
						})
						

					} catch (e){
						console.log(e);
					}

					*/
	
				})

				getBulbColor(true);
				getBulbPowerState(true);

			}

			doAsyncForEach();

		})

	}).catch((e) => {
		console.log(e);
		Notification.set("Failed to pair to device", "pair-failure", 3);
		$(".loading-overlay").fadeOut(100);
	})
	
}


///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
// DEVELOPER

function developerPanel(){

	$("a.characteristic_value_get").click(function(e){
		e.preventDefault();
		let characteristic_uuid = $("input.characteristic_uuid").val();
		console.log(`Getting characteristic value of ${characteristic_uuid}`);
		console.log(paired_device.characteristic_map[characteristic_uuid]);

		paired_device.characteristic_map[characteristic_uuid].readValue().then(value => {
			
			let byteArray = getByteArrayFromDataview(value, "getUint8");

			console.log("Value", value, byteArray);

			$("input.characteristic_value").val(byteArray.join(", "));
			
		})

	})

	$("a.characteristic_value_set").click(function(e){

		e.preventDefault();

		let characteristic_uuid = $("input.characteristic_uuid").val();
		let characteristic_value = $("input.characteristic_value").val();

		let value_arr = characteristic_value.split(",").map(el => {
			return el.trim();
		})

		let array_uint8 = new Uint8Array(value_arr);

		console.log(`Setting characteristic of ${characteristic_uuid} to array :`, value_arr, "buffer:", array_uint8);
		console.log(paired_device.characteristic_map[characteristic_uuid]);

		paired_device.characteristic_map[characteristic_uuid].writeValue(array_uint8.buffer).then(() => {
			console.log("Success")
		}).catch((e) => {
			console.log("Failure", e);
		});


	})

	//

	$("a.record_data").click(function(e){
		e.preventDefault();

		console.log("SCANNING BLUETOOTH DEVICE SERVICE CHARACTERISTICS");
		scanBluetoothService(paired_device.device_reference.id, paired_device.service);
	})

	function scanBluetoothService(bluetooth_deviceId, service){

		let scan_instance = {};

		service.getCharacteristics().then(characteristics => {

			console.log(`Grabbed ${characteristics.length} Characteristics`)

			characteristics.forEach((characteristic) => {
				scan_instance[characteristic.uuid] = "DNR";
			})

			//


			let doAsyncForEach = async () => {

				await asyncForEach(characteristics, async (characteristic) => {
					
					try {

						let value = await characteristic.readValue();
						let byteArray = getByteArrayFromDataview(value, "getUint8");

						console.log(`Value of ${characteristic.uuid} : ${byteArray}`);
						
						scan_instance[characteristic.uuid] = byteArray;

					} catch (e) {
						console.log(e);
						scan_instance[characteristic.uuid] = "WRITE_ONLY";
					}
	
				})

				console.log("Sending . . .");

				ipcRenderer.send("data-recorder" , {
					deviceId : bluetooth_deviceId,
					serviceUUID : service.uuid,
					time : new Date(),
					data : scan_instance
				})

			}

			doAsyncForEach();


		})

	}

	$("a.export_data").click(function(e){
		e.preventDefault();
		ipcRenderer.send("export-data");
	})

	//

	$("a.re-pair_device").click(function(e){
		requestDevicePair(last_device_id);
	})

	//

	$("a.return_scanner").click(function(e){
		paired_device.reset();
		goToPage("main")
	})

	$("a.device_disconnect").click(function(e){
		e.preventDefault();
		paired_device.server.disconnect();
	})
}

///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
// HELPER METHODS

function getByteArrayFromDataview(dataview, bufferType){
							
	if (typeof bufferType == "undefined"){
		bufferType = "getUint8";
	}

	let byteArray = [];
	let bufferSize = dataview.byteLength;

	for (let i = 0; i < bufferSize; i++){
		byteArray[i] = dataview[bufferType](i);
	}

	return byteArray;

}

async function asyncForEach(array, callback) {

	for (let index = 0; index < array.length; index++){
		await callback(array[index], index, array);
	}
}