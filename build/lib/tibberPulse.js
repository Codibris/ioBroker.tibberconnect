"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TibberPulse = void 0;
const tibber_api_1 = require("tibber-api");
const tibberHelper_1 = require("./tibberHelper");
class TibberPulse extends tibberHelper_1.TibberHelper {
    constructor(tibberConfig, adapter) {
        super(adapter);
        this.tibberConfig = tibberConfig;
        this.tibberFeed = new tibber_api_1.TibberFeed(new tibber_api_1.TibberQuery(tibberConfig));
    }
    ConnectPulseStream() {
        try {
            this.tibberFeed.connect();
        }
        catch (e) {
            this.adapter.log.warn("Error on connect Feed:" + e.message);
        }
        // Add Error Handler on connection
        this.tibberFeed.on("error", (e) => {
            this.adapter.log.error('Error in Tibber Feed on "' + e[0]["path"] + '" with message "' + e[0]["message"] + '"');
        });
        // Add data receiver
        this.tibberFeed.on("data", (data) => {
            const receivedData = data;
            this.fetchLiveMeasurement("LiveMeasurement", receivedData);
        });
    }
    DisconnectPulseStream() {
        try {
            this.tibberFeed.close();
        }
        catch (e) {
            this.adapter.log.warn("Error on Feed closed:" + e.message);
        }
        // reinit Tibberfeed
        this.tibberFeed = new tibber_api_1.TibberFeed(new tibber_api_1.TibberQuery(this.tibberConfig));
    }
    fetchLiveMeasurement(objectDestination, liveMeasurement) {
        if (this.tibberConfig.homeId !== undefined) {
            this.checkAndSetValue(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "timestamp"), liveMeasurement.timestamp, "Timestamp when usage occurred");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "power"), liveMeasurement.power, "Consumption at the moment (Watt)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "lastMeterConsumption"), liveMeasurement.lastMeterConsumption, "Last meter active import register state (kWh)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "accumulatedConsumption"), liveMeasurement.accumulatedConsumption, "kWh consumed since midnight");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "accumulatedProduction"), liveMeasurement.accumulatedProduction, "net kWh produced since midnight");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "accumulatedConsumptionLastHour"), liveMeasurement.accumulatedConsumptionLastHour, "kWh consumed since since last hour shift");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "accumulatedProductionLastHour"), liveMeasurement.accumulatedProductionLastHour, "net kWh produced since last hour shift");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "accumulatedCost"), liveMeasurement.accumulatedCost, "Accumulated cost since midnight; requires active Tibber power deal");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "accumulatedReward"), liveMeasurement.accumulatedReward, "Accumulated reward since midnight; requires active Tibber power deal");
            this.checkAndSetValue(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "currency"), liveMeasurement.currency, "Currency of displayed cost; requires active Tibber power deal");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "minPower"), liveMeasurement.minPower, "Min consumption since midnight (Watt)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "averagePower"), liveMeasurement.averagePower, "Average consumption since midnight (Watt)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "maxPower"), liveMeasurement.maxPower, "Peak consumption since midnight (Watt)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "powerProduction"), liveMeasurement.powerProduction, "Net production (A-) at the moment (Watt)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "minPowerProduction"), liveMeasurement.minPowerProduction, "Min net production since midnight (Watt)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "maxPowerProduction"), liveMeasurement.maxPowerProduction, "Max net production since midnight (Watt)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "lastMeterProduction"), liveMeasurement.lastMeterProduction, "Last meter active export register state (kWh)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "powerFactor"), liveMeasurement.powerFactor, "Power factor (active power / apparent power)");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "voltagePhase1"), liveMeasurement.voltagePhase1, "Voltage on phase 1; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware.");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "voltagePhase2"), liveMeasurement.voltagePhase2, "Voltage on phase 2; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware.");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "voltagePhase3"), liveMeasurement.voltagePhase3, "Voltage on phase 3; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware.");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "currentL1"), liveMeasurement.currentL1, "Current on L1; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware.");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "currentL2"), liveMeasurement.currentL2, "Current on L2; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware.");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "currentL3"), liveMeasurement.currentL3, "Current on L3; on Kaifa and Aidon meters the value is not part of every HAN data frame therefore the value is null at timestamps with second value other than 0, 10, 20, 30, 40, 50. There can be other deviations based on concrete meter firmware.");
            this.checkAndSetValueNumber(this.getStatePrefix(this.tibberConfig.homeId, objectDestination, "signalStrength"), liveMeasurement.signalStrength, "Device signal strength (Pulse - dB; Watty - percent)");
        }
    }
}
exports.TibberPulse = TibberPulse;
//# sourceMappingURL=tibberPulse.js.map