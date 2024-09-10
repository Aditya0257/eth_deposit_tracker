import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import axios from "axios";
import "dotenv/config";
import { BigNumber } from "@ethersproject/bignumber";

const app = express();
const port = 3000;

const BEACON_DEPOSIT_CONTRACT =
  "0x00000000219ab540356cBB839Cbe05303d7705Fa".toLowerCase();
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_BASE_URL = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;

const prisma = new PrismaClient();

app.use(express.json());

// interface TransactionData {
//   blockNumber: number;
//   hash: string;
//   fromAddress: string;
//   value: string;
//   input: string;
//   gasPrice: string;
//   gas: string;
// }

type TransactionData = any;

// interface Deposit {
//   blockNumber: number;
//   blockTimestamp: number;
//   hash: string;
//   fromAddress: string;
//   value: string;
//   pubKey: string;
//   fee: string;
// }

type Deposit = any;

// interface WebhookEvent {
//   event: {
//     activity: {
//       toAddress: string;
//       hash: string;
//       blockNum: string;
//       fromAddress: string;
//       value: string;
//     }[];
//     createdAt: string;
//   };
// }

type WebhookEvent = any;

async function getTransactionData(txHash: string): Promise<TransactionData> {
  const response = await axios.post(ALCHEMY_BASE_URL, {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getTransactionByHash",
    params: [txHash],
  });

  return response.data.result;
}

function decodePubKey(inputData: string): string {
  // The pubKey starts at index 64 and is 48 bytes long
  return "0x" + inputData.slice(64, 160);
}

app.post("/txntracker", async (req: Request, res: Response) => {
  try {
    console.log("Notification received!");

    const { event } = req.body as WebhookEvent;

    if (event && event.activity) {
      for (const activity of event.activity) {
        if (activity.toAddress.toLowerCase() === BEACON_DEPOSIT_CONTRACT) {
          const txData = await getTransactionData(activity.hash);

          const deposit: Deposit = {
            blockNumber: parseInt(activity.blockNum, 16),
            blockTimestamp: new Date(event.createdAt).getTime() / 1000,
            hash: activity.hash,
            fromAddress: activity.fromAddress,
            value: ethers.formatUnits(activity.value, "ether"),
            pubKey: decodePubKey(txData.input),
            fee: BigNumber.from(txData.gasPrice).mul(txData.gas).toString(),
          };

          // await prisma.deposit.create({ data: deposit });
          console.log("New deposit saved:", deposit);
        } else {
          console.log(
            "Activity not related to Beacon Deposit Contract:",
            activity.toAddress
          );
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/*", (req: Request, res: Response) => {
  res.json({
    message: "Server is running!",
    success: true,
  });
});

app.listen(port, () => {
  console.log(`Webhook server listening at port no: ${port}`);
});
