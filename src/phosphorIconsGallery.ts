import * as vscode from 'vscode';
import { PHOSPHOR_ICONS } from './phosphor-icons-list';

export interface IconGalleryData {
   icons: string[];
   categories: Record<string, string[]>;
}

export async function loadPhosphorIcons(): Promise<IconGalleryData> {
   const allIcons = PHOSPHOR_ICONS;

   const categories: Record<string, string[]> = {
      'Animals & Nature': allIcons.filter(icon =>
         icon.includes('bird') || icon.includes('fish') || icon.includes('dog') || icon.includes('cat') ||
         icon.includes('tree') || icon.includes('leaf') || icon.includes('flower') || icon.includes('sun') ||
         icon.includes('moon') || icon.includes('star') || icon.includes('cloud') || icon.includes('rain') ||
         icon.includes('snow') || icon.includes('wind') || icon.includes('fire') || icon.includes('water')
      ),
      'Arrows & Navigation': allIcons.filter(icon =>
         icon.includes('arrow') || icon.includes('chevron') || icon.includes('caret') || icon.includes('angle') ||
         icon.includes('corner') || icon.includes('move') || icon.includes('direction')
      ),
      'Communication': allIcons.filter(icon =>
         icon.includes('chat') || icon.includes('message') || icon.includes('mail') || icon.includes('email') ||
         icon.includes('phone') || icon.includes('call') || icon.includes('video') || icon.includes('microphone') ||
         icon.includes('speaker') || icon.includes('volume') || icon.includes('notification') || icon.includes('bell')
      ),
      'Design & Tools': allIcons.filter(icon =>
         icon.includes('paint') || icon.includes('brush') || icon.includes('palette') || icon.includes('color') ||
         icon.includes('scissors') || icon.includes('crop') || icon.includes('resize') || icon.includes('zoom') ||
         icon.includes('magnifying') || icon.includes('search') || icon.includes('filter') || icon.includes('eye') ||
         icon.includes('cursor') || icon.includes('pointer') || icon.includes('hand') || icon.includes('fingerprint')
      ),
      'Devices & Hardware': allIcons.filter(icon =>
         icon.includes('computer') || icon.includes('laptop') || icon.includes('tablet') || icon.includes('phone') ||
         icon.includes('mobile') || icon.includes('monitor') || icon.includes('keyboard') || icon.includes('mouse') ||
         icon.includes('printer') || icon.includes('camera') || icon.includes('headphone') || icon.includes('battery') ||
         icon.includes('wifi') || icon.includes('bluetooth') || icon.includes('usb') || icon.includes('chip') ||
         icon.includes('cpu') || icon.includes('memory') || icon.includes('hard-drive') || icon.includes('server')
      ),
      'Files & Folders': allIcons.filter(icon =>
         icon.includes('file') || icon.includes('folder') || icon.includes('document') || icon.includes('paper') ||
         icon.includes('archive') || icon.includes('zip') || icon.includes('download') || icon.includes('upload') ||
         icon.includes('share') || icon.includes('link') || icon.includes('attachment') || icon.includes('clipboard')
      ),
      'Interface & UI': allIcons.filter(icon =>
         icon.includes('menu') || icon.includes('list') || icon.includes('grid') || icon.includes('layout') ||
         icon.includes('sidebar') || icon.includes('window') || icon.includes('browser') || icon.includes('tab') ||
         icon.includes('button') || icon.includes('switch') || icon.includes('toggle') || icon.includes('slider') ||
         icon.includes('progress') || icon.includes('loading') || icon.includes('spinner') || icon.includes('check') ||
         icon.includes('close') || icon.includes('plus') || icon.includes('minus') || icon.includes('settings') ||
         icon.includes('gear') || icon.includes('cog') || icon.includes('wrench') || icon.includes('tool')
      ),
      'Math & Finance': allIcons.filter(icon =>
         icon.includes('calculator') || icon.includes('math') || icon.includes('plus') || icon.includes('minus') ||
         icon.includes('multiply') || icon.includes('divide') || icon.includes('equals') || icon.includes('percent') ||
         icon.includes('currency') || icon.includes('dollar') || icon.includes('euro') || icon.includes('bitcoin') ||
         icon.includes('money') || icon.includes('bank') || icon.includes('credit') || icon.includes('wallet') ||
         icon.includes('shopping') || icon.includes('cart') || icon.includes('bag') || icon.includes('store')
      ),
      'Media & Entertainment': allIcons.filter(icon =>
         icon.includes('play') || icon.includes('pause') || icon.includes('stop') || icon.includes('skip') ||
         icon.includes('rewind') || icon.includes('fast') || icon.includes('forward') || icon.includes('repeat') ||
         icon.includes('shuffle') || icon.includes('music') || icon.includes('audio') || icon.includes('video') ||
         icon.includes('film') || icon.includes('camera') || icon.includes('image') || icon.includes('photo') ||
         icon.includes('picture') || icon.includes('gallery') || icon.includes('youtube') || icon.includes('spotify')
      ),
      'Security & Safety': allIcons.filter(icon =>
         icon.includes('lock') || icon.includes('unlock') || icon.includes('key') || icon.includes('shield') ||
         icon.includes('security') || icon.includes('safe') || icon.includes('warning') || icon.includes('alert') ||
         icon.includes('error') || icon.includes('danger') || icon.includes('caution') || icon.includes('info') ||
         icon.includes('help') || icon.includes('question') || icon.includes('exclamation')
      ),
      'Social & People': allIcons.filter(icon =>
         icon.includes('user') || icon.includes('person') || icon.includes('people') || icon.includes('group') ||
         icon.includes('team') || icon.includes('friend') || icon.includes('profile') || icon.includes('avatar') ||
         icon.includes('face') || icon.includes('smile') || icon.includes('heart') || icon.includes('like') ||
         icon.includes('star') || icon.includes('favorite') || icon.includes('bookmark') || icon.includes('flag')
      ),
      'Time & Calendar': allIcons.filter(icon =>
         icon.includes('clock') || icon.includes('time') || icon.includes('hour') || icon.includes('minute') ||
         icon.includes('second') || icon.includes('watch') || icon.includes('timer') || icon.includes('alarm') ||
         icon.includes('calendar') || icon.includes('date') || icon.includes('schedule') || icon.includes('event') ||
         icon.includes('birthday') || icon.includes('holiday')
      ),
      'Transportation': allIcons.filter(icon =>
         icon.includes('car') || icon.includes('truck') || icon.includes('bus') || icon.includes('train') ||
         icon.includes('plane') || icon.includes('ship') || icon.includes('boat') || icon.includes('bicycle') ||
         icon.includes('motorcycle') || icon.includes('taxi') || icon.includes('parking') || icon.includes('gas') ||
         icon.includes('fuel') || icon.includes('road') || icon.includes('map') || icon.includes('location') ||
         icon.includes('navigation') || icon.includes('compass') || icon.includes('gps')
      ),
      'Weather & Environment': allIcons.filter(icon =>
         icon.includes('weather') || icon.includes('temperature') || icon.includes('thermometer') || icon.includes('sun') ||
         icon.includes('moon') || icon.includes('cloud') || icon.includes('rain') || icon.includes('snow') ||
         icon.includes('wind') || icon.includes('storm') || icon.includes('lightning') || icon.includes('umbrella') ||
         icon.includes('sunrise') || icon.includes('sunset') || icon.includes('day') || icon.includes('night') ||
         icon.includes('earth') || icon.includes('globe') || icon.includes('world') || icon.includes('nature') ||
         icon.includes('mountain') || icon.includes('river') || icon.includes('ocean') || icon.includes('forest')
      )
   };

   const categorizedIcons = new Set<string>();
   for (const category in categories) {
      categories[category].forEach(icon => categorizedIcons.add(icon));
   }

   categories['Other'] = allIcons.filter(icon => !categorizedIcons.has(icon));

   return { icons: allIcons, categories };
}

export function showIconsGallery(iconData: IconGalleryData) {
   const panel = vscode.window.createWebviewPanel(
      'rajaIconsGallery',
      'Phosphor Icons Gallery',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
   );

   panel.webview.html = generateGalleryHTML(iconData);
}

function generateGalleryHTML(iconData: IconGalleryData): string {
   const categoryOptions = Object.keys(iconData.categories)
      .map(cat => `<option value="${cat}">${cat}</option>`)
      .join('');

   const iconItems = iconData.icons.map(icon => `
    <div class="icon-item" data-base="${icon}" data-category="${getCategoryForIcon(icon, iconData.categories)}" onclick="copyIcon('${icon}')">
      <div class="icon">
        <i class="ph ph-${icon}" data-base="${icon}"></i>
      </div>
      <div class="icon-name" data-base="${icon}">${icon}</div>
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
          gap: 10px;
        }
        .icon-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
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
          font-size: 35px;
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

        /* Category color accents */
        .icon-item[data-category="Animals & Nature"] {
          border-color: #4caf50;
          background: rgba(76, 175, 80, 0.08);
        }
        .icon-item[data-category="Animals & Nature"] .icon {
          color: #4caf50;
        }

        .icon-item[data-category="Arrows & Navigation"] {
          border-color: #ff9800;
          background: rgba(255, 152, 0, 0.08);
        }
        .icon-item[data-category="Arrows & Navigation"] .icon {
          color: #ff9800;
        }

        .icon-item[data-category="Communication"] {
          border-color: #03a9f4;
          background: rgba(3, 169, 244, 0.08);
        }
        .icon-item[data-category="Communication"] .icon {
          color: #03a9f4;
        }

        .icon-item[data-category="Design & Tools"] {
          border-color: #9c27b0;
          background: rgba(156, 39, 176, 0.08);
        }
        .icon-item[data-category="Design & Tools"] .icon {
          color: #9c27b0;
        }

        .icon-item[data-category="Devices & Hardware"] {
          border-color: #607d8b;
          background: rgba(96, 125, 139, 0.12);
        }
        .icon-item[data-category="Devices & Hardware"] .icon {
          color: #607d8b;
        }

        .icon-item[data-category="Files & Folders"] {
          border-color: #795548;
          background: rgba(121, 85, 72, 0.1);
        }
        .icon-item[data-category="Files & Folders"] .icon {
          color: #795548;
        }

        .icon-item[data-category="Interface & UI"] {
          border-color: #3f51b5;
          background: rgba(63, 81, 181, 0.08);
        }
        .icon-item[data-category="Interface & UI"] .icon {
          color: #3f51b5;
        }

        .icon-item[data-category="Math & Finance"] {
          border-color: #ff5722;
          background: rgba(255, 87, 34, 0.08);
        }
        .icon-item[data-category="Math & Finance"] .icon {
          color: #ff5722;
        }

        .icon-item[data-category="Media & Entertainment"] {
          border-color: #e91e63;
          background: rgba(233, 30, 99, 0.08);
        }
        .icon-item[data-category="Media & Entertainment"] .icon {
          color: #e91e63;
        }

        .icon-item[data-category="Security & Safety"] {
          border-color: #f44336;
          background: rgba(244, 67, 54, 0.08);
        }
        .icon-item[data-category="Security & Safety"] .icon {
          color: #f44336;
        }

        .icon-item[data-category="Social & People"] {
          border-color: #ffb300;
          background: rgba(255, 179, 0, 0.1);
        }
        .icon-item[data-category="Social & People"] .icon {
          color: #ffb300;
        }

        .icon-item[data-category="Time & Calendar"] {
          border-color: #009688;
          background: rgba(0, 150, 136, 0.08);
        }
        .icon-item[data-category="Time & Calendar"] .icon {
          color: #009688;
        }

        .icon-item[data-category="Transportation"] {
          border-color: #8bc34a;
          background: rgba(139, 195, 74, 0.08);
        }
        .icon-item[data-category="Transportation"] .icon {
          color: #8bc34a;
        }

        .icon-item[data-category="Weather & Environment"] {
          border-color: #00bcd4;
          background: rgba(0, 188, 212, 0.08);
        }
        .icon-item[data-category="Weather & Environment"] .icon {
          color: #00bcd4;
        }

        .icon-item[data-category="Other"] {
          border-color: #9e9e9e;
          background: rgba(158, 158, 158, 0.08);
        }
        .icon-item[data-category="Other"] .icon {
          color: #9e9e9e;
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
            <option value="fill">Fill</option>
            <option value="light">Light</option>
            <option value="thin">Thin</option>
            <option value="bold">Bold</option>
            <option value="duotone">Duotone</option>
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

        function getIconIdentifier(baseName) {
          return currentWeight === 'regular'
            ? 'phosphor-' + baseName
            : 'phosphor-' + baseName + '-' + currentWeight;
        }

        function changeWeight() {
          const select = document.getElementById('weight-select');
          currentWeight = select.value;
          const items = document.querySelectorAll('.icon-item');
          items.forEach(item => {
            const baseName = item.getAttribute('data-base');
            if (!baseName) {
              return;
            }

            const iconElement = item.querySelector('.icon i');
            if (iconElement) {
              if (currentWeight === 'regular') {
                iconElement.className = 'ph ph-' + baseName;
              } else {
                iconElement.className = 'ph-' + currentWeight + ' ph-' + baseName;
              }
            }

            const nameElement = item.querySelector('.icon-name');
            if (nameElement) {
              nameElement.textContent = getIconIdentifier(baseName);
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

        function copyIcon(baseName) {
          const identifier = getIconIdentifier(baseName);
          navigator.clipboard.writeText(identifier).then(() => {
            const notification = document.createElement('div');
            notification.textContent = '✓ Icon berhasil disalin: ' + identifier;
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 12px 16px; border-radius: 4px; font-size: 14px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: fadeInOut 3s ease-in-out;';

            const style = document.createElement('style');
            style.textContent = '@keyframes fadeInOut { 0% { opacity: 0; transform: translateY(-10px); } 10% { opacity: 1; transform: translateY(0); } 90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-10px); } }';
            document.head.appendChild(style);
            document.body.appendChild(notification);

            setTimeout(() => {
              document.body.removeChild(notification);
            }, 3000);
          }).catch(err => {
            console.error('Failed to copy:', err);
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

function getCategoryForIcon(icon: string, categories: Record<string, string[]>): string {
   for (const category in categories) {
      if (categories[category].includes(icon)) {
         return category;
      }
   }
   return '';
}
