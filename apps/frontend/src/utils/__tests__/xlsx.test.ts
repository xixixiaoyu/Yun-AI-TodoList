import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

describe('XLSX Library Security Test', () => {
  it('should import xlsx library successfully', () => {
    expect(XLSX).toBeDefined()
    expect(typeof XLSX.read).toBe('function')
    expect(typeof XLSX.utils.sheet_to_csv).toBe('function')
    expect(typeof XLSX.utils.book_new).toBe('function')
    expect(typeof XLSX.utils.aoa_to_sheet).toBe('function')
  })

  it('should create and manipulate Excel workbooks', () => {
    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    expect(workbook).toBeDefined()
    expect(Array.isArray(workbook.SheetNames)).toBe(true)

    // 创建工作表
    const data = [
      ['Name', 'Age', 'City'],
      ['Alice', 25, 'New York'],
      ['Bob', 30, 'London'],
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    expect(worksheet).toBeDefined()

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TestSheet')
    expect(workbook.SheetNames).toContain('TestSheet')

    // 转换为 CSV
    const csvData = XLSX.utils.sheet_to_csv(worksheet)
    expect(csvData).toContain('Alice')
    expect(csvData).toContain('Bob')
    expect(csvData).toContain('New York')
    expect(csvData).toContain('London')
  })

  it('should write and read Excel data', () => {
    // 创建测试数据
    const originalData = [
      ['Product', 'Price', 'Stock'],
      ['Laptop', 999.99, 50],
      ['Mouse', 29.99, 100],
    ]

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(originalData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

    // 写入 buffer - 使用 binary 类型更兼容
    const buffer = XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' })
    expect(buffer).toBeDefined()
    expect(typeof buffer).toBe('string')

    // 从 buffer 读取
    const readWorkbook = XLSX.read(buffer, { type: 'binary' })
    expect(readWorkbook).toBeDefined()
    expect(readWorkbook.SheetNames).toContain('Products')

    // 验证数据
    const readWorksheet = readWorkbook.Sheets['Products']
    const csvData = XLSX.utils.sheet_to_csv(readWorksheet)
    expect(csvData).toContain('Laptop')
    expect(csvData).toContain('Mouse')
    expect(csvData).toContain('999.99')
    expect(csvData).toContain('29.99')
  })

  it('should handle empty worksheets', () => {
    const workbook = XLSX.utils.book_new()
    const emptyWorksheet = XLSX.utils.aoa_to_sheet([])
    XLSX.utils.book_append_sheet(workbook, emptyWorksheet, 'Empty')

    expect(workbook.SheetNames).toContain('Empty')

    const csvData = XLSX.utils.sheet_to_csv(emptyWorksheet)
    expect(typeof csvData).toBe('string')
  })
})
