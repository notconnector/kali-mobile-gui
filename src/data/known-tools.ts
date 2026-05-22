/**
 * KNOWN_TOOLS — master list of pentesting tools
 * Used by ToolScannerScreen to detect what's installed and suggest installs.
 */
export interface KnownTool {
  command: string;
  package: string;
  name: string;
  category: string;
  icon: string;
  description: string;
}

export const KNOWN_TOOLS: KnownTool[] = [
  // ── Recon ─────────────────────────────────────────────────────
  {command: 'nmap',        package: 'nmap',                   name: 'Nmap',           category: 'recon',       icon: '🗺️',  description: 'Network port scanner and service detector'},
  {command: 'masscan',     package: 'masscan',                name: 'Masscan',        category: 'recon',       icon: '🔎',  description: 'Internet-scale port scanner'},
  {command: 'amass',       package: 'amass',                  name: 'Amass',          category: 'recon',       icon: '🌐',  description: 'In-depth subdomain enumeration'},
  {command: 'subfinder',   package: 'subfinder',              name: 'Subfinder',      category: 'recon',       icon: '🔍',  description: 'Fast passive subdomain discovery'},
  {command: 'theHarvester',package: 'theharvester',           name: 'theHarvester',   category: 'recon',       icon: '🌾',  description: 'Email, host and subdomain OSINT harvester'},
  {command: 'recon-ng',    package: 'recon-ng',               name: 'Recon-ng',       category: 'recon',       icon: '🕸️',  description: 'Modular web recon framework'},
  {command: 'dnsrecon',    package: 'dnsrecon',               name: 'DNSRecon',       category: 'recon',       icon: '📋',  description: 'DNS enumeration and zone transfer checks'},
  {command: 'dnsenum',     package: 'dnsenum',                name: 'DNSenum',        category: 'recon',       icon: '📡',  description: 'DNS enumeration with brute force'},
  {command: 'fierce',      package: 'fierce',                 name: 'Fierce',         category: 'recon',       icon: '🦁',  description: 'DNS reconnaissance tool'},
  {command: 'whois',       package: 'whois',                  name: 'Whois',          category: 'recon',       icon: '📄',  description: 'Domain registration information lookup'},

  // ── Vulnerability Analysis ────────────────────────────────────
  {command: 'nikto',       package: 'nikto',                  name: 'Nikto',          category: 'vuln',        icon: '🔬',  description: 'Web server vulnerability scanner'},
  {command: 'openvas',     package: 'openvas',                name: 'OpenVAS',        category: 'vuln',        icon: '🧫',  description: 'Full-featured vulnerability scanner'},
  {command: 'lynis',       package: 'lynis',                  name: 'Lynis',          category: 'vuln',        icon: '🔏',  description: 'Security auditing for Unix/Linux systems'},
  {command: 'nessus',      package: 'nessus',                 name: 'Nessus',         category: 'vuln',        icon: '🔭',  description: 'Commercial vulnerability scanner'},
  {command: 'wapiti',      package: 'wapiti',                 name: 'Wapiti',         category: 'vuln',        icon: '🌊',  description: 'Web app vulnerability scanner (black-box)'},

  // ── Web ───────────────────────────────────────────────────────
  {command: 'sqlmap',      package: 'sqlmap',                 name: 'SQLmap',         category: 'web',         icon: '💉',  description: 'Automated SQL injection and DB takeover'},
  {command: 'burpsuite',   package: 'burpsuite',              name: 'Burp Suite',     category: 'web',         icon: '🕷️',  description: 'Web app security testing platform'},
  {command: 'dirb',        package: 'dirb',                   name: 'DIRB',           category: 'web',         icon: '📂',  description: 'Web content scanner / directory bruteforce'},
  {command: 'gobuster',    package: 'gobuster',               name: 'Gobuster',       category: 'web',         icon: '👻',  description: 'Directory/DNS/vhost bruteforcer'},
  {command: 'ffuf',        package: 'ffuf',                   name: 'FFUF',           category: 'web',         icon: '💨',  description: 'Fast web fuzzer'},
  {command: 'wfuzz',       package: 'wfuzz',                  name: 'WFuzz',          category: 'web',         icon: '🌀',  description: 'Web application fuzzer'},
  {command: 'xsser',       package: 'xsser',                  name: 'XSSer',          category: 'web',         icon: '⚡',  description: 'Automated XSS detection and exploitation'},
  {command: 'whatweb',     package: 'whatweb',                name: 'WhatWeb',        category: 'web',         icon: '🏷️',  description: 'Web technology fingerprinting'},
  {command: 'wafw00f',     package: 'wafw00f',                name: 'WAF00f',         category: 'web',         icon: '🛡️',  description: 'Web Application Firewall detection'},
  {command: 'nuclei',      package: 'nuclei',                 name: 'Nuclei',         category: 'web',         icon: '⚗️',  description: 'Template-based vulnerability scanner'},

  // ── Exploitation ──────────────────────────────────────────────
  {command: 'msfconsole',  package: 'metasploit-framework',   name: 'Metasploit',     category: 'exploitation',icon: '💣',  description: 'World-class penetration testing framework'},
  {command: 'msfvenom',    package: 'metasploit-framework',   name: 'Msfvenom',       category: 'exploitation',icon: '🧨',  description: 'Payload generation and encoding'},
  {command: 'searchsploit',package: 'exploitdb',              name: 'SearchSploit',   category: 'exploitation',icon: '🔎',  description: 'Offline ExploitDB search'},
  {command: 'beef-xss',    package: 'beef-xss',               name: 'BeEF-XSS',       category: 'exploitation',icon: '🥩',  description: 'Browser Exploitation Framework'},
  {command: 'evil-winrm',  package: 'evil-winrm',             name: 'Evil-WinRM',     category: 'exploitation',icon: '😈',  description: 'WinRM shell for pentesting'},

  // ── Password Attacks ──────────────────────────────────────────
  {command: 'hydra',       package: 'hydra',                  name: 'Hydra',          category: 'passwords',   icon: '🐉',  description: 'Fast network login cracker'},
  {command: 'john',        package: 'john',                   name: 'John the Ripper',category: 'passwords',   icon: '🔑',  description: 'Password hash cracker'},
  {command: 'hashcat',     package: 'hashcat',                name: 'Hashcat',        category: 'passwords',   icon: '🔐',  description: 'GPU-accelerated password recovery'},
  {command: 'medusa',      package: 'medusa',                 name: 'Medusa',         category: 'passwords',   icon: '🦴',  description: 'Parallel network brute-forcer'},
  {command: 'ncrack',      package: 'ncrack',                 name: 'Ncrack',         category: 'passwords',   icon: '🔓',  description: 'High-speed network auth cracker'},
  {command: 'crunch',      package: 'crunch',                 name: 'Crunch',         category: 'passwords',   icon: '🍪',  description: 'Wordlist generator'},
  {command: 'cewl',        package: 'cewl',                   name: 'CeWL',           category: 'passwords',   icon: '🕸️',  description: 'Custom wordlist generator from website content'},

  // ── Wireless ──────────────────────────────────────────────────
  {command: 'aircrack-ng', package: 'aircrack-ng',            name: 'Aircrack-ng',    category: 'wireless',    icon: '📡',  description: 'WiFi security auditing suite'},
  {command: 'airodump-ng', package: 'aircrack-ng',            name: 'Airodump-ng',    category: 'wireless',    icon: '📻',  description: 'IEEE 802.11 packet capture'},
  {command: 'airmon-ng',   package: 'aircrack-ng',            name: 'Airmon-ng',      category: 'wireless',    icon: '📻',  description: 'Set wireless card to monitor mode'},
  {command: 'wifite',      package: 'wifite',                 name: 'Wifite2',        category: 'wireless',    icon: '🌐',  description: 'Automated WiFi attack tool'},
  {command: 'hostapd-wpe', package: 'hostapd-wpe',            name: 'Hostapd-WPE',    category: 'wireless',    icon: '📶',  description: 'Rogue AP for WPA Enterprise credential capture'},
  {command: 'bettercap',   package: 'bettercap',              name: 'Bettercap',      category: 'wireless',    icon: '🌊',  description: 'Network attack and monitoring framework'},
  {command: 'pixiewps',    package: 'pixiewps',               name: 'Pixiewps',       category: 'wireless',    icon: '✨',  description: 'WPS offline Pixie Dust attack'},
  {command: 'reaver',      package: 'reaver',                 name: 'Reaver',         category: 'wireless',    icon: '⚒️',  description: 'WPS brute-force attack'},

  // ── Sniffing & Spoofing ────────────────────────────────────────
  {command: 'wireshark',   package: 'wireshark',              name: 'Wireshark',      category: 'sniffing',    icon: '🦈',  description: 'Network protocol analyzer'},
  {command: 'tcpdump',     package: 'tcpdump',                name: 'tcpdump',        category: 'sniffing',    icon: '📡',  description: 'CLI packet capture and analysis'},
  {command: 'ettercap',    package: 'ettercap-graphical',     name: 'Ettercap',       category: 'sniffing',    icon: '🕵️',  description: 'MitM attacks, ARP poisoning, sniffing'},
  {command: 'arpspoof',    package: 'dsniff',                 name: 'Arpspoof',       category: 'sniffing',    icon: '🎭',  description: 'ARP cache poisoning / spoofing'},
  {command: 'responder',   package: 'responder',              name: 'Responder',      category: 'sniffing',    icon: '📢',  description: 'LLMNR/NBT-NS/MDNS poisoner and credential capture'},
  {command: 'sslstrip',    package: 'sslstrip',               name: 'SSLstrip',       category: 'sniffing',    icon: '🔓',  description: 'HTTP/S MitM downgrade attack'},

  // ── Post Exploitation ─────────────────────────────────────────
  {command: 'empire',      package: 'powershell-empire',      name: 'Empire',         category: 'postexploit', icon: '👑',  description: 'PowerShell and Python post-exploitation framework'},
  {command: 'starkiller',  package: 'starkiller',             name: 'Starkiller',     category: 'postexploit', icon: '⭐',  description: 'Multi-user Empire GUI'},
  {command: 'mimikatz',    package: 'mimikatz',               name: 'Mimikatz',       category: 'postexploit', icon: '🐱',  description: 'Windows credential dumping'},
  {command: 'crackmapexec',package: 'crackmapexec',           name: 'CrackMapExec',   category: 'postexploit', icon: '🗺️',  description: 'Swiss army knife for Active Directory'},
  {command: 'impacket-secretsdump', package: 'python3-impacket', name: 'Impacket',   category: 'postexploit', icon: '📦',  description: 'Python classes for working with network protocols'},
  {command: 'bloodhound',  package: 'bloodhound',             name: 'BloodHound',     category: 'postexploit', icon: '🐕',  description: 'AD attack path enumeration'},

  // ── Forensics ─────────────────────────────────────────────────
  {command: 'volatility3', package: 'volatility3',            name: 'Volatility3',    category: 'forensics',   icon: '🧪',  description: 'RAM forensics framework'},
  {command: 'autopsy',     package: 'autopsy',                name: 'Autopsy',        category: 'forensics',   icon: '🔭',  description: 'Digital forensics platform'},
  {command: 'binwalk',     package: 'binwalk',                name: 'Binwalk',        category: 'forensics',   icon: '🔩',  description: 'Firmware analysis and extraction'},
  {command: 'foremost',    package: 'foremost',               name: 'Foremost',       category: 'forensics',   icon: '📁',  description: 'File carving / data recovery'},
  {command: 'exiftool',    package: 'libimage-exiftool-perl', name: 'Exiftool',       category: 'forensics',   icon: '🖼️',  description: 'Read/write metadata in files'},

  // ── Reverse Engineering ────────────────────────────────────────
  {command: 'radare2',     package: 'radare2',                name: 'Radare2',        category: 'reverse',     icon: '⚙️',  description: 'Portable reverse engineering framework'},
  {command: 'ghidra',      package: 'ghidra',                 name: 'Ghidra',         category: 'reverse',     icon: '👻',  description: 'NSA reverse engineering suite'},
  {command: 'gdb',         package: 'gdb',                    name: 'GDB',            category: 'reverse',     icon: '🐛',  description: 'GNU debugger'},
  {command: 'apktool',     package: 'apktool',                name: 'Apktool',        category: 'reverse',     icon: '📦',  description: 'Android APK reverse engineering'},
  {command: 'jadx',        package: 'jadx',                   name: 'Jadx',           category: 'reverse',     icon: '☕',  description: 'Dex to Java decompiler'},
  {command: 'strace',      package: 'strace',                 name: 'Strace',         category: 'reverse',     icon: '🔍',  description: 'System call tracer'},

  // ── Social Engineering ─────────────────────────────────────────
  {command: 'setoolkit',   package: 'set',                    name: 'SEToolkit',      category: 'social',      icon: '🎣',  description: 'Social Engineering Toolkit'},
  {command: 'gophish',     package: 'gophish',                name: 'GoPhish',        category: 'social',      icon: '🎣',  description: 'Open-source phishing framework'},
  {command: 'maltego',     package: 'maltego',                name: 'Maltego',        category: 'social',      icon: '🕸️',  description: 'Visual link analysis for OSINT'},
];

export const KNOWN_COMMANDS = new Set(KNOWN_TOOLS.map(t => t.command));
