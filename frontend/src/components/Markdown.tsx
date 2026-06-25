'use client';

/**
 * 简易 Markdown 渲染器
 * 支持表格、粗体、标题、列表、代码等基础 Markdown
 */

const TABLE_MARKER = '\u0000TABLE';

// 提取并渲染 Markdown 表格（| col | col | 格式）
function renderTableBlock(rows: string[]): string {
  const parseRow = (row: string) =>
    row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const hasAlign = rows.length > 1 && /^[\s|:\-]+$/.test(rows[1].replace(/\|/g, '').trim());
  const headers = parseRow(rows[0]);
  const dataStart = hasAlign ? 2 : 1;
  let html = '<table class="w-full border-collapse my-3 text-xs"><thead>';
  html += '<tr class="border-b-2 border-slate-200">';
  for (const h of headers) {
    html += `<th class="px-3 py-2 text-left font-semibold text-slate-700 bg-slate-50">${h}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (let i = dataStart; i < rows.length; i++) {
    html += '<tr class="border-b border-slate-100 even:bg-slate-50/50">';
    for (const c of parseRow(rows[i])) {
      html += `<td class="px-3 py-2 text-slate-600">${c}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

// 先提取表格块，替换为占位符，剩余内容走正则管线，最后还原表格
function extractAndRenderTables(text: string): { text: string; tables: string[] } {
  const lines = text.split('\n');
  const result: string[] = [];
  let tableBuf: string[] = [];
  const tables: string[] = [];

  function flush() {
    if (tableBuf.length >= 2) {
      tables.push(renderTableBlock(tableBuf));
      result.push(`${TABLE_MARKER}${tables.length - 1}`);
    } else {
      result.push(...tableBuf);
    }
    tableBuf = [];
  }

  for (const line of lines) {
    if (/^\|.+\|$/.test(line.trim())) {
      tableBuf.push(line.trim());
    } else {
      flush();
      result.push(line);
    }
  }
  flush();

  return { text: result.join('\n'), tables };
}

export default function Markdown({ content }: { content: string }) {
  // 1. 提取表格
  const { text, tables } = extractAndRenderTables(content || '');

  // 2. 正则管线（在无表格内容上运行）
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-slate-800 mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-bold text-slate-800 mt-4 mb-2">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="text-lg font-bold text-slate-800 mt-4 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-rose-600 px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm before:content-[\'•\'] before:mr-2 before:text-slate-400">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-sm list-decimal">$1</li>')
    .replace(/^---$/gm, '<hr class="my-3 border-slate-200" />')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  // 3. 还原表格 HTML
  for (let i = 0; i < tables.length; i++) {
    html = html.replace(`${TABLE_MARKER}${i}`, tables[i]);
  }

  return (
    <div className="text-sm leading-relaxed text-slate-600" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
