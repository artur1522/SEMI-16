import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { downloadCsv, type ExportCell } from '../utils/exportCsv'
import { downloadSummaryReport, type ReportSummaryItem } from '../utils/exportReport'

interface ExportMenuProps {
  fileName: string
  title: string
  headers: readonly string[]
  rows: readonly (readonly ExportCell[])[]
  summary: readonly ReportSummaryItem[]
}

export default function ExportMenu({ fileName, title, headers, rows, summary }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function exportCsv() {
    downloadCsv(fileName, headers, rows)
    setOpen(false)
  }

  function exportReport() {
    downloadSummaryReport(fileName, title, summary, headers, rows)
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={rows.length === 0}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary shadow-sm transition-all hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 focus:outline-none focus:ring-2 focus:ring-accentFrom/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:focus:ring-darkAccentFrom/30"
      >
        <Download className="h-3.5 w-3.5" />
        Exportar
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Opciones de exportación"
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-white p-1 shadow-xl dark:border-darkBorder dark:bg-darkCard"
        >
          <button
            type="button"
            role="menuitem"
            onClick={exportCsv}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-textPrimary transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextPrimary dark:hover:bg-darkBackground"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Descargar datos CSV
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={exportReport}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-textPrimary transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextPrimary dark:hover:bg-darkBackground"
          >
            <FileText className="h-4 w-4 text-accentFrom dark:text-darkAccentFrom" />
            Generar reporte resumen
          </button>
        </div>
      )}
    </div>
  )
}