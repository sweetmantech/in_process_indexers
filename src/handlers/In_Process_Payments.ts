import { InProcessERC20Minter, InProcessMoment, InProcess_Payments } from "generated";
import getUsdcTransfer from "@/lib/getUsdcTransfer";
import { formatEther, zeroAddress } from "viem";
import extractPurchaseRecipientAndComment from "@/lib/extractPurchaseRecipientAndComment";

InProcessERC20Minter.ERC20RewardsDeposit.handler(async ({ event, context }) => {
  const usdcTransfer = await getUsdcTransfer(event);
  const entity: InProcess_Payments = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    collection: event.params.collection,
    currency: event.params.currency,
    token_id: Number(event.params.tokenId),
    chain_id: event.chainId,
    recipient: usdcTransfer.recipient,
    spender: usdcTransfer.spender,
    amount: usdcTransfer.amount,
    transaction_hash: event.transaction.hash,
    transferred_at: event.block.timestamp,
  };

  context.InProcess_Payments.set(entity);
});

InProcessMoment.Purchased.handler(async ({ event, context }) => {
  const { recipient, mintComment } = await extractPurchaseRecipientAndComment(event);

  if (mintComment) {
    context.InProcess_Moment_Comments.set(mintComment);
  }

  const entity: InProcess_Payments = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    collection: event.srcAddress.toLowerCase(),
    currency: zeroAddress,
    token_id: Number(event.params.tokenId),
    amount: formatEther(event.params.value),
    spender: event.params.sender.toLowerCase(),
    recipient: recipient.toLowerCase(),
    chain_id: event.chainId,
    transaction_hash: event.transaction.hash,
    transferred_at: event.block.timestamp,
  };

  if (event.params.value === BigInt(0) || recipient === zeroAddress) return;
  context.InProcess_Payments.set(entity);
});
