import express from "express";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import axios from "axios";
require("dotenv").config();
const { Alchemy, Network } = require("alchemy-sdk");
const { BigNumber } = require("@ethersproject/bignumber");
import logger from "./logger";

const app = express();
const port = 3000;

const BEACON_DEPOSIT_CONTRACT = "<YOUR BEACON_DEPOSIT_CONTRACT>";

const telegramBotToken = "<YOUR TELEGRAM BOT TOKEN>";
const telegramChatId = "<YOUR TELEGRAM CHAT ID>";

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
    logger.info("Telegram notification sent.");
  } catch (error) {
    logger.error("Error sending Telegram notification:", error);
  }
};

app.post("/txntracker", async (req: any, res: any) => {
  try {
    console.log("Notification received!");
    logger.info("Notification received!");

    const { event } = req.body as WebhookEvent;

    if (event && event.activity) {
      for (const activity of event.activity) {
        const log = activity.log;
        logger.info("Log Activity:", log);
        const blockNumber = parseInt(log.blockNumber, 16);
        const block = await alchemy.core.getBlock(blockNumber);
        const timestamp = block.timestamp;

        const transactionHash = log.transactionHash;
        const receipt =
          await alchemy.core.getTransactionReceipt(transactionHash);
        const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice).toString();

        // const blockHash = log.blockHash;
        // const transactionIndex = parseInt(log.transactionIndex, 16);
        // const address = log.address;
        // const data = log.data;
        // const topics = log.topics;
        // const logIndex = parseInt(log.logIndex, 16);
        const pubkey = activity.rawContract.address;

        const deposit: Deposit = {
          blockNumber: blockNumber,
          blockTimestamp: timestamp,
          fee: BigInt(fee),
          hash: transactionHash,
          pubkey: pubkey,
        };

        // Save the transaction to the database
        await prisma.deposit.create({ data: deposit });
        console.log("New Deposit Transaction saved:", deposit);
        logger.info("New Deposit Transaction saved:", deposit);

        // Send a notification with formatted deposit data
        await sendTelegramNotification(
          `New deposit transaction detected:\n` +
            `Block Number: ${deposit.blockNumber}\n` +
            `Timestamp: ${new Date(
              deposit.blockTimestamp * 1000,
            ).toISOString()}\n` +
            `Fee: ${deposit.fee}\n` +
            `Transaction Hash: ${deposit.hash}\n` +
            `Public Key: ${deposit.pubkey}`,
        );
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    logger.error("Error processing webhook:", error);
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
  logger.info(`Webhook server listening at port no: ${port}`);
});
