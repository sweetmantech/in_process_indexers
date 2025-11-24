import { InProcess_Collections } from "generated";

async function getValidatedExistingEntity(
  event: { srcAddress: string; chainId: number; block: { timestamp: number } },
  context: {
    InProcess_Collections: { get: (id: string) => Promise<InProcess_Collections | undefined> };
  }
): Promise<InProcess_Collections | undefined> {
  const collection = event.srcAddress.toLowerCase();
  const entityId = `${collection}_${event.chainId}`;

  const existingEntity = await context.InProcess_Collections.get(entityId);

  if (!existingEntity) {
    return undefined;
  }

  if (existingEntity.updated_at >= event.block.timestamp) {
    return undefined;
  }

  return existingEntity;
}

export default getValidatedExistingEntity;
