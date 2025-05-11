function adjustHeight(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}

function loadChat(session_id) {
    fetch(`/chats/load-chat/${session_id}/`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to load chat");
            return response.json();
        })
        .then(data => {
            const chatContainer = document.getElementById("chat-container");
            chatContainer.innerHTML = '';

            data.forEach(item => {
                const msgDiv = document.createElement("div");
                msgDiv.classList.add('flex', 'items-start', 'space-x-2');
                const innerDiv = document.createElement("div");
                innerDiv.classList.add('p-3', 'rounded-lg', 'max-w-xs', 'whitespace-pre-wrap');

                if (item.sender === 'user') {
                    msgDiv.classList.add('justify-end');
                    innerDiv.classList.add('bg-blue-600', 'text-white');
                } else {
                    innerDiv.classList.add('bg-gray-200', 'text-gray-800');
                }

                innerDiv.textContent = item.message;
                msgDiv.appendChild(innerDiv);
                chatContainer.appendChild(msgDiv);
            });

            chatContainer.classList.remove('hidden');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        })
        .catch(error => {
            console.error("Error loading chat:", error);
            alert("Failed to load chat.");
        });
}

function clearChat() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';
}

function getCSRFToken() {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
}

function updateSidebar(chatId, chatTitle) {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory.querySelector(`[data-id="${chatId}"]`)) {
        const btn = document.createElement('button');
        btn.setAttribute('data-id', chatId);
        btn.classList.add('text-left', 'w-full', 'py-2', 'px-4', 'hover:bg-gray-100', 'rounded');
        btn.innerText = chatTitle;
        btn.onclick = () => loadChat(chatId);
        chatHistory.prepend(btn);
    }
}

function simulateTyping(message, sender) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'items-start', 'space-x-2');
    if (sender === 'user') {
        messageDiv.classList.add('justify-end');
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add(
        sender === 'user' ? 'bg-blue-600' : 'bg-gray-200',
        sender === 'user' ? 'text-white' : 'text-gray-800',
        'p-3', 'rounded-lg', 'max-w-xs', 'whitespace-pre-wrap'
    );
    contentDiv.textContent = '';
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    let index = 0;
    const interval = setInterval(() => {
        if (index < message.length) {
            contentDiv.textContent += message[index];
            index++;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        } else {
            clearInterval(interval);
        }
    }, 20);
}

let currentChatId = null;
const botId = document.getElementById("bot-id").value;
let isLoading = false;

function submitMessage() {
    const userInputEl = document.getElementById('user-input');
    const userInput = userInputEl.value.trim();
    const sendBtn = document.querySelector('button[onclick="submitMessage()"]');

    if (userInput === '' || isLoading) return;

    isLoading = true;
    userInputEl.disabled = true;
    sendBtn.disabled = true;
    sendBtn.innerText = 'Generating...';

    const chatContainer = document.getElementById('chat-container');
    chatContainer.classList.remove('hidden');

    simulateTyping(userInput, 'user');


    const typingDiv = document.createElement('div');
    typingDiv.classList.add('flex', 'items-start', 'space-x-2');
    const typingContent = document.createElement('div');
    typingContent.classList.add('bg-gray-300', 'text-gray-800', 'p-3', 'rounded-lg', 'max-w-xs');
    typingContent.textContent = 'Typing...';
    typingDiv.appendChild(typingContent);
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    fetch('/chats/api/save-message/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({
            message: userInput,
            chat_id: currentChatId,
            bot_id: botId,
        }),
    })
    .then(res => res.json())
    .then(data => {
        currentChatId = data.chat_id;

        chatContainer.removeChild(typingDiv);

        simulateTyping(data.ai_response, 'ai');
        updateSidebar(data.chat_id, data.chat_title);
    })
    .catch(err => {
        console.error("Error saving message:", err);
        typingContent.textContent = "Error generating response.";
    })
    .finally(() => {
        userInputEl.disabled = false;
        sendBtn.disabled = false;
        sendBtn.innerText = 'Send';
        userInputEl.value = '';
        adjustHeight(userInputEl);
        isLoading = false;
    });
}
