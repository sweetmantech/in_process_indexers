# InProcess Indexers — Project Knowledge

## Primary Sales

Both protocols use the unified `Primary_Sales` schema.

### InProcess/Zora

- Event: `SaleSet` from `InProcessCreatorFixedPriceSaleStrategy` or `InProcessERC20Minter`
- Fields: `sale_start`, `sale_end`, `max_tokens_per_address`, `price_per_token`, `funds_recipient`, `currency`
- Currency: ETH or ERC20 (dynamic)
- Handler: `src/handlers/In_Process_Sales.ts` → `lib/in_process_sales/getLatestSale.ts`

### Catalog

- Event: `MintConfigurationUpdated` from `USDCFixedPriceController`
- Fields: `price_per_token`, `funds_recipient`; `sale_start/end/max_tokens_per_address` set to defaults
- Currency: always USDC (hardcoded via `USDC_ADDRESSES`)
- Handler: `src/handlers/Catalog_Sales.ts` → `lib/catalog_sales/getLatestSale.ts`
- `MintConfigurationUpdated` handles **both initial setup and all updates** (no separate update event)

---

## Secondary Sales (Royalties)

Both protocols use the unified `Secondary_Sales` schema.
Entity ID format: `${collection}_${token_id}_${chainId}`

### InProcess/Zora

- Royalty is **contract-level** (tokenId=0) set via `SetupNewContract.defaultRoyaltyConfiguration`
- Tuple: `(uint32 royaltyMintSchedule, uint32 royaltyBPS, address royaltyRecipient)`
- `royaltyMintSchedule` is always zeroed out by the contract — not stored
- On `SetupNewToken`: copy tokenId=0 row to new tokenId (copy-down pattern)
- On `UpdatedRoyalties(tokenId=0)`: update contract base row only
- On `UpdatedRoyalties(tokenId=N)`: update/override that specific token row
- Primary (`funds_recipient`) and secondary (`royaltyRecipient`) are **independent addresses**
- Handler: `src/handlers/In_Process_Collections.ts` + `src/handlers/In_Process_Moments.ts`
- Events tracked in `config.yaml` under `InProcessMoment`: `UpdatedRoyalties(uint256 indexed tokenId, address indexed user, (uint32, uint32, address) configuration)`

### Catalog

- Royalty is **per-token**, same `fundsRecipient` used for both primary and secondary
- `royaltyBPS` is hardcoded at **1000 (10%)** in the contract
- `MintConfigurationUpdated` updates both `Primary_Sales` and `Secondary_Sales` simultaneously
- Primary and secondary recipient are **always the same address** — cannot be changed independently
- Handler: `src/handlers/Catalog_Sales.ts`

---

## Key Architectural Differences

|                     | InProcess/Zora                                    | Catalog                                   |
| ------------------- | ------------------------------------------------- | ----------------------------------------- |
| Primary recipient   | `SaleSet.funds_recipient`                         | `MintConfigurationUpdated.fundsRecipient` |
| Secondary recipient | `SetupNewContract.royaltyRecipient` (independent) | Same `fundsRecipient`                     |
| Can they differ?    | Yes                                               | No — always coupled                       |
| Secondary royalty % | Configurable                                      | Hardcoded 10%                             |
| Royalty level       | Contract-level default, per-token override        | Always per-token                          |
| Update events       | Separate events for primary/secondary             | Single event for both                     |

---

## Schema

```graphql
type Primary_Sales {
  id, collection, token_id, price_per_token, funds_recipient, currency,
  sale_start (nullable), sale_end (nullable), max_tokens_per_address (nullable),
  chain_id, transaction_hash, created_at
}

type Secondary_Sales {
  id, collection, token_id,
  royalty_recipient, royalty_bps,
  chain_id, updated_at, transaction_hash
}
```

## ERC-2981 Royalty Resolution (InProcess/Zora)

`CreatorRoyaltiesControl.getRoyalties(tokenId)`:

1. Returns token-specific royalty if `royaltyRecipient != address(0)`
2. Falls back to `CONTRACT_BASE_ID (tokenId=0)` default

---

## Codegen

Run after any `schema.graphql` change:

```
pnpm codegen
```

Generated types live in `generated/src/db/Entities.gen.ts`.
Type errors after schema changes are expected until codegen runs.
