import re

with open('c:/Users/Davi/Downloads/Sinergia/mobile/www/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add SVG CSS helper styles
svg_css = """
    /* SVG Icons Helpers */
    .svg-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      flex-shrink: 0;
    }
    .pulse-dot-green {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      margin-right: 5px;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
    }
    .pulse-dot-red {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #EF4444;
      margin-right: 5px;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
    }
"""

if '/* SVG Icons Helpers */' not in html:
    html = html.replace('  </style>', svg_css + '  </style>')

# 2. Add ICONS JS definition right after <script>
icons_js = """
    // Catálogo de Ícones SVG Profissionais (Substituição de Emojis)
    const ICONS = {
      bell: (size=16, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
      bellOff: (size=28, color='#94A3B8') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 4l16 16"/><path d="M6.3 6.3a6 6 0 0 0-.3 1.7c0 7-3 9-3 9h14"/><path d="M18 12.8a6 6 0 0 0-.2-4.8"/></svg>`,
      gear: (size=16, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
      users: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      sync: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`,
      clock: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      calendar: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      dashboard: (size=18, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
      folder: (size=18, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
      check: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      checkCircle: (size=16, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 10 11 15 8 12"/></svg>`,
      sparkles: (size=16, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>`,
      lightbulb: (size=18, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
      edit: (size=12, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
      send: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
      paperclip: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`,
      target: (size=36, color='#2563EB') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
      pin: (size=12, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`,
      moon: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
      zap: (size=12, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      alertTriangle: (size=14, color='#F97316') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      alertCircle: (size=14, color='#EF4444') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      cloud: (size=12, color='#2563EB') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
      hardDrive: (size=12, color='#64748B') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>`,
      chat: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      clipboard: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14h6"/><path d="M9 10h6"/></svg>`,
      party: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>`,
      close: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      logout: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
      link: (size=14, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
      arrowRight: (size=12, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
      phone: (size=12, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
      signal: (size=12, color='currentColor') => `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V4"/></svg>`
    };
"""

if 'const ICONS =' not in html:
    html = html.replace('<script>', '<script>\n' + icons_js)

# 3. HTML direct SVG replacements
replacements = [
    # Wireframe badge phone
    ('📱 Sinergia Task Manager', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>Sinergia Task Manager'),
    # Status bar 5G
    ('<span>📶 5G 100%</span>', '<span style="display: inline-flex; align-items: center; gap: 4px;"><svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V4"/></svg> 5G 100%</span>'),
    # Greeting wave
    ('Bom dia 👋', 'Bom dia'),
    ('`Bom dia, ${user.name} 👋`', '`Bom dia, ${user.name}`'),
    # Team icon
    ('<span>👥 Time:', '<span style="display: inline-flex; align-items: center; gap: 4px;"><svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Time:'),
    # Bells in headers
    ('>🔔<span id="notifBadge"', '><svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span id="notifBadge"'),
    ('>🔔<span id="notifBadgeProj"', '><svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span id="notifBadgeProj"'),
    ('cursor: pointer;">🔔</div>', 'cursor: pointer;"><svg class="svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>'),
    # Gear
    ('openUserMenu()">⚙️</div>', 'openUserMenu()"><svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></div>'),
    ('openUserMenu()">⚙</div>', 'openUserMenu()"><svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></div>'),
    # Online status
    ('🟢 Online (Sync Ativo)', '<span class="pulse-dot-green"></span> Online (Sync Ativo)'),
    ('🔴 Modo Offline (WatermelonDB)', '<span class="pulse-dot-red"></span> Modo Offline (WatermelonDB)'),
    # Sync button
    ('🔄 Sincronizar', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right: 4px;"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>Sincronizar'),
    # Sparkle Workload
    ('<span style="font-size: 16px;">✨</span>', '<span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; background: #DBEAFE; color: #2563EB;"><svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg></span>'),
    # Lightbulb Insights
    ('<span style="font-size: 18px;">💡</span>', '<span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 8px; background: #FEF3C7; color: #D97706;"><svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg></span>'),
    # Bottom Nav
    ('<span style="font-size: 16px;">📊</span>Dashboard', '<svg class="svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 2px;"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>Dashboard'),
    ('<span style="font-size: 16px;">📁</span>Projetos', '<svg class="svg-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 2px;"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>Projetos'),
    # Detail screen deadline & edit
    ('⏰ Prazo: <strong id="detailDueDate">Hoje</strong> ✏️', '<svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Prazo: <strong id="detailDueDate">Hoje</strong> <svg class="svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>'),
    # Send comment arrow
    ('➤', '<svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'),
    # Attachment clip
    ('📎 Selecionar arquivo do dispositivo (MinIO)', '<svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>Selecionar arquivo do dispositivo (MinIO)'),
    # Complete task button
    ('✅ Concluir Tarefa', '<svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 5px;"><polyline points="20 6 9 17 4 12"/></svg>Concluir Tarefa'),
    ('✅ Marcar Tarefa como Concluída', '<svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 5px;"><polyline points="20 6 9 17 4 12"/></svg>Marcar Tarefa como Concluída'),
    # Create task deadline header
    ('<span>⏰</span> Prazo de Entrega *', '<span style="display: inline-flex; align-items: center; gap: 4px;"><svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Prazo de Entrega *</span>'),
    # Link in onboarding
    ('🔗 Já possuo', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Já possuo'),
    # User menu buttons
    ('🔄 Trocar de Usuário', '<svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>Trocar de Usuário'),
    ('🚪 Sair da Conta', '<svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sair da Conta'),
    # Notification modal header
    ('<span style="font-size: 18px;">🔔</span>', '<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'),
    ('⚙️ Silêncio', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 3px;"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>Silêncio'),
    ('⚙ Silêncio', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 3px;"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>Silêncio'),
    ('<span>🌙</span>', '<svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'),
    ('⏰ Prazos', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Prazos'),
    ('💬 Menções @', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Menções @'),
    ('📋 Tarefas', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14h6"/><path d="M9 10h6"/></svg>Tarefas'),
    ('✓ Marcar lidas', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px;"><polyline points="20 6 9 17 4 12"/></svg>Marcar lidas'),
    ('⚡ Testar Alerta', '<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Testar Alerta'),
    # Modals close button ✕
    ('>✕</button>', '><svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'),
    # Settings modal title
    ('⚙️ Silêncio por Período', '<span style="display: inline-flex; align-items: center; gap: 6px;"><svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>Silêncio por Período</span>'),
    ('⚙ Silêncio por Período', '<span style="display: inline-flex; align-items: center; gap: 6px;"><svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>Silêncio por Período</span>'),
    # Edit deadline modal title
    ('⏰ Alterar Prazo da Tarefa', '<span style="display: inline-flex; align-items: center; gap: 6px;"><svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Alterar Prazo da Tarefa</span>'),
    # Target empty state
    ('<div style="font-size: 32px; margin-bottom: 6px;">🎯</div>', '<div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: #EFF6FF; color: #2563EB; margin-bottom: 10px;"><svg class="svg-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>'),
    # Attachment icon
    ('<span>📁</span>', '<svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>'),
    # Subtask draft pin
    ('<span>📌 ${s.title}</span>', '<span style="display: inline-flex; align-items: center; gap: 6px;"><svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>${s.title}</span>'),
    # Notification empty bell
    ('<div style="font-size: 28px; margin-bottom: 6px;">🔕</div>', '<div style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%; background: #F1F5F9; color: #94A3B8; margin-bottom: 8px;"><svg class="svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 4l16 16"/><path d="M6.3 6.3a6 6 0 0 0-.3 1.7c0 7-3 9-3 9h14"/><path d="M18 12.8a6 6 0 0 0-.2-4.8"/></svg></div>'),
    # Card open task hint
    ('👉 Toque para abrir tarefa', 'Abrir tarefa <svg class="svg-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>')
]

for old, new in replacements:
    html = html.replace(old, new)

# 4. Replace dynamic JS icons:
# Notification card icons:
old_card_icon = "const icon = n.type === 'deadline' ? '⏰' : n.type === 'mention' ? '💬' : n.type === 'completion' ? '🎉' : '📋';"
new_card_icon = """const icon = n.type === 'deadline' ? ICONS.clock(18, n.color || '#2563EB') :
                     n.type === 'mention' ? ICONS.chat(18, n.color || '#8B5CF6') :
                     n.type === 'completion' ? ICONS.party(18, n.color || '#10B981') :
                     ICONS.clipboard(18, n.color || '#2563EB');"""
html = html.replace(old_card_icon, new_card_icon)

# Card innerHTML icon container
old_icon_div = '<div style="font-size: 18px; margin-top: 2px;">${icon}</div>'
new_icon_div = '<div style="margin-top: 2px; display: flex; align-items: center; justify-content: center;">${icon}</div>'
html = html.replace(old_icon_div, new_icon_div)

# Dashboard task card sync badge:
old_sync_badge = "const syncBadge = isSynced ? '☁️' : '💾 Offline';"
new_sync_badge = "const syncBadge = isSynced ? ICONS.cloud(13, '#2563EB') : ICONS.hardDrive(13, '#64748B') + ' <span style=\"font-size: 10px;\">Offline</span>';"
html = html.replace(old_sync_badge, new_sync_badge)

# Dashboard task card deadline icons:
old_deadline_code = """        let deadlineLabel = task.dueDate || 'Hoje';
        let deadlineColor = '#64748B';
        let deadlineIcon = '⏰';

        if (task.dueDateIso) {
          const diffHours = (new Date(task.dueDateIso).getTime() - Date.now()) / (1000 * 3600);
          if (diffHours < 0) {
            deadlineColor = '#DC2626';
            deadlineIcon = '🚨';
            deadlineLabel += ' (Atrasada)';
          } else if (diffHours <= 1) {
            deadlineColor = '#EF4444';
            deadlineIcon = '🚨';
            deadlineLabel += ' (1h restante)';
          } else if (diffHours <= 24) {
            deadlineColor = '#EA580C';
            deadlineIcon = '⚠️';
          } else if (diffHours <= 72) {
            deadlineColor = '#D97706';
            deadlineIcon = '⏳';
          } else if (diffHours <= 168) {
            deadlineColor = '#16A34A';
            deadlineIcon = '🟢';
          }
        }"""

new_deadline_code = """        let deadlineLabel = task.dueDate || 'Hoje';
        let deadlineColor = '#64748B';
        let deadlineIcon = ICONS.clock(12, '#64748B');

        if (task.dueDateIso) {
          const diffHours = (new Date(task.dueDateIso).getTime() - Date.now()) / (1000 * 3600);
          if (diffHours < 0) {
            deadlineColor = '#DC2626';
            deadlineIcon = ICONS.alertCircle(12, '#DC2626');
            deadlineLabel += ' (Atrasada)';
          } else if (diffHours <= 1) {
            deadlineColor = '#EF4444';
            deadlineIcon = ICONS.alertCircle(12, '#EF4444');
            deadlineLabel += ' (1h restante)';
          } else if (diffHours <= 24) {
            deadlineColor = '#EA580C';
            deadlineIcon = ICONS.alertTriangle(12, '#EA580C');
          } else if (diffHours <= 72) {
            deadlineColor = '#D97706';
            deadlineIcon = ICONS.clock(12, '#D97706');
          } else if (diffHours <= 168) {
            deadlineColor = '#16A34A';
            deadlineIcon = ICONS.checkCircle(12, '#16A34A');
          }
        }"""
html = html.replace(old_deadline_code, new_deadline_code)

# Subtitle in task item:
old_sub_title = """<span style="font-size: 11px; font-weight: 600; color: ${deadlineColor};">${deadlineIcon} Prazo: ${deadlineLabel}</span>"""
new_sub_title = """<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: ${deadlineColor};">${deadlineIcon} Prazo: ${deadlineLabel}</span>"""
html = html.replace(old_sub_title, new_sub_title)

# Clean up notification titles (replace emoji in title with clean text since the icon SVG is rendered separately in the card):
notif_titles = [
    ("🚨 Prazo Crítico (1 hora)", "Prazo Crítico (1 hora)"),
    ("⚠️ Prazo Próximo (1 dia)", "Prazo Próximo (1 dia)"),
    ("⏳ Prazo se Aproximando (3 dias)", "Prazo se Aproximando (3 dias)"),
    ("🟢 Prazo Confortável (7 dias)", "Prazo Confortável (7 dias)"),
    ("💬 Nova Menção @", "Nova Menção @"),
    ("🎉 Conclusão Antecipada!", "Conclusão Antecipada!"),
    ("🎉 Conclusão Antecipada", "Conclusão Antecipada"),
    ("📋 Nova Tarefa no Time", "Nova Tarefa no Time")
]
for old_t, new_t in notif_titles:
    html = html.replace(old_t, new_t)

# Clean up toasts:
html = html.replace("showToast('🎉 Parabéns! Tarefa concluída!');", "showToast('Parabéns! Tarefa concluída com sucesso!');")
html = html.replace("showToast('🎉 Todas as sub-tarefas concluídas! Tarefa finalizada!');", "showToast('Todas as sub-tarefas concluídas! Tarefa finalizada!');")
html = html.replace("showToast('🌙 Silêncio por Período ativado!'", "showToast('Silêncio por Período ativado!'")
html = html.replace("showToast('Modo Silencioso ativado!'", "showToast('Modo Silencioso ativado!'")
html = html.replace("showToast('🚀 Time \"'", "showToast('Time \"'")
html = html.replace("showToast('🎉 Convite validado!'", "showToast('Convite validado!'")
html = html.replace("showToast('⏳ Sincronizando com o servidor...')", "showToast('Sincronizando com o servidor...')")
html = html.replace("showToast('✅ Sincronização concluída!'", "showToast('Sincronização concluída!'")
html = html.replace("showToast('✅ Banco local persistido com sucesso.')", "showToast('Banco local persistido com sucesso.')")
html = html.replace("showToast(`👋 Olá, ${user.name}!`);", "showToast(`Olá, ${user.name}!`);")
html = html.replace("showToast(`🎉 Bem-vindo, ${name}!", "showToast(`Bem-vindo, ${name}!")
html = html.replace("showToast(`✅ Tarefa criada", "showToast(`Tarefa criada")

# Clean up deadline badge labels in create task:
html = html.replace("badge.innerText = '🚨 Vencido';", "badge.innerText = 'Vencido';")
html = html.replace("badge.innerText = '🚨 1h (Crítico)';", "badge.innerText = '1h restante (Crítico)';")
html = html.replace("badge.innerText = '⚠️ 1 dia (Próximo)';", "badge.innerText = '1 dia (Próximo)';")
html = html.replace("badge.innerText = '⏳ 3 dias (Atenção)';", "badge.innerText = '3 dias (Atenção)';")
html = html.replace("badge.innerText = '🟢 7 dias (Confortável)';", "badge.innerText = '7 dias (Confortável)';")
html = html.replace("badge.innerText = `📅 Em ${diffDays} dias`;", "badge.innerText = `Em ${diffDays} dias`;")

with open('c:/Users/Davi/Downloads/Sinergia/mobile/www/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Successfully converted all emojis to clean, modern SVGs in mobile/www/index.html!')
