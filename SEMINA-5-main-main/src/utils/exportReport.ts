import type { ExportCell } from './exportCsv'

export interface ReportSummaryItem {
  label: string
  value: string | number
}

function escapeHtml(value: ExportCell): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return entities[character]
  })
}

export function downloadSummaryReport(
  fileName: string,
  title: string,
  summary: readonly ReportSummaryItem[],
  headers: readonly string[],
  rows: readonly (readonly ExportCell[])[]
) {
  const generatedAt = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date())
  const summaryMarkup = summary
    .map(({ label, value }) => `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join('')
  const tableHead = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')
  const tableRows = rows.length
    ? rows.map((row) => `<tr>${headers.map((_, index) => `<td>${escapeHtml(row[index])}</td>`).join('')}</tr>`).join('')
    : `<tr><td class="empty" colspan="${Math.max(headers.length, 1)}">No hay datos para los filtros seleccionados.</td></tr>`
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | CloudOps</title>
  <style>
    :root { color-scheme: light; font-family: Arial, sans-serif; color: #172033; background: #f4f6fa; }
    body { margin: 0; padding: 36px 20px; }
    main { max-width: 1100px; margin: 0 auto; }
    header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    h1 { margin: 0; font-size: 28px; }
    .date { margin-top: 8px; color: #64748b; font-size: 13px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 24px 0; }
    .metric { padding: 16px; border: 1px solid #dbe2ec; border-radius: 8px; background: white; }
    .metric span { display: block; color: #64748b; font-size: 12px; }
    .metric strong { display: block; margin-top: 6px; font-size: 18px; }
    h2 { margin: 28px 0 12px; font-size: 17px; }
    .table-wrap { overflow-x: auto; border: 1px solid #dbe2ec; border-radius: 8px; background: white; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e8edf4; text-align: left; vertical-align: top; }
    th { background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; }
    tr:last-child td { border-bottom: 0; }
    .empty { padding: 24px; color: #64748b; text-align: center; }
    @media print { body { padding: 0; background: white; } .table-wrap { overflow: visible; } }
  </style>
</head>
<body>
  <main>
    <header><h1>${escapeHtml(title)}</h1><p class="date">Generado el ${escapeHtml(generatedAt)}</p></header>
    <section class="summary" aria-label="Resumen">${summaryMarkup}</section>
    <h2>Detalle de datos filtrados</h2>
    <div class="table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table></div>
  </main>
</body>
</html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}-reporte.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}