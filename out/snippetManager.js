"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnippetManager = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
class SnippetManager {
    constructor(ctx) {
        this.ctx = ctx;
        // Determine storage location: prefer user-configured path, fallback to globalStorage
        const cfgPath = vscode.workspace.getConfiguration('rajaSnippetsManager').get('storagePath');
        const basePath = cfgPath && cfgPath.length > 0 ? cfgPath : ctx.globalStorageUri.fsPath;
        this.dataFile = path.join(basePath, 'snippets.json');
        fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
    }
    getDataFilePath() {
        return this.dataFile;
    }
    async setStoragePath(newDir) {
        if (!newDir) {
            return;
        }
        fs.mkdirSync(newDir, { recursive: true });
        const newFile = path.join(newDir, 'snippets.json');
        // If current file exists and new file doesn't exist, copy it to new location
        if (fs.existsSync(this.dataFile) && !fs.existsSync(newFile)) {
            try {
                fs.copyFileSync(this.dataFile, newFile);
            }
            catch (e) {
                // ignore copy errors, will write default below if needed
            }
        }
        // If new file already exists, use it instead of overwriting
        if (fs.existsSync(newFile)) {
            // Check if the existing file has valid data
            try {
                const content = fs.readFileSync(newFile, 'utf8');
                JSON.parse(content); // Just to validate it's valid JSON
            }
            catch (e) {
                // If invalid JSON, create a new default file
                fs.writeFileSync(newFile, JSON.stringify({ groups: ['default'], snippets: [] }, null, 2));
            }
        }
        else {
            // Ensure there's a file at newFile
            fs.writeFileSync(newFile, JSON.stringify({ groups: ['default'], snippets: [] }, null, 2));
        }
        this.dataFile = newFile;
        // Persist choice in user settings
        await vscode.workspace.getConfiguration('rajaSnippetsManager').update('storagePath', newDir, vscode.ConfigurationTarget.Global);
    }
    async openStorage() {
        if (!fs.existsSync(this.dataFile)) {
            // create default file if missing
            await this.saveData({ groups: ['default'], snippets: [] });
        }
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(this.dataFile));
        await vscode.window.showTextDocument(doc);
    }
    getData() {
        if (!fs.existsSync(this.dataFile)) {
            return { groups: ['default'], snippets: [] };
        }
        const raw = fs.readFileSync(this.dataFile, 'utf8');
        try {
            return JSON.parse(raw);
        }
        catch {
            return { groups: ['default'], snippets: [] };
        }
    }
    async saveData(data) {
        fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    }
    async addGroup(name) {
        const data = this.getData();
        if (!data.groups.includes(name)) {
            data.groups.push(name);
            await this.saveData(data);
        }
    }
    async createSnippet() {
        const title = await vscode.window.showInputBox({ prompt: 'Masukkan judul snippet' });
        if (!title) {
            return;
        }
        // Panggil webview editor untuk membuat snippet baru tanpa membuat file untitled
        this.openSnippetEditor({ title, content: '', type: 'code' });
    }
    async addSnippet(group, title, content, type) {
        const data = this.getData();
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        data.snippets.push({ id, title, content, group, type });
        await this.saveData(data);
    }
    listAll() {
        return this.getData().snippets.slice();
    }
    findByTitle(title) {
        return this.getData().snippets.find((s) => s.title === title);
    }
    async pickGroup() {
        const data = this.getData();
        const pick = await vscode.window.showQuickPick(data.groups, { placeHolder: 'Pilih grup' });
        return pick;
    }
    async pickSnippet() {
        const data = this.getData();
        const items = data.snippets.map((s) => ({ label: s.title, description: s.group, id: s.id }));
        const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Pilih snippet' });
        if (!pick) {
            return undefined;
        }
        return data.snippets.find((s) => s.id === pick.id);
    }
    async deleteSnippet(id) {
        const data = this.getData();
        const idx = data.snippets.findIndex((s) => s.id === id);
        if (idx >= 0) {
            data.snippets.splice(idx, 1);
            await this.saveData(data);
            return true;
        }
        return false;
    }
    async updateSnippet(id, patch) {
        const data = this.getData();
        const snippet = data.snippets.find((s) => s.id === id);
        if (!snippet) {
            return false;
        }
        Object.assign(snippet, patch);
        await this.saveData(data);
        return true;
    }
    async deleteGroup(name) {
        const data = this.getData();
        const idx = data.groups.indexOf(name);
        if (idx < 0) {
            return false;
        }
        data.groups.splice(idx, 1);
        // Remove or reassign snippets in the deleted group
        data.snippets = data.snippets.filter((s) => s.group !== name);
        await this.saveData(data);
        return true;
    }
    exportAsJson() {
        const data = this.getData();
        return JSON.stringify(data, null, 2);
    }
    async importFromJson(jsonStr) {
        const imported = JSON.parse(jsonStr);
        if (imported.groups && Array.isArray(imported.snippets)) {
            await this.saveData(imported);
        }
        else {
            throw new Error('Invalid JSON format');
        }
    }
    // Fungsi untuk membuka webview editor
    openSnippetEditor(snippet) {
        const panel = vscode.window.createWebviewPanel('snippetEditor', `Edit Snippet: ${snippet.title}`, vscode.ViewColumn.Active, { enableScripts: true });
        panel.webview.html = this.getSnippetEditorHtml(snippet);
        // Tambahkan komunikasi dengan webview jika diperlukan
        // panel.webview.onDidReceiveMessage(message => { ... });
    }
    // Tambahkan method untuk menghasilkan konten HTML webview editor
    getSnippetEditorHtml(snippet) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src vscode-resource: 'unsafe-inline'; script-src vscode-resource:;">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Edit Snippet</title>
        </head>
        <body>
            <h1>Edit Snippet: ${snippet.title}</h1>
            <form id="snippetForm">
                <label>Konten:</label><br>
                <textarea id="content" style="width:100%; height:200px;">${snippet.content}</textarea><br>
                <label>Tipe Snippet:</label><br>
                <select id="snippetType">
                    <option value="code" ${snippet.type === 'code' ? 'selected' : ''}>Kode</option>
                    <option value="terminal" ${snippet.type === 'terminal' ? 'selected' : ''}>Terminal</option>
                </select><br>
                <button type="button" onclick="submitSnippet()">Simpan</button>
            </form>
            <script>
                const vscode = acquireVsCodeApi();
                function submitSnippet() {
                    const content = document.getElementById('content').value;
                    const type = document.getElementById('snippetType').value;
                    vscode.postMessage({ command: 'saveSnippet', content, type });
                }
            </script>
        </body>
        </html>
    `;
    }
    async importSnippets(snippets) {
        const data = this.getData();
        data.snippets.push(...snippets);
        await this.saveData(data);
    }
    async replaceSnippets(snippets) {
        const data = this.getData();
        data.snippets = snippets;
        await this.saveData(data);
    }
}
exports.SnippetManager = SnippetManager;
//# sourceMappingURL=snippetManager.js.map