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

---

## Admin Permissions

Both protocols track who has admin rights on a contract/token via events.
Entity ID format: `${collection}_${chainId}_${tokenId}_${user}`

### InProcess/Zora

- Contract: `ZoraCreator1155Impl` (inherits `CreatorPermissionControl`)
- Event: `UpdatedPermissions(uint256 indexed tokenId, address indexed user, uint256 indexed permissions)`
- Permission bits (power of 2):
  - `PERMISSION_BIT_ADMIN = 2` — full control, can manage all other roles
  - `PERMISSION_BIT_MINTER = 4` — `adminMint`, `setupNewToken`
  - `PERMISSION_BIT_SALES = 8` — `callSale` (configure sale strategies)
  - `PERMISSION_BIT_METADATA = 16` — update URIs, metadata, renderer
  - `PERMISSION_BIT_FUNDS_MANAGER = 32` — `setFundsRecipient`, `withdraw`
- `tokenId=0` = contract-level permission; `tokenId=N` = token-specific
- Contract-level ADMIN implicitly passes all token-level checks
- Handler filters: `permissions=2` (ADMIN grant) and `permissions=0` (removal)
- Handler: `src/handlers/In_Process_Admins.ts` → `lib/in_process_admins/getLatestAdmin.ts`
- Schema: `InProcess_Admins` — field `permission: Int`

### Catalog

- Contract: `CR1155Implementation` (inherits `PermissionController`)
- Two separate events:
  - `ContractPermissionsUpdated(address indexed user, uint256 authScope)` — contract-level, no tokenId → stored as `token_id=0`
  - `TokenPermissionsUpdated(uint256 indexed tokenId, address indexed user, uint256 authScope)` — token-level
- Auth scope bit flags:
  - `AUTH_SCOPE_OWNER = 1` — full control incl. `updateContractURI`, managing other permissions
  - `AUTH_SCOPE_ARTIST = 2` — `setupToken`, mint, configure sales/payout/URI, withdraw; can also manage permissions
  - `AUTH_SCOPE_MANAGER = 4` — `setupToken`, configure sales/referral, upgrade; **cannot** mint admin, update payout, or manage permissions
- Combined scopes possible (e.g. `OWNER|ARTIST = 3`)
- On init: `_artist` gets `OWNER|ARTIST (3)`, `catalogAdmin` gets `OWNER (1)`, `_operator` becomes Ownable owner
- Multiple addresses can hold the same scope on the same token
- `removeSingleContractAuthScope` removes one bit at a time → `authScope` can be any intermediate value
- `authScope=0` means all permissions revoked (record kept, value set to 0)
- Handler: `src/handlers/Catalog_Admins.ts` → `lib/catalog_admins/getLatestAdmin.ts`
- Schema: `Catalog_Admins` — field `auth_scope: Int`

### Removal Tracking (both protocols)

| Protocol       | Removal indicator | Record deleted?   |
| -------------- | ----------------- | ----------------- |
| InProcess/Zora | `permissions = 0` | No — updated to 0 |
| Catalog        | `authScope = 0`   | No — updated to 0 |

Query active admins: `permission != 0` / `auth_scope != 0`

### Admin Architecture Comparison

|                            | InProcess/Zora                       | Catalog                                         |
| -------------------------- | ------------------------------------ | ----------------------------------------------- |
| Roles                      | 5 fine-grained bits                  | 3 broad scopes                                  |
| "Super admin"              | `PERMISSION_BIT_ADMIN (2)`           | `AUTH_SCOPE_OWNER (1)`                          |
| Contract-level event       | `UpdatedPermissions(tokenId=0, ...)` | `ContractPermissionsUpdated(user, scope)`       |
| Token-level event          | `UpdatedPermissions(tokenId=N, ...)` | `TokenPermissionsUpdated(tokenId, user, scope)` |
| Who can manage permissions | ADMIN only                           | OWNER or ARTIST                                 |
| Funds/withdraw role        | Separate `FUNDS_MANAGER`             | Any OWNER or ARTIST                             |

---

## Codegen

Run after any `schema.graphql` change:

```bash
pnpm codegen
```

Generated types live in `generated/src/db/Entities.gen.ts`.
Type errors after schema changes are expected until codegen runs.
