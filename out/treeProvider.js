"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnippetsTreeDataProvider = exports.SnippetTreeItem = void 0;
const vscode = require("vscode");
class SnippetTreeItem extends vscode.TreeItem {
    constructor(labelInput, collapsibleState, snippet, group, command) {
        // Ekstrak string label dari TreeItemLabel jika perlu
        const labelString = typeof labelInput === 'string' ? labelInput : labelInput.label;
        super(labelInput, collapsibleState);
        // Set properti public
        this.label = labelString;
        this.group = group;
        this.snippet = snippet;
        // Tooltip yang lebih informatif
        if (snippet) {
            this.tooltip = `${snippet.title}\n${snippet.content.substring(0, 100)}${snippet.content.length > 100 ? '...' : ''}\n\nType: ${snippet.type}\nGroup: ${snippet.group}`;
        }
        else {
            this.tooltip = labelString;
        }
        if (snippet) {
            this.contextValue = `snippet-${snippet.type}`;
            // Gunakan icon yang lebih spesifik berdasarkan tipe
            if (snippet.type === 'terminal') {
                this.iconPath = new vscode.ThemeIcon('terminal');
            }
            else {
                this.iconPath = new vscode.ThemeIcon('symbol-snippet');
            }
            // Tambahkan deskripsi dengan tipe snippet
            this.description = snippet.type === 'terminal' ? 'Terminal' : 'Code';
            // Beri warna berbeda untuk tipe yang berbeda
            if (snippet.type === 'terminal') {
                this.resourceUri = vscode.Uri.parse('terminal://snippet');
            }
        }
        else if (group) {
            this.contextValue = 'group';
            // Set icon untuk grup dengan folder
            this.iconPath = new vscode.ThemeIcon('folder-opened');
        }
        // Set command jika ada
        if (command) {
            this.command = command;
        }
    }
}
exports.SnippetTreeItem = SnippetTreeItem;
class SnippetsTreeDataProvider {
    constructor(manager) {
        this.manager = manager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        // Debug: log label & contextValue untuk inspeksi saat development
        try {
            // eslint-disable-next-line no-console
            console.log(`[SnippetsTree] getTreeItem: label=${element.label}, contextValue=${element.contextValue}`);
        }
        catch (e) { }
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Root: show groups (sorted alphabetically)
            const data = this.manager.getData();
            const sortedGroups = [...data.groups].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            return Promise.resolve(sortedGroups.map(g => {
                const snippetsInGroup = data.snippets.filter(s => s.group === g);
                const groupItem = new SnippetTreeItem(g, vscode.TreeItemCollapsibleState.Expanded, // Buka default untuk better UX
                undefined, g);
                // Tambahkan deskripsi dengan jumlah snippet
                const itemCount = snippetsInGroup.length;
                const terminalCount = snippetsInGroup.filter(s => s.type === 'terminal').length;
                const codeCount = itemCount - terminalCount;
                // Buat deskripsi yang lebih informatif
                if (terminalCount > 0 && codeCount > 0) {
                    groupItem.description = `${itemCount} items (${codeCount} code, ${terminalCount} terminal)`;
                }
                else if (terminalCount > 0) {
                    groupItem.description = `${itemCount} terminal${itemCount !== 1 ? 's' : ''}`;
                }
                else {
                    groupItem.description = `${itemCount} snippet${itemCount !== 1 ? 's' : ''}`;
                }
                return groupItem;
            }));
        }
        if (element.group) {
            // Inside a group: show snippets (sorted alphabetically by title)
            const data = this.manager.getData();
            const snippets = data.snippets.filter(s => s.group === element.group);
            const sortedSnippets = [...snippets].sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
            return Promise.resolve(sortedSnippets.map(s => {
                const item = new SnippetTreeItem(s.title, // Hapus indentasi manual
                vscode.TreeItemCollapsibleState.None, s, undefined, {
                    command: s.type === 'terminal' ? 'rajaSnippets.runSnippet' : 'rajaSnippets.insertSnippet',
                    title: s.type === 'terminal' ? 'Run in Terminal' : 'Insert Snippet',
                    arguments: [{ snippet: s }]
                });
                // Set icon untuk posisi yang lebih rapi
                if (s.type === 'terminal') {
                    item.iconPath = new vscode.ThemeIcon('terminal');
                }
                else {
                    item.iconPath = new vscode.ThemeIcon('code');
                }
                // Tambahkan deskripsi sebagai indikator tipe
                item.description = s.type === 'terminal' ? 'Terminal' : 'Code';
                // Atur resourceUri untuk visualisasi yang lebih baik
                if (s.type === 'terminal') {
                    item.resourceUri = vscode.Uri.parse('terminal://snippet');
                }
                return item;
            }));
        }
        return Promise.resolve([]);
    }
}
exports.SnippetsTreeDataProvider = SnippetsTreeDataProvider;
//# sourceMappingURL=treeProvider.js.map