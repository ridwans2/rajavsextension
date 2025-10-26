"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const phosphor_icons_list_1 = require("./phosphor-icons-list");
const vscode = require("vscode");
const fs = require("fs");
const snippetManager_1 = require("./snippetManager");
const treeProvider_1 = require("./treeProvider");
const phosphorIconsTree_1 = require("./phosphorIconsTree");
/**
 * Resolve dynamic placeholders like {$variable} in snippet content
 * Prompts user for each placeholder and replaces them.
 */
async function resolvePlaceholders(template) {
    // Find all {$name} placeholders using regex
    const placeholderRegex = /\{\$(\w+)\}/g;
    const placeholders = new Map();
    let match;
    // Extract unique placeholder names
    while ((match = placeholderRegex.exec(template)) !== null) {
        const name = match[1];
        if (!placeholders.has(name)) {
            placeholders.set(name, undefined);
        }
    }
    // Prompt user for each placeholder
    for (const [name] of placeholders) {
        const value = await vscode.window.showInputBox({
            prompt: `Masukkan nilai untuk ${name}`,
            placeHolder: name,
            validateInput: (val) => {
                if (val.trim() === '')
                    return 'Nilai tidak boleh kosong';
                return null;
            }
        });
        if (value === undefined) {
            // User cancelled, abort insertion
            throw new Error('Operasi dibatalkan');
        }
        placeholders.set(name, value);
    }
    // Replace placeholders in the template
    let resolved = template;
    for (const [name, value] of placeholders) {
        if (value !== undefined) {
            const regex = new RegExp(`\\{\\$${name}\\}`, 'g');
            resolved = resolved.replace(regex, value);
        }
    }
    return resolved;
}
function activate(context) {
    // Raja Snippets Manager activation
    const manager = new snippetManager_1.SnippetManager(context);
    const treeProvider = new treeProvider_1.SnippetsTreeDataProvider(manager);
    vscode.window.registerTreeDataProvider('rajaSnippetsExplorer', treeProvider);
    // Raja Folding activation
    console.log('Raja VsExtension is now active!');
    // Register snippets commands
    context.subscriptions.push(vscode.commands.registerCommand('rajaSnippets.refresh', () => treeProvider.refresh()), vscode.commands.registerCommand('rajaSnippets.addSnippetToGroup', async (groupItem) => {
        // Perbaikan: Mendapatkan nama grup dengan benar
        const groupName = typeof groupItem.label === 'string' ? groupItem.label : groupItem.label.label;
        const title = await vscode.window.showInputBox({
            prompt: 'Masukkan judul snippet',
            placeHolder: 'Snippet Saya'
        });
        if (!title) {
            return;
        }
        // Create empty snippet and open a webview editor (no Untitled file)
        await manager.addSnippet(groupName, title, '', 'code');
        const snippets = manager.getData().snippets;
        const newSnippet = snippets[snippets.length - 1];
        // Refresh tree view segera setelah menambah snippet
        treeProvider.refresh();
        // Open a webview panel to edit the newly created snippet (same UX as edit flow)
        const panel = vscode.window.createWebviewPanel('rajaSnippetEditor', `Edit: ${newSnippet.title}`, vscode.ViewColumn.One, { enableScripts: true });
        const escapeHtml = (s) => {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        };
        panel.webview.html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding: 12px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
          label { display:block; margin-top:8px; font-weight:600 }
          input[type="text"], textarea, select { width:100%; box-sizing: border-box; padding:8px; margin-top:4px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
          textarea { min-height: 240px; font-family: monospace; white-space: pre; }
          .row { display:flex; gap:8px; margin-top:12px }
          button { padding:8px 12px; border-radius:4px; border:none; cursor:pointer; display: flex; align-items: center; gap: 4px; }
          button.save { background: var(--vscode-button-background); color: var(--vscode-button-foreground) }
          button.insert { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground) }
          button.run { background: var(--vscode-terminal-background); color: var(--vscode-terminal-foreground) }
          button.delete { background: var(--vscode-errorForeground); color: white }
        </style>
      </head>
      <body>
        <label>Judul</label>
        <input id="title" type="text" value="${escapeHtml(newSnippet.title)}" />

        <label>Content</label>
        <textarea id="content">${escapeHtml(newSnippet.content)}</textarea>

        <p style="font-size:11px;margin:0 0 8px 0;color:var(--vscode-descriptionForeground)">
          Tips: Gunakan placeholder dinamis seperti <code>{$nama}</code> untuk meminta input saat snippet disisipkan/dijalankan.
        </p>

        <label>Tipe</label>
        <select id="type">
          <option value="code" ${newSnippet.type === 'code' ? 'selected' : ''}>Kode</option>
          <option value="terminal" ${newSnippet.type === 'terminal' ? 'selected' : ''}>Terminal</option>
        </select>

        <label>Group</label>
        <select id="group">
          ${manager.getData().groups.map(g => `<option value="${escapeHtml(g)}" ${g === newSnippet.group ? 'selected' : ''}>${escapeHtml(g)}</option>`).join('')}
        </select>

        <div class="row">
          <button class="save" title="Simpan">💾 Simpan</button>
          <button id="insertBtn" class="insert" style="display: ${newSnippet.type === 'code' ? 'flex' : 'none'}" title="Sisipkan">+ Sisipkan</button>
          <button id="runBtn" class="run" style="display: ${newSnippet.type === 'terminal' ? 'flex' : 'none'}" title="Terminal"> Terminal ></button>
          <button class="delete" title="Hapus">🗑️ Hapus</button>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Debug: Log initial type
          console.log('Initial type:', document.getElementById('type')?.value);

          // Fungsi untuk mengubah tampilan tombol berdasarkan tipe
          function updateButtonsVisibility(type) {
            console.log('Updating buttons visibility for type:', type);
            const insertBtn = document.querySelector('#insertBtn');
            const runBtn = document.querySelector('#runBtn');

            if (insertBtn) {
              insertBtn.style.display = type === 'code' ? 'flex' : 'none';
              console.log('Insert button visibility:', type === 'code' ? 'flex' : 'none');
            }
            if (runBtn) {
              runBtn.style.display = type === 'terminal' ? 'flex' : 'none';
              console.log('Run button visibility:', type === 'terminal' ? 'flex' : 'none');
            }
          }

          // Event listener untuk perubahan tipe
          const typeSelect = document.getElementById('type');
          if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
              console.log('Type changed to:', e.target.value);
              updateButtonsVisibility(e.target.value);
            });

            // Initialize visibility based on current type
            updateButtonsVisibility(typeSelect.value);
          }

          document.querySelector('.save').addEventListener('click', () => {
            const title = document.getElementById('title').value;
            const content = document.getElementById('content').value;
            const type = document.getElementById('type').value;
            const group = document.getElementById('group').value;
            vscode.postMessage({ command: 'save', title, content, type, group });
          });

          const insertBtn = document.querySelector('#insertBtn');
          if (insertBtn) {
            insertBtn.addEventListener('click', () => {
              vscode.postMessage({ command: 'insert' });
            });
          }

          const runBtn = document.querySelector('#runBtn');
          if (runBtn) {
            runBtn.addEventListener('click', () => {
              vscode.postMessage({ command: 'run' });
            });
          }

          document.querySelector('.delete').addEventListener('click', () => {
            vscode.postMessage({ command: 'delete' });
          });
        </script>
      </body>
      </html>`;
        const msgDisp = panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'save') {
                await manager.updateSnippet(newSnippet.id, { title: msg.title, content: msg.content, type: msg.type, group: msg.group });
                vscode.window.showInformationMessage('Snippet telah disimpan.');
                treeProvider.refresh();
                panel.dispose();
            }
            else if (msg.command === 'insert') {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor');
                    return;
                }
                try {
                    const contentToInsert = await resolvePlaceholders(newSnippet.content);
                    await editor.edit((editBuilder) => {
                        editBuilder.insert(editor.selection.active, contentToInsert);
                    });
                }
                catch {
                    // User cancelled placeholder input; do nothing
                }
            }
            else if (msg.command === 'run') {
                try {
                    const commandToRun = await resolvePlaceholders(newSnippet.content);
                    const term = vscode.window.activeTerminal ?? vscode.window.createTerminal('Raja Snippets');
                    term.show(true);
                    term.sendText(commandToRun, true);
                }
                catch {
                    // User cancelled placeholder input; do nothing
                }
            }
            else if (msg.command === 'delete') {
                const confirm = await vscode.window.showWarningMessage(`Hapus snippet '${newSnippet.title}'?`, 'Hapus', 'Batal');
                if (confirm === 'Hapus') {
                    await manager.deleteSnippet(newSnippet.id);
                    vscode.window.showInformationMessage('Snippet telah dihapus.');
                    treeProvider.refresh();
                    panel.dispose();
                }
            }
        });
        panel.onDidDispose(() => msgDisp.dispose());
    }), vscode.commands.registerCommand('rajaSnippets.addGroupInline', async () => {
        const name = await vscode.window.showInputBox({ prompt: 'Group name' });
        if (!name) {
            return;
        }
        await manager.addGroup(name);
        vscode.window.showInformationMessage(`Group '${name}' created.`);
        treeProvider.refresh();
    }), vscode.commands.registerCommand('rajaSnippets.deleteGroupFromTree', async (groupItem) => {
        // Perbaikan: Mendapatkan nama grup dengan benar
        const groupName = typeof groupItem.label === 'string' ? groupItem.label : groupItem.label.label;
        const confirmation = await vscode.window.showWarningMessage(`Apakah Anda yakin ingin menghapus grup '${groupName}'? Semua snippet di dalamnya akan ikut terhapus.`, { modal: true }, 'Hapus');
        if (confirmation === 'Hapus') {
            await manager.deleteGroup(groupName);
            vscode.window.showInformationMessage(`Group '${groupName}' deleted.`);
            treeProvider.refresh();
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('rajaSnippets.addGroup', async () => {
        const name = await vscode.window.showInputBox({ prompt: 'Group name' });
        if (!name) {
            return;
        }
        await manager.addGroup(name);
        vscode.window.showInformationMessage(`Group '${name}' created.`);
        treeProvider.refresh();
    }), vscode.commands.registerCommand('rajaSnippets.addSnippet', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Open a file and select text to save as snippet');
            return;
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection) || editor.document.getText();
        const title = await vscode.window.showInputBox({ prompt: 'Snippet title' });
        if (!title) {
            return;
        }
        const group = await manager.pickGroup();
        if (!group) {
            return;
        }
        const type = 'code'; // Default new snippets from editor are code type
        await manager.addSnippet(group, title, text, type);
        vscode.window.showInformationMessage(`Snippet '${title}' saved to '${group}'.`);
        treeProvider.refresh();
    }), vscode.commands.registerCommand('rajaSnippets.insertSnippet', async (item) => {
        let snippet;
        if (item?.snippet) {
            snippet = item.snippet;
        }
        else {
            // Filter hanya snippet tipe code untuk quick pick
            const codeSnippets = manager.getData().snippets.filter(s => s.type === 'code');
            const pick = await vscode.window.showQuickPick(codeSnippets.map(s => ({ label: s.title, description: s.group, snippet: s })), { placeHolder: 'Pilih snippet kode' });
            if (!pick) {
                return;
            }
            snippet = pick.snippet;
        }
        if (!snippet) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        const contentToInsert = await resolvePlaceholders(snippet.content);
        await editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, contentToInsert);
        });
    }), vscode.commands.registerCommand('rajaSnippets.runSnippet', async (item) => {
        let snippet;
        if (item?.snippet) {
            snippet = item.snippet;
        }
        else {
            // Filter hanya snippet tipe terminal untuk quick pick
            const terminalSnippets = manager.getData().snippets.filter(s => s.type === 'terminal');
            const pick = await vscode.window.showQuickPick(terminalSnippets.map(s => ({ label: s.title, description: s.group, snippet: s })), { placeHolder: 'Pilih perintah terminal' });
            if (!pick) {
                return;
            }
            snippet = pick.snippet;
        }
        if (!snippet) {
            return;
        }
        const term = vscode.window.activeTerminal ?? vscode.window.createTerminal('Raja Snippets');
        term.show(true);
        const commandToRun = await resolvePlaceholders(snippet.content);
        term.sendText(commandToRun, true);
    }), vscode.commands.registerCommand('rajaSnippets.listSnippets', async () => {
        const items = manager.listAll();
        const pick = await vscode.window.showQuickPick(items.map((i) => ({ label: i.title, description: i.group })), { placeHolder: 'Select snippet' });
        if (!pick) {
            return;
        }
        const s = manager.findByTitle(pick.label);
        if (s && vscode.window.activeTextEditor) {
            await vscode.window.activeTextEditor.insertSnippet(new vscode.SnippetString(s.content));
        }
    }), vscode.commands.registerCommand('rajaSnippets.editOrDeleteSnippet', async (item) => {
        const snippet = item?.snippet;
        if (!snippet) {
            return;
        }
        // Create a webview panel to edit the snippet with a small form
        const panel = vscode.window.createWebviewPanel('rajaSnippetEditor', `Edit: ${snippet.title}`, vscode.ViewColumn.One, { enableScripts: true });
        const escapeHtml = (s) => {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        };
        panel.webview.html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding: 12px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
          label { display:block; margin-top:8px; font-weight:600 }
          input[type="text"], textarea, select { width:100%; box-sizing: border-box; padding:8px; margin-top:4px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
          textarea { min-height: 240px; font-family: monospace; white-space: pre; }
          .row { display:flex; gap:8px; margin-top:12px }
          button { padding:8px 12px; border-radius:4px; border:none; cursor:pointer; display: flex; align-items: center; gap: 4px; }
          button.save { background: var(--vscode-button-background); color: var(--vscode-button-foreground) }
          button.insert { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground) }
          button.run { background: var(--vscode-terminal-background); color: var(--vscode-terminal-foreground) }
          button.delete { background: var(--vscode-errorForeground); color: white }
        </style>
      </head>
      <body>
        <label>Judul</label>
        <input id="title" type="text" value="${escapeHtml(snippet.title)}" />

        <label>Content</label>
        <textarea id="content">${escapeHtml(snippet.content)}</textarea>

        <p style="font-size:11px;margin:0 0 8px 0;color:var(--vscode-descriptionForeground)">
          Tips: Gunakan placeholder dinamis seperti <code>{$nama}</code> untuk meminta input saat snippet disisipkan/dijalankan.
        </p>

        <label>Tipe</label>
        <select id="type">
          <option value="code" ${snippet.type === 'code' ? 'selected' : ''}>Kode</option>
          <option value="terminal" ${snippet.type === 'terminal' ? 'selected' : ''}>Terminal</option>
        </select>

        <label>Group</label>
        <select id="group">
          ${manager.getData().groups.map(g => `<option value="${escapeHtml(g)}" ${g === snippet.group ? 'selected' : ''}>${escapeHtml(g)}</option>`).join('')}
        </select>

        <div class="row">
          <button class="save" title="Simpan">💾 Simpan</button>
          <button id="insertBtn" class="insert" style="display: ${snippet.type === 'code' ? 'flex' : 'none'}" title="Sisipkan">+ Sisipkan</button>
          <button id="runBtn" class="run" style="display: ${snippet.type === 'terminal' ? 'flex' : 'none'}" title="Terminal"> Terminal ></button>
          <button class="delete" title="Hapus">🗑️ Hapus</button>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          // Fungsi untuk mengubah tampilan tombol berdasarkan tipe
          function updateButtonsVisibility(type) {
            const insertBtn = document.querySelector('#insertBtn');
            const runBtn = document.querySelector('#runBtn');

            if (insertBtn) {
              insertBtn.style.display = type === 'code' ? 'flex' : 'none';
            }
            if (runBtn) {
              runBtn.style.display = type === 'terminal' ? 'flex' : 'none';
            }
          }

          // Event listener untuk perubahan tipe
          document.getElementById('type').addEventListener('change', (e) => {
            updateButtonsVisibility(e.target.value);
          });

          document.querySelector('.save').addEventListener('click', () => {
            const title = document.getElementById('title').value;
            const content = document.getElementById('content').value;
            const type = document.getElementById('type').value;
            const group = document.getElementById('group').value;
            vscode.postMessage({ command: 'save', title, content, type, group });
          });

          const insertBtn = document.querySelector('#insertBtn');
          if (insertBtn) {
            insertBtn.addEventListener('click', () => {
              vscode.postMessage({ command: 'insert' });
            });
          }

          const runBtn = document.querySelector('#runBtn');
          if (runBtn) {
            runBtn.addEventListener('click', () => {
              vscode.postMessage({ command: 'run' });
            });
          }

          document.querySelector('.delete').addEventListener('click', () => {
            vscode.postMessage({ command: 'delete' });
          });
        </script>
      </body>
      </html>`;
        const msgDisp = panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'save') {
                await manager.updateSnippet(snippet.id, { title: msg.title, content: msg.content, type: msg.type, group: msg.group });
                vscode.window.showInformationMessage('Snippet telah diperbarui.');
                treeProvider.refresh();
                panel.dispose();
            }
            else if (msg.command === 'insert') {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor');
                    return;
                }
                try {
                    const contentToInsert = await resolvePlaceholders(snippet.content);
                    await editor.edit((editBuilder) => {
                        editBuilder.insert(editor.selection.active, contentToInsert);
                    });
                }
                catch {
                    // User cancelled placeholder input; do nothing
                }
            }
            else if (msg.command === 'run') {
                try {
                    const commandToRun = await resolvePlaceholders(snippet.content);
                    const term = vscode.window.activeTerminal ?? vscode.window.createTerminal('Raja Snippets');
                    term.show(true);
                    term.sendText(commandToRun, true);
                }
                catch {
                    // User cancelled placeholder input; do nothing
                }
            }
            else if (msg.command === 'delete') {
                const confirm = await vscode.window.showWarningMessage(`Hapus snippet '${snippet.title}'?`, 'Hapus', 'Batal');
                if (confirm === 'Hapus') {
                    await manager.deleteSnippet(snippet.id);
                    vscode.window.showInformationMessage('Snippet telah dihapus.');
                    treeProvider.refresh();
                    panel.dispose();
                }
            }
        });
        panel.onDidDispose(() => msgDisp.dispose());
    }), vscode.commands.registerCommand('rajaSnippets.changeSnippetType', async (item) => {
        const snippet = item?.snippet;
        if (!snippet) {
            return;
        }
        const newType = await vscode.window.showQuickPick([
            { label: '$(code) Snippet Kode', value: 'code' },
            { label: '$(terminal) Perintah Terminal', value: 'terminal' }
        ], { placeHolder: 'Pilih tipe snippet' });
        if (newType && newType.value !== snippet.type) {
            await manager.updateSnippet(snippet.id, { type: newType.value });
            vscode.window.showInformationMessage('Tipe snippet telah diperbarui.');
            treeProvider.refresh();
        }
    }), 
    // Show snippet actions as a QuickPick (clickable icons) — alternative to inline hover-icons
    vscode.commands.registerCommand('rajaSnippets.showSnippetActions', async (item) => {
        const snippet = item?.snippet;
        if (!snippet) {
            return;
        }
        const picks = [
            { label: '$(insert) Sisipkan', description: 'Sisipkan snippet pada kursor', action: 'insert' },
            { label: '$(terminal) Jalankan', description: 'Jalankan di terminal', action: 'run' },
            { label: '$(edit) Edit', description: 'Edit snippet', action: 'edit' },
            { label: '$(trash) Hapus', description: 'Hapus snippet', action: 'delete' }
        ];
        const pick = await vscode.window.showQuickPick(picks, { placeHolder: 'Pilih aksi untuk snippet' });
        if (!pick) {
            return;
        }
        switch (pick.action) {
            case 'insert':
                await vscode.commands.executeCommand('rajaSnippets.insertSnippet', { snippet });
                break;
            case 'run':
                await vscode.commands.executeCommand('rajaSnippets.runSnippet', { snippet });
                break;
            case 'edit':
                await vscode.commands.executeCommand('rajaSnippets.editOrDeleteSnippet', { snippet });
                break;
            case 'delete':
                const confirm = await vscode.window.showWarningMessage(`Hapus snippet '${snippet.title}'?`, 'Hapus', 'Batal');
                if (confirm === 'Hapus') {
                    await manager.deleteSnippet(snippet.id);
                    vscode.window.showInformationMessage('Snippet telah dihapus.');
                    treeProvider.refresh();
                }
                break;
        }
    }), 
    // Show all snippet actions in a submenu
    vscode.commands.registerCommand('rajaSnippets.showAllSnippetActions', async (item) => {
        const snippet = item?.snippet;
        if (!snippet) {
            return;
        }
        const picks = [
            { label: '$(insert) Sisipkan', description: '', action: 'insert' },
            { label: '$(terminal) Jalankan', description: 'Jalankan di terminal', action: 'run' },
            { label: '$(edit) Edit', description: '', action: 'edit' },
            { label: '$(gear) Ganti Tipe', description: '', action: 'change-type' },
            { label: '$(trash) Hapus', description: '', action: 'delete' }
        ];
        const pick = await vscode.window.showQuickPick(picks, { placeHolder: 'Pilih aksi untuk snippet' });
        if (!pick) {
            return;
        }
        switch (pick.action) {
            case 'insert':
                await vscode.commands.executeCommand('rajaSnippets.insertSnippet', { snippet });
                break;
            case 'run':
                await vscode.commands.executeCommand('rajaSnippets.runSnippet', { snippet });
                break;
            case 'edit':
                await vscode.commands.executeCommand('rajaSnippets.editOrDeleteSnippet', { snippet });
                break;
            case 'change-type':
                await vscode.commands.executeCommand('rajaSnippets.changeSnippetType', { snippet });
                break;
            case 'delete':
                await vscode.commands.executeCommand('rajaSnippets.deleteSnippet', { snippet });
                break;
        }
    }), 
    // Show group actions in a submenu
    vscode.commands.registerCommand('rajaSnippets.showGroupActions', async (item) => {
        const groupName = typeof item.label === 'string' ? item.label : item.label.label;
        const picks = [
            { label: '$(add) Tambah Snippet', description: '', action: 'add' },
            { label: '$(refresh) Refresh Grup', description: '', action: 'refresh' },
            { label: '$(export) Export Grup', description: '', action: 'export' },
            { label: '$(trash) Hapus Grup', description: '', action: 'delete' }
        ];
        const pick = await vscode.window.showQuickPick(picks, { placeHolder: 'Pilih aksi untuk grup' });
        if (!pick) {
            return;
        }
        switch (pick.action) {
            case 'add':
                await vscode.commands.executeCommand('rajaSnippets.addSnippetToGroup', item);
                break;
            case 'refresh':
                treeProvider.refresh();
                vscode.window.showInformationMessage('Grup telah di-refresh.');
                break;
            case 'export':
                // Export only the selected group
                try {
                    const data = manager.getData();
                    const groupSnippets = data.snippets.filter(s => s.group === groupName);
                    const exportData = {
                        groups: [groupName],
                        snippets: groupSnippets
                    };
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(`${groupName}-snippets.json`),
                        filters: { 'JSON files': ['json'] },
                        saveLabel: 'Export Grup'
                    });
                    if (uri) {
                        const fs = require('fs');
                        fs.writeFileSync(uri.fsPath, JSON.stringify(exportData, null, 2));
                        vscode.window.showInformationMessage(`Berhasil export ${groupSnippets.length} snippets dari grup '${groupName}'.`);
                    }
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Gagal export grup: ${error.message}`);
                }
                break;
            case 'delete':
                await vscode.commands.executeCommand('rajaSnippets.deleteGroupFromTree', item);
                break;
        }
    }), vscode.commands.registerCommand('rajaSnippets.deleteGroup', async () => {
        const group = await manager.pickGroup();
        if (!group) {
            return;
        }
        const confirm = await vscode.window.showWarningMessage(`Delete group '${group}' and all its snippets?`, 'Delete', 'Cancel');
        if (confirm === 'Delete') {
            await manager.deleteGroup(group);
            vscode.window.showInformationMessage(`Group '${group}' deleted.`);
            treeProvider.refresh();
        }
    }), vscode.commands.registerCommand('rajaSnippets.deleteSnippet', async (item) => {
        const snippet = item?.snippet;
        if (!snippet) {
            return;
        }
        const confirm = await vscode.window.showWarningMessage(`Hapus snippet '${snippet.title}'?`, 'Hapus', 'Batal');
        if (confirm === 'Hapus') {
            await manager.deleteSnippet(snippet.id);
            vscode.window.showInformationMessage('Snippet telah dihapus.');
            treeProvider.refresh();
        }
    }), vscode.commands.registerCommand('rajaSnippets.exportJson', async () => {
        const json = manager.exportAsJson();
        const uri = await vscode.window.showSaveDialog({ filters: { JSON: ['json'] }, defaultUri: vscode.Uri.file('snippets.json') });
        if (!uri) {
            return;
        }
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(uri, encoder.encode(json));
        vscode.window.showInformationMessage('Snippet berhasil diekspor.');
    }), vscode.commands.registerCommand('rajaSnippets.importJson', async () => {
        const uri = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { JSON: ['json'] } });
        if (!uri) {
            return;
        }
        const bytes = await vscode.workspace.fs.readFile(uri[0]);
        const decoder = new TextDecoder();
        const json = decoder.decode(bytes);
        try {
            await manager.importFromJson(json);
            vscode.window.showInformationMessage('Snippet berhasil diimpor.');
            treeProvider.refresh();
        }
        catch (e) {
            vscode.window.showErrorMessage('Impor gagal. Format JSON tidak valid.');
        }
    }));
    // New storage commands
    context.subscriptions.push(vscode.commands.registerCommand('rajaSnippets.openStorage', async () => {
        await manager.openStorage();
    }), vscode.commands.registerCommand('rajaSnippets.showStoragePath', async () => {
        const p = manager.getDataFilePath();
        vscode.window.showInformationMessage(`Snippets storage: ${p}`);
    }), vscode.commands.registerCommand('rajaSnippets.configureStorage', async () => {
        const uri = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false, openLabel: 'Pilih folder untuk menyimpan snippets' });
        if (!uri || uri.length === 0) {
            return;
        }
        const folder = uri[0].fsPath;
        const snippetsFile = require('path').join(folder, 'snippets.json');
        const fs = require('fs');
        let message = `Snippets storage diset ke: ${folder}`;
        // Check if snippets.json already exists in the selected folder
        if (fs.existsSync(snippetsFile)) {
            try {
                const content = fs.readFileSync(snippetsFile, 'utf8');
                const data = JSON.parse(content);
                const snippetCount = data.snippets ? data.snippets.length : 0;
                const groupCount = data.groups ? data.groups.length : 0;
                message = `Snippets storage diset ke: ${folder}. Menggunakan file yang sudah ada dengan ${snippetCount} snippet di ${groupCount} grup.`;
            }
            catch (e) {
                message = `Snippets storage diset ke: ${folder}. File snippets.json ditemukan tapi tidak valid, akan membuat file baru.`;
            }
        }
        await manager.setStoragePath(folder);
        vscode.window.showInformationMessage(message);
        treeProvider.refresh();
    }), vscode.commands.registerCommand('rajaSnippets.exportSnippets', async () => {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('snippets.json'),
            filters: { 'JSON files': ['json'] },
            saveLabel: 'Export Snippets'
        });
        if (!uri) {
            return;
        }
        try {
            const data = manager.getData();
            const content = JSON.stringify(data, null, 2);
            fs.writeFileSync(uri.fsPath, content, 'utf8');
            vscode.window.showInformationMessage(`Berhasil export ${data.snippets.length} snippets ke ${uri.fsPath}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Gagal export snippets: ${error.message}`);
        }
    }), vscode.commands.registerCommand('rajaSnippets.importSnippets', async () => {
        const uri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: { 'JSON files': ['json'] },
            openLabel: 'Import Snippets'
        });
        if (!uri || uri.length === 0) {
            return;
        }
        try {
            const content = fs.readFileSync(uri[0].fsPath, 'utf8');
            const importData = JSON.parse(content);
            if (!importData.snippets || !Array.isArray(importData.snippets)) {
                throw new Error('File tidak valid: tidak ada array snippets');
            }
            const currentData = manager.getData();
            // Tanyakan apakah ingin merge atau replace
            const action = await vscode.window.showQuickPick([
                { label: 'Merge', description: 'Gabungkan dengan snippets yang ada' },
                { label: 'Replace', description: 'Ganti semua snippets yang ada' }
            ], { placeHolder: 'Pilih aksi import' });
            if (!action) {
                return;
            }
            if (action.label === 'Merge') {
                // Merge snippets
                await manager.importSnippets(importData.snippets);
                vscode.window.showInformationMessage(`Berhasil mengimpor ${importData.snippets.length} snippets (merged)`);
            }
            else {
                // Replace all snippets
                await manager.replaceSnippets(importData.snippets);
                vscode.window.showInformationMessage(`Berhasil mengimpor ${importData.snippets.length} snippets (replaced)`);
            }
            treeProvider.refresh();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Gagal import snippets: ${error.message}`);
        }
    }));
    // Raja Folding commands
    let foldAll = vscode.commands.registerCommand('rajaFolding.foldAll', () => {
        vscode.commands.executeCommand('editor.foldAll');
    });
    let unfoldAll = vscode.commands.registerCommand('rajaFolding.unfoldAll', () => {
        vscode.commands.executeCommand('editor.unfoldAll');
    });
    let foldByClass = vscode.commands.registerCommand('rajaFolding.foldByClass', () => {
        foldByPattern(/^class\s+/);
    });
    let foldByFunction = vscode.commands.registerCommand('rajaFolding.foldByFunction', () => {
        foldByPattern(/^(public\s+)?static\s+function\s+/);
    });
    let foldLevel1 = vscode.commands.registerCommand('rajaFolding.foldLevel1', () => {
        foldByIndentation(4);
    });
    let foldLevel2 = vscode.commands.registerCommand('rajaFolding.foldLevel2', () => {
        foldByIndentation(16);
    });
    let foldLevel3 = vscode.commands.registerCommand('rajaFolding.foldLevel3', () => {
        foldByIndentation(20);
    });
    let foldLevel4 = vscode.commands.registerCommand('rajaFolding.foldLevel4', () => {
        foldByIndentation(24);
    });
    let foldLevel5 = vscode.commands.registerCommand('rajaFolding.foldLevel5', () => {
        foldByIndentation(36);
    });
    let foldOthers = vscode.commands.registerCommand('rajaFolding.foldOthers', () => {
        // Fold comments and imports
        foldByPattern(/^\s*(\/\/|\/\*|import|from)/);
    });
    context.subscriptions.push(foldAll, unfoldAll, foldByClass, foldByFunction, foldLevel1, foldLevel2, foldLevel3, foldLevel4, foldLevel5, foldOthers);
    // Raja Icons commands
    let showGallery = vscode.commands.registerCommand('rajaIcons.showGallery', async () => {
        const iconData = await loadPhosphorIcons();
        vscode.window.showInformationMessage(`Loaded ${iconData.icons.length} Phosphor icons`);
        showIconsGallery(iconData);
    });
    context.subscriptions.push(showGallery);
    // Raja Icons Tree View
    const iconsTreeDataProvider = new phosphorIconsTree_1.IconsTreeDataProvider();
    const iconsTreeView = vscode.window.createTreeView('rajaIconsTree', {
        treeDataProvider: iconsTreeDataProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(iconsTreeView);
    // Command untuk copy icon (notifikasi singkat 0.5 detik)
    context.subscriptions.push(vscode.commands.registerCommand('rajaIcons.copyIcon', async (iconName) => {
        if (iconName) {
            await vscode.env.clipboard.writeText(`phosphor-${iconName}`);
            // Show temporary status bar notification for 0.5 seconds
            const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
            statusBarItem.text = `✓ Icon berhasil disalin: phosphor-${iconName}`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
            statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
            statusBarItem.show();
            // Hide after 0.5 seconds
            setTimeout(() => {
                statusBarItem.dispose();
            }, 500);
        }
    }));
    // Command untuk search icons
    context.subscriptions.push(vscode.commands.registerCommand('rajaIcons.searchIcons', async () => {
        const searchTerm = await vscode.window.showInputBox({
            prompt: 'Cari icon Phosphor',
            placeHolder: 'Masukkan nama icon, contoh: %heart% atau %arrow%',
            value: '%'
        });
        if (searchTerm !== undefined) {
            // Remove % characters and trim
            const cleanTerm = searchTerm.replace(/%/g, '').trim();
            iconsTreeDataProvider.refresh(cleanTerm);
        }
    }));
    // Command untuk clear search
    context.subscriptions.push(vscode.commands.registerCommand('rajaIcons.clearSearch', () => {
        iconsTreeDataProvider.refresh('');
    }));
}
exports.activate = activate;
async function loadPhosphorIcons() {
    // Use the complete Phosphor Icons list
    const allIcons = phosphor_icons_list_1.PHOSPHOR_ICONS;
    // Create categories based on common prefixes/themes
    const categories = {
        "Animals & Nature": allIcons.filter(icon => icon.includes('bird') || icon.includes('fish') || icon.includes('dog') || icon.includes('cat') ||
            icon.includes('tree') || icon.includes('leaf') || icon.includes('flower') || icon.includes('sun') ||
            icon.includes('moon') || icon.includes('star') || icon.includes('cloud') || icon.includes('rain') ||
            icon.includes('snow') || icon.includes('wind') || icon.includes('fire') || icon.includes('water')),
        "Arrows & Navigation": allIcons.filter(icon => icon.includes('arrow') || icon.includes('chevron') || icon.includes('caret') || icon.includes('angle') ||
            icon.includes('corner') || icon.includes('move') || icon.includes('direction')),
        "Communication": allIcons.filter(icon => icon.includes('chat') || icon.includes('message') || icon.includes('mail') || icon.includes('email') ||
            icon.includes('phone') || icon.includes('call') || icon.includes('video') || icon.includes('microphone') ||
            icon.includes('speaker') || icon.includes('volume') || icon.includes('notification') || icon.includes('bell')),
        "Design & Tools": allIcons.filter(icon => icon.includes('paint') || icon.includes('brush') || icon.includes('palette') || icon.includes('color') ||
            icon.includes('scissors') || icon.includes('crop') || icon.includes('resize') || icon.includes('zoom') ||
            icon.includes('magnifying') || icon.includes('search') || icon.includes('filter') || icon.includes('eye') ||
            icon.includes('cursor') || icon.includes('pointer') || icon.includes('hand') || icon.includes('fingerprint')),
        "Devices & Hardware": allIcons.filter(icon => icon.includes('computer') || icon.includes('laptop') || icon.includes('tablet') || icon.includes('phone') ||
            icon.includes('mobile') || icon.includes('monitor') || icon.includes('keyboard') || icon.includes('mouse') ||
            icon.includes('printer') || icon.includes('camera') || icon.includes('headphone') || icon.includes('battery') ||
            icon.includes('wifi') || icon.includes('bluetooth') || icon.includes('usb') || icon.includes('chip') ||
            icon.includes('cpu') || icon.includes('memory') || icon.includes('hard-drive') || icon.includes('server')),
        "Files & Folders": allIcons.filter(icon => icon.includes('file') || icon.includes('folder') || icon.includes('document') || icon.includes('paper') ||
            icon.includes('archive') || icon.includes('zip') || icon.includes('download') || icon.includes('upload') ||
            icon.includes('share') || icon.includes('link') || icon.includes('attachment') || icon.includes('clipboard')),
        "Interface & UI": allIcons.filter(icon => icon.includes('menu') || icon.includes('list') || icon.includes('grid') || icon.includes('layout') ||
            icon.includes('sidebar') || icon.includes('window') || icon.includes('browser') || icon.includes('tab') ||
            icon.includes('button') || icon.includes('switch') || icon.includes('toggle') || icon.includes('slider') ||
            icon.includes('progress') || icon.includes('loading') || icon.includes('spinner') || icon.includes('check') ||
            icon.includes('close') || icon.includes('plus') || icon.includes('minus') || icon.includes('settings') ||
            icon.includes('gear') || icon.includes('cog') || icon.includes('wrench') || icon.includes('tool')),
        "Math & Finance": allIcons.filter(icon => icon.includes('calculator') || icon.includes('math') || icon.includes('plus') || icon.includes('minus') ||
            icon.includes('multiply') || icon.includes('divide') || icon.includes('equals') || icon.includes('percent') ||
            icon.includes('currency') || icon.includes('dollar') || icon.includes('euro') || icon.includes('bitcoin') ||
            icon.includes('money') || icon.includes('bank') || icon.includes('credit') || icon.includes('wallet') ||
            icon.includes('shopping') || icon.includes('cart') || icon.includes('bag') || icon.includes('store')),
        "Media & Entertainment": allIcons.filter(icon => icon.includes('play') || icon.includes('pause') || icon.includes('stop') || icon.includes('skip') ||
            icon.includes('rewind') || icon.includes('fast') || icon.includes('forward') || icon.includes('repeat') ||
            icon.includes('shuffle') || icon.includes('music') || icon.includes('audio') || icon.includes('video') ||
            icon.includes('film') || icon.includes('camera') || icon.includes('image') || icon.includes('photo') ||
            icon.includes('picture') || icon.includes('gallery') || icon.includes('youtube') || icon.includes('spotify')),
        "Security & Safety": allIcons.filter(icon => icon.includes('lock') || icon.includes('unlock') || icon.includes('key') || icon.includes('shield') ||
            icon.includes('security') || icon.includes('safe') || icon.includes('warning') || icon.includes('alert') ||
            icon.includes('error') || icon.includes('danger') || icon.includes('caution') || icon.includes('info') ||
            icon.includes('help') || icon.includes('question') || icon.includes('exclamation')),
        "Social & People": allIcons.filter(icon => icon.includes('user') || icon.includes('person') || icon.includes('people') || icon.includes('group') ||
            icon.includes('team') || icon.includes('friend') || icon.includes('profile') || icon.includes('avatar') ||
            icon.includes('face') || icon.includes('smile') || icon.includes('heart') || icon.includes('like') ||
            icon.includes('star') || icon.includes('favorite') || icon.includes('bookmark') || icon.includes('flag')),
        "Time & Calendar": allIcons.filter(icon => icon.includes('clock') || icon.includes('time') || icon.includes('hour') || icon.includes('minute') ||
            icon.includes('second') || icon.includes('watch') || icon.includes('timer') || icon.includes('alarm') ||
            icon.includes('calendar') || icon.includes('date') || icon.includes('schedule') || icon.includes('event') ||
            icon.includes('birthday') || icon.includes('holiday')),
        "Transportation": allIcons.filter(icon => icon.includes('car') || icon.includes('truck') || icon.includes('bus') || icon.includes('train') ||
            icon.includes('plane') || icon.includes('ship') || icon.includes('boat') || icon.includes('bicycle') ||
            icon.includes('motorcycle') || icon.includes('taxi') || icon.includes('parking') || icon.includes('gas') ||
            icon.includes('fuel') || icon.includes('road') || icon.includes('map') || icon.includes('location') ||
            icon.includes('navigation') || icon.includes('compass') || icon.includes('gps')),
        "Weather & Environment": allIcons.filter(icon => icon.includes('weather') || icon.includes('temperature') || icon.includes('thermometer') || icon.includes('sun') ||
            icon.includes('moon') || icon.includes('cloud') || icon.includes('rain') || icon.includes('snow') ||
            icon.includes('wind') || icon.includes('storm') || icon.includes('lightning') || icon.includes('umbrella') ||
            icon.includes('sunrise') || icon.includes('sunset') || icon.includes('day') || icon.includes('night') ||
            icon.includes('earth') || icon.includes('globe') || icon.includes('world') || icon.includes('nature') ||
            icon.includes('mountain') || icon.includes('river') || icon.includes('ocean') || icon.includes('forest'))
    };
    // Add uncategorized icons to "Other" category
    const categorizedIcons = new Set();
    for (const category in categories) {
        categories[category].forEach(icon => categorizedIcons.add(icon));
    }
    categories["Other"] = allIcons.filter(icon => !categorizedIcons.has(icon));
    return { icons: allIcons, categories };
}
function showIconsGallery(iconData) {
    const panel = vscode.window.createWebviewPanel('rajaIconsGallery', 'Phosphor Icons Gallery', vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
    panel.webview.html = generateGalleryHTML(iconData);
}
function generateGalleryHTML(iconData) {
    const categoryOptions = Object.keys(iconData.categories).map(cat => `<option value="${cat}">${cat}</option>`).join('');
    const iconItems = iconData.icons.map(icon => `
    <div class="icon-item" data-icon="${icon}" data-category="${getCategoryForIcon(icon, iconData.categories)}" onclick="copyIcon('ph ph-${icon}')">
      <div class="icon">
        <i class="ph ph-${icon}"></i>
      </div>
      <div class="icon-name">ph ph-${icon}</div>
    </div>
  `).join('');
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Phosphor Icons Gallery</title>
      <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/style.css">
      <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/bold/style.css">
      <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/duotone/style.css">
      <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/fill/style.css">
      <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/light/style.css">
      <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/thin/style.css">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0 0 10px 0;
          color: var(--vscode-editor-foreground);
        }
        .links {
          margin-bottom: 20px;
        }
        .links a {
          color: var(--vscode-accent-foreground);
          text-decoration: none;
          margin: 0 10px;
        }
        .links a:hover {
          text-decoration: underline;
        }
        .filters {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          min-width: 150px;
        }
        .filter-group label {
          font-size: 12px;
          margin-bottom: 5px;
          color: var(--vscode-descriptionForeground);
        }
        .filter-select {
          padding: 8px;
          border: 1px solid var(--vscode-input-border);
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border-radius: 4px;
          font-size: 13px;
        }
        .filter-select:focus {
          outline: none;
          border-color: var(--vscode-focusBorder);
        }
        .search-container {
          margin-bottom: 20px;
        }
        .search-input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--vscode-input-border);
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border-radius: 4px;
          font-size: 14px;
        }
        .search-input:focus {
          outline: none;
          border-color: var(--vscode-focusBorder);
        }
        .gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 20px;
        }
        .icon-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          border: 1px solid var(--vscode-panel-border);
          border-radius: 8px;
          background: var(--vscode-panel-background);
          cursor: pointer;
          transition: all 0.2s;
        }
        .icon-item:hover {
          background: var(--vscode-list-hoverBackground);
          border-color: var(--vscode-focusBorder);
        }
        .icon {
          font-size: 32px;
          margin-bottom: 8px;
          color: var(--vscode-foreground);
        }
        .icon-name {
          font-size: 11px;
          text-align: center;
          word-break: break-all;
          color: var(--vscode-descriptionForeground);
          font-family: 'Courier New', monospace;
        }
        .stats {
          margin-bottom: 20px;
          font-size: 14px;
          color: var(--vscode-descriptionForeground);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Phosphor Icons Gallery</h1>
        <div class="links">
          <a href="https://phosphoricons.com/" target="_blank">Official Website</a> |
          <a href="https://github.com/phosphor-icons/webcomponents" target="_blank">GitHub</a>
        </div>
      </div>
      <div class="filters">
        <div class="filter-group">
          <label for="category-select">Category:</label>
          <select class="filter-select" id="category-select" onchange="filterIcons()">
            <option value="">All Categories</option>
            ${categoryOptions}
          </select>
        </div>
        <div class="filter-group">
          <label for="weight-select">Icon Weight:</label>
          <select class="filter-select" id="weight-select" onchange="changeWeight()">
            <option value="regular">Regular</option>
            <option value="bold">Bold</option>
            <option value="duotone">Duotone</option>
            <option value="fill">Fill</option>
            <option value="light">Light</option>
            <option value="thin">Thin</option>
          </select>
        </div>
      </div>
      <div class="search-container">
        <input type="text" class="search-input" placeholder="Search icons..." onkeyup="filterIcons()">
      </div>
      <div class="stats">Total icons: ${iconData.icons.length}</div>
      <div class="gallery" id="gallery">
        ${iconItems}
      </div>

      <script>
        let currentWeight = 'regular';

        function changeWeight() {
          const select = document.getElementById('weight-select');
          currentWeight = select.value;
          const icons = document.querySelectorAll('.icon i');
          const iconNames = document.querySelectorAll('.icon-name');

          icons.forEach((icon, index) => {
            const baseName = icon.className.split(' ').pop().replace('ph-', '').replace(/-(regular|bold|duotone|fill|light|thin)$/, '');
            if (currentWeight === 'regular') {
              icon.className = 'ph ph-' + baseName;
              iconNames[index].textContent = 'ph ph-' + baseName;
            } else {
              icon.className = 'ph-' + currentWeight + ' ph-' + baseName;
              iconNames[index].textContent = 'ph ph-' + baseName + '-' + currentWeight;
            }
          });
          filterIcons();
        }

        function filterIcons() {
          const categorySelect = document.getElementById('category-select');
          const searchInput = document.querySelector('.search-input');
          const selectedCategory = categorySelect.value;
          const searchTerm = searchInput.value.toLowerCase();

          const items = document.querySelectorAll('.icon-item');
          let visibleCount = 0;

          items.forEach(item => {
            const iconName = item.querySelector('.icon-name').textContent.toLowerCase();
            const itemCategory = item.getAttribute('data-category');

            const matchesCategory = !selectedCategory || itemCategory === selectedCategory;
            const matchesSearch = !searchTerm || iconName.includes(searchTerm);

            if (matchesCategory && matchesSearch) {
              item.style.display = '';
              visibleCount++;
            } else {
              item.style.display = 'none';
            }
          });

          document.querySelector('.stats').textContent = 'Showing ' + visibleCount + ' of ' + items.length + ' icons';
        }

        function copyIcon(iconName) {
          navigator.clipboard.writeText(iconName).then(() => {
            // Show notification
            const notification = document.createElement('div');
            notification.textContent = '✓ Icon berhasil disalin: ' + iconName;
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 12px 16px; border-radius: 4px; font-size: 14px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: fadeInOut 3s ease-in-out;';

            // Add fade animation
            const style = document.createElement('style');
            style.textContent = '@keyframes fadeInOut { 0% { opacity: 0; transform: translateY(-10px); } 10% { opacity: 1; transform: translateY(0); } 90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-10px); } }';
            document.head.appendChild(style);
            document.body.appendChild(notification);

            // Remove notification after animation
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 3000);

            console.log('Copied:', iconName);
          }).catch(err => {
            console.error('Failed to copy:', err);
            // Show error notification
            const notification = document.createElement('div');
            notification.textContent = '❌ Gagal menyalin icon';
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 12px 16px; border-radius: 4px; font-size: 14px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
            document.body.appendChild(notification);
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 3000);
          });
        }
      </script>
    </body>
    </html>
  `;
}
function getCategoryForIcon(icon, categories) {
    for (const category in categories) {
        if (categories[category].includes(icon)) {
            return category;
        }
    }
    return '';
}
function foldByPattern(pattern) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const document = editor.document;
    const linesToFold = [];
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text;
        if (pattern.test(line.trim())) {
            linesToFold.push(i);
        }
    }
    if (linesToFold.length > 0) {
        vscode.commands.executeCommand('editor.fold', { selectionLines: linesToFold });
    }
}
function foldByIndentation(minIndent) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const document = editor.document;
    const linesToFold = [];
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        if (line.firstNonWhitespaceCharacterIndex >= minIndent && line.text.trim().length > 0) {
            linesToFold.push(i);
        }
    }
    if (linesToFold.length > 0) {
        vscode.commands.executeCommand('editor.fold', { selectionLines: linesToFold });
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map