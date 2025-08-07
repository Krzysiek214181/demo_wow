let autoScrollInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    hljs.configure({
        ignoreUnescapedHTML: true
    });

    const chatBlock = document.getElementById("chatBlock");
    const promptForm = document.getElementById('promptForm');
    const promptText = document.getElementById('promptText');

    chatBlock.addEventListener('wheel', () => {
        if (autoScrollInterval) {
          stopAutoScroll();
        };
    });

    promptText.focus();

    promptForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData(promptForm);
        const prompt = formData.get('promptText');
        promptForm.reset();
        
        const userDiv = document.createElement('div');
        userDiv.innerHTML += `<br> <strong>USER:</strong><br>`;
        userDiv.innerHTML += prompt;
        chatBlock.appendChild(userDiv);
        promptText.focus();

        chatBlock.scrollTop = userDiv.offsetTop;

        const response = await fetch("http://localhost:2137/test", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "prompt": prompt
            })
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        chatBlock.innerHTML += "<br><strong> GPT:</strong>"
        let markdownBuffer = ""
        const aiDiv = document.createElement('div');
        aiDiv.style.marginTop = "0";
        chatBlock.appendChild(aiDiv);

        startAutoScroll(chatBlock);

        while(true){
            const {value, done} = await reader?.read();
            if (done){
                stopAutoScroll();
                break;
            };

            const chunkText = decoder.decode(value, {stream: true})
            const data = handleChunk(chunkText, markdownBuffer);
            markdownBuffer = data.newBuffer;
            aiDiv.innerHTML = data.parsed;
            hljs.highlightAll();
            console.log(chunkText);
        };
    });
});

function handleChunk(chunk, markdownBuffer){
    markdownBuffer += chunk;
    return {
        "parsed": marked.parse(markdownBuffer),
        "newBuffer": markdownBuffer
    };
};

function startAutoScroll(container) {
    if (autoScrollInterval !== null) return;
  
    autoScrollInterval = setInterval(() => {
      container.scrollTop += 5;
    }, 1);
};
  
function stopAutoScroll() {
    console.error("STOPPED")
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    };
};

