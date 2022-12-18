"use strict";
/*
 * Created with @iobroker/create-adapter v2.0.2
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = __importStar(require("@iobroker/adapter-core"));
const luxon_1 = require("luxon");
const tibberAPICaller_1 = require("./lib/tibberAPICaller");
const tibberPulse_1 = require("./lib/tibberPulse");
// Load your modules here, e.g.:
// import * as fs from "fs";
class Tibberconnect extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: "tibberconnect",
        });
        this.queryUrl = "";
        this.sortNumeric = (dir) => {
            return (a, b) => (a - b) * dir;
        };
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
        this.homeIdList = [];
        this.intervallList = [];
        this.queryUrl = "https://api.tibber.com/v1-beta/gql";
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        // Reset the connection indicator during startup;
        if (!this.config.TibberAPIToken) {
            // No Token defined in configuration
            this.log.warn("Missing API Token - please check configuration");
            this.setState("info.connection", false, true);
        }
        else {
            // Need 2 configs - API and Feed (feed chaged query url)
            const tibberConfigAPI = {
                active: true,
                apiEndpoint: {
                    apiKey: this.config.TibberAPIToken,
                    queryUrl: this.queryUrl,
                },
            };
            const tibberConfigFeed = {
                active: true,
                apiEndpoint: {
                    apiKey: this.config.TibberAPIToken,
                    queryUrl: this.queryUrl,
                },
            };
            // Now read all Data from API
            const tibberAPICaller = new tibberAPICaller_1.TibberAPICaller(tibberConfigAPI, this);
            try {
                this.homeIdList = await tibberAPICaller.updateHomesFromAPI();
            }
            catch (error) {
                this.log.warn(tibberAPICaller.generateErrorMessage(error, "Abruf 'homes'"));
            }
            // if feed is not used - set info.connection if data received
            if (!this.config.FeedActive) {
                if (this.homeIdList) {
                    this.setState("info.connection", true, true);
                    this.log.debug("Connection Check: Feed not enabled and I received home list from api - good connection");
                }
                else {
                    this.setState("info.connection", false, true);
                    this.log.debug("Connection Check: Feed not enabled and I do not get home list from api - bad connection");
                }
            }
            // Init Load Data for home
            if (this.homeIdList.length > 0) {
                for (const index in this.homeIdList) {
                    try {
                        await tibberAPICaller.updateCurrentPrice(this.homeIdList[index]);
                    }
                    catch (error) {
                        this.log.warn(tibberAPICaller.generateErrorMessage(error, "Abruf 'Aktueller Preis'"));
                    }
                    try {
                        await tibberAPICaller.updatePricesToday(this.homeIdList[index]);
                    }
                    catch (error) {
                        this.log.warn(tibberAPICaller.generateErrorMessage(error, "Abruf 'Preise von heute'"));
                    }
                    try {
                        await tibberAPICaller.updatePricesTomorrow(this.homeIdList[index]);
                    }
                    catch (error) {
                        this.log.warn(tibberAPICaller.generateErrorMessage(error, "Abruf 'Preise von morgen'"));
                    }
                }
            }
            const energyPriceCallIntervall = this.setInterval(() => {
                if (this.homeIdList.length > 0) {
                    for (const index in this.homeIdList) {
                        try {
                            tibberAPICaller.updateCurrentPrice(this.homeIdList[index]);
                        }
                        catch (error) {
                            this.log.warn(tibberAPICaller.generateErrorMessage(error, "Abruf 'Aktueller Preis'"));
                        }
                    }
                }
            }, 300000);
            this.intervallList.push(energyPriceCallIntervall);
            const energyPricesListUpdateInterval = this.setInterval(() => {
                if (this.homeIdList.length > 0) {
                    for (const index in this.homeIdList) {
                        try {
                            tibberAPICaller.updatePricesToday(this.homeIdList[index]);
                        }
                        catch (error) {
                            this.log.warn(tibberAPICaller.generateErrorMessage(error, "Abruf 'Preise von heute'"));
                        }
                        try {
                            tibberAPICaller.updatePricesTomorrow(this.homeIdList[index]);
                        }
                        catch (error) {
                            this.log.warn(tibberAPICaller.generateErrorMessage(error, "Abruf 'Preise von morgen'"));
                        }
                    }
                }
            }, 300000);
            this.intervallList.push(energyPricesListUpdateInterval);
            // If User uses TibberConfig - start connection
            if (this.config.FeedActive) {
                for (const index in this.homeIdList) {
                    try {
                        tibberConfigFeed.homeId = this.homeIdList[index];
                        // define fields for Datafeed
                        tibberConfigFeed.timestamp = true;
                        tibberConfigFeed.power = true;
                        if (this.config.FeedConfigLastMeterConsumption) {
                            tibberConfigFeed.lastMeterConsumption = true;
                        }
                        if (this.config.FeedConfigAccumulatedConsumption) {
                            tibberConfigFeed.accumulatedConsumption = true;
                        }
                        if (this.config.FeedConfigAccumulatedProduction) {
                            tibberConfigFeed.accumulatedProduction = true;
                        }
                        if (this.config.FeedConfigAccumulatedConsumptionLastHour) {
                            tibberConfigFeed.accumulatedConsumptionLastHour = true;
                        }
                        if (this.config.FeedConfigAccumulatedProductionLastHour) {
                            tibberConfigFeed.accumulatedProductionLastHour = true;
                        }
                        if (this.config.FeedConfigAccumulatedCost) {
                            tibberConfigFeed.accumulatedCost = true;
                        }
                        if (this.config.FeedConfigAccumulatedCost) {
                            tibberConfigFeed.accumulatedReward = true;
                        }
                        if (this.config.FeedConfigCurrency) {
                            tibberConfigFeed.currency = true;
                        }
                        if (this.config.FeedConfigMinPower) {
                            tibberConfigFeed.minPower = true;
                        }
                        if (this.config.FeedConfigAveragePower) {
                            tibberConfigFeed.averagePower = true;
                        }
                        if (this.config.FeedConfigMaxPower) {
                            tibberConfigFeed.maxPower = true;
                        }
                        if (this.config.FeedConfigPowerProduction) {
                            tibberConfigFeed.powerProduction = true;
                        }
                        if (this.config.FeedConfigMinPowerProduction) {
                            tibberConfigFeed.minPowerProduction = true;
                        }
                        if (this.config.FeedConfigMaxPowerProduction) {
                            tibberConfigFeed.maxPowerProduction = true;
                        }
                        if (this.config.FeedConfigLastMeterProduction) {
                            tibberConfigFeed.lastMeterProduction = true;
                        }
                        if (this.config.FeedConfigPowerFactor) {
                            tibberConfigFeed.powerFactor = true;
                        }
                        if (this.config.FeedConfigVoltagePhase1) {
                            tibberConfigFeed.voltagePhase1 = true;
                        }
                        if (this.config.FeedConfigVoltagePhase2) {
                            tibberConfigFeed.voltagePhase2 = true;
                        }
                        if (this.config.FeedConfigVoltagePhase3) {
                            tibberConfigFeed.voltagePhase3 = true;
                        }
                        if (this.config.FeedConfigCurrentL1) {
                            tibberConfigFeed.currentL1 = true;
                        }
                        if (this.config.FeedConfigCurrentL2) {
                            tibberConfigFeed.currentL2 = true;
                        }
                        if (this.config.FeedConfigCurrentL3) {
                            tibberConfigFeed.currentL3 = true;
                        }
                        if (this.config.FeedConfigSignalStrength) {
                            tibberConfigFeed.signalStrength = true;
                        }
                        const tibberPulse = new tibberPulse_1.TibberPulse(tibberConfigFeed, this);
                        tibberPulse.ConnectPulseStream();
                    }
                    catch (e) {
                        this.log.warn(e.message);
                    }
                }
            }
            this.subscribeStates('*.Calculations.GetBestTime');
            this.subscribeStates('*.Calculations.GetHighs');
            this.subscribeStates('*.Calculations.GetLows');
        }
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);
            for (const index in this.intervallList) {
                this.clearInterval(this.intervallList[index]);
            }
            // info.connect to false, if adapter is closed
            this.setState("info.connection", false, true);
            callback();
        }
        catch (e) {
            callback();
        }
    }
    /**
     * Is called if a subscribed state changes
     */
    async onStateChange(id, state) {
        var _a, _b;
        if (state) {
            if (id.startsWith(this.namespace) && id.endsWith('.Calculations.GetBestTime') && state.val === true) {
                //const homeId = id.substring(this.namespace.length + 7, id.indexOf('.Calculations.GetBestTime'))
                const nameSpaceWithHomeId = id.substring(0, id.indexOf('.Calculations.GetBestTime'))
                    .replace('.Calculations.GetBestTime', '');
                try {
                    const [Duration, LastEnd] = await Promise.all([
                        this.getStateAsync(nameSpaceWithHomeId + '.Calculations.Duration'),
                        this.getStateAsync(nameSpaceWithHomeId + '.Calculations.LastEnd'),
                        this.setStateAsync(nameSpaceWithHomeId + '.Calculations.CronString', {
                            val: '',
                            ack: true
                        }),
                        this.setStateAsync(nameSpaceWithHomeId + '.Calculations.BestStart', {
                            val: '',
                            ack: true
                        })
                    ]);
                    const duration = (_a = Number(Duration === null || Duration === void 0 ? void 0 : Duration.val)) !== null && _a !== void 0 ? _a : 0;
                    const lastEnd = (_b = String(LastEnd === null || LastEnd === void 0 ? void 0 : LastEnd.val)) !== null && _b !== void 0 ? _b : "";
                    let [result, lows, highs] = await this.get_best_timeslot(nameSpaceWithHomeId, duration, lastEnd);
                    // The state was changed
                    //this.log.info('string: ' + this.namespace + '.calculations.GetBestTime');
                    this.log.debug('Duration: ' + (Duration === null || Duration === void 0 ? void 0 : Duration.val) + ', LastEnd: ' + (LastEnd === null || LastEnd === void 0 ? void 0 : LastEnd.val) + ', result: ' + result);
                    this.log.debug('stringified result: ' + JSON.stringify(result));
                    await Promise.all([
                        this.setStateAsync(nameSpaceWithHomeId + '.Calculations.Duration', {
                            ack: true
                        }),
                        this.setStateAsync(nameSpaceWithHomeId + '.Calculations.LastEnd', {
                            val: luxon_1.DateTime.fromISO(lastEnd).toISO(),
                            ack: true
                        }),
                        this.setStateAsync(nameSpaceWithHomeId + '.Calculations.Feedback', {
                            val: JSON.stringify(result),
                            ack: true
                        }),
                        this.setStateAsync(nameSpaceWithHomeId + '.Calculations.Lows', {
                            val: JSON.stringify(lows),
                            ack: true
                        }),
                        this.setStateAsync(nameSpaceWithHomeId + '.Calculations.Highs', {
                            val: JSON.stringify(highs),
                            ack: true
                        })
                    ]);
                    let now = luxon_1.DateTime.now();
                    let day = now.day;
                    if (now.hour > result[0]) {
                        now = now.plus({ days: 1 });
                    }
                    let BestStart = luxon_1.DateTime.fromObject({
                        year: now.year,
                        month: now.month,
                        day: now.day,
                        hour: result[0]
                    });
                    await this.setStateAsync(nameSpaceWithHomeId + '.Calculations.BestStart', {
                        val: BestStart.toISO(),
                        ack: true
                    });
                    let startdate = luxon_1.DateTime.fromObject({
                        year: now.year,
                        month: now.month,
                        day: day
                    });
                    let cron = ['{"time":{"exactTime":true,"start":"', BestStart.hour, ':00"},"period":{"once":"', startdate, '"}}'].join('');
                    await this.setStateAsync(nameSpaceWithHomeId + '.Calculations.CronString', {
                        val: cron,
                        ack: true
                    });
                }
                catch (error) {
                    this.log.error(error);
                }
                finally {
                    await this.setStateAsync(nameSpaceWithHomeId + '.Calculations.GetBestTime', {
                        val: false,
                        ack: true
                    });
                }
            }
            else {
                // The state was changed
                this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
            }
        }
        else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }
    async get_best_timeslot(namespaceWithHomeId, hours, LastEnd) {
        //todo: integration usage of "firstStart"
        //todo: rename hours to Duration
        try {
            if (!luxon_1.DateTime.fromISO(LastEnd).isValid) {
                let ErrorMsg = 'Entry provided for LastEnd is no valid formatted Date (expect ISO 8601 string). LastEnd: ' + LastEnd;
                await this.setStateAsync(namespaceWithHomeId + '.Calculations.Feedback', {
                    val: 'Error: ' + ErrorMsg,
                    ack: true
                });
                throw new Error(ErrorMsg);
            }
            if (!Number.isInteger(hours)) {
                let ErrorMsg = 'Entry provided for Duration is no integer. Duration: ' + hours;
                await this.setStateAsync(namespaceWithHomeId + '.Calculations.Feedback', {
                    val: 'Error: ' + ErrorMsg,
                    ack: true
                });
                throw new Error(ErrorMsg);
            }
            let now = luxon_1.DateTime.now();
            let LastEndDate = luxon_1.DateTime.fromISO(LastEnd);
            let ErrorMsg = '';
            if (LastEndDate < now) {
                ErrorMsg = 'Entry provided for LastEnd in the past. LastEnd: ' + LastEnd;
            }
            let diff = (LastEndDate.toMillis() - now.toMillis());
            let diff_hours = Math.floor(diff / (1000 * 60 * 60));
            if (now.hour < 13 && (diff_hours + now.hour > 23)) {
                ErrorMsg = 'LastEnd too far in future - price data for tomorrow only available after 1pm today. LastEnd: ' + LastEnd;
            }
            if (diff_hours + now.hour > 47) {
                ErrorMsg = 'LastEnd to far in future - price data only available until tomorrow midnight. LastEnd: ' + LastEnd;
            }
            if (now.plus({ hours: hours }) >= LastEndDate) {
                ErrorMsg = 'LastEnd too soon for given duration. LastEnd: ' + LastEnd + ', duration: ' + hours;
            }
            if (ErrorMsg !== '') {
                this.log.error(ErrorMsg);
                await this.setStateAsync(namespaceWithHomeId + '.Calculations.Feedback', {
                    val: 'Error: ' + ErrorMsg,
                    ack: true
                });
                throw new Error(ErrorMsg);
            }
            let current_hour = now.hour;
            let maxhour = LastEndDate.hour + 24 * (LastEndDate.day - now.day);
            let Preise = await this.get_prices(namespaceWithHomeId, LastEndDate);
            this.log.debug("Preise : " + JSON.stringify(Preise));
            let mins = [], last = Number.MAX_SAFE_INTEGER;
            for (let i = 0; i < Preise.length - 1; i++) {
                if (last > Preise[i] && Preise[i + 1] > Preise[i]) {
                    mins.push((current_hour + i + 1) % 24);
                    last = Preise[i];
                }
            }
            if (Preise[Preise.length - 1] < Preise[Preise.length - 2]) {
                mins.push((current_hour + Preise.length) % 24);
            }
            let highs = [];
            last = Number.MIN_SAFE_INTEGER;
            for (let i = 0; i < Preise.length - 1; i++) {
                if (last < Preise[i] && Preise[i + 1] < Preise[i]) {
                    highs.push((current_hour + i + 1) % 24);
                    last = Preise[i];
                }
            }
            if (Preise[Preise.length - 1] > Preise[Preise.length - 2]) {
                highs.push((current_hour + Preise.length) % 24);
            }
            let prices_sorted = Preise.slice().sort(this.sortNumeric(1));
            let best_hours_today = [], best_hours_tomorrow = [];
            for (let count = 0; count < hours; count++) {
                let low = prices_sorted.shift();
                if (low) {
                    let low_hour = (current_hour + Preise.indexOf(low) + 1);
                    if (low_hour < 24)
                        best_hours_today.push(low_hour);
                    else
                        best_hours_tomorrow.push(low_hour - 24);
                }
            }
            const best_hours = best_hours_today.slice().sort(this.sortNumeric(1));
            best_hours.push(...(best_hours_tomorrow.sort(this.sortNumeric(1))));
            return [
                best_hours,
                mins,
                highs
            ];
        }
        catch (error) {
            error = 'error during calculation of best hours: ' + error;
            this.log.error(error);
            throw new Error(error);
        }
    }
    async get_prices(namespaceWithHomeId, LastEndDate) {
        const now = luxon_1.DateTime.now();
        let current_hour = now.hour;
        let maxhour = LastEndDate.hour + 24 * (LastEndDate.day - now.day);
        let prices = [];
        let state = null;
        for (let i = (current_hour + 1); i < Math.min(maxhour, 24); i++) {
            this.log.silly("using today." + i);
            state = await this.getStateAsync(namespaceWithHomeId + '.PricesToday.' + i + '.total');
            if (state === null || state === void 0 ? void 0 : state.val)
                prices.push(Number(state === null || state === void 0 ? void 0 : state.val));
        }
        if (maxhour >= 24) {
            for (let i = 0; i < maxhour - 24; i++) {
                state = await this.getStateAsync(namespaceWithHomeId + '.PricesTomorrow.' + i + '.startsAt');
                if (state) {
                    const startsAt = Date.parse(state.val);
                    if (startsAt > LastEndDate.millisecond) {
                        this.log.silly("using tomorrow." + i);
                        state = await this.getStateAsync(namespaceWithHomeId + '.PricesTomorrow.' + i + '.total');
                        if (state === null || state === void 0 ? void 0 : state.val)
                            prices.push(Number(state === null || state === void 0 ? void 0 : state.val));
                    }
                }
            }
        }
        return prices;
    }
    async checkAndSetStateStringFromAPI(name, value, displayName) {
        if (value) {
            await this.setObjectNotExistsAsync(name, {
                type: "state",
                common: {
                    name: displayName,
                    type: "string",
                    role: "string",
                    read: true,
                    write: true,
                },
                native: {},
            });
            await this.setStateAsync(name, value, true);
        }
    }
    async checkAndSetStateNumberFromAPI(name, value, displayName) {
        if (value) {
            await this.setObjectNotExistsAsync(name, {
                type: "state",
                common: {
                    name: displayName,
                    type: "number",
                    role: "number",
                    read: true,
                    write: true,
                },
                native: {},
            });
            await this.setStateAsync(name, value, true);
        }
    }
    async setStateBoolFromAPI(name, value, displayName) {
        await this.setObjectNotExistsAsync(name, {
            type: "state",
            common: {
                name: displayName,
                type: "boolean",
                role: "boolean",
                read: true,
                write: true,
            },
            native: {},
        });
        await this.setStateAsync(name, value, true);
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Tibberconnect(options);
}
else {
    // otherwise start the instance directly
    (() => new Tibberconnect())();
}
//# sourceMappingURL=main.js.map