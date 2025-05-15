function adjustHeight(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}

function highlightActiveChat(sessionId) {
    document.querySelectorAll("[id^='chat-session-']").forEach(el => {
        el.classList.remove("bg-blue-100", "dark:bg-blue-900/30", "font-bold", "border-l-4", "border-blue-500");
        el.classList.remove("bg-blue-50", "dark:bg-blue-900/20");

        const titleSpan = el.querySelector('[id^="chat-title-"]');
        if (titleSpan) {
            titleSpan.classList.remove("text-blue-800", "dark:text-blue-200");
            titleSpan.classList.remove("text-white");
            titleSpan.classList.add("text-gray-800", "dark:text-gray-200");
        }
    });

    if (sessionId) {
        const activeEl = document.getElementById(`chat-session-${sessionId}`);
        if (activeEl) {
            activeEl.classList.add("bg-blue-100", "dark:bg-blue-900/30", "font-bold", "border-l-4", "border-blue-500");

            const titleSpan = activeEl.querySelector(`#chat-title-${sessionId}`);
            if (titleSpan) {
                titleSpan.classList.remove("text-gray-800", "dark:text-gray-200");
                titleSpan.classList.add("text-blue-800", "dark:text-blue-200");
            }
        }
    }
}

function loadChat(session_id) {
    fetch(`/chats/load-chat/${session_id}/`)
        .then(response => response.json())
        .then(data => {
            const chatContainer = document.getElementById("chat-container");
            if (!chatContainer) {
                console.error("Chat container not found");
                return;
            }

            chatContainer.innerHTML = '';

            if (data.length === 0) {
                const botNameElement = document.querySelector('h2.text-3xl');

                const botDescriptionElement = document.querySelector('.flex.items-center.justify-between .text-sm');

                const botName = botNameElement ? botNameElement.textContent.trim() : 'Assistant';
                const botDescription = botDescriptionElement ? botDescriptionElement.textContent.trim() : 'I\'m here to help with your questions.';

                simulateTyping(`Welcome! I'm ${botName}. ${botDescription} How can I help you today?`, 'ai');
            } else {
                data.forEach(item => {
                    const msgDiv = document.createElement("div");
                    const innerDiv = document.createElement("div");
                    msgDiv.classList.add('flex', 'items-start', 'space-x-2');
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
            }

            chatContainer.classList.remove('hidden');
            chatContainer.scrollTop = chatContainer.scrollHeight;

            currentChatId = session_id;
            highlightActiveChat(session_id);
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

    const emptyHistoryPlaceholder = document.querySelector('#chat-history .text-center.py-8');
    if (emptyHistoryPlaceholder) {
        emptyHistoryPlaceholder.remove();
    }

    if (document.getElementById(`chat-session-${chatId}`)) return;

    const wrapper = document.createElement('div');
    wrapper.className = "relative flex items-center justify-between px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded";
    wrapper.id = `chat-session-${chatId}`;

    const titleDiv = document.createElement('div');
    titleDiv.className = "flex-1 cursor-pointer text-left";
    titleDiv.setAttribute("onclick", `loadChat(${chatId})`);
    titleDiv.setAttribute("data-id", chatId);
    titleDiv.id = `chat-click-${chatId}`;

    const span = document.createElement('span');
    span.id = `chat-title-${chatId}`;
    span.className = "truncate text-gray-800 dark:text-gray-200";
    span.textContent = chatTitle;
    titleDiv.appendChild(span);

    const settingsWrapper = document.createElement('div');
    settingsWrapper.className = "relative ml-2";
    settingsWrapper.id = `settings-wrapper-${chatId}`;

    const settingsBtn = document.createElement('button');
    settingsBtn.className = "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1";
    settingsBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>`;
    settingsBtn.setAttribute("onclick", `toggleMenu(event, ${chatId})`);

    const menuDiv = document.createElement('div');
    menuDiv.id = `menu-${chatId}`;
    menuDiv.className = "absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-lg hidden z-10 w-32 overflow-hidden";

    const renameBtn = document.createElement('button');
    renameBtn.className = "block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200";
    renameBtn.innerHTML = `<div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Rename
    </div>`;
    renameBtn.setAttribute("onclick", `startRename(${chatId})`);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = "block w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors duration-200";
    deleteBtn.innerHTML = `<div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
    </div>`;
    deleteBtn.setAttribute("onclick", `confirmDelete(${chatId})`);

    menuDiv.appendChild(renameBtn);
    menuDiv.appendChild(deleteBtn);

    settingsWrapper.appendChild(settingsBtn);
    settingsWrapper.appendChild(menuDiv);

    wrapper.appendChild(titleDiv);
    wrapper.appendChild(settingsWrapper);
    chatHistory.prepend(wrapper);

    highlightActiveChat(chatId);
}

function simulateTyping(message, sender, callback) {
    if (!message) {
        console.warn("simulateTyping called with empty message");
        if (typeof callback === 'function') callback();
        return null;
    }

    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) {
        if (typeof callback === 'function') callback();
        return null;
    }

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
            if (typeof callback === 'function') {
                callback();
            }
        }
    }, 20);

    return messageDiv;
}


let currentChatId = null;
const botId = document.getElementById("bot-id") ? document.getElementById("bot-id").value : null;
let isLoading = false;
let isStreaming = false;

function updateUIForLoading(isLoadingState, isStreamingState) {
    const userInputEl = document.getElementById('user-input');
    const sendBtn = document.querySelector('button[onclick="submitMessage()"]');

    if (isLoadingState || isStreamingState) {
        userInputEl.disabled = true;
        sendBtn.disabled = true;
        sendBtn.classList.add('opacity-50', 'cursor-not-allowed');

        if (isLoadingState) {
            sendBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Generating...
            `;
        } else if (isStreamingState) {
            sendBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Streaming...
            `;
        }
    } else {
        userInputEl.disabled = false;
        sendBtn.disabled = false;
        sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        sendBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send Message
        `;
    }
}

function submitMessage() {
    const userInputEl = document.getElementById('user-input');
    const userInput = userInputEl.value.trim();

    if (userInput === '' || isLoading || isStreaming) return;

    isLoading = true;
    updateUIForLoading(true, false);

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

        isLoading = false;
        isStreaming = true;
        updateUIForLoading(false, true);

        simulateTyping(data.ai_response, 'ai', function() {
            isStreaming = false;
            updateUIForLoading(false, false);
        });

        updateSidebar(data.chat_id, data.chat_title);
    })
    .catch(err => {
        typingContent.textContent = "Error generating response.";
        isLoading = false;
        isStreaming = false;
        updateUIForLoading(false, false);
    })
    .finally(() => {
        userInputEl.value = '';
        adjustHeight(userInputEl);
    });
}

function handleKeyDown(event) {
    if (event.key === 'Enter') {
        if (!event.shiftKey) {
            event.preventDefault();
            submitMessage();
        }
        else {
            return true;
        }
    }
}

function startNewChat() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) {
        console.error("Chat container not found");
        return;
    }

    chatContainer.innerHTML = '';
    chatContainer.classList.remove('hidden');

    currentChatId = null;
    highlightActiveChat(null);

    const botNameElement = document.querySelector('h2.text-3xl');

    const botDescriptionElement = document.querySelector('.flex.items-center.justify-between .text-sm');

    const botName = botNameElement ? botNameElement.textContent.trim() : 'Assistant';
    const botDescription = botDescriptionElement ? botDescriptionElement.textContent.trim() : 'I\'m here to help with your questions.';

    const welcomeMessage = `Welcome! I'm ${botName}. ${botDescription} How can I help you today?`;
    simulateTyping(welcomeMessage, 'ai');
}

function toggleMenu(event, sessionId) {
    event.stopPropagation();

    document.querySelectorAll("[id^='menu-']").forEach(menu => {
        menu.classList.add("hidden");
        menu.style.top = '';
        menu.style.bottom = '';
        menu.style.zIndex = '';
    });

    const menu = document.getElementById(`menu-${sessionId}`);
    const settingsBtn = document.querySelector(`#settings-wrapper-${sessionId} button`);

    if (menu.classList.contains("hidden")) {
        menu.classList.remove("hidden");
        menu.style.zIndex = '50';

        const menuRect = menu.getBoundingClientRect();
        const settingsBtnRect = settingsBtn.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const menuHeight = menuRect.height;
        const menuWidth = menuRect.width;

        const spaceBelow = viewportHeight - settingsBtnRect.bottom;
        const spaceAbove = settingsBtnRect.top;
        const spaceRight = viewportWidth - settingsBtnRect.right;

        if (spaceBelow >= menuHeight) {
            menu.style.top = '100%';
            menu.style.bottom = 'auto';
            menu.style.right = '0';
            menu.style.left = 'auto';
        }
        else if (spaceAbove >= menuHeight) {
            menu.style.bottom = '100%';
            menu.style.top = 'auto';
            menu.style.right = '0';
            menu.style.left = 'auto';
        }
        else if (spaceRight >= menuWidth) {
            menu.style.top = '0';
            menu.style.left = '100%';
            menu.style.right = 'auto';
            menu.style.bottom = 'auto';
        }
        else {
            menu.style.position = 'fixed';
            menu.style.top = `${Math.min(settingsBtnRect.bottom, viewportHeight - menuHeight - 10)}px`;
            menu.style.right = '10px';
            menu.style.bottom = 'auto';
            menu.style.left = 'auto';

            const resetPosition = () => {
                menu.style.position = '';
                document.removeEventListener('click', resetPosition);
            };
            document.addEventListener('click', resetPosition, { once: true });
        }
    } else {
        menu.classList.add("hidden");
        resetMenuStyles(menu);
    }

    document.addEventListener("click", () => {
        menu.classList.add("hidden");
        resetMenuStyles(menu);
    }, { once: true });
}

function resetMenuStyles(menu) {
    menu.style.top = '';
    menu.style.bottom = '';
    menu.style.right = '';
    menu.style.left = '';
    menu.style.zIndex = '';
    menu.style.position = '';
}

let renamingChatId = null;

function startRename(sessionId) {
    if (renamingChatId !== null) return;

    renamingChatId = sessionId;

    const titleEl = document.getElementById(`chat-title-${sessionId}`);
    const currentTitle = titleEl.innerText.trim();

    const settingsEl = document.getElementById(`menu-${sessionId}`).parentElement;
    settingsEl.classList.add("hidden");

    titleEl.innerHTML = `
        <input id="rename-input-${sessionId}" type="text" 
               class="border border-blue-400 p-1 text-sm rounded w-full focus:outline-none focus:ring text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700" 
               value="${currentTitle}" 
               onkeydown="if(event.key==='Enter'){ finishRename(${sessionId}) }" 
               onblur="cancelRename(${sessionId}, '${escapeHtml(currentTitle)}')"
               autofocus
        />
    `;

    document.getElementById(`rename-input-${sessionId}`).focus();
}

function finishRename(sessionId) {
    const input = document.getElementById(`rename-input-${sessionId}`);
    const newTitle = input.value.trim();

    if (!newTitle) return cancelRename(sessionId, input.defaultValue);

    fetch(`/chats/rename_chat/${sessionId}/${botId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ title: newTitle }),
    }).then(() => {
        renderChatTitle(sessionId, newTitle);
    });
}

function cancelRename(sessionId, originalTitle) {
    renderChatTitle(sessionId, originalTitle);
}

function renderChatTitle(sessionId, title) {
    const titleEl = document.getElementById(`chat-title-${sessionId}`);
    titleEl.textContent = title;

    const settingsEl = document.getElementById(`menu-${sessionId}`).parentElement;
    settingsEl.classList.remove("hidden");

    renamingChatId = null;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}

function confirmDelete(sessionId) {
    document.getElementById(`menu-${sessionId}`).classList.add("hidden");
    if (confirm("Are you sure you want to delete this chat?")) {
        fetch(`/chats/delete_chat/${sessionId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
        }).then(() => {
            const sessionEl = document.getElementById(`chat-session-${sessionId}`);
            if (sessionEl) sessionEl.remove();

            if (sessionId == currentChatId) {
                clearChat();
                currentChatId = null;

                const remainingChat = document.querySelector('[id^="chat-session-"]');
                if (remainingChat) {
                    const chatId = remainingChat.id.replace('chat-session-', '');
                    loadChat(chatId);
                } else {
                    startNewChat();
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.addEventListener('keydown', handleKeyDown);
    } else {
        console.error("User input element not found");
    }

    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) {
        console.error("Chat container not found");
        return;
    }

    try {
        const firstChat = document.querySelector('[id^="chat-session-"]');

        if (firstChat) {
            const chatId = firstChat.id.replace('chat-session-', '');
            loadChat(chatId);
        } else {
            startNewChat();
        }

        chatContainer.classList.remove('hidden');
    } catch (error) {
        console.error("Error during chat initialization:", error);
    }
});