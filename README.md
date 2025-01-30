# qBraid Chat Extension for VS Code

## 📝 Overview
qBraid Chat is a **VS Code extension** that allows users to interact with **qBraid's AI-powered chat system** directly within the editor. It provides **real-time AI assistance** for **quantum computing, coding, and general queries**.

## 🚀 Features
✔ **Seamless Chat UI** inside VS Code  
✔ **Supports multiple AI models**  
✔ **Easy API key configuration**  
✔ **Auto-scroll & real-time responses**  
✔ **Enter to send, Shift+Enter for new line**  
✔ **Optimized for both light & dark themes**  

---

## 📦 **Installation Guide**

### **1⃣ Install from VSIX**
If you have the `.vsix` file, install the extension manually:
```sh
code --install-extension qbraid-chat-0.1.0.vsix
```
Or manually:
1. Open **VS Code**  
2. Go to **Extensions (`Ctrl+Shift+X`)**  
3. Click **"Install from VSIX..."**  
4. Select **`qbraid-chat-0.1.0.vsix`**

---

### **2 Install from Source**
1. **Download the File**:
   ```sh
   Extract qbraid-chat.zip
   cd qbraid-chat
   ```
2. **Install Dependencies**:
   ```sh
   npm install
   ```
3. **Compile the Extension**:
   ```sh
   npm run compile
   ```
4. **Run the Extension in VS Code**:
   ```sh
   code --install-extension qbraid-chat-0.1.0.vsix
   ```

---

## 🔑 **API Key Configuration**
To use the qBraid Chat Extension, you must **configure your API key**.

### **1 Locate Configuration File**
The API key must be stored in the **configuration file** located at:
```
~/.qbraid/qbraidrc
```

### **2 Add API Key**
1. Open the terminal and run:
   ```sh
   nano ~/.qbraid/qbraidrc
   ```
2. Add the following content:
   ```
   [default]
   api-key = YOUR_QBRAID_API_KEY
   ```
3. **Save the file** (`Ctrl+X` → `Y` → `Enter`).

### **3 Verify API Key**
To ensure your API key is properly set up, run:
```sh
cat ~/.qbraid/qbraidrc
```
It should display:
```
[default]
api-key = YOUR_QBRAID_API_KEY
```

---

## ⚙️ **Usage Guide**
1. **Open VS Code**  
2. Click the **qBraid Chat Icon** in the Activity Bar  
3. **Select a Model** from the dropdown  
4. **Type your message**  
5. **Press `Enter` to send, `Shift+Enter` for a new line**  

---

## 🖥️ **User Interface**
| Element | Description |
|---------|------------|
| **Chat Box** | Displays user messages and AI responses |
| **Model Selector** | Choose an AI model for responses |
| **Input Field** | Type your message here |
| **Send Button** | Click to send a message |
| **Activity Bar Icon** | Opens the qBraid Chat UI |

---

## 🔍 **Troubleshooting**
### ❌ **Issue: Chat Icon Not Visible**
✔ **Fix**: Restart VS Code and reinstall:
```sh
rm -rf ~/.vscode/extensions/rajatbalda.qbraid-chat*
code .
```

### ❌ **Issue: Messages Sent Multiple Times**
✔ **Fix**: Run:
```sh
rm -rf ~/.vscode/extensions/rajatbalda.qbraid-chat*
npm run compile
code .
```

### ❌ **Issue: No Response from AI**
✔ **Fix**: Check API key:
```sh
cat ~/.qbraid/qbraidrc
```
Ensure the format is correct:
```
[default]
api-key = YOUR_QBRAID_API_KEY
```

---


### 🎯 **Developed by Rajat Balda**
For support, reach out via contact@rajatbalda.in.
