import { utils } from "@iobroker/testing";
// import { functionToTest } from "./moduleToTest";
const { adapter, database } = utils.unit.createMocks({});

describe("module to test => function to test", () => {
	afterEach(() => {
		// The mocks keep track of all method invocations - reset them after each single test
		adapter.resetMockHistory();
		// We want to start each test with a fresh database
		database.clear();
	});
});

// ... more test suites => describe
