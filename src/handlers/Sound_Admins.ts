import {
  SoundEditionV2_1,
  type Sound_Admins,
  type SoundEditionV2_1_RolesUpdated_handlerArgs,
} from "generated";
import { getLatestAdmin } from "@/lib/sound_admins/getLatestAdmin";

const ADMIN_ROLE = 1;

SoundEditionV2_1.RolesUpdated.handler(
  async ({ event, context }: SoundEditionV2_1_RolesUpdated_handlerArgs) => {
    const roles = Number(event.params.roles);
    const hasAdminRole = (roles & ADMIN_ROLE) !== 0;

    // MINTER_ROLE만 있고 ADMIN_ROLE 없는 경우 스킵 (minter 컨트랙트 노이즈 제외)
    if (!hasAdminRole && roles !== 0) return;

    const tokenId = BigInt(0); // Sound.xyz는 edition-level 권한만 존재
    const entity: Sound_Admins = {
      id: `${event.srcAddress.toLowerCase()}_${event.chainId}_${tokenId.toString()}_${event.params.user.toLowerCase()}`,
      collection: event.srcAddress.toLowerCase(),
      token_id: tokenId,
      admin: event.params.user.toLowerCase(),
      roles,
      chain_id: event.chainId,
      updated_at: event.block.timestamp,
    };

    const latestAdmin = await getLatestAdmin(entity, context);
    context.Sound_Admins.set(latestAdmin);
  }
);
