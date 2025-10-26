import { PHOSPHOR_ICONS } from './phosphor-icons-list';
import * as vscode from 'vscode';

export class IconsTreeDataProvider implements vscode.TreeDataProvider<IconTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<IconTreeItem | undefined | null | void> = new vscode.EventEmitter<IconTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<IconTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private iconCategories: {[key: string]: string[]} = {};
  private searchFilter: string = '';

  constructor() {
    this.loadIconCategories();
  }

  private loadIconCategories() {
    const allIcons = PHOSPHOR_ICONS;

    this.iconCategories = {
      "Animals & Nature": allIcons.filter(icon =>
        icon.includes('bird') || icon.includes('fish') || icon.includes('dog') || icon.includes('cat') ||
        icon.includes('tree') || icon.includes('leaf') || icon.includes('flower') || icon.includes('sun') ||
        icon.includes('moon') || icon.includes('star') || icon.includes('cloud') || icon.includes('rain') ||
        icon.includes('snow') || icon.includes('wind') || icon.includes('fire') || icon.includes('water')
      ),
      "Arrows & Navigation": allIcons.filter(icon =>
        icon.includes('arrow') || icon.includes('chevron') || icon.includes('caret') || icon.includes('angle') ||
        icon.includes('corner') || icon.includes('move') || icon.includes('direction')
      ),
      "Communication": allIcons.filter(icon =>
        icon.includes('chat') || icon.includes('message') || icon.includes('mail') || icon.includes('email') ||
        icon.includes('phone') || icon.includes('call') || icon.includes('video') || icon.includes('microphone') ||
        icon.includes('speaker') || icon.includes('volume') || icon.includes('notification') || icon.includes('bell')
      ),
      "Design & Tools": allIcons.filter(icon =>
        icon.includes('paint') || icon.includes('brush') || icon.includes('palette') || icon.includes('color') ||
        icon.includes('scissors') || icon.includes('crop') || icon.includes('resize') || icon.includes('zoom') ||
        icon.includes('magnifying') || icon.includes('search') || icon.includes('filter') || icon.includes('eye') ||
        icon.includes('cursor') || icon.includes('pointer') || icon.includes('hand') || icon.includes('fingerprint')
      ),
      "Devices & Hardware": allIcons.filter(icon =>
        icon.includes('computer') || icon.includes('laptop') || icon.includes('tablet') || icon.includes('phone') ||
        icon.includes('mobile') || icon.includes('monitor') || icon.includes('keyboard') || icon.includes('mouse') ||
        icon.includes('printer') || icon.includes('camera') || icon.includes('headphone') || icon.includes('battery') ||
        icon.includes('wifi') || icon.includes('bluetooth') || icon.includes('usb') || icon.includes('chip') ||
        icon.includes('cpu') || icon.includes('memory') || icon.includes('hard-drive') || icon.includes('server')
      ),
      "Files & Folders": allIcons.filter(icon =>
        icon.includes('file') || icon.includes('folder') || icon.includes('document') || icon.includes('paper') ||
        icon.includes('archive') || icon.includes('zip') || icon.includes('download') || icon.includes('upload') ||
        icon.includes('share') || icon.includes('link') || icon.includes('attachment') || icon.includes('clipboard')
      ),
      "Interface & UI": allIcons.filter(icon =>
        icon.includes('menu') || icon.includes('list') || icon.includes('grid') || icon.includes('layout') ||
        icon.includes('sidebar') || icon.includes('window') || icon.includes('browser') || icon.includes('tab') ||
        icon.includes('button') || icon.includes('switch') || icon.includes('toggle') || icon.includes('slider') ||
        icon.includes('progress') || icon.includes('loading') || icon.includes('spinner') || icon.includes('check') ||
        icon.includes('close') || icon.includes('plus') || icon.includes('minus') || icon.includes('settings') ||
        icon.includes('gear') || icon.includes('cog') || icon.includes('wrench') || icon.includes('tool')
      ),
      "Math & Finance": allIcons.filter(icon =>
        icon.includes('calculator') || icon.includes('math') || icon.includes('plus') || icon.includes('minus') ||
        icon.includes('multiply') || icon.includes('divide') || icon.includes('equals') || icon.includes('percent') ||
        icon.includes('currency') || icon.includes('dollar') || icon.includes('euro') || icon.includes('bitcoin') ||
        icon.includes('money') || icon.includes('bank') || icon.includes('credit') || icon.includes('wallet') ||
        icon.includes('shopping') || icon.includes('cart') || icon.includes('bag') || icon.includes('store')
      ),
      "Media & Entertainment": allIcons.filter(icon =>
        icon.includes('play') || icon.includes('pause') || icon.includes('stop') || icon.includes('skip') ||
        icon.includes('rewind') || icon.includes('fast') || icon.includes('forward') || icon.includes('repeat') ||
        icon.includes('shuffle') || icon.includes('music') || icon.includes('audio') || icon.includes('video') ||
        icon.includes('film') || icon.includes('camera') || icon.includes('image') || icon.includes('photo') ||
        icon.includes('picture') || icon.includes('gallery') || icon.includes('youtube') || icon.includes('spotify')
      ),
      "Security & Safety": allIcons.filter(icon =>
        icon.includes('lock') || icon.includes('unlock') || icon.includes('key') || icon.includes('shield') ||
        icon.includes('security') || icon.includes('safe') || icon.includes('warning') || icon.includes('alert') ||
        icon.includes('error') || icon.includes('danger') || icon.includes('caution') || icon.includes('info') ||
        icon.includes('help') || icon.includes('question') || icon.includes('exclamation')
      ),
      "Social & People": allIcons.filter(icon =>
        icon.includes('user') || icon.includes('person') || icon.includes('people') || icon.includes('group') ||
        icon.includes('team') || icon.includes('friend') || icon.includes('profile') || icon.includes('avatar') ||
        icon.includes('face') || icon.includes('smile') || icon.includes('heart') || icon.includes('like') ||
        icon.includes('star') || icon.includes('favorite') || icon.includes('bookmark') || icon.includes('flag')
      ),
      "Time & Calendar": allIcons.filter(icon =>
        icon.includes('clock') || icon.includes('time') || icon.includes('hour') || icon.includes('minute') ||
        icon.includes('second') || icon.includes('watch') || icon.includes('timer') || icon.includes('alarm') ||
        icon.includes('calendar') || icon.includes('date') || icon.includes('schedule') || icon.includes('event') ||
        icon.includes('birthday') || icon.includes('holiday')
      ),
      "Transportation": allIcons.filter(icon =>
        icon.includes('car') || icon.includes('truck') || icon.includes('bus') || icon.includes('train') ||
        icon.includes('plane') || icon.includes('ship') || icon.includes('boat') || icon.includes('bicycle') ||
        icon.includes('motorcycle') || icon.includes('taxi') || icon.includes('parking') || icon.includes('gas') ||
        icon.includes('fuel') || icon.includes('road') || icon.includes('map') || icon.includes('location') ||
        icon.includes('navigation') || icon.includes('compass') || icon.includes('gps')
      ),
      "Weather & Environment": allIcons.filter(icon =>
        icon.includes('weather') || icon.includes('temperature') || icon.includes('thermometer') || icon.includes('sun') ||
        icon.includes('moon') || icon.includes('cloud') || icon.includes('rain') || icon.includes('snow') ||
        icon.includes('wind') || icon.includes('storm') || icon.includes('lightning') || icon.includes('umbrella') ||
        icon.includes('sunrise') || icon.includes('sunset') || icon.includes('day') || icon.includes('night') ||
        icon.includes('earth') || icon.includes('globe') || icon.includes('world') || icon.includes('nature') ||
        icon.includes('mountain') || icon.includes('river') || icon.includes('ocean') || icon.includes('forest')
      )
    };

    // Add uncategorized icons to "Other" category
    const categorizedIcons = new Set<string>();
    for (const category in this.iconCategories) {
      this.iconCategories[category].forEach(icon => categorizedIcons.add(icon));
    }
    this.iconCategories["Other"] = allIcons.filter(icon => !categorizedIcons.has(icon));
  }

  refresh(searchFilter: string = ''): void {
    this.searchFilter = searchFilter;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: IconTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: IconTreeItem): Thenable<IconTreeItem[]> {
    if (!element) {
      // Root level - return categories
      const categories = Object.keys(this.iconCategories);
      const filteredCategories = this.searchFilter ?
        categories.filter(cat =>
          cat.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
          this.iconCategories[cat].some(icon => icon.toLowerCase().includes(this.searchFilter.toLowerCase()))
        ) : categories;

      return Promise.resolve(filteredCategories.map(category => {
        const iconMap: {[key: string]: string} = {
          "Animals & Nature": "leaf",
          "Arrows & Navigation": "arrow-right",
          "Communication": "chat",
          "Design & Tools": "pencil",
          "Devices & Hardware": "device-desktop",
          "Files & Folders": "file",
          "Interface & UI": "layout",
          "Math & Finance": "calculator",
          "Media & Entertainment": "play",
          "Security & Safety": "shield",
          "Social & People": "person",
          "Time & Calendar": "calendar",
          "Transportation": "car",
          "Weather & Environment": "cloud",
          "Other": "question"
        };

        return new IconTreeItem(
          category,
          `${category} (${this.iconCategories[category].length})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          'category',
          undefined,
          iconMap[category] || 'folder'
        );
      }));
    } else if (element.type === 'category') {
      // Category level - return icons in this category
      const icons = this.iconCategories[element.label];
      const filteredIcons = this.searchFilter ?
        icons.filter(icon => icon.toLowerCase().includes(this.searchFilter.toLowerCase())) :
        icons;

      return Promise.resolve(filteredIcons.map(icon => new IconTreeItem(
        `phosphor-${icon}`,
        `Click to copy: phosphor-${icon}`,
        vscode.TreeItemCollapsibleState.None,
        'icon',
        icon
      )));
    }

    return Promise.resolve([]);
  }
}

export class IconTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: 'category' | 'icon',
    public readonly iconName?: string,
    public readonly iconThemeName?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.type = type;
    this.iconName = iconName;
    this.iconThemeName = iconThemeName;

    if (type === 'category') {
      this.contextValue = label === "Animals & Nature" ? 'category-with-search' : 'category';
      this.iconPath = new vscode.ThemeIcon(iconThemeName || 'folder');
    } else if (type === 'icon') {
      this.contextValue = 'icon';

      // Use meaningful Unicode symbols based on icon name
      let symbol = '🔹'; // default symbol

      if (iconName!.includes('heart')) symbol = '❤️';
      else if (iconName!.includes('star')) symbol = '⭐';
      else if (iconName!.includes('user') || iconName!.includes('person')) symbol = '👤';
      else if (iconName!.includes('chat') || iconName!.includes('message')) symbol = '💬';
      else if (iconName!.includes('phone') || iconName!.includes('call')) symbol = '📞';
      else if (iconName!.includes('mail') || iconName!.includes('email')) symbol = '📧';
      else if (iconName!.includes('camera')) symbol = '📷';
      else if (iconName!.includes('image') || iconName!.includes('photo')) symbol = '🖼️';
      else if (iconName!.includes('video') || iconName!.includes('film')) symbol = '🎥';
      else if (iconName!.includes('music') || iconName!.includes('audio')) symbol = '🎵';
      else if (iconName!.includes('play')) symbol = '▶️';
      else if (iconName!.includes('pause')) symbol = '⏸️';
      else if (iconName!.includes('stop')) symbol = '⏹️';
      else if (iconName!.includes('arrow')) symbol = '➡️';
      else if (iconName!.includes('chevron')) symbol = '❯';
      else if (iconName!.includes('caret')) symbol = '‣';
      else if (iconName!.includes('home')) symbol = '🏠';
      else if (iconName!.includes('search') || iconName!.includes('magnifying')) symbol = '🔍';
      else if (iconName!.includes('settings') || iconName!.includes('gear')) symbol = '⚙️';
      else if (iconName!.includes('lock')) symbol = '🔒';
      else if (iconName!.includes('unlock')) symbol = '🔓';
      else if (iconName!.includes('key')) symbol = '🔑';
      else if (iconName!.includes('shield')) symbol = '🛡️';
      else if (iconName!.includes('warning') || iconName!.includes('alert')) symbol = '⚠️';
      else if (iconName!.includes('check')) symbol = '✅';
      else if (iconName!.includes('close') || iconName!.includes('x')) symbol = '❌';
      else if (iconName!.includes('plus')) symbol = '➕';
      else if (iconName!.includes('minus')) symbol = '➖';
      else if (iconName!.includes('calendar') || iconName!.includes('date')) symbol = '📅';
      else if (iconName!.includes('clock') || iconName!.includes('time')) symbol = '🕐';
      else if (iconName!.includes('folder')) symbol = '📁';
      else if (iconName!.includes('file')) symbol = '📄';
      else if (iconName!.includes('trash')) symbol = '🗑️';
      else if (iconName!.includes('download')) symbol = '⬇️';
      else if (iconName!.includes('upload')) symbol = '⬆️';
      else if (iconName!.includes('cloud')) symbol = '☁️';
      else if (iconName!.includes('sun')) symbol = '☀️';
      else if (iconName!.includes('moon')) symbol = '🌙';
      else if (iconName!.includes('star')) symbol = '⭐';
      else if (iconName!.includes('lightning') || iconName!.includes('bolt')) symbol = '⚡';
      else if (iconName!.includes('fire')) symbol = '🔥';
      else if (iconName!.includes('water')) symbol = '💧';
      else if (iconName!.includes('tree') || iconName!.includes('leaf')) symbol = '🌿';
      else if (iconName!.includes('flower')) symbol = '🌸';
      else if (iconName!.includes('car') || iconName!.includes('vehicle')) symbol = '🚗';
      else if (iconName!.includes('plane')) symbol = '✈️';
      else if (iconName!.includes('ship') || iconName!.includes('boat')) symbol = '🚢';
      else if (iconName!.includes('train')) symbol = '🚆';
      else if (iconName!.includes('bus')) symbol = '🚌';
      else if (iconName!.includes('bike') || iconName!.includes('bicycle')) symbol = '🚲';
      else if (iconName!.includes('computer') || iconName!.includes('laptop')) symbol = '💻';
      else if (iconName!.includes('phone') || iconName!.includes('mobile')) symbol = '📱';
      else if (iconName!.includes('tablet')) symbol = '📱';
      else if (iconName!.includes('keyboard')) symbol = '⌨️';
      else if (iconName!.includes('mouse')) symbol = '🖱️';
      else if (iconName!.includes('headphone')) symbol = '🎧';
      else if (iconName!.includes('battery')) symbol = '🔋';
      else if (iconName!.includes('wifi')) symbol = '📶';
      else if (iconName!.includes('bluetooth')) symbol = '📶';
      else if (iconName!.includes('calculator')) symbol = '🧮';
      else if (iconName!.includes('shopping') || iconName!.includes('cart')) symbol = '🛒';
      else if (iconName!.includes('store')) symbol = '🏪';
      else if (iconName!.includes('bank') || iconName!.includes('money')) symbol = '💰';
      else if (iconName!.includes('credit') || iconName!.includes('card')) symbol = '💳';
      else if (iconName!.includes('dollar') || iconName!.includes('euro') || iconName!.includes('bitcoin')) symbol = '💵';
      else if (iconName!.includes('game') || iconName!.includes('controller')) symbol = '🎮';
      else if (iconName!.includes('paint') || iconName!.includes('brush')) symbol = '🎨';
      else if (iconName!.includes('scissors')) symbol = '✂️';
      else if (iconName!.includes('hammer') || iconName!.includes('wrench')) symbol = '🔧';
      else if (iconName!.includes('tool') || iconName!.includes('screwdriver')) symbol = '🛠️';
      else if (iconName!.includes('lightbulb')) symbol = '💡';
      else if (iconName!.includes('book')) symbol = '📚';
      else if (iconName!.includes('pencil') || iconName!.includes('pen')) symbol = '✏️';
      else if (iconName!.includes('paper') || iconName!.includes('document')) symbol = '📄';
      else if (iconName!.includes('clipboard')) symbol = '📋';
      else if (iconName!.includes('link')) symbol = '🔗';
      else if (iconName!.includes('share')) symbol = '📤';
      else if (iconName!.includes('bell')) symbol = '🔔';
      else if (iconName!.includes('notification')) symbol = '🔔';
      else if (iconName!.includes('bookmark')) symbol = '🔖';
      else if (iconName!.includes('flag')) symbol = '🚩';
      else if (iconName!.includes('map') || iconName!.includes('location')) symbol = '🗺️';
      else if (iconName!.includes('compass')) symbol = '🧭';
      else if (iconName!.includes('earth') || iconName!.includes('globe')) symbol = '🌍';
      else if (iconName!.includes('yin') || iconName!.includes('yang')) symbol = '☯️';

      // Create SVG with the symbol
      const svgIcon = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><text x="8" y="12" font-family="Arial" font-size="12" text-anchor="middle" fill="currentColor">${symbol}</text></svg>`;
      this.iconPath = vscode.Uri.parse(`data:image/svg+xml;base64,${Buffer.from(svgIcon).toString('base64')}`);

      this.command = {
        command: 'rajaIcons.copyIcon',
        title: 'Copy Icon',
        arguments: [iconName]
      };
    }
  }
}
