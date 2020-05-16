const express = require("express");
const app = express();
const port = 3000;
const path = require("path");

const electron = require("electron");
const ipcMain = electron.ipcMain;

app.get("/", (req, res) => res.send("Hello World!"));

app.get("/color/:format", (req, res) => {
	// return current color in specified format or as RGB by default

	if (typeof bulb_handler == "undefined"){
		return;
	}

});

app.post("/color/:format/:color", (req, res) => {
	// set color

	if (typeof bulb_handler == "undefined"){
		return;
	}
})

app.listen(port, () => console.log(`Webserver listening on localhost port ${port}`))


module.exports = this;