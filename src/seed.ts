import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";

import { BigNumber } from "@ethersproject/bignumber";
import axios from "axios";

const prisma = new PrismaClient();

async function main() {
  const url =
    "https://eth-mainnet.g.alchemy.com/v2/jCDsAl8JhBC4dmHzidPbiVRUioW5GcBa";
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const body = {
    id: 1,
    jsonrpc: "2.0",
    method: "alchemy_getAssetTransfers",
    params: [
      {
        fromBlock: "0x0",
        toBlock: "latest",
        toAddress: "0x00000000219ab540356cBB839Cbe05303d7705Fa", // Beacon Deposit Contract address
        withMetadata: false,
        excludeZeroValue: true,
        maxCount: "0x3e8", // maximum number of transactions
        category: ["external"],
      },
    ],
  };

  try {
    const response = await axios.post(url, body, { headers });

    const data = response.data;

    if (data && data.result && data.result.transfers) {
      // Get the latest 5 transactions
      const latest5Transactions = data.result.transfers.slice(0, 5);

      // Log the transactions
      console.log(latest5Transactions);

      // Seed each transaction into the database
      for (const tx of latest5Transactions) {
        const deposit = {
          blockNumber: tx.blockNum ? parseInt(tx.blockNum, 16) : null,
          blockTimestamp: tx.metadata?.blockTimestamp
            ? new Date(tx.metadata.blockTimestamp).getTime() / 1000
            : null,
          hash: tx.hash || "Unknown",
          fromAddress: tx.from || "Unknown",
          value: tx.value ? ethers.formatUnits(tx.value, "ether") : "0",
          pubKey: tx.rawContract?.input
            ? "0x" + tx.rawContract.input.slice(64, 160)
            : "0xDummyPublicKey", // Dummy public key if not available
          fee:
            tx.gasPrice && tx.gas
              ? BigNumber.from(tx.gasPrice).mul(tx.gas).toString()
              : "0", // Default fee to "0" if not available
        };

        console.log("updated each txn: ", deposit);
        // await prisma.deposit.create({ data: deposit });
      }

      console.log("Seeding completed.");
    } else {
      console.log("No transactions found.");
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
