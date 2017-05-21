# Eleos

Eleos is a multi-platform wallet for zero-knowledge cryptocurrencies written in Electron. 

  - Compatible with Windows, MacOS, and Linux
  - No third-party Java dependencies required
  - Supports both Zclassic and Zcash

![Screenshot](https://i.imgur.com/zHn4Hx8.png)

### Installation
Note: First time installations may take awhile to load since ~1GB of cryptographic data must be downloaded first.

##### Windows and MacOS
The simplest way to get started on Windows or MacOS is to [download and run the latest installer](https://github.com/zencashio/eleos/releases).

##### Linux
Note: Eleos requires that the compiled wallets are named zcashd-linux or zcld-linux and are saved into the eleos directory.
Get the dependencies
```
sudo apt-get install node.js nodejs-legacy npm
npm install electron tcp-port-used tar-fs request-progress ht-auth express-ws node-pty
```

Get the source
```
git clone https://github.com/zencashio/eleos.git eleos
```

Copy the Zclassic/Zcash wallet daemon into the elos directory (name the binary zcld-linux or zcashd-linux)
```
cp ~/Builds/zclassic/src/zcashd ~/Builds/elos/zcld-linux
```
or
```
cp ~/Builds/zcash/src/zcashd ~/Builds/elos/zcashd-linux
```
Start eleos
```
cd ~/Builds/eleos && npm start
```

### Supported Wallets

Eleos is primarily designed for Zcash-based cryptocurrencies. The wallet.dat for each cryptocurrency is stored in the directories below.

| Support | Status | Windows Location | MacOS Location |
| ------ | ------ | ------ | ------ |
| Zclassic | Fully supported | %APPDATA%/Zclassic | ~/Library/Application Support/Zclassic |
| Zcash | Fully supported | %APPDATA%/Zcash | ~/Library/Application Support/Zcash |
| Zencash | alpha version | %APPDATA%/Zencash | ~/Library/Application Support/Zencash |


### Development

Want to contribute? Great! We need help.


### Todos

 - Display shielded tx generation status
 - Write MOAR tests
 - Write MOAR documentation

### Help!
  - Chat: [Zdeveloper RocketChat](https://rocketchat.zdeveloper.org)
  - Other: Submit a Github issue as needed.

### License
Common Public Attribution License (CPAL-1.0)
