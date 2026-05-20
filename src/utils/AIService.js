import SSHManager from './SSHManager';
import {ALL_TOOLS} from '../data';

class AIService {
  constructor() {
    this.apiKey = null;
    this.model = 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free';
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.sshManager = SSHManager;
    this.isExecuting = false;
    this._loadTokenFromStorage();
  }

  async _loadTokenFromStorage() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('openrouter_api_key');
      if (token) {
        this.apiKey = token;
      }
    } catch (e) {}
  }

  setApiKey(token) {
    this.apiKey = token;
  }

  getApiKey() {
    return this.apiKey;
  }

  async checkModelAvailability() {
    console.log('[KALI_AI] checkModelAvailability - start');
    console.log('[KALI_AI] Token exists:', !!this.apiKey);
    console.log('[KALI_AI] Token length:', this.apiKey?.length);

    if (!this.apiKey) {
      console.log('[KALI_AI] No token - returning false');
      return {available: false, message: 'Brak tokena'};
    }

    try {
      const url = `${this.baseUrl}/chat/completions`;
      console.log('[KALI_AI] Fetching:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{role: 'user', content: 'Test'}],
          max_tokens: 10,
        }),
      });

      console.log('[KALI_AI] Response status:', response.status);
      const text = await response.text();
      console.log('[KALI_AI] Response length:', text.length);
      console.log('[KALI_AI] Response preview:', text.substring(0, 200));

      if (!response.ok) {
        console.log('[KALI_AI] Response not OK');
        try {
          const errorData = JSON.parse(text);
          console.log('[KALI_AI] Error data:', errorData);
          return {available: false, message: `Błąd: ${errorData.error?.message || text.substring(0, 50)}`};
        } catch {
          return {available: false, message: `Błąd (${response.status})`};
        }
      }

      try {
        const data = JSON.parse(text);
        console.log('[KALI_AI] JSON parsed successfully');
        console.log('[KALI_AI] Data keys:', Object.keys(data));
        return {available: true, message: 'Model gotowy'};
      } catch (parseError) {
        console.log('[KALI_AI] JSON parse error:', parseError.message);
        return {available: false, message: 'Błąd parsowania'};
      }
    } catch (error) {
      console.log('[KALI_AI] Fetch error:', error.message);
      return {available: false, message: `Błąd: ${error.message}`};
    }
  }

  async chat(messages, onCommand = null, onOutput = null) {
    if (!this.apiKey) {
      throw new Error('Brak OpenRouter API Key. Ustaw klucz w Ustawieniach.');
    }

    const systemPrompt = `Jesteś asystentem pentestowym dla Kali Linux.
Twoje zadanie: pomagać użytkownikowi dobierać narzędzia i komendy, oraz wykonywać je.

Ważne zasady:
- Jeśli użytkownik chce wykonać akcję, generuj komendy w formacie: CMD: <komenda>
- Po CMD: możesz dodać ANALYZE: <co sprawdzić w output>
- Bądź bezpośredni i praktyczny

Dostępne narzędzia Kali Linux: nmap, metasploit, hydra, john, aircrack-ng, wireshark, burpsuite, sqlmap, nikto, gobuster, dirb, enum4linux, smbclient, responder, crackmapexec, impacket, hashcat, cewl, maltego, recon-ng, theharvester, sherlock, osint-framework.

Format odpowiedzi:
1. Krótkie wyjaśnienie
2. Konkretne narzędzia z kategorii
3. Przykładowe komendy z flagami (jeśli użytkownik chce wykonać)
4. Dodatkowe porady

Odpowiadaj po polsku.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {role: 'system', content: systemPrompt},
            ...messages.map(m => ({role: m.role, content: m.content}))
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error?.message || errorData.message || 'Błąd API');
        } catch {
          throw new Error(`Błąd API (${response.status}): ${text.substring(0, 100)}`);
        }
      }

      try {
        const data = JSON.parse(text);
        if (data.error) {
          throw new Error(data.error);
        }
        const output = data.choices[0].message.content;
        return output;
      } catch (parseError) {
        throw new Error('Błąd parsowania odpowiedzi.');
      }
    } catch (error) {
      throw new Error(`Błąd AI: ${error.message}`);
    }
  }

  _cleanOutput(output) {
    return output.replace(/\[\/INST\].*$/g, '').trim();
  }

  async executeWithAI(query, onProgress, onCommand, onOutput) {
    if (this.isExecuting) {
      throw new Error('AI już wykonuje zadanie.');
    }

    this.isExecuting = true;
    const messages = [{role: 'user', content: query}];
    const history = [];

    try {
      while (true) {
        onProgress?.('AI myśli...');
        const response = await this.chat(messages);
        history.push({role: 'assistant', content: response});
        onProgress?.(response);

        const commands = this._extractCommands(response);
        if (commands.length === 0) {
          break;
        }

        for (const cmd of commands) {
          onCommand?.(cmd);
          onProgress?.(`Wykonywanie: ${cmd}`);
          
          const output = await this.sshManager.execute(cmd);
          onOutput?.(output);
          history.push({role: 'system', content: `Output: ${output}`});
          messages.push({role: 'assistant', content: response});
          messages.push({role: 'system', content: `Output: ${output}`});

          const analysisQuery = `Analizuj ten output i zdecyduj czy trzeba wykonać kolejne komendy. Output: ${output}`;
          const analysis = await this.chat([...messages, {role: 'user', content: analysisQuery}]);
          onProgress?.(analysis);
          history.push({role: 'assistant', content: analysis});

          const nextCommands = this._extractCommands(analysis);
          if (nextCommands.length === 0 || analysis.toLowerCase().includes('zakończ') || analysis.toLowerCase().includes('done')) {
            return history;
          }
        }
      }

      return history;
    } finally {
      this.isExecuting = false;
    }
  }

  _extractCommands(text) {
    const commands = [];
    const cmdRegex = /CMD:\s*([^\n]+)/gi;
    let match;
    while ((match = cmdRegex.exec(text)) !== null) {
      commands.push(match[1].trim());
    }
    return commands;
  }

  _getToolsList() {
    let list = '';
    Object.entries(ALL_TOOLS).forEach(([categoryId, tools]) => {
      tools.forEach(tool => {
        list += `\n- ${tool.name} (${tool.command}): ${tool.description}`;
        if (tool.flags.length > 0) {
          list += ` [flagi: ${tool.flags.map(f => f.flag).join(', ')}]`;
        }
      });
    });
    return list;
  }
}

export default new AIService();
