import * as utils from "@iobroker/adapter-core";
import { IConfig, TibberQuery } from "tibber-api";
import { IAddress } from "tibber-api/lib/src/models/IAddress";
import { IContactInfo } from "tibber-api/lib/src/models/IContactInfo";
import { ILegalEntity } from "tibber-api/lib/src/models/ILegalEntity";
import { IPrice } from "tibber-api/lib/src/models/IPrice";

export class TibberAPICaller {
	tibberConfig: IConfig;
	tibberQuery: TibberQuery;
	adapter: utils.AdapterInstance;
	currentHomeId: string;

	constructor(tibberConfig: IConfig, adapter: utils.AdapterInstance) {
		this.adapter = adapter;
		this.tibberConfig = tibberConfig;
		this.tibberQuery = new TibberQuery(this.tibberConfig);
		this.currentHomeId = "";
	}

	async updateHomesFromAPI(): Promise<string[]> {
		const currentHomes = await this.tibberQuery.getHomes();
		this.adapter.log.info(JSON.stringify(currentHomes));
		const homeIdList: string[] = [];
		for (const homeIndex in currentHomes) {
			const currentHome = currentHomes[homeIndex];
			this.currentHomeId = currentHome.id;
			homeIdList.push(this.currentHomeId);
			// Set HomeId in tibberConfig for further API Calls
			this.tibberConfig.homeId = this.currentHomeId;
			// Home GENERAL
			this.checkAndSetValue(this.getStatePrefix("General", "Id"), currentHome.id, "ID of your home");
			this.checkAndSetValue(
				this.getStatePrefix("General", "Timezone"),
				currentHome.timeZone,
				"The time zone the home resides in",
			);
			this.checkAndSetValue(
				this.getStatePrefix("General", "NameInApp"),
				currentHome.appNickname,
				"The nickname given to the home by the user",
			);
			this.checkAndSetValue(
				this.getStatePrefix("General", "AvatarInApp"),
				currentHome.appAvatar,
				"The chosen avatar for the home",
			); // Values: APARTMENT, ROWHOUSE, FLOORHOUSE1, FLOORHOUSE2, FLOORHOUSE3, COTTAGE, CASTLE
			this.checkAndSetValue(this.getStatePrefix("General", "Type"), currentHome.type, "The type of home."); // Values: APARTMENT, ROWHOUSE, HOUSE, COTTAGE
			this.checkAndSetValue(
				this.getStatePrefix("General", "PrimaryHeatingSource"),
				currentHome.primaryHeatingSource,
				"The primary form of heating in the household",
			); // Values: AIR2AIR_HEATPUMP, ELECTRICITY, GROUND, DISTRICT_HEATING, ELECTRIC_BOILER, AIR2WATER_HEATPUMP, OTHER
			this.checkAndSetValueNumber(
				this.getStatePrefix("General", "Size"),
				currentHome.size,
				"The size of the home in square meters",
			);
			this.checkAndSetValueNumber(
				this.getStatePrefix("General", "NumberOfResidents"),
				currentHome.numberOfResidents,
				"The number of people living in the home",
			);
			this.checkAndSetValueNumber(
				this.getStatePrefix("General", "MainFuseSize"),
				currentHome.mainFuseSize,
				"The main fuse size",
			);
			this.checkAndSetValueBoolean(
				this.getStatePrefix("General", "HasVentilationSystem"),
				currentHome.hasVentilationSystem,
				"Whether the home has a ventilation system",
			);

			this.fetchAddress("Address", currentHome.address);
			this.fetchLegalEntity("Owner", currentHome.owner);

			// TO DO: currentHome.currentSubscription
			// TO DO: currentHome.subscriptions
			// TO DO: currentHome.consumption
			// TO DO: currentHome.production

			this.checkAndSetValueBoolean(
				this.getStatePrefix("Features", "RealTimeConsumptionEnabled"),
				currentHome.features.realTimeConsumptionEnabled,
			);
		}

		return homeIdList;
	}

	async updateCurrentPrice(homeId: string): Promise<void> {
		if (homeId) {
			const currentPrice = await this.tibberQuery.getCurrentEnergyPrice(homeId);
			this.adapter.log.info(JSON.stringify(currentPrice));
			this.currentHomeId = homeId;
			await this.fetchPrice("CurrentPrice", currentPrice);
		}
	}

	private fetchAddress(objectDestination: string, address: IAddress): void {
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "address1"), address.address1);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "address2"), address.address2);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "address3"), address.address3);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "City"), address.city);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "PostalCode"), address.postalCode);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "Country"), address.country);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "Latitude"), address.latitude);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "Longitude"), address.longitude);
	}

	private fetchPrice(objectDestination: string, price: IPrice){
		this.checkAndSetValueNumber(this.getStatePrefix(objectDestination, "total"), price.total, "The total price (energy + taxes)");
		this.checkAndSetValueNumber(this.getStatePrefix(objectDestination, "energy"), price.energy, "Nordpool spot price");
		this.checkAndSetValueNumber(this.getStatePrefix(objectDestination, "tax"), price.tax, "The tax part of the price (guarantee of origin certificate, energy tax (Sweden only) and VAT)");
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "startsAt"), price.startsAt, "The start time of the price");
		//this.checkAndSetValue(this.getStatePrefix(objectDestination, "currency"), price.currency, "The price currency");
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "level"), price.level, "The price level compared to recent price values");
	}

	private fetchLegalEntity(objectDestination: string, legalEntity: ILegalEntity): void {
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "Id"), legalEntity.id);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "FirstName"), legalEntity.firstName);
		this.checkAndSetValueBoolean(this.getStatePrefix(objectDestination, "IsCompany"), legalEntity.isCompany);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "Name"), legalEntity.name);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "MiddleName"), legalEntity.middleName);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "LastName"), legalEntity.lastName);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "OrganizationNo"), legalEntity.organizationNo);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "Language"), legalEntity.language);
		if (legalEntity.contactInfo) {
			this.fetchContactInfo(objectDestination + ".ContactInfo", legalEntity.contactInfo);
		}
		if (legalEntity.address) {
			this.fetchAddress(objectDestination + ".Address", legalEntity.address);
		}
	}

	private fetchContactInfo(objectDestination: string, contactInfo: IContactInfo): void {
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "Email"), contactInfo.email);
		this.checkAndSetValue(this.getStatePrefix(objectDestination, "Mobile"), contactInfo.mobile);
	}

	private getStatePrefix(space: string, name: string): { [key: string]: string } {
		const statePrefix = {
			key: name,
			value: "Homes." + this.currentHomeId + "." + space + "." + name,
		};
		return statePrefix;
	}

	private async checkAndSetValue(
		stateName: { [key: string]: string },
		value: string,
		description?: string,
	): Promise<void> {
		if (value) {
			await this.adapter.setObjectNotExistsAsync(stateName.value, {
				type: "state",
				common: {
					name: stateName.key,
					type: "string",
					role: "String",
					desc: description,
					read: true,
					write: true,
				},
				native: {},
			});

			await this.adapter.setStateAsync(stateName.value, value);
		}
	}

	private async checkAndSetValueNumber(
		stateName: { [key: string]: string },
		value: number,
		description?: string,
	): Promise<void> {
		if (value) {
			await this.adapter.setObjectNotExistsAsync(stateName.value, {
				type: "state",
				common: {
					name: stateName.key,
					type: "number",
					role: "Number",
					desc: description,
					read: true,
					write: true,
				},
				native: {},
			});

			await this.adapter.setStateAsync(stateName.value, value);
		}
	}

	private async checkAndSetValueBoolean(
		stateName: { [key: string]: string },
		value: boolean,
		description?: string,
	): Promise<void> {
		if (value) {
			await this.adapter.setObjectNotExistsAsync(stateName.value, {
				type: "state",
				common: {
					name: stateName.key,
					type: "boolean",
					role: "Boolean",
					desc: description,
					read: true,
					write: true,
				},
				native: {},
			});

			await this.adapter.setStateAsync(stateName.value, value);
		}
	}
}
