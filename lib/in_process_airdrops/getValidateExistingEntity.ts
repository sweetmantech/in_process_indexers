import {
  handlerContext,
  InProcess_Airdrops,
  InProcessMoment_TransferSingle_event,
} from "generated";

async function getValidateExistingEntity(
  event: InProcessMoment_TransferSingle_event,
  context: handlerContext
): Promise<InProcess_Airdrops> {
  const collection = event.srcAddress.toLowerCase();
  const entityId = `${collection}_${event.params.to}_${event.chainId}`;

  const existingEntity = await context.InProcess_Airdrops.get(entityId);

  if (!existingEntity) {
    return {
      id: entityId,
      recipient: event.params.to,
      collection,
      token_id: Number(event.params.id),
      amount: Number(event.params.value),
      chain_id: event.chainId,
    };
  }

  return {
    ...existingEntity,
    amount: existingEntity.amount + Number(event.params.value),
  };
}

export default getValidateExistingEntity;
