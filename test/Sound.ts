import assert from "assert";
import { TestHelpers } from "generated";
import type { Sound_Editions, Sound_Tiers, Sound_Moments } from "generated";

const { MockDb, SoundCreatorV2, SoundEditionV2_1, SoundMetadata } = TestHelpers;

const EDITION = "0x38125f59663ad6b9f84efdb790dcde61692adec4";
const OWNER = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const CONTRACT_URI = "ar://contractHash/";
const TIER_FREE = 0;
const TIER_LIMITED = 1;
const FREE_BASE_URI = "ar://21xBOczDUFX0bg52sy34LDTO1Fro6mBGvd1FUYe0wvA";
const LIMITED_BASE_URI = "ar://yYH8g5Nt9bjK8B_qOk6R22K1rKkJMfPRuoMnbUhIQaI";

describe("Sound.xyz Handler Tests", () => {
  // ─────────────────────────────────────────────
  // Sound_Editions
  // ─────────────────────────────────────────────
  describe("SoundCreatorV2.Created", () => {
    it("should create Sound_Editions with owner", async () => {
      const mockDb = MockDb.createMockDb();

      const event = SoundCreatorV2.Created.createMockEvent({
        edition: EDITION,
        owner: OWNER,
      });

      const db = await SoundCreatorV2.Created.processEvent({ event, mockDb });

      const id = `${EDITION}_${event.chainId}`;
      const actual = await db.entities.Sound_Editions.get(id);

      const expected: Sound_Editions = {
        id,
        address: EDITION,
        name: "",
        owner: OWNER.toLowerCase(),
        uri: "",
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actual, expected);
    });
  });

  describe("SoundEditionV2_1.SoundEditionInitialized", () => {
    it("should fill name and uri, preserve owner from Created", async () => {
      const event = SoundCreatorV2.Created.createMockEvent({
        edition: EDITION,
        owner: OWNER,
      });

      const mockDb = await SoundCreatorV2.Created.processEvent({
        event,
        mockDb: MockDb.createMockDb(),
      });

      const initEvent = SoundEditionV2_1.SoundEditionInitialized.createMockEvent({
        // [name, symbol, metadataModule, baseURI, contractURI, fundingRecipient, royaltyBPS, isMetadataFrozen, isCreateTierFrozen, tierCreations[]]
        init: [
          "Test Album",
          "TA",
          "0x0000000000000000000000000000000000000000",
          "",
          CONTRACT_URI,
          OWNER as `0x${string}`,
          1000n,
          false,
          false,
          [],
        ],
        mockEventData: { srcAddress: EDITION },
      });

      const db = await SoundEditionV2_1.SoundEditionInitialized.processEvent({
        event: initEvent,
        mockDb,
      });

      const id = `${EDITION.toLowerCase()}_${initEvent.chainId}`;
      const actual = await db.entities.Sound_Editions.get(id);

      assert.equal(actual?.name, "Test Album");
      assert.equal(actual?.uri, CONTRACT_URI);
      assert.equal(actual?.owner, OWNER.toLowerCase());
    });
  });

  // ─────────────────────────────────────────────
  // Sound_Tiers
  // ─────────────────────────────────────────────
  describe("SoundMetadata.BaseURISet", () => {
    it("should create Sound_Tiers row with uri and quantity=0", async () => {
      const mockDb = MockDb.createMockDb();

      const event = SoundMetadata.BaseURISet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: BigInt(TIER_FREE),
        uri: FREE_BASE_URI,
      });

      const db = await SoundMetadata.BaseURISet.processEvent({ event, mockDb });

      const id = `${EDITION}_${TIER_FREE}_${event.chainId}`;
      const actual = await db.entities.Sound_Tiers.get(id);

      const expected: Sound_Tiers = {
        id,
        collection: EDITION,
        tier: TIER_FREE,
        uri: FREE_BASE_URI,
        quantity: 0n,
        chain_id: event.chainId,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actual, expected);
    });

    it("should preserve existing quantity when URI is updated", async () => {
      // Seed an existing tier with quantity=3
      const mockDb = MockDb.createMockDb().entities.Sound_Tiers.set({
        id: `${EDITION}_${TIER_FREE}_8453`,
        collection: EDITION,
        tier: TIER_FREE,
        uri: "ar://old/",
        quantity: 3n,
        chain_id: 8453,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const event = SoundMetadata.BaseURISet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: BigInt(TIER_FREE),
        uri: FREE_BASE_URI,
        mockEventData: { chainId: 8453 },
      });

      const db = await SoundMetadata.BaseURISet.processEvent({ event, mockDb });

      const id = `${EDITION}_${TIER_FREE}_8453`;
      const actual = await db.entities.Sound_Tiers.get(id);

      assert.equal(actual?.uri, FREE_BASE_URI);
      assert.equal(actual?.quantity, 3n); // preserved
    });
  });

  // ─────────────────────────────────────────────
  // Sound_Moments
  // ─────────────────────────────────────────────
  describe("SoundEditionV2_1.Minted", () => {
    it("should create one Sound_Moments row per tokenId in batch", async () => {
      // Seed tier URI cache
      const mockDb = MockDb.createMockDb().entities.Sound_Tiers.set({
        id: `${EDITION.toLowerCase()}_${TIER_LIMITED}_8453`,
        collection: EDITION.toLowerCase(),
        tier: TIER_LIMITED,
        uri: LIMITED_BASE_URI,
        quantity: 0n,
        chain_id: 8453,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const event = SoundEditionV2_1.Minted.createMockEvent({
        tier: BigInt(TIER_LIMITED),
        to: OWNER as `0x${string}`,
        quantity: 3n,
        fromTokenId: 1n,
        mockEventData: { srcAddress: EDITION, chainId: 8453 },
      });

      const db = await SoundEditionV2_1.Minted.processEvent({ event, mockDb });

      // tokenId 1, 2, 3 should be created
      for (let i = 1n; i <= 3n; i++) {
        const id = `${EDITION.toLowerCase()}_${i}_8453`;
        const actual = await db.entities.Sound_Moments.get(id);

        const expected: Sound_Moments = {
          id,
          collection: EDITION.toLowerCase(),
          token_id: i,
          uri: `${LIMITED_BASE_URI}/${i}`, // 1-indexed position within tier
          chain_id: 8453,
          created_at: event.block.timestamp,
          updated_at: event.block.timestamp,
          transaction_hash: event.transaction.hash,
        };

        assert.deepEqual(actual, expected, `token ${i} should match`);
      }
    });

    it("should continue tier index from existing quantity", async () => {
      // 3 tokens already minted in limited tier
      const mockDb = MockDb.createMockDb().entities.Sound_Tiers.set({
        id: `${EDITION.toLowerCase()}_${TIER_LIMITED}_8453`,
        collection: EDITION.toLowerCase(),
        tier: TIER_LIMITED,
        uri: LIMITED_BASE_URI,
        quantity: 3n,
        chain_id: 8453,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const event = SoundEditionV2_1.Minted.createMockEvent({
        tier: BigInt(TIER_LIMITED),
        to: OWNER as `0x${string}`,
        quantity: 2n,
        fromTokenId: 4n,
        mockEventData: { srcAddress: EDITION, chainId: 8453 },
      });

      const db = await SoundEditionV2_1.Minted.processEvent({ event, mockDb });

      const token4 = await db.entities.Sound_Moments.get(`${EDITION.toLowerCase()}_4_8453`);
      const token5 = await db.entities.Sound_Moments.get(`${EDITION.toLowerCase()}_5_8453`);

      assert.equal(token4?.uri, `${LIMITED_BASE_URI}/4`); // 3 + 0 + 1
      assert.equal(token5?.uri, `${LIMITED_BASE_URI}/5`); // 3 + 1 + 1
    });

    it("should update Sound_Tiers.quantity after mint", async () => {
      const mockDb = MockDb.createMockDb().entities.Sound_Tiers.set({
        id: `${EDITION.toLowerCase()}_${TIER_FREE}_8453`,
        collection: EDITION.toLowerCase(),
        tier: TIER_FREE,
        uri: FREE_BASE_URI,
        quantity: 6n,
        chain_id: 8453,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const event = SoundEditionV2_1.Minted.createMockEvent({
        tier: BigInt(TIER_FREE),
        to: OWNER as `0x${string}`,
        quantity: 3n,
        fromTokenId: 7n,
        mockEventData: { srcAddress: EDITION, chainId: 8453 },
      });

      const db = await SoundEditionV2_1.Minted.processEvent({ event, mockDb });

      const tier = await db.entities.Sound_Tiers.get(`${EDITION.toLowerCase()}_${TIER_FREE}_8453`);
      assert.equal(tier?.quantity, 9n); // 6 + 3
    });

    it("should set empty uri when no tier URI is set yet", async () => {
      const mockDb = MockDb.createMockDb();

      const event = SoundEditionV2_1.Minted.createMockEvent({
        tier: BigInt(TIER_FREE),
        to: OWNER as `0x${string}`,
        quantity: 1n,
        fromTokenId: 1n,
        mockEventData: { srcAddress: EDITION, chainId: 8453 },
      });

      const db = await SoundEditionV2_1.Minted.processEvent({ event, mockDb });

      const token = await db.entities.Sound_Moments.get(`${EDITION.toLowerCase()}_1_8453`);
      assert.equal(token?.uri, "");
    });
  });
});
