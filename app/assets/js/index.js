
let bulb_service = "f000ffa0-0451-4000-b000-000000000000";

$(document).ready(function(){
	
	console.log("Application Ready");

	let bluetooth_scanning_state = false;
	
	$(".scan-btn").click(function(e){

		e.preventDefault();

		if (bluetooth_scanning_state == false){

			bluetooth_scanning_state = true;

			$(".scan-btn").text("Stop Scanning");

			$(".bluetooth-list > .bluetooth-item:not(.template)").remove();

			ipcRenderer.sendSync("bluetooth-discovery");

			console.log("Requesting Bluetooth Scan");

			navigator.bluetooth.requestDevice({
				acceptAllDevices : true,
				optionalServices : ["generic_access", "battery_service", "device_information"]
			}).then(device => {
				console.log("Bluetooth Discovery Callback")
			}).catch(error => {
				console.log(error);
			})

		} else {

			bluetooth_scanning_state = false;

			$(".scan-btn").text("Scan");

			ipcRenderer.send("bluetooth-discovery-stop");

		}

	})

	ipcRenderer.on("bluetooth-discovery-response", (event, response) => {

		let devices = response.devices;

		console.log(devices);

		let device_map = {};

		devices.forEach((device, index) => {

			// If the item doesn't exist, create it
			// If the item does exist, and the name is different, change it
			// If the item shouldn't exist, remove it

			if (!device_map.hasOwnProperty(device.deviceId)){
				device_map[device.deviceId] = device.deviceName;
			}

			let bluetooth_item = $(`.bluetooth-list > .bluetooth-item[device_id="${device.deviceId}"]`)

			if (bluetooth_item.length == 0){

				console.log(device);

				bluetooth_item = $(".bluetooth-list > .bluetooth-item.template").clone().removeClass("template");

				bluetooth_item.attr("device_id", device.deviceId);
				bluetooth_item.children("span.name").text(`Name : ${(typeof device.deviceName == "undefined" || device.deviceName == null) ? "Unknown" : device.deviceName}`);
				bluetooth_item.children("span.address").html(`Address : <em>${device.deviceId}</em>`);
				bluetooth_item.appendTo($(".bluetooth-list"));

				bluetooth_item.children("a").click(function(e){
					e.preventDefault();

					let device_id = bluetooth_item.attr("device_id");

					console.log(`Requesting Bluetooth Pair for ${device_id}`);

					$(".bluetooth-list > .bluetooth-item:not(.template)").each(function(){
						$(this).children("a").attr("disabled", true);
					})

					ipcRenderer.sendSync("bluetooth-pair", device_id);

					navigator.bluetooth.requestDevice({
						acceptAllDevices : true,
						optionalServices : ["generic_access", "battery_service", "device_information"]
					}).then(device => {
						console.log("Bluetooth Pairing Callback")
						console.log(device);

						device.addEventListener("gattserverdisconnected", () => {
							console.log("DEVICE DISCONNECTED - RESET MENUS");
						})

					}).catch(error => {
						console.log(error);
					})


					/*
					.then(server => {
						console.log("Getting light control . . .");
						return server.getPrimaryService(bulb_service);
					}).then(service => {

						console.log(`Service ${service.uuid}`);

						service.getCharacteristics().then(characteristics => {
							characteristics.forEach(characteristic => {
								console.log(`Characteristic: ${characteristic.uuid}`)
							})
						})

					})
					*/

				})

			} else if (device.deviceName !== device_map[device.deviceId]){
				console.log(`Updating device ${device.deviceId} from '${device_map[device.deviceId]}' to '${device.deviceName}'`)
				device_map[device.deviceId] = device.deviceName;
				bluetooth_item.children("span.name").text(`Name : ${(typeof device.deviceName == "undefined" || device.deviceName == null) ? "Unknown" : device.deviceName}`);
			}

		})

		$(".bluetooth-list > .bluetooth-item:not(.template)").each(function(){
			let attr_id = $(this).attr("device_id");
			if (!device_map.hasOwnProperty(attr_id)){
				console.log(`${attr_id} not available, removing`)
				$(this).remove();
			}
		})

		if (response.isFinal){
			bluetooth_scanning_state = false;

			$(".scan-btn").text("Scan");
		}

	})

})