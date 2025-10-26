"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const phosphorIconsGallery_1 = require("./phosphorIconsGallery");
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
        const iconData = await (0, phosphorIconsGallery_1.loadPhosphorIcons)();
        vscode.window.showInformationMessage(`Loaded ${iconData.icons.length} Phosphor icons`);
        (0, phosphorIconsGallery_1.showIconsGallery)(iconData);
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
    context.subscriptions.push(vscode.commands.registerCommand('rajaIcons.copyIcon', async (iconName, weight = 'regular') => {
        if (iconName) {
            const identifier = (0, phosphorIconsTree_1.getIconIdentifier)(iconName, weight);
            await vscode.env.clipboard.writeText(identifier);
            // Show temporary status bar notification for 0.5 seconds
            const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
            statusBarItem.text = `✓ Icon berhasil disalin: ${identifier}`;
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