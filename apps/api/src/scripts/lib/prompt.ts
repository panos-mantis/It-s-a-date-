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
function readVisibleLine(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, terminal: false });
    rl.once('line', (line) => {
      rl.close();
      resolve(line);
    });
  });
}

// Hidden line: raw mode, nothing echoed. Enter finishes, Backspace deletes, Ctrl+C quits.
function readHiddenLine(): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let buf = '';
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.removeListener('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          resolve(buf);
          return;
        }
        if (ch === '\u0003') {
          stdin.setRawMode(false);
          process.stdout.write('\nCancelled, nothing written\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') buf = buf.slice(0, -1);
        else if (ch >= ' ') buf += ch;
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
