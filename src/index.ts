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

const BEACON_DEPOSIT_CONTRACT = "0x00000000219ab540356cBB839Cbe05303d7705Fa";

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const settings = {
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
  maxRetries: 10,
};

const alchemy = new Alchemy(settings);
const prisma = new PrismaClient();

app.use(express.json());

type Deposit = any;
type WebhookEvent = any;

// Function to send Telegram notifications
const sendTelegramNotification = async (message: string) => {
  try {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    await axios.post(url, {
      chat_id: telegramChatId,
      text: message,
    });
    console.log("Telegram notification sent.");
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
};

app.post("/txntracker", async (req: any, res: any) => {
  try {
    console.log("Notification received!");

    const { event } = req.body as WebhookEvent;

    if (event && event.activity) {
      for (const activity of event.activity) {
        const log = activity.log;
        console.log("Log Activity:", log);
        const blockNumber = parseInt(log.blockNumber, 16);
        const block = await alchemy.core.getBlock(blockNumber);
        const timestamp = block.timestamp;

        const transactionHash = log.transactionHash;
        const receipt = await alchemy.core.getTransactionReceipt(
          transactionHash
        );
        const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice).toString();

        // const blockHash = log.blockHash;
        // const transactionIndex = parseInt(log.transactionIndex, 16);
        // const address = log.address;
        // const data = log.data;
        // const topics = log.topics;
        // const logIndex = parseInt(log.logIndex, 16);
        const pubKey = activity.rawContract.address;

        const deposit: Deposit = {
          blockNumber: blockNumber,
          blockTimestamp: timestamp,
          fee: fee,
          hash: transactionHash,
          pubKey: pubKey,
        };

        // Save the transaction to the database
        // await prisma.transaction.create({ data: transaction });
        console.log("New Deposit Transaction saved:", deposit);

        // Send a notification
        await sendTelegramNotification("New deposit transaction detected.");
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
