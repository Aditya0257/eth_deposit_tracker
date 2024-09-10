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
const { Interface } = require("@ethersproject/abi");
const app = express();
const port = 3000;
const BEACON_DEPOSIT_CONTRACT = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;
const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
});
const prisma = new PrismaClient();
app.use(express.json());
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
// Initialize the contract interface with the event ABI
const contractInterface = new Interface(eventABI);
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
                const log = activity.log;
                const transactionHash = log.transactionHash;
                console.log("Transaction Hash:", transactionHash);
                // Fetch the transaction logs using the transaction hash
                const receipt = yield alchemy.core.getTransactionReceipt(transactionHash);
                if (receipt && receipt.logs) {
                    for (const logEntry of receipt.logs) {
                        // Check if the log is from the Beacon Deposit Contract
                        if (logEntry.address.toLowerCase() === BEACON_DEPOSIT_CONTRACT.toLowerCase()) {
                            try {
                                const depositEventTopic = ethers.id("DepositEvent(bytes,bytes,bytes,bytes,bytes)");
                                if (logEntry.topics[0] === depositEventTopic) {
                                    // Decode the log to extract the pubkey
                                    const decodedLog = contractInterface.parseLog({
                                        data: logEntry.data,
                                        topics: logEntry.topics,
                                    });
                                    const pubkey = ethers.utils.hexlify(decodedLog.args.pubkey);
                                    console.log("PubKey:", pubkey);
                                    // Save the transaction to the database (if needed)
                                    // await prisma.transaction.create({ data: { pubkey, ... } });
                                    // Send a notification
                                    yield sendTelegramNotification(`New deposit with PubKey: ${pubkey}`);
                                }
                            }
                            catch (error) {
                                console.error("Error decoding log:", error);
                            }
                        }
                    }
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
