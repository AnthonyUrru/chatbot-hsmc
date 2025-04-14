document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    let conversationHistory = [
       {
            role: "assistant",
            content: document.querySelector('.welcome-message .message-content').innerHTML
        }
    ];
    
    // Función para añadir mensaje al chat
    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Si el contenido incluye HTML (como el mensaje de bienvenida)
        if (content.startsWith('<')) {
            messageContent.innerHTML = content;
        } else {
            messageContent.innerHTML = `<p>${content}</p>`;
        }
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString() === new Date().toLocaleDateString() ? 'Hoy' : now.toLocaleDateString();
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = `${dateString}, ${timeString}`;
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Función para mostrar indicador de "escribiendo"
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Función para ocultar indicador de "escribiendo"
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Función para enviar mensaje a DeepInfra
    async function sendToDeepInfra(userMessage) {
        showTypingIndicator();
        
        // Añadir mensaje del usuario al historial
        conversationHistory.push({
            role: "user",
            content: userMessage
        });
        
        try {
            const response = await fetch("/.netlify/functions/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ messages: conversationHistory })
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.choices && data.choices[0].message) {
                const botResponse = data.choices[0].message.content;
                
                // Añadir respuesta al historial
                conversationHistory.push({
                    role: "assistant",
                    content: botResponse
                });
                
                hideTypingIndicator();
                addMessage('bot', botResponse);
            } else {
                throw new Error("Respuesta inesperada de la API");
            }
        } catch (error) {
            hideTypingIndicator();
            addMessage('bot', '⚠️ Error temporal. Por favor, intente nuevamente.');
            console.error("Error en la API:", error);
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            addMessage('user', message);
            userInput.value = '';
            sendToDeepInfra(message);
        }
    });
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = userInput.value.trim();
            if (message) {
                addMessage('user', message);
                userInput.value = '';
                sendToDeepInfra(message);
            }
        }
    });
});