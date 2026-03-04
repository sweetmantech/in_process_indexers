import assert from "assert";
import { TestHelpers } from "generated";
import type { Catalog_Collections, Catalog_Moments, Catalog_Sales } from "generated";
import { encodeFunctionData } from "viem";
import { crFactoryAbi } from "../lib/abi/crFactoryAbi";
import { USDC_ADDRESSES } from "../lib/consts";

const { MockDb, CatalogReleaseFactory, CatalogRelease1155, USDCFixedPriceController } = TestHelpers;

const COLLECTION = "0x1234567890123456789012345678901234567890";
const CREATOR = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const ARTIST = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

describe("Catalog Event Handler Tests", () => {
  describe("CatalogReleaseFactory.CRContractCreated", () => {
    it("should create Catalog_Collections entity with name decoded from calldata", async () => {
      const mockDb = MockDb.createMockDb();

      const collectionName = "My Catalog Release";
      const input = encodeFunctionData({
        abi: crFactoryAbi,
        functionName: "deployReleaseContractWithCalls",
        args: [ARTIST, CREATOR, "ipfs://contract-uri", collectionName, []],
      });

      const event = CatalogReleaseFactory.CRContractCreated.createMockEvent({
        _contractAddress: COLLECTION,
        _creator: CREATOR,
      });

      (event.transaction as { input: string }).input = input;

      const mockDbUpdated = await CatalogReleaseFactory.CRContractCreated.processEvent({
        event,
        mockDb,
      });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Collections.get(entityId);

      const expectedEntity: Catalog_Collections = {
        id: entityId,
        address: collection,
        name: collectionName,
        creator: CREATOR.toLowerCase(),
        uri: "",
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should store empty name when calldata cannot be decoded", async () => {
      const mockDb = MockDb.createMockDb();

      const event = CatalogReleaseFactory.CRContractCreated.createMockEvent({
        _contractAddress: COLLECTION,
        _creator: CREATOR,
      });

      (event.transaction as { input: string }).input = "0xdeadbeef";

      const mockDbUpdated = await CatalogReleaseFactory.CRContractCreated.processEvent({
        event,
        mockDb,
      });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Collections.get(entityId);

      assert.ok(actualEntity, "entity should exist");
      assert.equal(actualEntity.name, "", "name should be empty when calldata is undecodable");
    });
  });

  describe("CatalogRelease1155.URI (id = 0 — contract URI)", () => {
    it("should update Catalog_Collections uri", async () => {
      const newUri = "ipfs://updated-contract-uri";
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.URI.createMockEvent({
        value: newUri,
        id: 0n,
      });

      (event as { srcAddress: string }).srcAddress = COLLECTION;
      (event.block as { timestamp: number }).timestamp = 1000;

      const mockDb = MockDb.createMockDb().entities.Catalog_Collections.set({
        id: `${collection}_${event.chainId}`,
        address: collection,
        name: "My Release",
        creator: CREATOR.toLowerCase(),
        uri: "",
        chain_id: event.chainId,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      const mockDbUpdated = await CatalogRelease1155.URI.processEvent({ event, mockDb });

      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Collections.get(entityId);

      assert.ok(actualEntity, "entity should exist");
      assert.equal(actualEntity.uri, newUri, "uri should be updated");
      assert.equal(
        actualEntity.updated_at,
        event.block.timestamp,
        "updated_at should be refreshed"
      );
    });

    it("should not update if updated_at is more recent", async () => {
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.URI.createMockEvent({
        value: "ipfs://new-uri",
        id: 0n,
      });

      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const originalUri = "ipfs://original-uri";
      const futureTimestamp = event.block.timestamp + 9999;

      const mockDb = MockDb.createMockDb().entities.Catalog_Collections.set({
        id: `${collection}_${event.chainId}`,
        address: collection,
        name: "My Release",
        creator: CREATOR.toLowerCase(),
        uri: originalUri,
        chain_id: event.chainId,
        created_at: 0,
        updated_at: futureTimestamp,
        transaction_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      const mockDbUpdated = await CatalogRelease1155.URI.processEvent({ event, mockDb });

      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Collections.get(entityId);

      assert.equal(
        actualEntity?.uri,
        originalUri,
        "uri should not change when entity is more recent"
      );
    });
  });

  describe("CatalogRelease1155.TokenCreated", () => {
    it("should create Catalog_Moments entity correctly", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;
      const tokenUri = "ipfs://token-uri";

      const event = CatalogRelease1155.TokenCreated.createMockEvent({
        _tokenId: tokenId,
        _contract: COLLECTION,
        _artist: ARTIST,
        _uri: tokenUri,
        _contentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await CatalogRelease1155.TokenCreated.processEvent({ event, mockDb });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${tokenId}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Moments.get(entityId);

      const expectedEntity: Catalog_Moments = {
        id: entityId,
        collection,
        token_id: Number(tokenId),
        artist: ARTIST.toLowerCase(),
        uri: tokenUri,
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("CatalogRelease1155.URI (id > 0 — token URI)", () => {
    it("should update Catalog_Moments uri", async () => {
      const tokenId = 1n;
      const newUri = "ipfs://updated-token-uri";
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.URI.createMockEvent({
        value: newUri,
        id: tokenId,
      });

      (event as { srcAddress: string }).srcAddress = COLLECTION;
      (event.block as { timestamp: number }).timestamp = 1000;

      const mockDb = MockDb.createMockDb().entities.Catalog_Moments.set({
        id: `${collection}_${tokenId}_${event.chainId}`,
        collection,
        token_id: Number(tokenId),
        artist: ARTIST.toLowerCase(),
        uri: "ipfs://old-uri",
        chain_id: event.chainId,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      const mockDbUpdated = await CatalogRelease1155.URI.processEvent({ event, mockDb });

      const entityId = `${collection}_${tokenId}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Moments.get(entityId);

      assert.ok(actualEntity, "entity should exist");
      assert.equal(actualEntity.uri, newUri, "uri should be updated");
      assert.equal(
        actualEntity.updated_at,
        event.block.timestamp,
        "updated_at should be refreshed"
      );
    });
  });

  describe("USDCFixedPriceController.MintConfigurationUpdated", () => {
    it("should create Catalog_Sales entity correctly", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;
      const pricePerToken = 5_000_000n; // 5 USDC
      const fundsRecipient = "0x9999999999999999999999999999999999999999";

      const event = USDCFixedPriceController.MintConfigurationUpdated.createMockEvent({
        releaseContract: COLLECTION,
        tokenId,
        configuration: [pricePerToken, fundsRecipient],
      });

      const mockDbUpdated = await USDCFixedPriceController.MintConfigurationUpdated.processEvent({
        event,
        mockDb,
      });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${Number(tokenId)}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Sales.get(entityId);

      const expectedEntity: Catalog_Sales = {
        id: entityId,
        collection,
        token_id: Number(tokenId),
        price_per_token: pricePerToken,
        funds_recipient: fundsRecipient.toLowerCase(),
        currency: USDC_ADDRESSES[event.chainId] ?? "",
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should not overwrite a more recent Catalog_Sales entity", async () => {
      const tokenId = 1n;
      const collection = COLLECTION.toLowerCase();
      const originalPrice = 1_000_000n;

      const event = USDCFixedPriceController.MintConfigurationUpdated.createMockEvent({
        releaseContract: COLLECTION,
        tokenId,
        configuration: [5_000_000n, CREATOR],
      });

      const futureTimestamp = event.block.timestamp + 9999;

      const mockDb = MockDb.createMockDb().entities.Catalog_Sales.set({
        id: `${collection}_${Number(tokenId)}_${event.chainId}`,
        collection,
        token_id: Number(tokenId),
        price_per_token: originalPrice,
        funds_recipient: CREATOR.toLowerCase(),
        currency: USDC_ADDRESSES[event.chainId] ?? "",
        chain_id: event.chainId,
        created_at: futureTimestamp,
        transaction_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      const mockDbUpdated = await USDCFixedPriceController.MintConfigurationUpdated.processEvent({
        event,
        mockDb,
      });

      const entityId = `${collection}_${Number(tokenId)}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Sales.get(entityId);

      assert.equal(actualEntity?.price_per_token, originalPrice, "price should not change");
    });
  });
});
