import { OpenAIService } from "./OpenAIService.js";
import express from "express";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
let messages = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APIkeys = JSON.parse(fs.readFileSync(path.join(__dirname, "apiKeys.json"), 'utf-8'));
dotenv.config();
const app = express();
app.use(express.json());
const openaiService = new OpenAIService();
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.get("/", (req, res) => {
    const apiKey = req.cookies ? req.cookies.apiKey : null;
    if (!apiKey) {
        console.log("no api key");
        return res.redirect('/enter-key');
    }
    ;
    res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});
app.get('/enter-key', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'enter-key.html'));
});
app.get("/clearContext", () => {
    messages = [];
});
app.post("/test", async (req, res) => {
    const apiKey = req.cookies ? req.cookies.apiKey : null;
    if (!apiKey) {
        res.status(401).send("no apiKey found!");
        return;
    }
    ;
    const keyData = APIkeys.find((k) => k.key === apiKey);
    if (!keyData) {
        res.status(401).send("invalid apiKey");
        return;
    }
    ;
    const prompt = req.body.prompt;
    let fullresponse = '';
    const response = openaiService.streamCompletion(prompt, undefined, messages);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();
    for await (const part of response) {
        res.write(part);
        fullresponse += part;
    }
    ;
    res.end();
    messages.push({
        "role": "assistant",
        "content": fullresponse
    });
});
app.listen(2137, () => {
    console.log("listening on port 2137");
});
