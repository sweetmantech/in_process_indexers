import getValidateExistingEntity from "@/lib/in_process_airdrops/getValidateExistingEntity";
import { InProcessMoment } from "generated";
import { zeroAddress } from "viem";

InProcessMoment.TransferSingle.handler(
  async ({ event, context }) => {
    const entity = await getValidateExistingEntity(event, context);
    context.InProcess_Airdrops.set(entity);
  },
  {
    eventFilters: [
      {
        from: zeroAddress,
      },
    ],
  }
);
