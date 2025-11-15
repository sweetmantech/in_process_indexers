/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { ERC20Minter, ERC20Minter_MintComment, ERC20Minter_ERC20RewardsDeposit, CreatorFactory, CreatorFactory_SetupNewContract, ERC1155, ERC1155_UpdatedPermissions } from "generated";
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
    address: event.params.newContract.toLowerCase(),
    contractURI: event.params.contractURI,
    defaultAdmin: event.params.defaultAdmin.toLowerCase(),
    payoutRecipient: event.params.defaultRoyaltyConfiguration[2].toLowerCase(),
    chainId: event.chainId,
    transactionHash: event.transaction.hash,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
  };
  context.CreatorFactory_SetupNewContract.set(entity);
});

ERC1155.UpdatedPermissions.handler(async ({ event, context }) => {
  const entity: ERC1155_UpdatedPermissions = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    tokenContract: event.srcAddress.toLowerCase(),
    tokenId: Number(event.params.tokenId),
    user: event.params.user.toLowerCase(),
    permissions: Number(event.params.permissions),
    chainId: event.chainId,
  };
  context.ERC1155_UpdatedPermissions.set(entity);
}, {
  wildcard: true,
  eventFilters: {
    permissions: BigInt(2),
  }
});

ERC20Minter.ERC20RewardsDeposit.handler(async ({ event, context }) => {
  const usdcTransfer = await getUsdcTransfer(event);
  const entity: ERC20Minter_ERC20RewardsDeposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    collection: event.params.collection,
    currency: event.params.currency,
    tokenId: event.params.tokenId,
    chainId: event.chainId,
    recipient: usdcTransfer.recipient,
    spender: usdcTransfer.spender,
    amount: usdcTransfer.amount,
    transactionHash: event.transaction.hash,
    blockNumber: event.block.number,
  };

  context.ERC20Minter_ERC20RewardsDeposit.set(entity);
});
