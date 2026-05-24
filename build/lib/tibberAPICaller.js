"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TibberAPICaller = void 0;
const tibber_api_1 = require("tibber-api");
const tibberHelper_1 = require("./tibberHelper");
class TibberAPICaller extends tibberHelper_1.TibberHelper {
    constructor(tibberConfig, adapter) {
        super(adapter);
        this.tibberConfig = tibberConfig;
        this.tibberQuery = new tibber_api_1.TibberQuery(this.tibberConfig);
    }
    async updateHomesFromAPI() {
        const currentHomes = await this.tibberQuery.getHomes();
        this.adapter.log.debug("Get homes from tibber api: " + JSON.stringify(currentHomes));
        const homeIdList = [];
        for (const homeIndex in currentHomes) {
            const currentHome = currentHomes[homeIndex];
            const homeId = currentHome.id;
            homeIdList.push(homeId);
            // Home GENERAL – awaited so DB errors surface here instead of as unhandled rejections
            await this.checkAndSetValue(this.getStatePrefix(homeId, "General", "Id"), currentHome.id, "ID of your home");
            await this.checkAndSetValue(this.getStatePrefix(homeId, "General", "Timezone"), currentHome.timeZone, "The time zone the home resides in");
            await this.checkAndSetValue(this.getStatePrefix(homeId, "General", "NameInApp"), currentHome.appNickname, "The nickname given to the home by the user");
            await this.checkAndSetValue(this.getStatePrefix(homeId, "General", "AvatarInApp"), currentHome.appAvatar, "The chosen avatar for the home"); // Values: APARTMENT, ROWHOUSE, FLOORHOUSE1, FLOORHOUSE2, FLOORHOUSE3, COTTAGE, CASTLE
            await this.checkAndSetValue(this.getStatePrefix(homeId, "General", "Type"), currentHome.type, "The type of home."); // Values: APARTMENT, ROWHOUSE, HOUSE, COTTAGE
            await this.checkAndSetValue(this.getStatePrefix(homeId, "General", "PrimaryHeatingSource"), currentHome.primaryHeatingSource, "The primary form of heating in the household"); // Values: AIR2AIR_HEATPUMP, ELECTRICITY, GROUND, DISTRICT_HEATING, ELECTRIC_BOILER, AIR2WATER_HEATPUMP, OTHER
            await this.checkAndSetValueNumber(this.getStatePrefix(homeId, "General", "Size"), currentHome.size, "The size of the home in square meters");
            await this.checkAndSetValueNumber(this.getStatePrefix(homeId, "General", "NumberOfResidents"), currentHome.numberOfResidents, "The number of people living in the home");
            await this.checkAndSetValueNumber(this.getStatePrefix(homeId, "General", "MainFuseSize"), currentHome.mainFuseSize, "The main fuse size");
            await this.checkAndSetValueBoolean(this.getStatePrefix(homeId, "General", "HasVentilationSystem"), currentHome.hasVentilationSystem, "Whether the home has a ventilation system");
            await this.fetchAddress(homeId, "Address", currentHome.address);
            await this.fetchLegalEntity(homeId, "Owner", currentHome.owner);
            // TO DO: currentHome.currentSubscription
            // TO DO: currentHome.subscriptions
            // TO DO: currentHome.consumption
            // TO DO: currentHome.production
            await this.checkAndSetValueBoolean(this.getStatePrefix(homeId, "Features", "RealTimeConsumptionEnabled"), currentHome.features.realTimeConsumptionEnabled);
        }
        return homeIdList;
    }
    generateErrorMessage(error, context) {
        var _a, _b, _c, _d;
        const statusMessage = (_b = (_a = error === null || error === void 0 ? void 0 : error.statusMessage) !== null && _a !== void 0 ? _a : error === null || error === void 0 ? void 0 : error.message) !== null && _b !== void 0 ? _b : "unbekannt";
        let errorMessages = "";
        if (Array.isArray(error === null || error === void 0 ? void 0 : error.errors)) {
            for (const e of error.errors) {
                if (errorMessages) {
                    errorMessages += ", ";
                }
                errorMessages += (_c = e === null || e === void 0 ? void 0 : e.message) !== null && _c !== void 0 ? _c : String(e);
            }
        }
        else if ((error === null || error === void 0 ? void 0 : error.errors) && typeof error.errors === "object") {
            for (const key in error.errors) {
                const e = error.errors[key];
                if (errorMessages) {
                    errorMessages += ", ";
                }
                errorMessages += (_d = e === null || e === void 0 ? void 0 : e.message) !== null && _d !== void 0 ? _d : String(e);
            }
        }
        const details = errorMessages ? ": " + errorMessages : "";
        return "Fehler (" + statusMessage + ") bei Vorgang " + context + details;
    }
    async updateCurrentPrice(homeId) {
        if (homeId) {
            const currentPrice = await this.tibberQuery.getCurrentEnergyPrice(homeId);
            this.adapter.log.debug("Get current price from tibber api: " + JSON.stringify(currentPrice));
            await this.fetchPrice(homeId, "CurrentPrice", currentPrice);
        }
    }
    async updatePricesToday(homeId) {
        const pricesToday = await this.tibberQuery.getTodaysEnergyPrices(homeId);
        this.adapter.log.debug("Get prices today from tibber api: " + JSON.stringify(pricesToday));
        for (const index in pricesToday) {
            const price = pricesToday[index];
            const hour = new Date(price.startsAt).getHours();
            await this.fetchPrice(homeId, "PricesToday." + hour, price);
        }
    }
    async updatePricesTomorrow(homeId) {
        const pricesTomorrow = await this.tibberQuery.getTomorrowsEnergyPrices(homeId);
        this.adapter.log.debug("Get prices tomorrow from tibber api: " + JSON.stringify(pricesTomorrow));
        for (const index in pricesTomorrow) {
            const price = pricesTomorrow[index];
            const hour = new Date(price.startsAt).getHours();
            await this.fetchPrice(homeId, "PricesTomorrow." + hour, price);
        }
    }
    async fetchAddress(homeId, objectDestination, address) {
        if (!address)
            return;
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "address1"), address.address1);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "address2"), address.address2);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "address3"), address.address3);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "City"), address.city);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "PostalCode"), address.postalCode);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Country"), address.country);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Latitude"), address.latitude);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Longitude"), address.longitude);
    }
    async fetchPrice(homeId, objectDestination, price) {
        if (!price)
            return;
        await this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "total"), price.total, "The total price (energy + taxes)");
        await this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "energy"), price.energy, "Nordpool spot price");
        await this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "tax"), price.tax, "The tax part of the price (guarantee of origin certificate, energy tax (Sweden only) and VAT)");
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "startsAt"), price.startsAt, "The start time of the price");
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "level"), price.level, "The price level compared to recent price values");
    }
    async fetchLegalEntity(homeId, objectDestination, legalEntity) {
        if (!legalEntity)
            return;
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Id"), legalEntity.id);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "FirstName"), legalEntity.firstName);
        await this.checkAndSetValueBoolean(this.getStatePrefix(homeId, objectDestination, "IsCompany"), legalEntity.isCompany);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Name"), legalEntity.name);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "MiddleName"), legalEntity.middleName);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "LastName"), legalEntity.lastName);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "OrganizationNo"), legalEntity.organizationNo);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Language"), legalEntity.language);
        if (legalEntity.contactInfo) {
            await this.fetchContactInfo(homeId, objectDestination + ".ContactInfo", legalEntity.contactInfo);
        }
        if (legalEntity.address) {
            await this.fetchAddress(homeId, objectDestination + ".Address", legalEntity.address);
        }
    }
    async fetchContactInfo(homeId, objectDestination, contactInfo) {
        if (!contactInfo)
            return;
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Email"), contactInfo.email);
        await this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Mobile"), contactInfo.mobile);
    }
}
exports.TibberAPICaller = TibberAPICaller;
//# sourceMappingURL=tibberAPICaller.js.map