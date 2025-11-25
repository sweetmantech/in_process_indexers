import { InProcessMoment, InProcess_Collection_Admins, InProcess_Moment_Admins } from "generated";
import { FACTORY_ADDRESSES } from "../../lib/consts";
import { isExistingCollectionAdmin } from "../../lib/in_process_collection_admins/isExistingCollectionAdmin";
import { isExistingMomentAdmin } from "../../lib/in_process_moment_admins/isExistingMomentAdmin";

InProcessMoment.UpdatedPermissions.handler(
  async ({ event, context }) => {
    const entity: InProcess_Collection_Admins = {
      id: `${event.srcAddress.toLowerCase()}_${event.chainId}_${event.params.tokenId.toString()}_${event.params.user.toLowerCase()}`,
      collection: event.srcAddress.toLowerCase(),
      admin: event.params.user.toLowerCase(),
      chain_id: event.chainId,
      granted_at: event.block.timestamp,
    };

    if (FACTORY_ADDRESSES.includes(event.params.user.toLowerCase())) return;

    if (event.params.tokenId === BigInt(0)) {
      const existingEntity = await isExistingCollectionAdmin(entity, context);
      if (existingEntity) return;

      context.InProcess_Collection_Admins.set(entity);
    } else {
      const momentAdminEntity: InProcess_Moment_Admins = {
        ...entity,
        token_id: Number(event.params.tokenId),
      };
      const existingEntity = await isExistingMomentAdmin(momentAdminEntity, context);
      if (existingEntity) return;

      context.InProcess_Moment_Admins.set(momentAdminEntity);
    }
  },
  {
    eventFilters: {
      permissions: BigInt(2),
    },
  }
);
