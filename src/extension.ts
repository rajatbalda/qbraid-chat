import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import axios from "axios";

/**
 * Interface representing a chat message
 */
interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

const API_BASE_URL = "https://api.qbraid.com/api";
const CONFIG_FILE_PATH = path.join(os.homedir(), ".qbraid", "qbraidrc");

export async function activate(context: vscode.ExtensionContext) {
    console.log("✅ qBraid Chat Extension activated");

    // Register the webview provider
    const provider = new ChatViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("qbraid-chat-view", provider)
    );

    vscode.window.showInformationMessage("qBraid Chat extension activated!");
}

class ChatViewProvider implements vscode.WebviewViewProvider {
    public _view?: vscode.WebviewView;
    private _chatHistory: ChatMessage[] = [];

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        this.initializeWebview();
    }

    public async initializeWebview() {
        if (!this._view) {
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            this._view.webview.html = this.getNoApiKeyContent();
            return;
        }

        try {
            const models = await fetchModels(apiKey);
            this._view.webview.html = getWebviewContent(models);
            this.setupMessageHandlers(apiKey);
        } catch (error: any) {
            console.error("❌ Failed to initialize chat:", error.message);
            vscode.window.showErrorMessage(
                "Failed to initialize chat: " + (error.message || "Unknown error")
            );
        }
    }

    private getNoApiKeyContent() {
        return `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    h2 {
                        color: red;
                    }
                </style>
            </head>
            <body>
                <h2>qBraid API Key Missing</h2>
                <p>
                    Please ensure your API key is stored in the file:
                    <code>~/.qbraid/qbraidrc</code>.
                </p>
                
                <p>
                    The file should contain a line in the format: <br />
                    <code>api-key = YOUR_API_KEY</code>
                </p>
            </body>
        </html>`;
    }

    private setupMessageHandlers(apiKey: string) {
        if (!this._view) {
            return;
        }

        this._view.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case "sendMessage":
                    await this.handleUserMessage(message, apiKey);
                    break;
                case "clearHistory":
                    this._chatHistory = [];
                    this._view?.webview.postMessage({ type: "historyCleared" });
                    break;
            }
        });
    }

    private async handleUserMessage(message: any, apiKey: string) {
        if (!this._view) {
            return;
        }

        try {
            const userMessage: ChatMessage = {
                role: "user",
                content: message.text,
                timestamp: Date.now(),
            };
            this._chatHistory.push(userMessage);

            this._view.webview.postMessage({
                type: "updateMessages",
                messages: [userMessage],
            });

            this._view.webview.postMessage({ type: "showTyping" });

            const response = await axios.post(
                `${API_BASE_URL}/chat`,
                {
                    prompt: message.text,
                    model: message.model,
                },
                {
                    headers: {
                        "api-key": apiKey,
                    },
                }
            );

            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: response.data.content,
                timestamp: Date.now(),
            };
            this._chatHistory.push(assistantMessage);

            this._view.webview.postMessage({
                type: "updateMessages",
                messages: [assistantMessage],
            });
        } catch (error: any) {
            console.error("❌ API Error:", error.message);
            this._view?.webview.postMessage({
                type: "error",
                message: "Failed to process your request. Try again later.",
            });
        }
    }
}

/**
 * Reads the API key from the ~/.qbraid/qbraidrc configuration file.
 */
function getApiKey(): string | undefined {
    try {
        const configContent = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
        console.log("✅ Config Content:\n", configContent);

        // Extract API key using regex (handles spaces around `=`)
        const match = configContent.match(/^\s*api-key\s*=\s*(\S+)/m);
        if (match) {
            console.log("✅ Extracted API Key:", match[1]);
            return match[1].trim();
        }

        console.error("❌ API Key not found in ~/.qbraid/qbraidrc");
        return undefined;
    } catch (error) {
        if (error instanceof Error) {
            console.error("❌ Failed to read API key:", error.message);
        } else {
            console.error("❌ Unknown error:", error);
        }
        return undefined;
    }
}

/**
 * Fetches available models from the qBraid API.
 */
async function fetchModels(apiKey: string) {
    const response = await axios.get(`${API_BASE_URL}/chat/models`, {
        headers: { "api-key": apiKey },
    });
    return response.data;
}

/**
 * Generates the webview content for the chat interface.
 */
function getWebviewContent(models: any[]) {
    return `<!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                .header {
                    padding: 10px;
                    background-color: #282c34;
                    color: white;
                    text-align: center;
                }
                .chat-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                    background-color: #fff;
                    display: flex;
                    flex-direction: column;
                }
                .message {
                    max-width: 75%;
                    margin: 5px;
                    padding: 10px;
                    border-radius: 10px;
                    display: inline-block;
                    word-wrap: break-word;
                }
                .user-message {
                    background-color: #0078d4;
                    color: white;
                    align-self: flex-end;
                    text-align: left;
                    border-bottom-right-radius: 2px;
                }
                .assistant-message {
                    background-color: #f4f4f4;
                    color: black;
                    align-self: flex-start;
                    text-align: left;
                    border-bottom-left-radius: 2px;
                }
                .footer {
                    display: flex;
                    padding: 10px;
                    border-top: 1px solid #ccc;
                    background-color: white;
                }
                .footer textarea {
                    flex: 1;
                    height: 40px;
                    padding: 8px;
                    resize: none;
                    font-size: 14px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                .footer button {
                    margin-left: 10px;
                    padding: 10px;
                    font-size: 14px;
                    background-color: #0078d4;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .footer button:hover {
                    background-color: #005a9e;
                }
                #model-select {
                    margin-top: 5px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>qBraid Chat</h2>
                <label>Select a model:</label>
                <select id="model-select">
                    ${models.map((m) => `<option value="${m.model}">${m.model}</option>`).join("")}
                </select>
            </div>
            <div class="chat-container" id="chat-container"></div>
            <div class="footer">
                <textarea id="message-input" placeholder="Type your message here..."></textarea>
                <button id="send-button">Send</button>
            </div>
            <script>
                (function () {
                    const vscode = acquireVsCodeApi();
                    const chatContainer = document.getElementById("chat-container");
                    const messageInput = document.getElementById("message-input");
                    const sendButton = document.getElementById("send-button");
                    const modelSelect = document.getElementById("model-select");

                    let isSending = false;  // Prevent multiple sends

                    function addMessage(role, content) {
                        const messageDiv = document.createElement("div");
                        messageDiv.className = "message " + (role === "user" ? "user-message" : "assistant-message");
                        messageDiv.textContent = content;
                        chatContainer.appendChild(messageDiv);
                        chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll
                    }

                    function sendMessage() {
                        const messageText = messageInput.value.trim();
                        if (!messageText || isSending) return;

                        isSending = true; // Prevent duplicate sending
                        sendButton.disabled = true;

                        
                        // Send message to the extension
                        vscode.postMessage({
                            type: "sendMessage",
                            text: messageText,
                            model: modelSelect.value
                        });

                        // Clear input
                        messageInput.value = "";
                        setTimeout(() => {
                            isSending = false;
                            sendButton.disabled = false;
                        }, 1000);
                    }

                    sendButton.addEventListener("click", sendMessage);
                    
                    messageInput.addEventListener("keydown", (event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            sendMessage();
                        }
                    });

                    window.addEventListener("message", (event) => {
                        const message = event.data;
                        switch (message.type) {
                            case "updateMessages":
                                message.messages.forEach((msg) => addMessage(msg.role, msg.content));
                                break;
                            case "error":
                                addMessage("assistant", "❌ " + message.message);
                                break;
                            case "historyCleared":
                                chatContainer.innerHTML = ""; // Clear chat
                                break;
                        }
                    });
                })();
            </script>
        </body>
    </html>`;
}


export function deactivate() {}