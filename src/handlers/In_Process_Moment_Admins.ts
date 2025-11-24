import { InProcessMoment, InProcess_Moment_Admins } from "generated";

InProcessMoment.UpdatedPermissions.handler(
  async ({ event, context }) => {
    const entity: InProcess_Moment_Admins = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: Number(event.params.tokenId),
      admin: event.params.user.toLowerCase(),
      chain_id: event.chainId,
      granted_at: event.block.timestamp,
    };
    context.InProcess_Moment_Admins.set(entity);
  },
  {
    eventFilters: {
      permissions: BigInt(2),
    },
  }
);
