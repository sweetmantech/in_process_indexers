import assert from "assert";
import { 
  TestHelpers,
  ZoraCreator1155FactoryImpl_SetupNewContract
} from "generated";
const { MockDb, ZoraCreator1155FactoryImpl } = TestHelpers;

describe("ZoraCreator1155FactoryImpl contract SetupNewContract event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ZoraCreator1155FactoryImpl contract SetupNewContract event
  const event = ZoraCreator1155FactoryImpl.SetupNewContract.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ZoraCreator1155FactoryImpl_SetupNewContract is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ZoraCreator1155FactoryImpl.SetupNewContract.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualZoraCreator1155FactoryImplSetupNewContract = mockDbUpdated.entities.ZoraCreator1155FactoryImpl_SetupNewContract.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedZoraCreator1155FactoryImplSetupNewContract: ZoraCreator1155FactoryImpl_SetupNewContract = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      newContract: event.params.newContract,
      creator: event.params.creator,
      defaultAdmin: event.params.defaultAdmin,
      contractURI: event.params.contractURI,
      name: event.params.name,
      defaultRoyaltyConfiguration: event.params.defaultRoyaltyConfiguration,
      defaultRoyaltyConfiguration: event.params.defaultRoyaltyConfiguration,
      defaultRoyaltyConfiguration: event.params.defaultRoyaltyConfiguration,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualZoraCreator1155FactoryImplSetupNewContract, expectedZoraCreator1155FactoryImplSetupNewContract, "Actual ZoraCreator1155FactoryImplSetupNewContract should be the same as the expectedZoraCreator1155FactoryImplSetupNewContract");
  });
});
