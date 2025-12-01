import { InProcessMoment, InProcess_Moments } from "generated";
import getValidateExistingEntity from "@/lib/in_process_moments/getValidateExistingEntity";

InProcessMoment.SetupNewToken.handler(async ({ event, context }) => {
  const collection = event.srcAddress.toLowerCase();
  const chainId = event.chainId;
  const tokenId = Number(event.params.tokenId);
  const entityId = `${collection}_${tokenId}_${chainId}`;
  const entity: InProcess_Moments = {
    id: entityId,
    collection,
    token_id: tokenId,
    max_supply: event.params.maxSupply,
    uri: event.params.newURI,
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
  context.InProcess_Moments.set(entity);
});

InProcessMoment.URI.handler(async ({ event, context }) => {
  const existingEntity = await getValidateExistingEntity(event, context);

  if (!existingEntity) return;

  const entity: InProcess_Moments = {
    ...existingEntity,
    updated_at: event.block.timestamp,
    uri: event.params.value,
  };
  context.InProcess_Moments.set(entity);
});
