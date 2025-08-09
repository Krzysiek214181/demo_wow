import { OpenAIService } from "./OpenAIService.js";
import express from "express";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import { ChatCompletionMessageParam } from "openai/resources.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

type messagesObject = {
    [username: string]: ChatCompletionMessageParam[]
}

let messages: messagesObject= {};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type APIKey = { user: string; key: string };
const APIkeys: APIKey[] = JSON.parse(fs.readFileSync(path.join(__dirname, "apiKeys.json"), 'utf-8'));

dotenv.config();
const app = express();
app.use(express.json());

const openaiService = new OpenAIService();

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get("/", (req, res)=>{
    const apiKey = req.cookies ? req.cookies.apiKey : null;

    if(!apiKey){
        return res.redirect('/enter-key');
    };

    const keyData = APIkeys.find((k) => k.key === apiKey);

    if(!keyData){
        res.status(401).send("invalid apiKey");
        return;
    };

    res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});

app.get('/enter-key', (req,res) =>{
    res.sendFile(path.join(__dirname, 'public', 'enter-key.html'));
});

app.get("/clearContext", (req, res)=>{
    const apiKey = req.cookies? req.cookies.apiKey: null;
    if(!apiKey){
        res.status(401).send("no apiKey found!");
        return;
    };

    const keyData = APIkeys.find((k) => k.key === apiKey);

    if(!keyData){
        res.status(401).send("invalid apiKey");
        return;
    };

    const username = keyData.user;
    messages[username] = [];
});

app.post("/test", async(req, res) =>{
    const apiKey = req.cookies? req.cookies.apiKey: null;

    if(!apiKey){
        res.status(401).send("no apiKey found!");
        return;
    };

    const keyData = APIkeys.find((k) => k.key === apiKey);

    if(!keyData){
        res.status(401).send("invalid apiKey");
        return;
    };

    const username = keyData.user;
    const prompt = req.body.prompt;

    if(!messages[username]) messages[username] = [];

    messages[username].push({
        role: 'user',
        content: prompt
    });

    let fullresponse = '';

    const response = openaiService.streamCompletion(undefined, messages[username]);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    for await (const part of response){
        res.write(part);
        fullresponse += part;
    };
    res.end();
    messages[username].push({
        role: "assistant",
        content: fullresponse
    });
});

app.listen(2137, ()=>{
    console.log("listening on port 2137");
});