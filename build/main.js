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
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
        this.homeIdList = [];
        this.intervallList = [];
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        // Reset the connection indicator during startup
        this.setState("info.connection", false, true);
        if (this.config.TibberAPIToken == null) {
            // No Token defined in configuration
            this.log.warn("Missing API Token - please check configuration");
        }
        else {
            // Config object needed when instantiating TibberQuery
            const tibberConfig = {
                active: true,
                apiEndpoint: {
                    apiKey: this.config.TibberAPIToken,
                    //feedUrl: "wss://api.tibber.com/v1-beta/gql/subscriptions",
                    queryUrl: "https://api.tibber.com/v1-beta/gql",
                },
            };
            // Now read all Data from API
            const tibberAPICaller = new tibberAPICaller_1.TibberAPICaller(tibberConfig, this);
            this.homeIdList = await tibberAPICaller.updateHomesFromAPI();
            // Init Load Data for home
            if (this.homeIdList.length > 0) {
                for (const index in this.homeIdList) {
                    tibberAPICaller.updateCurrentPrice(this.homeIdList[index]);
                    tibberAPICaller.updatePricesToday(this.homeIdList[index]);
                    tibberAPICaller.updatePricesTomorrow(this.homeIdList[index]);
                }
            }
            const energyPriceCallIntervall = this.setInterval(() => {
                if (this.homeIdList.length > 0) {
                    for (const index in this.homeIdList) {
                        tibberAPICaller.updateCurrentPrice(this.homeIdList[index]);
                    }
                }
            }, 300000);
            this.intervallList.push(energyPriceCallIntervall);
            const energyPricesListUpdateIntervall = this.setInterval(() => {
                if (this.homeIdList.length > 0) {
                    for (const index in this.homeIdList) {
                        tibberAPICaller.updatePricesToday(this.homeIdList[index]);
                        tibberAPICaller.updatePricesTomorrow(this.homeIdList[index]);
                    }
                }
            }, 300000);
            this.intervallList.push(energyPricesListUpdateIntervall);
            // If User uses TibberConfig - start connection
            if (this.config.FeedActive) {
                for (const index in this.homeIdList) {
                    try {
                        tibberConfig.homeId = this.homeIdList[index];
                        // define fields for Datafeed
                        tibberConfig.timestamp = true;
                        tibberConfig.power = true;
                        if (this.config.FeedConfigLastMeterConsumption) {
                            tibberConfig.lastMeterConsumption = true;
                        }
                        if (this.config.FeedConfigAccumulatedConsumption) {
                            tibberConfig.accumulatedConsumption = true;
                        }
                        if (this.config.FeedConfigAccumulatedProduction) {
                            tibberConfig.accumulatedProduction = true;
                        }
                        if (this.config.FeedConfigAccumulatedConsumptionLastHour) {
                            tibberConfig.accumulatedConsumptionLastHour = true;
                        }
                        if (this.config.FeedConfigAccumulatedProductionLastHour) {
                            tibberConfig.accumulatedProductionLastHour = true;
                        }
                        if (this.config.FeedConfigAccumulatedCost) {
                            tibberConfig.accumulatedCost = true;
                        }
                        if (this.config.FeedConfigAccumulatedCost) {
                            tibberConfig.accumulatedReward = true;
                        }
                        if (this.config.FeedConfigCurrency) {
                            tibberConfig.currency = true;
                        }
                        if (this.config.FeedConfigMinPower) {
                            tibberConfig.minPower = true;
                        }
                        if (this.config.FeedConfigAveragePower) {
                            tibberConfig.averagePower = true;
                        }
                        if (this.config.FeedConfigMaxPower) {
                            tibberConfig.maxPower = true;
                        }
                        if (this.config.FeedConfigPowerProduction) {
                            tibberConfig.powerProduction = true;
                        }
                        if (this.config.FeedConfigMinPowerProduction) {
                            tibberConfig.minPowerProduction = true;
                        }
                        if (this.config.FeedConfigMaxPowerProduction) {
                            tibberConfig.maxPowerProduction = true;
                        }
                        if (this.config.FeedConfigLastMeterProduction) {
                            tibberConfig.lastMeterProduction = true;
                        }
                        if (this.config.FeedConfigPowerFactor) {
                            tibberConfig.powerFactor = true;
                        }
                        if (this.config.FeedConfigVoltagePhase1) {
                            tibberConfig.voltagePhase1 = true;
                        }
                        if (this.config.FeedConfigVoltagePhase2) {
                            tibberConfig.voltagePhase2 = true;
                        }
                        if (this.config.FeedConfigVoltagePhase3) {
                            tibberConfig.voltagePhase3 = true;
                        }
                        if (this.config.FeedConfigCurrentL1) {
                            tibberConfig.currentL1 = true;
                        }
                        if (this.config.FeedConfigCurrentL2) {
                            tibberConfig.currentL2 = true;
                        }
                        if (this.config.FeedConfigCurrentL3) {
                            tibberConfig.currentL3 = true;
                        }
                        if (this.config.FeedConfigSignalStrength) {
                            tibberConfig.signalStrength = true;
                        }
                        const tibberPulse = new tibberPulse_1.TibberPulse(tibberConfig, this);
                        tibberPulse.ConnectPulseStream();
                    }
                    catch (e) {
                        this.log.warn(e.message);
                    }
                }
            }
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
            callback();
        }
        catch (e) {
            callback();
        }
    }
    /**
     * Is called if a subscribed state changes
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        }
        else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
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
            await this.setStateAsync(name, value);
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
            await this.setStateAsync(name, value);
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
        await this.setStateAsync(name, value);
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