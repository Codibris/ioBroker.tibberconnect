"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TibberPulse = void 0;
const tibber_api_1 = require("tibber-api");
const tibberHelper_1 = require("./tibberHelper");
class TibberPulse extends tibberHelper_1.TibberHelper {
    constructor(tibberConfig, adapter) {
        super(adapter);
        this.tibberConfig = tibberConfig;
        this.tibberQuery = new tibber_api_1.TibberQuery(this.tibberConfig);
        this.tibberFeed = new tibber_api_1.TibberFeed(this.tibberQuery);
        this.httpQueryUrl = tibberConfig.apiEndpoint.queryUrl;
        this.addEventHandlerOnFeed(this.tibberFeed);
    }
    ConnectPulseStream() {
        try {
            this.tibberFeed.connect();
        }
        catch (e) {
            this.adapter.log.warn("Error on connect Feed: " + e.message);
        }
    }
    DisconnectPulseStream() {
        this.clearReconnectInterval();
        try {
            this.tibberFeed.close();
        }
        catch (e) {
            this.adapter.log.warn("Error on Feed close: " + e.message);
        }
        // reinit Tibberfeed
        this.tibberFeed = new tibber_api_1.TibberFeed(new tibber_api_1.TibberQuery(this.tibberConfig));
    }
    clearReconnectInterval() {
        if (this.reconnectInterval) {
            this.adapter.clearInterval(this.reconnectInterval);
            this.reconnectInterval = undefined;
        }
    }
    addEventHandlerOnFeed(currentFeed) {
        // Set info.connection state
        currentFeed.on("connected", (data) => {
            this.adapter.log.debug("Tibber Feed: " + data.toString());
            this.adapter.setState("info.connection", true, true);
        });
        // Set info.connection state
        currentFeed.on("disconnected", (data) => {
            this.adapter.log.debug("Tibber Feed: " + data.toString());
            this.adapter.setState("info.connection", false, true);
            if (this.adapter.config.FeedActive) {
                this.adapter.log.info("Feed was disconnected. I try to reconnect in 5s");
                this.reconnect();
            }
        });
        // Add Error Handler on connection
        currentFeed.on("error", (e) => {
            this.adapter.log.error("ERROR on Tibber-Feed: " + e.toString());
        });
        // Add data receiver. The handler itself is sync (EventEmitter contract),
        // so explicitly catch any rejection from the async pipeline to avoid
        // unhandled promise rejections terminating the adapter.
        currentFeed.on("data", (data) => {
            const receivedData = data;
            this.fetchLiveMeasurement("LiveMeasurement", receivedData).catch((e) => {
                this.adapter.log.warn("Error while processing Tibber live measurement: " + e.message);
            });
        });
    }
    async fetchLiveMeasurement(objectDestination, liveMeasurement) {
        if (this.tibberConfig.homeId === undefined)
            return;
        const homeId = this.tibberConfig.homeId;
        // Run all state writes concurrently – at the same time we guarantee that
        // every rejection is captured by Promise.all and surfaced to the caller's
        // .catch() handler instead of becoming an unhandled rejection.
        await Promise.all([
            this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "timestamp"), liveMeasurement.timestamp, "Timestamp when usage occurred"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "power"), liveMeasurement.power, "Consumption at the moment (Watt)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "lastMeterConsumption"), liveMeasurement.lastMeterConsumption, "Last meter active import register state (kWh)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "accumulatedConsumption"), liveMeasurement.accumulatedConsumption, "kWh consumed since midnight"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "accumulatedProduction"), liveMeasurement.accumulatedProduction, "net kWh produced since midnight"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "accumulatedConsumptionLastHour"), liveMeasurement.accumulatedConsumptionLastHour, "kWh consumed since since last hour shift"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "accumulatedProductionLastHour"), liveMeasurement.accumulatedProductionLastHour, "net kWh produced since last hour shift"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "accumulatedCost"), liveMeasurement.accumulatedCost, "Accumulated cost since midnight; requires active Tibber power deal"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "accumulatedReward"), liveMeasurement.accumulatedReward, "Accumulated reward since midnight; requires active Tibber power deal"),
            this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "currency"), liveMeasurement.currency, "Currency of displayed cost; requires active Tibber power deal"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "minPower"), liveMeasurement.minPower, "Min consumption since midnight (Watt)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "averagePower"), liveMeasurement.averagePower, "Average consumption since midnight (Watt)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "maxPower"), liveMeasurement.maxPower, "Peak consumption since midnight (Watt)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "powerProduction"), liveMeasurement.powerProduction, "Net production (A-) at the moment (Watt)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "minPowerProduction"), liveMeasurement.minPowerProduction, "Min net production since midnight (Watt)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "maxPowerProduction"), liveMeasurement.maxPowerProduction, "Max net production since midnight (Watt)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "lastMeterProduction"), liveMeasurement.lastMeterProduction, "Last meter active export register state (kWh)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "powerFactor"), liveMeasurement.powerFactor, "Power factor (active power / apparent power)"),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "voltagePhase1"), liveMeasurement.voltagePhase1, "Voltage on phase 1; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware."),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "voltagePhase2"), liveMeasurement.voltagePhase2, "Voltage on phase 2; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware."),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "voltagePhase3"), liveMeasurement.voltagePhase3, "Voltage on phase 3; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware."),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "currentL1"), liveMeasurement.currentL1, "Current on L1; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware."),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "currentL2"), liveMeasurement.currentL2, "Current on L2; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware."),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "currentL3"), liveMeasurement.currentL3, "Current on L3; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware."),
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "signalStrength"), liveMeasurement.signalStrength, "Device signal strength (Pulse - dB; Watty - percent)"),
        ]);
    }
    reconnect() {
        // avoid stacking multiple reconnect intervals if disconnect fires repeatedly
        if (this.reconnectInterval)
            return;
        this.reconnectInterval = this.adapter.setInterval(() => {
            if (!this.tibberFeed.connected) {
                this.adapter.log.debug("Try reconnecting now!");
                this.ConnectPulseStream();
            }
            else {
                this.adapter.log.debug("Reconnect successful! Interval not necessary.");
                this.clearReconnectInterval();
            }
        }, 5000);
    }
}
exports.TibberPulse = TibberPulse;
//# sourceMappingURL=tibberPulse.js.map