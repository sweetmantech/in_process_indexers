import { handlerContext, InProcess_Moment_Admins } from "generated";

/**
 * Checks for existence of an InProcess_Moment_Admins entity for a given collection, admin, and chain_id.
 *
 * @param entity - The InProcess_Moment_Admins entity to check
 * @param context - The storage context containing InProcess_Moment_Admins
 * @returns True if the entity exists, false otherwise
 */
export async function isExistingMomentAdmin(
  entity: InProcess_Moment_Admins,
  context: handlerContext
) {
  const existingEntity = await context.InProcess_Moment_Admins.get(entity.id);

  if (existingEntity) return true;

  return false;
}
