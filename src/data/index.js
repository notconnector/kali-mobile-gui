import {toolsRecon} from './tools-recon';
import {toolsVuln} from './tools-vuln';
import {toolsWeb} from './tools-web';
import {toolsExploitation} from './tools-exploitation';
import {toolsPasswords} from './tools-passwords';
import {toolsWireless} from './tools-wireless';
import {toolsSniffing} from './tools-sniffing';
import {toolsPostExploit} from './tools-postexploit';
import {toolsForensics} from './tools-forensics';
import {toolsReverse} from './tools-reverse';
import {toolsSocial, toolsReporting} from './tools-social';

export const ALL_TOOLS = {
  recon: toolsRecon,
  vuln: toolsVuln,
  web: toolsWeb,
  exploitation: toolsExploitation,
  passwords: toolsPasswords,
  wireless: toolsWireless,
  sniffing: toolsSniffing,
  postexploit: toolsPostExploit,
  forensics: toolsForensics,
  reverse: toolsReverse,
  social: toolsSocial,
  reporting: toolsReporting,
};

export function getToolsByCategory(categoryId) {
  return ALL_TOOLS[categoryId] || [];
}

export function getToolById(categoryId, toolId) {
  const tools = getToolsByCategory(categoryId);
  return tools.find(t => t.id === toolId) || null;
}

export function searchAllTools(query) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results = [];
  Object.entries(ALL_TOOLS).forEach(([categoryId, tools]) => {
    tools.forEach(tool => {
      if (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.command.toLowerCase().includes(q)
      ) {
        results.push({...tool, categoryId});
      }
    });
  });
  return results;
}

export function buildCommand(tool, flagValues, target) {
  const parts = [tool.command];

  tool.flags.forEach(flag => {
    const value = flagValues[flag.id];
    if (value === undefined || value === null || value === '') return;

    switch (flag.type) {
      case 'toggle':
        if (value === true) parts.push(flag.flag);
        break;
      case 'text':
        if (flag.flag && value.trim()) {
          parts.push(`${flag.flag} ${value.trim()}`);
        } else if (!flag.flag && value.trim()) {
          parts.push(value.trim());
        }
        break;
      case 'number':
        if (flag.flag && String(value).trim()) {
          parts.push(`${flag.flag} ${String(value).trim()}`);
        }
        break;
      case 'select':
        if (flag.flag && value) {
          parts.push(`${flag.flag} ${value}`);
        } else if (!flag.flag && value) {
          parts.push(value);
        }
        break;
      default:
        break;
    }
  });

  if (tool.hasTarget && target && target.trim()) {
    parts.push(target.trim());
  }

  return parts.filter(p => p).join(' ');
}

export function getDefaultFlagValues(tool) {
  const defaults = {};
  tool.flags.forEach(flag => {
    defaults[flag.id] = flag.default !== undefined ? flag.default : '';
  });
  return defaults;
}

export {CATEGORIES} from './categories';
