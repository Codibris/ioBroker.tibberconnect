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
            // Home GENERAL
            this.checkAndSetValue(this.getStatePrefix(homeId, "General", "Id"), currentHome.id, "ID of your home");
            this.checkAndSetValue(this.getStatePrefix(homeId, "General", "Timezone"), currentHome.timeZone, "The time zone the home resides in");
            this.checkAndSetValue(this.getStatePrefix(homeId, "General", "NameInApp"), currentHome.appNickname, "The nickname given to the home by the user");
            this.checkAndSetValue(this.getStatePrefix(homeId, "General", "AvatarInApp"), currentHome.appAvatar, "The chosen avatar for the home"); // Values: APARTMENT, ROWHOUSE, FLOORHOUSE1, FLOORHOUSE2, FLOORHOUSE3, COTTAGE, CASTLE
            this.checkAndSetValue(this.getStatePrefix(homeId, "General", "Type"), currentHome.type, "The type of home."); // Values: APARTMENT, ROWHOUSE, HOUSE, COTTAGE
            this.checkAndSetValue(this.getStatePrefix(homeId, "General", "PrimaryHeatingSource"), currentHome.primaryHeatingSource, "The primary form of heating in the household"); // Values: AIR2AIR_HEATPUMP, ELECTRICITY, GROUND, DISTRICT_HEATING, ELECTRIC_BOILER, AIR2WATER_HEATPUMP, OTHER
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, "General", "Size"), currentHome.size, "The size of the home in square meters");
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, "General", "NumberOfResidents"), currentHome.numberOfResidents, "The number of people living in the home");
            this.checkAndSetValueNumber(this.getStatePrefix(homeId, "General", "MainFuseSize"), currentHome.mainFuseSize, "The main fuse size");
            this.checkAndSetValueBoolean(this.getStatePrefix(homeId, "General", "HasVentilationSystem"), currentHome.hasVentilationSystem, "Whether the home has a ventilation system");
            this.fetchAddress(homeId, "Address", currentHome.address);
            this.fetchLegalEntity(homeId, "Owner", currentHome.owner);
            // TO DO: currentHome.currentSubscription
            // TO DO: currentHome.subscriptions
            // TO DO: currentHome.consumption
            // TO DO: currentHome.production
            this.checkAndSetValueBoolean(this.getStatePrefix(homeId, "Features", "RealTimeConsumptionEnabled"), currentHome.features.realTimeConsumptionEnabled);
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
            this.fetchPrice(homeId, "PricesToday." + hour, price);
        }
    }
    async updatePricesTomorrow(homeId) {
        const pricesTomorrow = await this.tibberQuery.getTomorrowsEnergyPrices(homeId);
        this.adapter.log.debug("Get prices tomorrow from tibber api: " + JSON.stringify(pricesTomorrow));
        for (const index in pricesTomorrow) {
            const price = pricesTomorrow[index];
            const hour = new Date(price.startsAt).getHours();
            this.fetchPrice(homeId, "PricesTomorrow." + hour, price);
        }
    }
    fetchAddress(homeId, objectDestination, address) {
        if (!address)
            return;
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "address1"), address.address1);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "address2"), address.address2);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "address3"), address.address3);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "City"), address.city);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "PostalCode"), address.postalCode);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Country"), address.country);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Latitude"), address.latitude);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Longitude"), address.longitude);
    }
    fetchPrice(homeId, objectDestination, price) {
        if (!price)
            return;
        this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "total"), price.total, "The total price (energy + taxes)");
        this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "energy"), price.energy, "Nordpool spot price");
        this.checkAndSetValueNumber(this.getStatePrefix(homeId, objectDestination, "tax"), price.tax, "The tax part of the price (guarantee of origin certificate, energy tax (Sweden only) and VAT)");
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "startsAt"), price.startsAt, "The start time of the price");
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "level"), price.level, "The price level compared to recent price values");
    }
    fetchLegalEntity(homeId, objectDestination, legalEntity) {
        if (!legalEntity)
            return;
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Id"), legalEntity.id);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "FirstName"), legalEntity.firstName);
        this.checkAndSetValueBoolean(this.getStatePrefix(homeId, objectDestination, "IsCompany"), legalEntity.isCompany);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Name"), legalEntity.name);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "MiddleName"), legalEntity.middleName);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "LastName"), legalEntity.lastName);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "OrganizationNo"), legalEntity.organizationNo);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Language"), legalEntity.language);
        if (legalEntity.contactInfo) {
            this.fetchContactInfo(homeId, objectDestination + ".ContactInfo", legalEntity.contactInfo);
        }
        if (legalEntity.address) {
            this.fetchAddress(homeId, objectDestination + ".Address", legalEntity.address);
        }
    }
    fetchContactInfo(homeId, objectDestination, contactInfo) {
        if (!contactInfo)
            return;
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Email"), contactInfo.email);
        this.checkAndSetValue(this.getStatePrefix(homeId, objectDestination, "Mobile"), contactInfo.mobile);
    }
}
exports.TibberAPICaller = TibberAPICaller;
//# sourceMappingURL=tibberAPICaller.js.map