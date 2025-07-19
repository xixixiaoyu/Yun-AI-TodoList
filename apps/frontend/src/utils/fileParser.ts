import * as mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import * as XLSX from 'xlsx'
import { logger } from './logger'

// 设置 PDF.js worker - 使用本地文件
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// 文件大小限制 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * 解析 PDF 文件内容
 */
export async function parsePDFFile(file: File): Promise<string> {
  try {
    logger.info(
      'Starting PDF file parsing',
      { fileName: file.name, fileSize: file.size },
      'FileParser'
    )

    // 基本文件验证
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('文件格式不正确，请选择 PDF 文件')
    }

    if (file.size === 0) {
      throw new Error('PDF 文件为空')
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB 限制
      throw new Error('PDF 文件过大，请选择小于 10MB 的文件')
    }

    const arrayBuffer = await file.arrayBuffer()
    logger.info('File read completed, starting PDF parsing', {}, 'FileParser')

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      // 添加更多配置选项
      verbosity: 0, // 减少控制台输出
      isEvalSupported: false, // 安全选项
      disableFontFace: true, // 提高性能
    }).promise

    logger.info('PDF loaded successfully', { numPages: pdf.numPages }, 'FileParser')

    if (pdf.numPages === 0) {
      throw new Error('PDF 文件没有页面内容')
    }

    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        logger.info(
          `Processing page ${i}/${pdf.numPages}`,
          { page: i, total: pdf.numPages },
          'FileParser'
        )
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .filter(
            (item): item is { str: string } =>
              'str' in item && typeof (item as { str?: unknown }).str === 'string'
          )
          .map((item) => item.str)
          .join(' ')
        fullText += pageText + '\n'
      } catch (pageError) {
        logger.warn(`Page ${i} parsing failed`, pageError, 'FileParser')
        // 继续处理其他页面
      }
    }

    if (fullText.trim().length === 0) {
      throw new Error('PDF 文件中没有找到可提取的文本内容')
    }

    logger.info('PDF parsing completed', { textLength: fullText.length }, 'FileParser')
    return fullText.trim()
  } catch (error) {
    logger.error('PDF parsing failed', error, 'FileParser')

    // 提供更详细的错误信息
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error('PDF 文件已损坏或格式不正确')
      }
      if (error.message.includes('Password')) {
        throw new Error('PDF 文件受密码保护，暂不支持')
      }
      if (error.message.includes('network')) {
        throw new Error('网络错误，请检查网络连接')
      }
      // 如果是我们自定义的错误，直接抛出
      if (
        error.message.includes('文件格式') ||
        error.message.includes('文件为空') ||
        error.message.includes('文件过大') ||
        error.message.includes('没有页面') ||
        error.message.includes('没有找到')
      ) {
        throw error
      }
    }

    throw new Error(`PDF 解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 解析 Excel 文件内容
 */
export async function parseExcelFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    let fullText = ''

    // 遍历所有工作表
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]

      // 转换为 CSV 格式
      const csvData = XLSX.utils.sheet_to_csv(worksheet)

      if (csvData.trim()) {
        fullText += `\n--- 工作表: ${sheetName} ---\n${csvData}\n`
      }
    })

    return fullText.trim()
  } catch (error) {
    logger.error('Excel parsing error', error, 'FileParser')
    throw new Error('无法解析 Excel 文件内容')
  }
}

/**
 * 解析 DOCX 文件内容
 */
export async function parseDocxFile(file: File): Promise<string> {
  try {
    logger.info(
      'Starting DOCX file parsing',
      { fileName: file.name, fileSize: file.size },
      'FileParser'
    )

    // 基本文件验证
    if (
      !file.type.includes('wordprocessingml') &&
      !file.type.includes('msword') &&
      !file.name.toLowerCase().endsWith('.docx')
    ) {
      throw new Error('文件格式不正确，请选择 DOCX 文件')
    }

    if (file.size === 0) {
      throw new Error('DOCX 文件为空')
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB 限制
      throw new Error('DOCX 文件过大，请选择小于 10MB 的文件')
    }

    const arrayBuffer = await file.arrayBuffer()
    logger.info('File read completed, starting DOCX parsing', {}, 'FileParser')

    const result = await mammoth.extractRawText({ arrayBuffer })

    if (result.messages && result.messages.length > 0) {
      logger.warn('DOCX parsing warnings', { messages: result.messages }, 'FileParser')
    }

    const text = result.value

    if (!text || text.trim().length === 0) {
      throw new Error('DOCX 文件中没有找到可提取的文本内容')
    }

    logger.info('DOCX parsing completed', { textLength: text.length }, 'FileParser')
    return text.trim()
  } catch (error) {
    logger.error('DOCX parsing failed', error, 'FileParser')

    // 提供更详细的错误信息
    if (error instanceof Error) {
      if (error.message.includes('not a valid zip file')) {
        throw new Error('DOCX 文件已损坏或格式不正确')
      }
      if (error.message.includes('password')) {
        throw new Error('DOCX 文件受密码保护，暂不支持')
      }
      // 如果是我们自定义的错误，直接抛出
      if (
        error.message.includes('文件格式') ||
        error.message.includes('文件为空') ||
        error.message.includes('文件过大') ||
        error.message.includes('没有找到')
      ) {
        throw error
      }
    }

    throw new Error(`DOCX 解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 解析 CSV 文件内容
 */
export async function parseCSVFile(file: File): Promise<string> {
  try {
    logger.info(
      'Starting CSV file parsing',
      { fileName: file.name, fileSize: file.size },
      'FileParser'
    )

    // 基本文件验证
    if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv')) {
      throw new Error('文件格式不正确，请选择 CSV 文件')
    }

    if (file.size === 0) {
      throw new Error('CSV 文件为空')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('CSV 文件过大，请选择小于 10MB 的文件')
    }

    const text = await file.text()

    if (!text || text.trim().length === 0) {
      throw new Error('CSV 文件中没有找到内容')
    }

    // 简单的 CSV 格式化处理
    const lines = text.split('\n')
    let formattedText = ''

    lines.forEach((line, index) => {
      if (line.trim()) {
        const cells = line.split(',')
        if (index === 0) {
          // 标题行
          formattedText += `表头: ${cells.join(' | ')}\n`
          formattedText += '-'.repeat(50) + '\n'
        } else {
          // 数据行
          formattedText += `第${index}行: ${cells.join(' | ')}\n`
        }
      }
    })

    logger.info('CSV parsing completed', { textLength: formattedText.length }, 'FileParser')
    return formattedText.trim()
  } catch (error) {
    logger.error('CSV parsing failed', error, 'FileParser')

    if (error instanceof Error) {
      // 如果是我们自定义的错误，直接抛出
      if (
        error.message.includes('文件格式') ||
        error.message.includes('文件为空') ||
        error.message.includes('文件过大') ||
        error.message.includes('没有找到')
      ) {
        throw error
      }
    }

    throw new Error(`CSV 解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 解析 DOC 文件内容
 */
export async function parseDocFile(file: File): Promise<string> {
  try {
    logger.info(
      'Starting DOC file parsing',
      { fileName: file.name, fileSize: file.size },
      'FileParser'
    )

    // 基本文件验证
    if (!file.type.includes('msword') && !file.name.toLowerCase().endsWith('.doc')) {
      throw new Error('文件格式不正确，请选择 DOC 文件')
    }

    if (file.size === 0) {
      throw new Error('DOC 文件为空')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('DOC 文件过大，请选择小于 10MB 的文件')
    }

    // 尝试使用 mammoth 解析 DOC 文件
    // 注意：mammoth 主要支持 DOCX，对 DOC 支持有限
    const arrayBuffer = await file.arrayBuffer()

    try {
      const result = await mammoth.extractRawText({ arrayBuffer })

      if (result.messages && result.messages.length > 0) {
        logger.warn('DOC parsing warnings', { messages: result.messages }, 'FileParser')
      }

      const text = result.value

      if (!text || text.trim().length === 0) {
        throw new Error('DOC 文件解析结果为空，建议转换为 DOCX 格式后重试')
      }

      logger.info('DOC parsing completed', { textLength: text.length }, 'FileParser')
      return text.trim()
    } catch (mammothError) {
      logger.warn('mammoth DOC parsing failed, trying text extraction', mammothError, 'FileParser')

      // 如果 mammoth 失败，提供友好的错误信息
      throw new Error(
        'DOC 文件格式较旧，建议将文件转换为 DOCX 格式后重新上传，以获得更好的解析效果'
      )
    }
  } catch (error) {
    logger.error('DOC parsing failed', error, 'FileParser')

    if (error instanceof Error) {
      // 如果是我们自定义的错误，直接抛出
      if (
        error.message.includes('文件格式') ||
        error.message.includes('文件为空') ||
        error.message.includes('文件过大') ||
        error.message.includes('建议转换') ||
        error.message.includes('建议将文件')
      ) {
        throw error
      }
    }

    throw new Error(
      `DOC 解析失败: ${error instanceof Error ? error.message : '未知错误'}。建议转换为 DOCX 格式后重试`
    )
  }
}

/**
 * 解析文本文件内容
 */
export async function parseTextFile(file: File): Promise<string> {
  try {
    return await file.text()
  } catch (error) {
    logger.error('Text file parsing error', error, 'FileParser')
    throw new Error('无法解析文本文件内容')
  }
}

/**
 * 根据文件类型解析文件内容
 */
export async function parseFile(file: File): Promise<string> {
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制 (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`)
  }

  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  try {
    let content = ''

    // 根据文件类型选择解析方法
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      content = await parsePDFFile(file)
    } else if (fileType.includes('wordprocessingml') || fileName.endsWith('.docx')) {
      content = await parseDocxFile(file)
    } else if (fileType.includes('msword') || fileName.endsWith('.doc')) {
      content = await parseDocFile(file)
    } else if (fileName.endsWith('.csv') || fileType.includes('csv')) {
      content = await parseCSVFile(file)
    } else if (
      fileType.includes('spreadsheet') ||
      fileType.includes('excel') ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      content = await parseExcelFile(file)
    } else if (
      fileType.startsWith('text/') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.json')
    ) {
      content = await parseTextFile(file)
    } else {
      throw new Error('不支持的文件类型。支持的格式：PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, MD, JSON')
    }

    // 构建包含文件元数据的完整文本
    const metadata = [
      `文件名: ${file.name}`,
      `文件大小: ${(file.size / 1024).toFixed(2)} KB`,
      `文件类型: ${file.type || '未知'}`,
      `上传时间: ${new Date().toLocaleString()}`,
    ].join('\n')

    return `=== 文件信息 ===\n${metadata}\n\n=== 文件内容 ===\n${content}`
  } catch (error) {
    logger.error('File parsing failed', error, 'FileParser')
    throw error instanceof Error ? error : new Error('文件解析失败')
  }
}
