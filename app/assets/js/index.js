
const BULB_SERVICE_UUID = "f000ffa0-0451-4000-b000-000000000000"; // "0000180a-0000-1000-8000-00805f9b34fb" // "00001800-0000-1000-8000-00805f9b34fb";
const BULB_MAC_QUICK_ADDR = "98:5D:AD:25:DB:90";

const BULB_COLOR_CHARACTERISTIC_UUID = "f000ffa4-0451-4000-b000-000000000000";

///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

let paired_device = {
	device_reference : null,
	device_id : null,
	server : null,
	service : null,
	characteristic_map : null,

	reset : function(){
		if (paired_device.device_id !== null && paired_device.device_id.replace(/ /g, "") !== ""){
			last_device_id = paired_device.device_id;
		}
		paired_device.device_reference = null,
		paired_device.device_id = null;
		paired_device.server = null,
		paired_device.service = null
		paired_device.characteristic_map = [];
		
	}
}
let last_device_id;

let color_picker;

///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

const notification = {
	id : null,
	set : function(message, id, timeout){
		$(".notification > span").text(message);
		notification.id = id;
		$(".notification").slideDown(20);


		if (timeout){
			setTimeout(function(){
				notification.stop(id)
			}, timeout * 1000);
		}
	},
	stop : function(id){
		if ((typeof id == "undefined") || (typeof id !== undefined && notification.id == id)){
			$(".notification").slideUp(40);
		}
	}
}

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

///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

$(document).ready(function(){
	
	console.log("Application Ready");

	notification.stop();

	/*

	*/

	color_picker = new iro.ColorPicker(".color-wheel", {
		width : 256,
		height : 256,
		layout : [
			{ 
				component: iro.ui.Wheel,
			}
		],
		handleRadius : 16
	});

	color_picker.on("input:change", (color) => {
		if (paired_device.device_id){
			setBulbColor(color.rgb.r, color.rgb.g, color.rgb.b);
		}
	})

	function setBulbColor(r, g, b){
		if (paired_device.device_id){

			if (typeof paired_device.characteristic_map[BULB_COLOR_CHARACTERISTIC_UUID] == "undefined"){
				console.log("Did not find bluetooth characteristic to set RGB");
				return;
			}

			let array_uint8 = new Uint8Array([r, g, b]);

			paired_device.characteristic_map[BULB_COLOR_CHARACTERISTIC_UUID].writeValue(array_uint8.buffer).then(() => {
				console.log(`Pushed bulb color rgb(${r}, ${g}, ${b})`)
			}).catch((e) => {
				console.log("Failure", e);
			});

		} else {
			console.log("No device found");
		}
	}

	/*

	*/

	let bluetooth_scanning_state = false;
	
	$(".scan-btn").mousedown(function(e){

		e.preventDefault();

		if (e.which == 3){
			requestPairDevice(BULB_MAC_QUICK_ADDR);
			return;
		}

		$(this).attr("disabled", true);

		if (bluetooth_scanning_state == false){

			bluetooth_scanning_state = true;

			notification.set("Scanning . . .", "scanning");

			$(".scan-btn").text("Stop Scanning");

			$(".bluetooth-list > .bluetooth-item:not(.template)").remove();

			console.log("Requesting Bluetooth Scan");

			ipcRenderer.sendSync("bluetooth-state", {
				mode : "discovery"
			})

			$(this).removeAttr("disabled");

			navigator.bluetooth.requestDevice({
				acceptAllDevices : true,
				optionalServices : ["generic_access", "battery_service", "device_information", BULB_SERVICE_UUID]
			}).then(device => {
				console.log("Bluetooth Discovery Callback")
			}).catch(error => {
				console.log(error);
			}).finally(() => {
				notification.stop("scanning");
			})

		} else {

			bluetooth_scanning_state = false;

			notification.set("Scanning stopped", "scanning-stopped", 2);

			$(".scan-btn").text("Scan");

			ipcRenderer.send("bluetooth-state", {
				mode : "discovery",
				stop : true
			});

			$(this).removeAttr("disabled");

		}

	})


	//

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

					requestPairDevice(device_id);

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

	function requestPairDevice(device_id){

		console.log(`Requesting Bluetooth Pair for ${device_id}`);
		notification.set("Pairing . . .", "pairing");

		ipcRenderer.sendSync("bluetooth-state", {
			mode : "pairing",
			deviceId : device_id

		});


		navigator.bluetooth.requestDevice({
			acceptAllDevices : true,
			optionalServices : ["generic_access", "battery_service", "device_information", BULB_SERVICE_UUID]
		}).then(device => {
			console.log("==================================")
			console.log("Bluetooth Pairing Callback")
			console.log(device);

			paired_device.device_reference = device;
			paired_device.device_id = device_id;
			last_device_id = device_id;
			paired_device.characteristic_map = [];

			device.addEventListener("gattserverdisconnected", () => {
				console.log("DEVICE DISCONNECTED - RESET MENUS");
				paired_device.reset();
				$(".device-handler > div > span.device_name").text(`Device Name: UNPAIRED`)
				notification.set("Device disconnected", "device-unpaired", 10)
			})

			return device.gatt.connect();

		}).then(server => {

			console.log("Getting light control server. . .");
			console.log(server)

			paired_device.server = server;

			notification.set("Paired successfully", "pair-success", 3);

			$(".device-scan").hide();

			$(".device-handler > div > span.device_name").text(`Device Name: ${paired_device.device_reference.name}`)
			$(".device-handler > div > span.device_id").text(`Device ID: ${paired_device.device_reference.id}`)

			server.getPrimaryServices().then(function(services){
				console.log("SERVICES", services);
			})

			return server.getPrimaryService(BULB_SERVICE_UUID);

		}).then(service => {

			console.log(`Service ${service.uuid}`);

			$(".device-handler").show();

			paired_device.service = service;

			service.getCharacteristics().then(characteristics => {

				let doAsyncForEach = async () => {

					await asyncForEach(characteristics, async (characteristic) => {
						
						paired_device.characteristic_map[characteristic.uuid] = characteristic;
						console.log(`Characteristic: ${characteristic.uuid}`, characteristic)

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
		
					})

					if (typeof paired_device.characteristic_map[BULB_COLOR_CHARACTERISTIC_UUID] !== "undefined"){

						console.log("Connected to bulb, getting color for UI . . .");

						paired_device.characteristic_map[BULB_COLOR_CHARACTERISTIC_UUID].readValue().then(value => {
							
							let byteArray = getByteArrayFromDataview(value, "getUint8");

							console.log("Bulb color -> ", byteArray);
							color_picker.color.set({
								r : byteArray[0],
								g : byteArray[1],
								b : byteArray[2]
							})

						}).catch((e) => {
							console.log(e);
						})
					}


				}

				doAsyncForEach();

				/*
				characteristics.forEach(characteristic => {



					paired_device.characteristic_map[characteristic.uuid] = characteristic;
					console.log(`Characteristic: ${characteristic.uuid}`, characteristic)

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

				})
				*/

			})

		}).catch(error => {
			console.log(error);
		}).finally(() => {
			notification.stop("pairing");
		})


	}

	//

	$("a.characteristic_value_get").click(function(e){
		e.preventDefault();
		let characteristic_uuid = $("input.characteristic_uuid").val();
		console.log(`Getting characteristic value of ${characteristic_uuid}`);
		console.log(paired_device.characteristic_map[characteristic_uuid]);

		paired_device.characteristic_map[characteristic_uuid].readValue().then(value => {
			
			let byteArray = getByteArrayFromDataview(value, "getUint8");

			console.log("Value", value, byteArray);
			
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

	//

	$("a.export_data").click(function(e){
		e.preventDefault();
		ipcRenderer.send("export-data");
	})

	//

	$("a.re-pair_device").click(function(e){
		requestPairDevice(last_device_id);
	})

	//

	$("a.return_scanner").click(function(e){
		paired_device.reset();
		$(".device-handler").hide();
		$(".device-scan").show();
	})

	$("a.device_disconnect").click(function(e){
		e.preventDefault();
		paired_device.server.disconnect();
	})


})

//

async function asyncForEach(array, callback) {

	for (let index = 0; index < array.length; index++){
		await callback(array[index], index, array);
	}
}