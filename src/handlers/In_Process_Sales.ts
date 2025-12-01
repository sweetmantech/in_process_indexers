import { InProcessCreatorFixedPriceSaleStrategy, InProcessERC20Minter } from "generated";
import getLatestSale from "@/lib/in_process_sales/getLatestSale";

InProcessERC20Minter.SaleSet.handler(async ({ event, context }) => {
  const latestSale = await getLatestSale(event, context);
  context.InProcess_Sales.set(latestSale);
});

InProcessCreatorFixedPriceSaleStrategy.SaleSet.handler(async ({ event, context }) => {
  const latestSale = await getLatestSale(event, context);
  context.InProcess_Sales.set(latestSale);
});
