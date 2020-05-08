const express = require("express");
const app = express();
const port = 3000;
const path = require("path");

app.get("/", (req, res) => res.send("Hello World!"));

app.get("/index.js", (req, res) => res.sendFile(path.join(__dirname, "/app/assets/js/index.js")));

app.listen(port, () => console.log(`Webserver listening on localhost port ${port}`))