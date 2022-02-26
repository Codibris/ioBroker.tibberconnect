/*
 * Created with @iobroker/create-adapter v2.0.2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import { IConfig } from "tibber-api";
import { TibberAPICaller } from "./lib/tibberAPICaller";
import { TibberPulse } from "./lib/tibberPulse";

// Load your modules here, e.g.:
// import * as fs from "fs";

class Tibberconnect extends utils.Adapter {
	intervallList: ioBroker.Interval[];
	homeIdList: string[];

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
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
	private async onReady(): Promise<void> {
		// Initialize your adapter here

		// Reset the connection indicator during startup
		this.setState("info.connection", false, true);

		if (this.config.TibberAPIToken == null) {
			// No Token defined in configuration
			this.log.warn("Missing API Token - please check configuration");
		} else {
			// Config object needed when instantiating TibberQuery
			const tibberConfig: IConfig = {
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
			const tibberAPICaller = new TibberAPICaller(tibberConfig, this);
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
			energyPriceCallIntervall
			// If User uses TibberConfig - start connection
			if (this.config.PulseActive) {
				try {
					const tibberPulse = new TibberPulse(tibberConfig, this);
					tibberPulse.ConnectPulseStream();
				} catch (e) {
					this.log.warn((e as Error).message);
				}
			}
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
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
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	private async checkAndSetStateStringFromAPI(name: string, value: string, displayName: string): Promise<void> {
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

	private async checkAndSetStateNumberFromAPI(name: string, value: number, displayName: string): Promise<void> {
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

	private async setStateBoolFromAPI(name: string, value: boolean, displayName: string): Promise<void> {
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
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Tibberconnect(options);
} else {
	// otherwise start the instance directly
	(() => new Tibberconnect())();
}
