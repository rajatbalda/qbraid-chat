import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';

let apiKey: string | undefined;

// Load API Key from the configuration file
const loadApiKeyFromFile = () => {
    const filePath = `${os.homedir()}/.qbraid/qbraidrc`;
    if (fs.existsSync(filePath)) {
        const config = fs.readFileSync(filePath, 'utf-8');
        const match = config.match(/api-key\s*=\s*(.+)/);
        if (match) {
            apiKey = match[1].trim();
            vscode.window.showInformationMessage('API Key loaded successfully from configuration file.');
        } else {
            vscode.window.showErrorMessage('API Key not found in configuration file.');
        }
    } else {
        vscode.window.showErrorMessage('Configuration file not found.');
    }
};

// Command: Configure API Key
const configureApiKey = async () => {
    apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your qBraid API Key',
        placeHolder: 'API Key',
        password: true,
        ignoreFocusOut: true
    });

    if (apiKey) {
        vscode.window.showInformationMessage('API Key configured successfully!');
    } else {
        vscode.window.showErrorMessage('API Key configuration canceled.');
    }
};

// Command: Fetch Chat Models
const fetchChatModels = async () => {
    if (!apiKey) {
        vscode.window.showErrorMessage('API Key not configured. Please configure it first.');
        return;
    }

    try {
        const response = await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: 'Fetching chat models...' },
            async () => {
                const headers = new Headers({ 'api-key': apiKey || '' });
                const res = await fetch('https://api.qbraid.com/api/chat/models', { headers });

                if (!res.ok) {
                    throw new Error(`Failed to fetch models: ${res.statusText}`);
                }

                const data = await res.json();
                return data.models || [];
            }
        );

        if (response.length > 0) {
            vscode.window.showQuickPick(response, {
                placeHolder: 'Select a chat model',
            }).then(selectedModel => {
                if (selectedModel) {
                    vscode.window.showInformationMessage(`Selected model: ${selectedModel}`);
                }
            });
        } else {
            vscode.window.showWarningMessage('No models available.');
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error fetching models: ${(error as Error).message}`);
    }
};

// Command: Send Chat Message
const sendChatMessage = async () => {
    if (!apiKey) {
        vscode.window.showErrorMessage('API Key not configured. Please configure it first.');
        return;
    }

    const prompt = await vscode.window.showInputBox({
        prompt: 'Enter your prompt for the qBraid Chat',
        placeHolder: 'Type your question here...',
        ignoreFocusOut: true
    });

    if (!prompt) {
        vscode.window.showErrorMessage('Prompt cannot be empty.');
        return;
    }

    try {
        vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: 'Sending message...' },
            async () => {
                const headers = new Headers({
                    'Content-Type': 'application/json',
                    'api-key': apiKey || ''
                });

                const res = await fetch('https://api.qbraid.com/api/chat', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        prompt,
                        model: 'gpt-4o-mini',
                        stream: true
                    })
                });

                if (!res.ok) {
                    throw new Error(`Failed to fetch response: ${res.statusText}`);
                }

                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let receivedText = '';

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        receivedText += decoder.decode(value, { stream: true });
                        vscode.window.showInformationMessage(receivedText); // Stream partial responses
                    }
                }

                vscode.window.showInformationMessage(`Full Response: ${receivedText}`);
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Error: ${(error as Error).message}`);
    }
};

// Activate the extension
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('qbraidChat.configureApiKey', configureApiKey),
        vscode.commands.registerCommand('qbraidChat.fetchChatModels', fetchChatModels),
        vscode.commands.registerCommand('qbraidChat.sendChatMessage', sendChatMessage)
    );

    loadApiKeyFromFile();
    vscode.window.showInformationMessage('qBraid Chat Extension is now active!');
}

// Deactivate the extension
export function deactivate() {}
