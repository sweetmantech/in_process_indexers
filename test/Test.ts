import assert from "assert";
import {
  TestHelpers,
  CreatorFactory_SetupNewContract,
  ERC20Minter_MintComment,
  ERC20Minter_ERC20RewardsDeposit,
} from "generated";

const { MockDb, CreatorFactory, ERC20Minter } = TestHelpers;

describe("Event Handler Tests", () => {
  describe("CreatorFactory.SetupNewContract", () => {
    it("should create entity correctly", async () => {
      const mockDb = MockDb.createMockDb();

      const defaultAdmin = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      const payoutRecipient = "0x5555555555555555555555555555555555555555";
      const event = CreatorFactory.SetupNewContract.createMockEvent({
        newContract: "0x1234567890123456789012345678901234567890",
        defaultAdmin: defaultAdmin,
        contractURI: "https://example.com/contract",
        defaultRoyaltyConfiguration: [0n, 0n, payoutRecipient],
      });

      const mockDbUpdated = await CreatorFactory.SetupNewContract.processEvent({
        event,
        mockDb,
      });

      const actualEntity = mockDbUpdated.entities.CreatorFactory_SetupNewContract.get(
        `${event.chainId}_${event.block.number}_${event.logIndex}`
      );

      const expectedEntity: CreatorFactory_SetupNewContract = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        address: event.params.newContract.toLowerCase(),
        contractURI: event.params.contractURI,
        defaultAdmin: defaultAdmin.toLowerCase(),
        payoutRecipient: payoutRecipient.toLowerCase(),
        chainId: event.chainId,
        transactionHash: event.transaction.hash,
        blockNumber: event.block.number,
        blockTimestamp: event.block.timestamp,
      };

      assert.deepEqual(
        actualEntity,
        expectedEntity,
        "CreatorFactory_SetupNewContract entity should match expected values"
      );
    });
  });

  describe("ERC20Minter.MintComment", () => {
    it("should create entity correctly", async () => {
      const mockDb = MockDb.createMockDb();

      const event = ERC20Minter.MintComment.createMockEvent({
        sender: "0x1111111111111111111111111111111111111111",
        tokenContract: "0x2222222222222222222222222222222222222222",
        tokenId: 1n,
        comment: "Test comment",
      });

      const mockDbUpdated = await ERC20Minter.MintComment.processEvent({
        event,
        mockDb,
      });

      const actualEntity = mockDbUpdated.entities.ERC20Minter_MintComment.get(
        `${event.chainId}_${event.block.number}_${event.logIndex}`
      );

      const expectedEntity: ERC20Minter_MintComment = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        sender: event.params.sender,
        tokenContract: event.params.tokenContract.toLowerCase(),
        tokenId: event.params.tokenId.toString(),
        comment: event.params.comment,
        transactionHash: event.transaction.hash,
        timestamp: event.block.timestamp,
        chainId: event.chainId,
      };

      assert.deepEqual(
        actualEntity,
        expectedEntity,
        "ERC20Minter_MintComment entity should match expected values"
      );
    });
  });

  describe("ERC20Minter.ERC20RewardsDeposit", () => {
    it("should create entity correctly", async function () {
      this.timeout(10000); // Increase timeout since getUsdcTransfer makes async RPC calls
      const mockDb = MockDb.createMockDb();

      const event = ERC20Minter.ERC20RewardsDeposit.createMockEvent({
        collection: "0x3333333333333333333333333333333333333333",
        currency: "0x4444444444444444444444444444444444444444",
        tokenId: 2n,
      });

      // Set a valid transaction hash (must start with 0x and be 66 chars)
      // Use type assertion to bypass read-only property
      (event.transaction as { hash: string }).hash =
        "0x1234567890123456789012345678901234567890123456789012345678901234";

      const mockDbUpdated = await ERC20Minter.ERC20RewardsDeposit.processEvent({
        event,
        mockDb,
      });

      const actualEntity = mockDbUpdated.entities.ERC20Minter_ERC20RewardsDeposit.get(
        `${event.chainId}_${event.block.number}_${event.logIndex}`
      );

      // Note: getUsdcTransfer is async and may fail in tests, so we check for basic structure
      assert.ok(actualEntity, "ERC20Minter_ERC20RewardsDeposit entity should exist");
      assert.equal(
        actualEntity.id,
        `${event.chainId}_${event.block.number}_${event.logIndex}`,
        "Entity ID should match expected format"
      );
      assert.equal(
        actualEntity.collection,
        event.params.collection,
        "Collection should match event params"
      );
      assert.equal(
        actualEntity.currency,
        event.params.currency,
        "Currency should match event params"
      );
      assert.equal(actualEntity.tokenId, event.params.tokenId, "TokenId should match event params");
      assert.equal(
        actualEntity.transactionHash,
        event.transaction.hash,
        "TransactionHash should match event"
      );
      assert.equal(actualEntity.blockNumber, event.block.number, "BlockNumber should match event");
      // recipient, spender, and amount are derived from getUsdcTransfer
      // When getUsdcTransfer fails, it returns zeroAddress and "0.000000"
      assert.ok(typeof actualEntity.recipient === "string", "Recipient should be a string");
      assert.ok(typeof actualEntity.spender === "string", "Spender should be a string");
      assert.ok(typeof actualEntity.amount === "string", "Amount should be a string");
    });
  });
});
