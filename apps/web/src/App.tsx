import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant' | 'tool';
  text: string;
};

type StreamEvent =
  | { type: 'tool_call'; name: string; arguments: unknown }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'message'; text: string }
  | { type: 'error'; message: string }
  | { type: 'done' };

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hi! I am your AI Developer Assistant. Try: “What is 42 * 18?”, “What is the weather in Kolkata?”, or “Explain tool calling.”',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendMessage() {
    const message = input.trim();
    if (!message || busy) return;

    setMessages((current) => [...current, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);

    try {
      const response = await fetch(`${apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok || !response.body) {
        throw new Error('API request failed. Is the backend running?');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          const line = frame.split('\n').find((item) => item.startsWith('data: '));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as StreamEvent;

          if (event.type === 'tool_call') {
            setMessages((current) => [
              ...current,
              { role: 'tool', text: `Calling ${event.name}…` },
            ]);
          } else if (event.type === 'tool_result') {
            setMessages((current) => [
              ...current,
              { role: 'tool', text: `${event.name} returned: ${JSON.stringify(event.result)}` },
            ]);
          } else if (event.type === 'message') {
            setMessages((current) => [...current, { role: 'assistant', text: event.text }]);
          } else if (event.type === 'error') {
            setMessages((current) => [...current, { role: 'assistant', text: `Error: ${event.message}` }]);
          }
        }
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unexpected client error.';
      setMessages((current) => [...current, { role: 'assistant', text: messageText }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <section className="shell">
        <header className="header">
          <div>
            <p className="eyebrow">Agentic AI · Milestone 1</p>
            <h1>AI Developer Assistant</h1>
            <p className="subtitle">LLM + tool calling + a simple agent loop</p>
          </div>
          <div className={`status ${busy ? 'busy' : ''}`}>
            <span /> {busy ? 'Running agent' : 'Ready'}
          </div>
        </header>

        <div className="chat">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
              <span className="label">{message.role}</span>
              <div className="bubble">{message.text}</div>
            </div>
          ))}
          {busy && <div className="typing">Agent is deciding what to do…</div>}
        </div>

        <div className="composer">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Ask the agent something…"
            rows={3}
            disabled={busy}
          />
          <button onClick={() => void sendMessage()} disabled={busy || !input.trim()}>
            {busy ? 'Running…' : 'Send'}
          </button>
        </div>
      </section>
    </main>
  );
}
