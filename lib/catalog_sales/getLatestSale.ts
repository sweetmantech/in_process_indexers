import {
  handlerContext,
  Catalog_Sales,
  USDCFixedPriceController_MintConfigurationUpdated_event,
} from "generated";
import { USDC_ADDRESSES } from "@/lib/consts";

async function getLatestSale(
  event: USDCFixedPriceController_MintConfigurationUpdated_event,
  context: handlerContext
): Promise<Catalog_Sales> {
  const collection = event.params.releaseContract.toLowerCase();
  const tokenId = Number(event.params.tokenId);
  const entityId = `${collection}_${tokenId}_${event.chainId}`;

  const existingEntity = await context.Catalog_Sales.get(entityId);

  const newEntity: Catalog_Sales = {
    id: entityId,
    collection,
    token_id: tokenId,
    price_per_token: event.params.configuration[0],
    funds_recipient: event.params.configuration[1].toLowerCase(),
    currency: USDC_ADDRESSES[event.chainId] ?? "",
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };

  if (!existingEntity) return newEntity;
  if (existingEntity.created_at >= event.block.timestamp) return existingEntity;

  return newEntity;
}

export default getLatestSale;
