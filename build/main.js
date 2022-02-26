"use strict";
/*
 * Created with @iobroker/create-adapter v2.0.2
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
                    feedUrl: "wss://api.tibber.com/v1-beta/gql/subscriptions",
                    queryUrl: "https://api.tibber.com/v1-beta/gql",
                },
                timestamp: true,
                power: true,
            };
            // Now read all Data from API
            const tibberAPICaller = new tibberAPICaller_1.TibberAPICaller(tibberConfig, this);
            this.homeIdList = await tibberAPICaller.updateHomesFromAPI();
            const energyPriceCallIntervall = this.setInterval(() => {
                this.log.info("Timer läuft!");
                if (this.homeIdList.length > 0) {
                    for (const index in this.homeIdList) {
                        this.log.info(this.homeIdList[index]);
                        tibberAPICaller.updateCurrentPrice(this.homeIdList[index]);
                    }
                }
            }, 300000);
            this.intervallList.push(energyPriceCallIntervall);
            // If User uses TibberConfig - start connection
            if (this.config.PulseActive) {
                try {
                    const tibberPulse = new tibberPulse_1.TibberPulse(tibberConfig, this);
                    tibberPulse.ConnectPulseStream();
                }
                catch (e) {
                    this.log.warn(e.message);
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