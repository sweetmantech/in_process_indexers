import {
  CatalogRelease1155,
  type CatalogRelease1155_TokenPurchased_handlerArgs,
  type Collectors,
} from "generated";

CatalogRelease1155.TokenPurchased.handler(
  async ({ event, context }: CatalogRelease1155_TokenPurchased_handlerArgs) => {
    const collectEntity: Collectors = {
      id: `${event.srcAddress.toLowerCase()}_${event.params.tokenId.toString()}_${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: event.params.tokenId,
      amount: event.params.amount,
      chain_id: event.chainId,
      collector: event.params.buyer.toLowerCase(),
      transaction_hash: event.transaction.hash,
      collected_at: event.block.timestamp,
    };

    context.Collectors.set(collectEntity);
  }
);
