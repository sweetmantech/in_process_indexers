import { handlerContext, InProcess_Collection_Admins } from "generated";

/**
 * Checks for existence of an InProcess_Collection_Admins entity for a given collection, admin, and chain_id.
 *
 * @param entity - The InProcess_Collection_Admins entity to check
 * @param context - The storage context containing InProcess_Collection_Admins
 * @returns True if the entity exists, false otherwise
 */
export async function isExistingCollectionAdmin(
  entity: InProcess_Collection_Admins,
  context: handlerContext
) {
  const entityId = entity.id;
  const existingEntity = await context.InProcess_Collection_Admins.get(entityId);

  return !!existingEntity;
}
