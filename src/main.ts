/*
 * Created with @iobroker/create-adapter v2.0.2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import { TibberQuery, IConfig } from "tibber-api";
import { TibberPulse } from "./lib/tibberPulse";

// Load your modules here, e.g.:
// import * as fs from "fs";

class Tibberconnect extends utils.Adapter {
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
					apiKey: this.config.TibberAPIToken, // Demo token
					feedUrl: "wss://api.tibber.com/v1-beta/gql/subscriptions",
					queryUrl: "https://api.tibber.com/v1-beta/gql",
				},
				timestamp: true,
				power: true,
			};

			const tibberQuery: TibberQuery = new TibberQuery(tibberConfig);

			const result = await tibberQuery.getHomes();
			const HomeName = "Homes";

			for (const HomeIndex in result) {
				const currentHome = result[HomeIndex];
				const HomeId = currentHome.id;
				// Set HomeId in Config for feed
				tibberConfig.homeId = HomeId;
				// Fetch main data
				this.checkAndSetStateStringFromAPI(HomeName + "." + HomeId + ".General.Id", currentHome.id, "Id");
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".General.Timezone",
					currentHome.timeZone,
					"Timezone",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".General.NameInApp",
					currentHome.appNickname,
					"NameInApp",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".General.AvatarInApp",
					currentHome.appAvatar,
					"AvatarInApp",
				);
				this.checkAndSetStateNumberFromAPI(HomeName + "." + HomeId + ".General.Size", currentHome.size, "Size");
				this.checkAndSetStateStringFromAPI(HomeName + "." + HomeId + ".General.Type", currentHome.type, "Type");
				this.checkAndSetStateNumberFromAPI(
					HomeName + "." + HomeId + ".General.NumberOfResidents",
					currentHome.numberOfResidents,
					"NumberOfResidents",
				);
				this.checkAndSetStateNumberFromAPI(
					HomeName + "." + HomeId + ".General.MainFuseSize",
					currentHome.mainFuseSize,
					"MainFuseSize",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".General.NumberOfResidents",
					currentHome.primaryHeatingSource,
					"NumberOfResidents",
				);
				this.setStateBoolFromAPI(
					HomeName + "." + HomeId + ".General.hasVentilationSystem",
					currentHome.hasVentilationSystem,
					"hasVentilationSystem",
				);

				// Fetch adress data
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Address.Address1",
					currentHome.address.address1,
					"Address1",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Address.Address2",
					currentHome.address.address2,
					"Address2",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Address.Address3",
					currentHome.address.address3,
					"Address3",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Address.PostalCode",
					currentHome.address.postalCode,
					"PostalCode",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Address.City",
					currentHome.address.city,
					"City",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Address.Country",
					currentHome.address.country,
					"Country",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Address.Latitude",
					currentHome.address.latitude,
					"Latitude",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Address.Longitude",
					currentHome.address.longitude,
					"Longitude",
				);

				// Fetch owner data
				this.checkAndSetStateStringFromAPI(HomeName + "." + HomeId + ".Owner.Id", currentHome.owner.id, "Id");
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Owner.Firstname",
					currentHome.owner.firstName,
					"Firstname",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Owner.Name",
					currentHome.owner.name,
					"Name",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Owner.MiddleName",
					currentHome.owner.middleName,
					"Name",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Owner.LastName",
					currentHome.owner.lastName,
					"Lastname",
				);
				this.setStateBoolFromAPI(
					HomeName + "." + HomeId + ".Owner.IsCompany",
					currentHome.owner.isCompany,
					"IsCompany",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Owner.OrganizationNo",
					currentHome.owner.organizationNo,
					"OrganizationNo",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Owner.Language",
					currentHome.owner.language,
					"Language",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Owner.Language",
					currentHome.owner.language,
					"Language",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Owner.ContactInfo.Email",
					currentHome.owner.contactInfo.email,
					"E-Mail",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".Owner.ContactInfo.Mobile",
					currentHome.owner.contactInfo.mobile,
					"Mobile",
				);

				// Fetch meteringPoint data
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".MeteringPointData.ConsumptionEan",
					currentHome.meteringPointData.consumptionEan,
					"ConsumptionEan",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".MeteringPointData.GridCompany",
					currentHome.meteringPointData.gridCompany,
					"GridCompany",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".MeteringPointData.GridAreaCode",
					currentHome.meteringPointData.gridAreaCode,
					"GridAreaCode",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".MeteringPointData.PriceAreaCode",
					currentHome.meteringPointData.priceAreaCode,
					"priceAreaCode",
				);
				// this.checkAndSetStateStringFromAPI(HomeName + "." + HomeId + ".MeteringPointData.ProductionEan", currentHome.meteringPointData.productionEan, "ProductionEan");
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".MeteringPointData.EnergyTaxType",
					currentHome.meteringPointData.energyTaxType,
					"EnergyTaxType",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".MeteringPointData.VatType",
					currentHome.meteringPointData.vatType,
					"VatType",
				);
				this.checkAndSetStateNumberFromAPI(
					HomeName + "." + HomeId + ".MeteringPointData.EstimatedAnnualConsumption",
					currentHome.meteringPointData.estimatedAnnualConsumption,
					"EstimatedAnnualConsumption",
				);

				// Fetch feature data
				this.setStateBoolFromAPI(
					HomeName + "." + HomeId + ".Features.RealTimeConsumptionEnabled",
					currentHome.features.realTimeConsumptionEnabled,
					"RealTimeConsumptionEnabled",
				);

				// Get current Energy Price from Tribber
				const resultEnergy = await tibberQuery.getCurrentEnergyPrice(HomeId);

				// Fetch currentEnergyPrice for current home
				this.checkAndSetStateNumberFromAPI(
					HomeName + "." + HomeId + ".CurrentEnergyPrice.TotalCost",
					resultEnergy.total,
					"Total Cost",
				);
				this.checkAndSetStateNumberFromAPI(
					HomeName + "." + HomeId + ".CurrentEnergyPrice.EnergyCost",
					resultEnergy.energy,
					"Energy Cost",
				);
				this.checkAndSetStateNumberFromAPI(
					HomeName + "." + HomeId + ".CurrentEnergyPrice.Tax",
					resultEnergy.tax,
					"Tax",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".CurrentEnergyPrice.StartsAt",
					resultEnergy.startsAt,
					"StartsAt",
				);
				this.checkAndSetStateStringFromAPI(
					HomeName + "." + HomeId + ".CurrentEnergyPrice.Level",
					resultEnergy.level,
					"Level",
				);
				// this.checkAndSetStateStringFromAPI(HomeName + "." + HomeId + ".CurrentEnergyPrice.Level", resultEnergy.currency, "Currency");

				// Get todays energy prices
				const resultTodayEnergy = await tibberQuery.getTodaysEnergyPrices(HomeId);

				for (const TodayEnergyIndex in resultTodayEnergy) {
					const currentTodayEnergy = resultTodayEnergy[TodayEnergyIndex];
					const StartsAt = new Date(currentTodayEnergy.startsAt);
					const StartsAtTime = StartsAt.getHours();

					// Fetch currentEnergyPrice for current home
					this.checkAndSetStateNumberFromAPI(
						HomeName + "." + HomeId + ".TodayEnergyPrice." + StartsAtTime + ".TotalCost",
						currentTodayEnergy.total,
						"Total Cost",
					);
					this.checkAndSetStateNumberFromAPI(
						HomeName + "." + HomeId + ".TodayEnergyPrice." + StartsAtTime + ".EnergyCost",
						currentTodayEnergy.energy,
						"Energy Cost",
					);
					this.checkAndSetStateNumberFromAPI(
						HomeName + "." + HomeId + ".TodayEnergyPrice." + StartsAtTime + ".Tax",
						currentTodayEnergy.tax,
						"Tax",
					);
					this.checkAndSetStateStringFromAPI(
						HomeName + "." + HomeId + ".TodayEnergyPrice." + StartsAtTime + ".StartsAt",
						currentTodayEnergy.startsAt,
						"StartsAt",
					);
					this.checkAndSetStateStringFromAPI(
						HomeName + "." + HomeId + ".TodayEnergyPrice." + StartsAtTime + ".Level",
						currentTodayEnergy.level,
						"Level",
					);
					// this.checkAndSetStateStringFromAPI(HomeName + "." + HomeId + ".TodayEnergyPrice." + TodayEnergyIndex + ".Currency", currentTodayEnergy.currency, "Currency");
				}

				// Get tomorrows energy prices
				const resultTomorrowsEnergy = await tibberQuery.getTomorrowsEnergyPrices(HomeId);

				for (const TomorrowsEnergyIndex in resultTomorrowsEnergy) {
					const currentTomorrowsEnergy = resultTomorrowsEnergy[TomorrowsEnergyIndex];
					const StartsAt = new Date(currentTomorrowsEnergy.startsAt);
					const StartsAtTime = StartsAt.getHours();

					// Fetch currentEnergyPrice for current home
					this.checkAndSetStateNumberFromAPI(
						HomeName + "." + HomeId + ".TomorrowsEnergyPrice." + StartsAtTime + ".TotalCost",
						currentTomorrowsEnergy.total,
						"Total Cost",
					);
					this.checkAndSetStateNumberFromAPI(
						HomeName + "." + HomeId + ".TomorrowsEnergyPrice." + StartsAtTime + ".EnergyCost",
						currentTomorrowsEnergy.energy,
						"Energy Cost",
					);
					this.checkAndSetStateNumberFromAPI(
						HomeName + "." + HomeId + ".TomorrowsEnergyPrice." + StartsAtTime + ".Tax",
						currentTomorrowsEnergy.tax,
						"Tax",
					);
					this.checkAndSetStateStringFromAPI(
						HomeName + "." + HomeId + ".TomorrowsEnergyPrice." + StartsAtTime + ".StartsAt",
						currentTomorrowsEnergy.startsAt,
						"StartsAt",
					);
					this.checkAndSetStateStringFromAPI(
						HomeName + "." + HomeId + ".TomorrowsEnergyPrice." + StartsAtTime + ".Level",
						currentTomorrowsEnergy.level,
						"Level",
					);
					// this.checkAndSetStateStringFromAPI(HomeName + "." + HomeId + ".TomorrowsEnergyPrice." + StartsAtTime + ".Currency", currentTomorrowsEnergy.currency, "Currency");
				}

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
