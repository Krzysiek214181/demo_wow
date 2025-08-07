import { OpenAIService } from "./OpenAIService.js";
import express from "express";
import dotenv from "dotenv";
import { ChatCompletionMessageParam } from "openai/resources.js";

let messages: ChatCompletionMessageParam[] = [];

dotenv.config();
const app = express();
app.use(express.json());

const openaiService = new OpenAIService();

app.use(express.static("./dist/public"));

app.post("/test", async(req, res) =>{
    const prompt = req.body.prompt;
    let fullresponse = '';

    const response = openaiService.streamCompletion(prompt, undefined, messages);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    for await (const part of response){
        res.write(part);
        fullresponse += part;
    };
    res.end();
    messages.push({
        "role": "assistant",
        "content": fullresponse
    });
});

app.listen(2137, ()=>{
    console.log("listening on port 2137");
});