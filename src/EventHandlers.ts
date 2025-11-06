/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { ERC20Minter, ERC20Minter_MintComment, ERC20Minter_ERC20RewardsDeposit, CreatorFactory, CreatorFactory_SetupNewContract } from "generated";
import getUsdcTransfer from "../lib/getUsdcTransfer";

ERC20Minter.MintComment.handler(async ({ event, context }) => {
  const entity: ERC20Minter_MintComment = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    tokenContract: event.params.tokenContract.toLowerCase(),
    tokenId: event.params.tokenId.toString(),
    comment: event.params.comment,
    transactionHash: event.transaction.hash,
    timestamp: event.block.timestamp,
    chainId: event.chainId
  };

  context.ERC20Minter_MintComment.set(entity);
});
CreatorFactory.SetupNewContract.handler(async ({ event, context }) => {
  const entity: CreatorFactory_SetupNewContract = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    address: event.params.newContract,
    contractURI: event.params.contractURI,
    defaultAdmin: event.params.defaultAdmin,
    chainId: event.chainId,
    transactionHash: event.transaction.hash,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
  };
  context.CreatorFactory_SetupNewContract.set(entity);
});
ERC20Minter.ERC20RewardsDeposit.handler(async ({ event, context }) => {
  const usdcTransfer = await getUsdcTransfer(event);

  const entity: ERC20Minter_ERC20RewardsDeposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    collection: event.params.collection,
    currency: event.params.currency,
    tokenId: event.params.tokenId,
    recipient: usdcTransfer.recipient,
    spender: usdcTransfer.spender,
    amount: usdcTransfer.amount,
    transactionHash: event.transaction.hash,
    blockNumber: event.block.number,
  };

  context.ERC20Minter_ERC20RewardsDeposit.set(entity);
});
