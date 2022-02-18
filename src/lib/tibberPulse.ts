import { TibberFeed, IConfig } from "tibber-api";
import * as utils from "@iobroker/adapter-core";

export class TibberPulse {
	tibberConfig: IConfig;
	tibberFeed: TibberFeed;
	adapter: utils.AdapterInstance;

	constructor(tibberConfig: IConfig, adapter: utils.AdapterInstance) {
		this.tibberConfig = tibberConfig;
		this.tibberFeed = new TibberFeed(this.tibberConfig);
		this.adapter = adapter;
	}

	ConnectPulseStream(): void {
		try {
			this.tibberFeed.connect();
		} catch (e) {
			this.adapter.log.warn("Error on connect Feed:" + (e as Error).message);
		}

		// Add Error Handler on connection
		this.tibberFeed.on("error", (e) => {
			this.adapter.log.error(
				'Error in Tibber Feed on "' + e[0]["path"] + '" with message "' + e[0]["message"] + '"',
			);
		});
	}

	DisconnectPulseStream(): void {
		try {
			this.tibberFeed.close();
		} catch (e) {
			this.adapter.log.warn("Error on Feed closed:" + (e as Error).message);
		}

		// reinit Tibberfeed
		this.tibberFeed = new TibberFeed(this.tibberConfig);
	}
}
