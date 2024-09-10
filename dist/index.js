"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const port = 5000;
const BEACON_DEPOSIT_CONTRACT = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;
// Define ABI for the DepositEvent
const eventABI = [
    // Event definition
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
];
const contractInterface = new Interface(eventABI);
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const settings = {
    apiKey: ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
    maxRetries: 10,
};
const alchemy = new Alchemy(settings);
const prisma = new PrismaClient();
app.use(express.json());
// Function to send Telegram notifications
const sendTelegramNotification = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        yield axios.post(url, {
            chat_id: telegramChatId,
            text: message,
        });
        console.log("Telegram notification sent.");
    }
    catch (error) {
        console.error("Error sending Telegram notification:", error);
    }
});
app.post("/txntracker", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Notification received!");
        const { event } = req.body;
        if (event && event.activity) {
            for (const activity of event.activity) {
                console.log("Log Activity:", activity.log);
                // Extract log information
                const log = activity.log;
                // Filter for DepositEvent
                const depositEventTopic = ethers.utils.id("DepositEvent(bytes,bytes,bytes,bytes,bytes)");
                if (log.topics[0] === depositEventTopic) {
                    const blockNumber = parseInt(log.blockNumber, 16);
                    const block = yield alchemy.core.getBlock(blockNumber);
                    const timestamp = block.timestamp;
                    const transactionHash = log.transactionHash;
                    const receipt = yield alchemy.core.getTransactionReceipt(transactionHash);
                    const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice).toString();
                    const blockHash = log.blockHash;
                    const transactionIndex = parseInt(log.transactionIndex, 16);
                    const address = log.address;
                    const data = log.data;
                    const topics = log.topics;
                    const logIndex = parseInt(log.logIndex, 16);
                    const decodedLog = contractInterface.parseLog({
                        data: data,
                        topics: topics,
                    });
                    const { pubkey, amount } = decodedLog.args;
                    const pubKey = ethers.hexlify(pubkey);
                    const transaction = {
                        blockNumber: blockNumber,
                        blockTimestamp: timestamp,
                        fee: fee,
                        hash: transactionHash,
                        pubKey: pubKey,
                    };
                    // Save the transaction to the database 
                    // await prisma.transaction.create({ data: transaction });
                    console.log("New transaction saved:", transaction);
                    // Send a notification
                    yield sendTelegramNotification("New deposit transaction detected.");
                }
                else {
                    console.log("Log is not a DepositEvent.");
                }
            }
        }
        res.status(200).send("OK");
    }
    catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send("Internal Server Error");
    }
}));
app.get("/*", (req, res) => {
    res.json({
        message: "Server is running!",
        success: true,
    });
});
app.listen(port, () => {
    console.log(`Webhook server listening at port no: ${port}`);
});
