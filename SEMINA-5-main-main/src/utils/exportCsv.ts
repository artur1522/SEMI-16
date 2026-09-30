export type ExportCell = string | number | boolean | null | undefined

function quoteCsvCell(value: ExportCell): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function downloadCsv(
  fileName: string,
  headers: readonly string[],
  rows: readonly (readonly ExportCell[])[]
) {
  const content = [headers, ...rows]
    .map((row) => row.map(quoteCsvCell).join(','))
    .join('\r\n')
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}