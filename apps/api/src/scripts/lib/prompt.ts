import readline from 'node:readline';

// Piped stdin is read once and served line by line (prompts are echoed so logs make sense).
let pipedLines: string[] | undefined;
let pipedIdx = 0;

async function nextPipedLine(): Promise<string> {
  if (!pipedLines) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk as Uint8Array));
    pipedLines = Buffer.concat(chunks).toString('utf8').split(/\r?\n/);
  }
  return pipedLines[pipedIdx++] ?? '';
}

// Visible line: the console echoes typing itself; readline gets no output stream, so it can't
// redraw (and erase) the prompt label.
export function readVisibleLine(input: NodeJS.ReadableStream = process.stdin): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input, terminal: false });
    // EOF (Ctrl+D) closes without a line: settle with '' so callers fail instead of hanging.
    rl.once('close', () => resolve(''));
    rl.once('line', (line) => {
      resolve(line);
      rl.close();
    });
  });
}

// CSI (ESC [ params final) and SS3 (ESC O final) sequences: arrows, Home/End, Delete, F-keys.
// eslint-disable-next-line no-control-regex
const ESCAPE_SEQUENCE = /\u001b(?:\[[0-?]*[ -/]*[@-~]|O.)/g;

/** Pure key handling for the hidden prompt. Escape sequences never add characters. */
export function applyKeys(buf: string, chunk: string): { buf: string; done: boolean } {
  let out = buf;
  for (const ch of chunk.replace(ESCAPE_SEQUENCE, '')) {
    if (ch === '\r' || ch === '\n') return { buf: out, done: true };
    if (ch === '\u007f' || ch === '\b') out = out.slice(0, -1);
    else if (ch >= ' ') out += ch;
  }
  return { buf: out, done: false };
}

// Hidden line: raw mode, nothing echoed. Enter finishes, Backspace deletes, Ctrl+C quits.
function readHiddenLine(): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let buf = '';
    const onData = (chunk: string) => {
      if (chunk.includes('\u0003')) {
        stdin.setRawMode(false);
        process.stdout.write('\nCancelled, nothing written\n');
        process.exit(130);
      }
      const next = applyKeys(buf, chunk);
      buf = next.buf;
      if (next.done) {
        stdin.removeListener('data', onData);
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write('\n');
        resolve(buf);
      }
    };
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.on('data', onData);
    stdin.resume();
  });
}

async function ask(question: string, hidden: boolean): Promise<string> {
  if (!process.stdin.isTTY) {
    process.stdout.write(`${question}\n`);
    return nextPipedLine();
  }
  process.stdout.write(question);
  return hidden ? readHiddenLine() : readVisibleLine();
}

export const askLine = (question: string): Promise<string> => ask(question, false);
export const askHidden = (question: string): Promise<string> => ask(question, true);
