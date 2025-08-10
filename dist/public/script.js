let autoScrollInterval = null;
const DOMAIN = 'https://demo.xxxx.xyz';

document.addEventListener('DOMContentLoaded', async () => {
    hljs.configure({
        ignoreUnescapedHTML: true
    });

    const chatBlock = document.getElementById("chatBlock");
    const promptForm = document.getElementById('promptForm');
    const promptText = document.getElementById('promptText');
    const clearContextBtn = document.getElementById('clearContextBtn');
    const sendBtn = document.getElementById('sendBtn');
    const logOutBtn = document.getElementById('logOutBtn');

    clearContextBtn.addEventListener('click',()=>{
        fetch(`${DOMAIN}/clearContext`);
        chatBlock.innerHTML = "";
    });

    logOutBtn.addEventListener('click', ()=>{
        document.cookie = "apiKey=; max-age=0; path=/;";
        location.reload();
    });

    //auto resize for input
    promptText.addEventListener('input', ()=>{
        const maxHeight = 100; //in px
        promptText.style.height = '28px';
        promptText.style.height = Math.min(maxHeight, promptText.scrollHeight) + 'px';
    });

    //stop autoscroll if user scrolls
    chatBlock.addEventListener('wheel', () => {
        if (autoScrollInterval) {
          stopAutoScroll();
        };
    });

    promptText.focus();

    //submit on enter, newline on shift+enter
    promptText.addEventListener('keydown', (event)=>{
        if(event.key === 'Enter' && !event.shiftKey && !event.ctrlKey){
            event.preventDefault();
            sendBtn.click();
        };
    });

    promptForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData(promptForm);
        const prompt = formData.get('promptText');
        promptForm.reset();
        promptText.style.height = '28px';

        //append user message to chat and refocus on input
        const userDiv = document.createElement('div');
        userDiv.classList.add('messageDiv');
        userDiv.innerHTML += `<br> <strong>USER:</strong><br>`;
        userDiv.innerHTML += `<p>${escapeHtml(prompt)}</p>`;
        chatBlock.appendChild(userDiv);
        promptText.focus();

        chatBlock.scrollTop = userDiv.offsetTop;

        const response = await fetch(`${DOMAIN}/test`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "prompt": prompt
            })
        });

        if(!response.ok){
            if (response.status === 401){
                const error = await response.text();
                alert(error);
                return;
            };
        };

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        //append ai response to chat and start autoscroll
        let markdownBuffer = ""
        const aiDiv = document.createElement('div');
        aiDiv.innerHTML += "<br><strong>AI:</strong>"
        chatBlock.appendChild(aiDiv);
        const aiResponseDiv = document.createElement('div');
        aiResponseDiv.classList.add('messageDiv');
        aiDiv.appendChild(aiResponseDiv);

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
            aiResponseDiv.innerHTML = data.parsed;
            hljs.highlightAll();
            console.log(chunkText);
        };
    });
});

//markdown to html
function handleChunk(chunk, markdownBuffer){
    markdownBuffer += chunk;
    return {
        "parsed": marked.parse(markdownBuffer),
        "newBuffer": markdownBuffer
    };
};

//scroll 5px every 1ms
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

//escape html + newline to <br>
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, '<br>');
};


