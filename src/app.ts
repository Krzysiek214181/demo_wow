import { OpenAIService } from "./OpenAIService.js";
import express from "express";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import { ChatCompletionMessageParam } from "openai/resources.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

//options
const PORT = 8080;

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

    if (!messages[username] || messages[username].length === 0)
        messages[username] = [{
            role: 'system',
            content: `You are a solar panel sales assistant AI.  
                    Your job is to:  
                    1. Hold a natural, friendly conversation with the customer to collect all the information needed to determine their solar suitability and prepare a proposal.  
                    2. Ask questions one at a time. If the customer is unsure, help them estimate. Avoid overwhelming them with technical jargon.  
                    3. Keep track of which questions are already answered. Do not repeat them unless you need to confirm unclear information.  
                    4. When enough information is gathered, produce a clear, well-structured summary of the customer's situation for internal use.
                    5. Before creating the summary check whether you already have all the answers, if not - ask follow-up questions. 
                    6. The summary must include:
                    - Name
                    - Location (city)  
                    - Roof type
                    - Roof size
                    - Roof orientation 
                    - Shading conditions  
                    - Average monthly electricity bill  
                    - Energy usage pattern (day/night balance if known)  
                    - Budget or financing preference  
                    - If the client is interested in energy storage
                    - Any constraints or special requests  
                    6. Always output in this format at the end:
                    **PODSUMOWANIE**:  
                    [Write the structured summary here in bullet points]  

                    **NOTES**:  
                    [Add any internal notes or clarifications for the sales team]  
                    

                    Conversation rules:  
                    - Default to Polish.  
                    - Avoid making technical recommendations until the summary is complete.  
                    - Keep a natural feel throughout the conversation, don't start every sentence with customer's name
                    - If the customer is not a good fit for solar, still complete the summary and note the reason.`
        }, {
            role: 'assistant',
            content: `Dzień dobry! Jestem asystentem do spraw instalacji paneli słonecznych.  
            Dzisiaj chciałbym zadać ci parę pytań aby dopasować dla Ciebie odpowiednią ofertę. 
            Czy zanim zaczniemy masz jakieś uwagi albo pytania?`
        }];

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

app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`);
});