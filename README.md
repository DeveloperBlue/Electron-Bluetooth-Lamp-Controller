# Electron Bluetooth Lamp Controller

[![Demo Video](https://img.youtube.com/vi/_7ogx-qlPFA/hqdefault.jpg)](https://youtu.be/_7ogx-qlPFA)

Electron Bluetooth Lamp Controller is a simple crossplatform desktop and web application for controlling bluetooth lightbulbs and other generic bluetooth devices. [Download Latest Release Here](https://github.com/DeveloperBlue/Electron-Bluetooth-Lamp-Controller/releases)

\*See **Devices** section

Device Pairing 				| Color & Brightness Control |  Temperature Control 	 | Generic Bluetooth Control
:--------------------------:|:--------------------------:|:-------------------------:|:-------------------------:
![Device Pairing](https://i.imgur.com/tgMdKmp.png)  |  ![Color and Brightness Control](https://i.imgur.com/jzYOqys.png) |  ![Temperature Control](https://i.imgur.com/HWyEaI8.png) |  ![Generic Bluetooth Control](https://i.imgur.com/3hhDbV9.png)

At the moment, the following features are implemented:
- Device scanning and pairing
- Color Control with elegant picker and presets
- Brightness Control
- Temperature Color Control (eg. the perceived "warmth" of the color of the bulb)
- Developer Options (Interacting with your own custom bluetooth characteristics)

## The Project
The goal was to build an Electron application (Windows, Mac, & Linux) that allowed me to control my bluetooth lamp in basic ways- (On/Off, Set RGB Color, Get RGB Color, etc.) with a nice UI. Originally, the bluetooth bulb could only be used through the product's android application. While the application was able to provide functionaity, it was pretty buggy, mistranslated, and not pleasant to use. 

This project was create as both a hobby project and a small honors project for university. 

Using what I learned in CS488 Computer Networks and the Internet, CS389 Software Engineering, and my own experience with Electron and development, I got to work. Originally, I tried to reverse-engineer the android application after decompiling it, but that proved to be obfuscated and burried under layers of files and library dependencies. There were also concerns that I wasn't quite sure what else this application was doing on my device, especially giving the abundance of extra libraries embed in the application.

Development involved using Wireshark, packet sniffing, learning various protocols and security standards (eg. Bluetooth), and a ton of other intricacies when developing for the web, Electron, using bluetooth, and implementing different types of color control. There were initial struggling with bluetooth sniffing, manufacturers changing log output directories, whacky functionality, and cross-developing between my Android device and workstation. Overall, it was a good learning experience and I'm happy to say I met my goals.

You can read more about it in my [Project Writeup](https://docs.google.com/document/d/18pkIHQm8RgYsRLt1UWYlANxl2J0j5KryW2cuX4AhJuo/edit?usp=sharing)

## Build

If you would rather not use the prebuilt executable from [releases](https://github.com/DeveloperBlue/Electron-Bluetooth-Lamp-Controller/releases), you may build the project yourself.

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/DeveloperBlue/Electron-Bluetooth-Lamp-Controller.git

# Navigate into the repository
cd Electron-Bluetooth-Lamp-Controller

# Install dependencies
npm install

# Start
npm start
```

Alternatively, you may run `npm run-script dev-start` rather than `npm start` to launch with the client-side developer console open.

## Future Implementations

Future updates may include:
- Synthesia (Color Reactions to Music)
- Color Transitions (Slow, Fast, Rave, Breating, User-defined color transitions)
- Voice Control
- User-defined color presets
- Individual RGB Control submenu
- Web Socket Service
- Timed events (CRON events for eg. turning on at 7pm)
- IFTTT Integration (Google Assistant, Amazon's Alexa, Apple's Siri, Mirosoft's Cortana, etc.)
- Device Groups (Control multiple devices at once, if your computer has Bluetooth 5 or the devices allow it)

## Devices

There are no standards for bluetooth bulbs. Vendors define their own UUIDs, and thefore there is a slim chance that many devices will be compatible.

For developing this project, I used the "Bowlight" bulb. From what I can tell this company also makes other bulbs, and there is a good chance they may be compatible.

- [Bowlight](https://web.archive.org/web/20200516122021/https://cn.made-in-china.com/gongying/qq453176385-yqiJKpzjrNWu.html)
- [icolorlive](https://www.amazon.com/gp/product/B01KV7TIG8/ref=ask_ql_qh_dp_hza) \[[1](https://www.amazon.com/ask/questions/asin/B01KV7TIG8)\] \[[2](https://apkpure.com/icolorlive/com.dearming.icolorlive)\] \[[3](https://www.youtube.com/watch?v=F39xhYWHDKA)\]
- [Elbro-RGB](https://www.amazon.com/%E6%B1%9F%E7%BE%A4-Elbro-RGB/dp/B076ZF5FMW/ref=sr_1_2?dchild=1&qid=1589632433&s=mobile-apps&sr=1-2) \[[1](https://www.amazon.com/s?rh=n%3A2350149011%2Cp_4%3A%E6%B1%9F%E7%BE%A4)\]


[Original Android Application](https://web.archive.org/web/20200516120301/https://www.amazon.com/%E6%B1%9F%E7%BE%A4-BowLight/dp/B076KMTNCT)

Other devices can be supported, but need to be configured. (This means packet sniffing to figure out which services and characteristics are responsible for what processes, so only experienced users can try this)

If there's a demand, I'll crawl the web for other creations of this kind of project, and compile configs for different bulbs.

## Thanks To
Special thanks to:
- [iro.js](https://github.com/jaames/iro.js) - A modern, SVG-based color picker widget for vanilla JavaScript
- [Helen Sherwood-Taylor from PyCon UK](http://slides.com/helenst/ble#/)