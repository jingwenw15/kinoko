export type ImportedTask = {
  title: string;
  done: boolean;
};

export function parseTaskFile(content: string): ImportedTask[] {
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const markdownTasks = lines
    .map(parseMarkdownTask)
    .filter((task): task is ImportedTask => task !== null);

  if (markdownTasks.length > 0) {
    return markdownTasks;
  }

  return lines
    .filter(line => !line.startsWith('#'))
    .map(parseTodoTxtTask)
    .filter((task): task is ImportedTask => task !== null);
}

function parseMarkdownTask(line: string): ImportedTask | null {
  const match = /^[-*]\s+\[([ xX])\]\s+(.+)$/.exec(line);
  if (!match) {
    return null;
  }

  return {
    done: match[1]?.toLowerCase() === 'x',
    title: match[2]!.trim()
  };
}

function parseTodoTxtTask(line: string): ImportedTask | null {
  const done = line.startsWith('x ');
  const title = line
    .replace(/^x\s+(\d{4}-\d{2}-\d{2}\s+)?/, '')
    .replace(/^\([A-Z]\)\s+/, '')
    .trim();

  return title ? {title, done} : null;
}
