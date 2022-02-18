"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TibberPulse = void 0;
const tibber_api_1 = require("tibber-api");
class TibberPulse {
    constructor(tibberConfig, adapter) {
        this.tibberConfig = tibberConfig;
        this.tibberFeed = new tibber_api_1.TibberFeed(this.tibberConfig);
        this.adapter = adapter;
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
    }
    DisconnectPulseStream() {
        try {
            this.tibberFeed.close();
        }
        catch (e) {
            this.adapter.log.warn("Error on Feed closed:" + e.message);
        }
        // reinit Tibberfeed
        this.tibberFeed = new tibber_api_1.TibberFeed(this.tibberConfig);
    }
}
exports.TibberPulse = TibberPulse;
//# sourceMappingURL=tibberPulse.js.map