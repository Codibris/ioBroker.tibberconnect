![Logo](admin/tibberconnect.png)

# ioBroker.tibberconnect

> # ⚠️ Hinweis: Dieser Adapter wird nicht mehr aktiv weiterentwickelt
>
> Während dieser Adapter in einer langen Pause war, ist mit **[ioBroker.tibberlink](https://github.com/hombach/ioBroker.tibberlink)** ein vollwertiger Nachfolger entstanden, der bereits im **offiziellen ioBroker-Repository** verfügbar ist und deutlich mehr kann:
>
> - direkter lokaler Zugriff auf den Tibber Pulse (nicht nur über die Cloud)
> - historische Verbrauchsdaten
> - Calculator-Channels für günstigste Stunden / Stundenblöcke / Best-Cost-Regeln
> - "Smart Battery Buffer"-Logik für Heimspeicher
> - JSON-Output für FlexCharts / eCharts
>
> **Für Neueinsteiger:** Bitte direkt [`tibberlink`](https://www.iobroker.net/#en/adapters/adapterref/iobroker.tibberlink/README.md) installieren.
>
> **Für Bestandsnutzer von `tibberconnect`:** Die hier veröffentlichte **v0.1.0** behebt die hartnäckigsten Stabilitätsprobleme (Crashes alle 30 Min, `power = 0` wurde verschluckt, Multi-Home-Konflikte, gelber `info.connection`-Status) und ist als Übergangs-Release gedacht. Geplant sind keine weiteren Feature-Releases — nur noch Sicherheits-Fixes, falls nötig. Mittelfristig zu `tibberlink` migrieren.
>
> Großen Dank an [@hombach](https://github.com/hombach) für das tolle Nachfolge-Werk. 🙏

---

![![NPM version](https://img.shields.io/npm/v/iobroker.tibberconnect.svg)](https://www.npmjs.com/package/iobroker.tibberconnect)
![![Downloads](https://img.shields.io/npm/dm/iobroker.tibberconnect.svg)](https://www.npmjs.com/package/iobroker.tibberconnect)
![Number of Installations](https://iobroker.live/badges/tibberconnect-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/tibberconnect-stable.svg)
[![Dependency Status](https://img.shields.io/david/Codibris/iobroker.tibberconnect.svg)](https://david-dm.org/Codibris/iobroker.tibberconnect)

[![NPM](https://nodei.co/npm/iobroker.tibberconnect.png?downloads=true)](https://nodei.co/npm/iobroker.tibberconnect/)

**Tests:** ![Test and Release](https://github.com/Codibris/ioBroker.tibberconnect/workflows/Test%20and%20Release/badge.svg)

Willkommen beim ioBroker Adapter für Tibber. Ich freue mich, dass Du diesen Adapter einsetzen möchtest. 
Falls du noch zu Tibber wechseln und mich dabei mit unterstützen möchstest kannst Du gerne meinen Einladungslink verwenden:

https://invite.tibber.com/hgg53izs

## tibberconnect adapter for ioBroker

connects tibber API and ioBroker

## Changelog
### 0.1.0 (2026-05-24) – Stability Release
- fix: numeric/boolean states with value `0` or `false` are no longer dropped (e.g. `power`, `powerProduction`, `accumulatedConsumptionLastHour`, `signalStrength`) – issues #187, #200, #224
- fix: `accumulatedReward` was only activated when `accumulatedCost` was enabled in admin (config key typo) – data loss for users with PV feed-in
- fix: unhandled promise rejection in price-update intervals crashed the adapter every 30–60 min; intervals now `await` API calls and catch errors – issues #129, #93, #83, #209
- fix: multi-home setups no longer collide on shared `homeId` state; every API call and Pulse feed gets its own home context – issue #221
- fix: `info.connection` is now set to green as soon as the API returns the home list, independent of the Pulse feed state – forum #13, #20, #107
- fix: `generateErrorMessage` no longer prints "undefined (undefined)" on network errors – forum #24
- fix: Pulse reconnect interval is tracked per feed and cleared on adapter unload (no leaks, no double-stacking)
- fix: defensive null-checks in `fetchPrice`, `fetchAddress`, `fetchLegalEntity`, `fetchContactInfo`

### 0.0.10 (2023-04-04)
- check current issues and update packages
- fixed issue #181 'Error in Tibber Feed on "undefined" with message "undefined"'
- fixed issue #130 pulse stream is not working

### 0.0.9 (2022-12-10)
- try automatically reconnecting websocket connection (pulse data) in 5s interval
- add some technical improvements on api calls
- add some debug logs

### 0.0.8 (2022-12-02)
- add some error handling while api calls

### 0.0.7 (2022-11-19)
- change connection state with live measurement
- Tibber API: breaking change in websocket subscriptions December 2022

### 0.0.6 (2022-11-19)
- quick temp. implementation of new tibber api Package

### 0.0.3 (2022-02-27)
- get prices of today and tomorrow

### 0.0.2 (2022-02-26)
- switch from schedule to deamon
- Load current energy price on 5 min interval
- optimize structure and internal objects
- connects tibber pulse and get data
- configurate fields for tibber pulse feed

### 0.0.1 (2022-02-18)
Reading data from tibber API:

- list and details of homes
- details of metering point
- features of account
- current energy price
- energy prices of today
- energy prices of tomorrow
- acitvate or deaktivate pulse (no data at the moment)

## License

GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (c) 2022 Codibris <email@codibris.de>
