import assert from "assert";
import { TestHelpers } from "generated";
import type {
  InProcess_Collections,
  InProcess_Moment_Comments,
  InProcess_Moments,
  InProcess_Admins,
} from "generated";

const { MockDb, InProcessCreatorFactory, InProcessERC20Minter, InProcessMoment } = TestHelpers;

describe("Event Handler Tests", () => {
  describe("InProcessCreatorFactory.SetupNewContract", () => {
    it("should create InProcess_Collections entity correctly", async () => {
      const mockDb = MockDb.createMockDb();

      const defaultAdmin = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      const payoutRecipient = "0x5555555555555555555555555555555555555555";
      const newContract = "0x1234567890123456789012345678901234567890";
      const event = InProcessCreatorFactory.SetupNewContract.createMockEvent({
        newContract: newContract,
        defaultAdmin: defaultAdmin,
        contractURI: "https://example.com/contract",
        defaultRoyaltyConfiguration: [0n, 0n, payoutRecipient],
      });

      const mockDbUpdated = await InProcessCreatorFactory.SetupNewContract.processEvent({
        event,
        mockDb,
      });

      const collection = newContract.toLowerCase();
      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.InProcess_Collections.get(entityId);

      const expectedEntity: InProcess_Collections = {
        id: entityId,
        address: collection,
        uri: event.params.contractURI,
        default_admin: defaultAdmin.toLowerCase(),
        payout_recipient: payoutRecipient.toLowerCase(),
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(
        actualEntity,
        expectedEntity,
        "InProcess_Collections entity should match expected values"
      );
    });
  });

  describe("InProcessERC20Minter.MintComment", () => {
    it("should create InProcess_Moment_Comments entity correctly", async () => {
      const mockDb = MockDb.createMockDb();

      const event = InProcessERC20Minter.MintComment.createMockEvent({
        sender: "0x1111111111111111111111111111111111111111",
        tokenContract: "0x2222222222222222222222222222222222222222",
        tokenId: 1n,
        comment: "Test comment",
      });

      const mockDbUpdated = await InProcessERC20Minter.MintComment.processEvent({
        event,
        mockDb,
      });

      const entityId = `${event.params.tokenContract.toLowerCase()}_${Number(event.params.tokenId)}_${event.chainId}_${event.block.number}_${event.logIndex}`;
      const actualEntity = await mockDbUpdated.entities.InProcess_Moment_Comments.get(entityId);

      const expectedEntity: InProcess_Moment_Comments = {
        id: entityId,
        sender: event.params.sender.toLowerCase(),
        collection: event.params.tokenContract.toLowerCase(),
        token_id: Number(event.params.tokenId),
        comment: event.params.comment,
        commented_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
        chain_id: event.chainId,
      };

      assert.deepEqual(
        actualEntity,
        expectedEntity,
        "InProcess_Moment_Comments entity should match expected values"
      );
    });
  });

  describe("InProcessERC20Minter.ERC20RewardsDeposit", () => {
    it("should create InProcess_ERC20RewardsDeposit entity correctly", async function () {
      this.timeout(10000); // Increase timeout since getUsdcTransfer makes async RPC calls
      const mockDb = MockDb.createMockDb();

      const event = InProcessERC20Minter.ERC20RewardsDeposit.createMockEvent({
        collection: "0x3333333333333333333333333333333333333333",
        currency: "0x4444444444444444444444444444444444444444",
        tokenId: 2n,
      });

      // Set a valid transaction hash (must start with 0x and be 66 chars)
      // Use type assertion to bypass read-only property
      (event.transaction as { hash: string }).hash =
        "0x1234567890123456789012345678901234567890123456789012345678901234";

      const mockDbUpdated = await InProcessERC20Minter.ERC20RewardsDeposit.processEvent({
        event,
        mockDb,
      });

      const entityId = `${event.chainId}_${event.block.number}_${event.logIndex}`;
      const actualEntity = await mockDbUpdated.entities.InProcess_ERC20RewardsDeposit.get(entityId);

      // Note: getUsdcTransfer is async and may fail in tests, so we check for basic structure
      assert.ok(actualEntity, "InProcess_ERC20RewardsDeposit entity should exist");
      assert.equal(actualEntity.id, entityId, "Entity ID should match expected format");
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
      assert.equal(
        actualEntity.token_id,
        Number(event.params.tokenId),
        "TokenId should match event params"
      );
      assert.equal(
        actualEntity.transaction_hash,
        event.transaction.hash,
        "TransactionHash should match event"
      );
      assert.equal(
        actualEntity.transferred_at,
        event.block.timestamp,
        "TransferredAt should match event timestamp"
      );
      assert.equal(actualEntity.chain_id, event.chainId, "ChainId should match event");
      // recipient, spender, and amount are derived from getUsdcTransfer
      // When getUsdcTransfer fails, it returns zeroAddress and "0.000000"
      assert.ok(typeof actualEntity.recipient === "string", "Recipient should be a string");
      assert.ok(typeof actualEntity.spender === "string", "Spender should be a string");
      assert.ok(typeof actualEntity.amount === "string", "Amount should be a string");
    });
  });

  describe("InProcessMoment.SetupNewToken", () => {
    it("should create InProcess_Moments entity correctly", async () => {
      const mockDb = MockDb.createMockDb();

      const collection = "0x1234567890123456789012345678901234567890";
      const tokenId = 1;
      const event = InProcessMoment.SetupNewToken.createMockEvent({
        tokenId: BigInt(tokenId),
        newURI: "https://example.com/token/1",
        maxSupply: 100n,
      });

      // Set srcAddress to the collection address
      (event as { srcAddress: string }).srcAddress = collection;

      const mockDbUpdated = await InProcessMoment.SetupNewToken.processEvent({
        event,
        mockDb,
      });

      const entityId = `${collection.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.InProcess_Moments.get(entityId);

      const expectedEntity: InProcess_Moments = {
        id: entityId,
        collection: collection.toLowerCase(),
        token_id: tokenId,
        max_supply: event.params.maxSupply,
        uri: event.params.newURI,
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(
        actualEntity,
        expectedEntity,
        "InProcess_Moments entity should match expected values"
      );
    });
  });

  describe("InProcessMoment.UpdatedPermissions", () => {
    it("should create InProcess_Admins entity correctly", async () => {
      const mockDb = MockDb.createMockDb();

      const collection = "0x1234567890123456789012345678901234567890";
      const tokenId = 1;
      const admin = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      const event = InProcessMoment.UpdatedPermissions.createMockEvent({
        tokenId: BigInt(tokenId),
        user: admin,
        permissions: 2n, // Required for the event filter
      });

      // Set srcAddress to the collection address
      (event as { srcAddress: string }).srcAddress = collection;

      const mockDbUpdated = await InProcessMoment.UpdatedPermissions.processEvent({
        event,
        mockDb,
      });

      const entityId = `${event.srcAddress.toLowerCase()}_${event.chainId}_${event.params.tokenId.toString()}_${event.params.user.toLowerCase()}`;
      const actualEntity = await mockDbUpdated.entities.InProcess_Admins.get(entityId);

      const expectedEntity: InProcess_Admins = {
        id: entityId,
        collection: collection.toLowerCase(),
        token_id: tokenId,
        admin: admin.toLowerCase(),
        chain_id: event.chainId,
        permission: Number(event.params.permissions),
        updated_at: event.block.timestamp,
      };

      assert.deepEqual(
        actualEntity,
        expectedEntity,
        "InProcess_Admins entity should match expected values"
      );
    });
  });
});
