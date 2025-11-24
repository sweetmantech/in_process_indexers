import { InProcessMoment_URI_event, HandlerContext, InProcess_Moments } from "generated";

async function getValidateExisitingEntity(
  event: InProcessMoment_URI_event,
  context: HandlerContext
): Promise<InProcess_Moments | undefined> {
  const collection = event.srcAddress.toLowerCase();
  const tokenId = Number(event.params.id);
  const entityId = `${collection}_${tokenId}_${event.chainId}`;

  const existingEntity = await context.InProcess_Moments.get(entityId);

  if (!existingEntity) {
    return undefined;
  }

  if (existingEntity.updated_at >= event.block.timestamp) {
    return undefined;
  }

  return existingEntity;
}

export default getValidateExisitingEntity;
