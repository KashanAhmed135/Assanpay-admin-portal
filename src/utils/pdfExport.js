import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const getCellValue = (row, key) => {
    if (!row) return ''
    const value = row[key]
    if (value === null || value === undefined) return ''
    return String(value)
}

const drawLogoBadge = (doc, x, y, size) => {
    doc.setDrawColor(30, 64, 175)
    doc.setFillColor(37, 99, 235)
    doc.roundedRect(x, y, size, size, 10, 10, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text('AP', x + size / 2, y + size / 2 + 4, { align: 'center' })
}

export function exportDataToPDF(
    data,
    columns,
    {
        title = 'Export',
        filename = 'export.pdf',
        companyName = 'AssanPay',
        logoUrl = '',
    } = {}
) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 36
    const headerY = 32
    const logoSize = 44

    if (typeof logoUrl === 'string' && logoUrl.startsWith('data:')) {
        try {
            doc.addImage(logoUrl, 'PNG', margin, headerY, logoSize, logoSize, undefined, 'FAST')
        } catch {
            drawLogoBadge(doc, margin, headerY, logoSize)
        }
    } else {
        drawLogoBadge(doc, margin, headerY, logoSize)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor('#0f172a')
    doc.text(title, pageWidth / 2, headerY + 24, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor('#64748b')
    doc.text(companyName, pageWidth / 2, headerY + 40, { align: 'center' })
    doc.setFontSize(8)
    doc.setTextColor('#94a3b8')
    doc.text('Confidential', pageWidth / 2, headerY + 50, { align: 'center' })
    const generated = new Date().toLocaleString()
    doc.text(`Generated: ${generated}`, pageWidth - margin, headerY + 24, { align: 'right' })

    doc.setDrawColor(37, 99, 235)
    doc.setFillColor(37, 99, 235)
    doc.roundedRect(margin, headerY + 58, pageWidth - margin * 2, 5, 3, 3, 'F')

    const bodyRows = (Array.isArray(data) ? data : []).map((row) =>
        columns.map((col) => getCellValue(row, col.key))
    )

    autoTable(doc, {
        startY: headerY + 78,
        head: [columns.map((col) => col.label || col.key || '')],
        body: bodyRows,
        styles: {
            font: 'helvetica',
            fontSize: 9.5,
            cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
            textColor: '#0f172a',
        },
        headStyles: {
            fillColor: [248, 250, 252],
            textColor: '#0f172a',
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [252, 252, 253],
        },
        theme: 'grid',
        didDrawPage: (dataArg) => {
            const pageCount = doc.internal.getNumberOfPages()
            doc.setFontSize(9)
            doc.setTextColor('#64748b')
            const footerText = `Page ${dataArg.pageNumber} of ${pageCount}`
            doc.text(footerText, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: 'right' })
        },
    })

    doc.save(filename)
}
