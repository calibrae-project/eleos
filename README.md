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
  1. Build Zclassic or Zcash wallet from Source
  2. Run `git clone https://github.com/zencashio/eleos.git eleos`
  3. Copy the Zclassic or Zcash wallet daemon into the eleos directory (name the binary zcld-linux or zcashd-linux).
  4. Start Eleos: `cd eleos` and `npm start`


### Supported Wallets

Eleos is primarily designed for Zcash-based cryptocurrencies.

| Support | Status |
| ------ | ------ |
| Zclassic | Fully supported |
| Zcash | Fully supported |
| Zen | Not yet supported |
|


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
Common Public Attribution License (CPAL)
