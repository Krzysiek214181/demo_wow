import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

export class OpenAIService{
    private openai: OpenAI;

    constructor(){
        this.openai = new OpenAI();
    };

    async *streamCompletion(prompt: string, model: string = 'gpt-4o-mini', pastmessages?: ChatCompletionMessageParam[]){
        let messages: ChatCompletionMessageParam[] = [];

        if(pastmessages) messages = pastmessages;

        messages.push({
            "role": "user",
            "content": prompt
        });

        try{
            const response = await this.openai.chat.completions.create({
                "model": model,
                "messages": messages,
                "stream": true
            });

            for await( const part of response){
                const chunk = part.choices[0].delta?.content;
                if (chunk) yield chunk;
            };
        }catch(error){
            console.error("error while streaming response");
            throw error;
        };

    };

};