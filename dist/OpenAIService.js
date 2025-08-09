import OpenAI from "openai";
export class OpenAIService {
    constructor() {
        this.openai = new OpenAI();
    }
    ;
    async *streamCompletion(model = 'gpt-4o-mini', messages) {
        try {
            const response = await this.openai.chat.completions.create({
                "model": model,
                "messages": messages,
                "stream": true
            });
            for await (const part of response) {
                const chunk = part.choices[0].delta?.content;
                if (chunk)
                    yield chunk;
            }
            ;
        }
        catch (error) {
            console.error("error while streaming response");
            throw error;
        }
        ;
    }
    ;
}
;
