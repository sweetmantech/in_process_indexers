import { InProcessMoment, InProcess_Admins } from "generated";
import { FACTORY_ADDRESSES } from "@/lib/consts";
import { getLatestAdmin } from "@/lib/in_process_admins/getLatestAdmin";

InProcessMoment.UpdatedPermissions.handler(
  async ({ event, context }) => {
    const entity: InProcess_Admins = {
      id: `${event.srcAddress.toLowerCase()}_${event.chainId}_${event.params.tokenId.toString()}_${event.params.user.toLowerCase()}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: Number(event.params.tokenId),
      admin: event.params.user.toLowerCase(),
      chain_id: event.chainId,
      permission: Number(event.params.permissions),
      updated_at: event.block.timestamp,
    };

    if (FACTORY_ADDRESSES.includes(event.params.user.toLowerCase())) return;

    const latestAdmin = await getLatestAdmin(entity, context);

    context.InProcess_Admins.set(latestAdmin);
  },
  {
    eventFilters: [
      {
        permissions: BigInt(2),
      },
      {
        permissions: BigInt(0),
      },
    ],
  }
);
