const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();
const { Alchemy, Network } = require("alchemy-sdk");
const { BigNumber } = require("@ethersproject/bignumber");
const { Interface } = require("@ethersproject/abi");
const fs = require("fs");

const app = express();
const port = 3000;

const BEACON_DEPOSIT_CONTRACT =
  "0x00000000219ab540356cBB839Cbe05303d7705Fa";

const telegramBotToken = "7534814123:AAHF4D7uQxa2dW_m6LsbYIb2XDVNNEItP4M";
const telegramChatId = "-1002392762080";

// Define ABI for the DepositEvent
const eventABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "bytes", name: "pubkey", type: "bytes" },
      {
        indexed: false,
        internalType: "bytes",
        name: "withdrawal_credentials",
        type: "bytes",
      },
      { indexed: false, internalType: "bytes", name: "amount", type: "bytes" },
      {
        indexed: false,
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
      { indexed: false, internalType: "bytes", name: "index", type: "bytes" },
    ],
    name: "DepositEvent",
    type: "event",
  },
  {
    inputs: [
      { internalType: "bytes", name: "pubkey", type: "bytes" },
      { internalType: "bytes", name: "withdrawal_credentials", type: "bytes" },
      { internalType: "bytes", name: "signature", type: "bytes" },
      { internalType: "bytes32", name: "deposit_data_root", type: "bytes32" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "get_deposit_count",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "get_deposit_root",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
];

// Create an Interface for decoding each transaction data
const contractInterface = new Interface(eventABI);

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
// const ALCHEMY_BASE_URL = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;

const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
  maxRetries: 10,
};

const alchemy = new Alchemy(settings);

const prisma = new PrismaClient();

app.use(express.json());

// interface Deposit {
//   blockNumber: number;
//   blockTimestamp: number;
//   hash: string;
//   fromAddress: string;
//   value: string;
//   pubKey: string;
//   fee: string;
// }

type Transaction = any;
type WebhookEvent = any;

// Function to send Telegram notifications
const sendTelegramNotification = async (message: any) => {
  try {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    await axios.post(url, {
      chat_id: telegramChatId,
      text: message,
    });
    console.log("Telegram notification sent.");
  } catch (error) {
    console.log(error);
  }
};

app.post("/txntracker", async (req: any, res: any) => {
  try {
    console.log("Notification received!");

    const { event } = req.body as WebhookEvent;

    if (event && event.activity) {
      for (const activity of event.activity) {
        // if (activity.toAddress.toLowerCase() === BEACON_DEPOSIT_CONTRACT) {

        const blockNumber = parseInt(activity.blockNum, 16);
        const block = await alchemy.core.getBlock(blockNumber);
        const timestamp = block.timestamp;

        const hash = activity.log.transactionHash;
        const receipt = await alchemy.core.getTransactionReceipt(hash);
        const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice).toString();

        const decodedLog = contractInterface.parseLog(activity);
        const { pubkey, amount } = decodedLog.args;
        const pubKey = ethers.hexlify(pubkey);

        const transaction: Transaction = {
          blockNumber: blockNumber,
          blockTimestamp: timestamp,
          fee: fee,
          hash: hash,
          pubKey: pubKey,
        };

        // await prisma.deposit.create({ data: deposit });
        console.log("New transaction saved:", transaction);

        await sendTelegramNotification("HEllo");
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/*", (req: any, res: any) => {
  res.json({
    message: "Server is running!",
    success: true,
  });
});

app.listen(port, () => {
  console.log(`Webhook server listening at port no: ${port}`);
});
