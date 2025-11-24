import { InProcessCreatorFactory, InProcessMoment, InProcess_Collections } from "generated";
import getValidateExistingEntity from "../../lib/in_process_collections/getValidateExistingEntity";

// Register ERC1155 contracts dynamically when they're created by the factory
InProcessCreatorFactory.SetupNewContract.contractRegister(({ event, context }) => {
  // Register the new ERC1155 contract using its address from the event
  context.addInProcessMoment(event.params.newContract);
});

InProcessCreatorFactory.SetupNewContract.handler(async ({ event, context }) => {
  const collection = event.params.newContract.toLowerCase();
  const entity: InProcess_Collections = {
    id: `${collection}_${event.chainId}`,
    address: collection,
    uri: event.params.contractURI,
    default_admin: event.params.defaultAdmin.toLowerCase(),
    payout_recipient: event.params.defaultRoyaltyConfiguration[2].toLowerCase(),
    chain_id: event.chainId,
    created_at: event.block.timestamp,
    updated_at: event.block.timestamp,
    transaction_hash: event.transaction.hash,
  };
  context.InProcess_Collections.set(entity);
});

InProcessMoment.ContractMetadataUpdated.handler(async ({ event, context }) => {
  if (event.params.uri === "") return;

  const existingEntity = await getValidateExistingEntity(event, context);

  if (!existingEntity) {
    return;
  }

  const entity: InProcess_Collections = {
    ...existingEntity,
    updated_at: event.block.timestamp,
    uri: event.params.uri,
  };
  context.InProcess_Collections.set(entity);
});
