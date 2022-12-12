"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TibberHelper = void 0;
class TibberHelper {
    constructor(adapter) {
        this.adapter = adapter;
    }
    getStatePrefix(homeId, space, name) {
        const statePrefix = {
            key: name,
            value: "Homes." + homeId + "." + space + "." + name,
        };
        return statePrefix;
    }
    async checkAndSetValue(stateName, value, description) {
        if (value !== null) {
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
    async checkAndSetValueNumber(stateName, value, description) {
        if (value !== null) {
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
    async checkAndSetValueBoolean(stateName, value, description) {
        if (value !== null) {
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
exports.TibberHelper = TibberHelper;
//# sourceMappingURL=tibberHelper.js.map