/**
 * Converte HTML para Markdown
 * Esta função é otimizada para converter emails HTML gerados pelo construtor de email
 */
export function convertHtmlToMarkdown(html: string): string {
  // Função para limpar o HTML antes da conversão
  const cleanHtml = (html: string): string => {
    // Remover DOCTYPE, html, head, body tags
    let cleaned = html.replace(/<!DOCTYPE[^>]*>|<html[^>]*>|<\/html>|<head>[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, "")

    // Remover comentários HTML
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "")

    // Remover scripts e estilos
    cleaned = cleaned.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")

    // Normalizar espaços em branco
    cleaned = cleaned.replace(/\s+/g, " ")

    return cleaned.trim()
  }

  // Função para extrair o conteúdo de uma tag
  const extractContent = (html: string, tag: string): string[] => {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, "gi")
    const matches: string[] = []
    let match

    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1])
    }

    return matches
  }

  // Função para converter tabelas HTML para tabelas Markdown
  const convertTables = (html: string): string => {
    // Identificar tabelas
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi

    return html.replace(tableRegex, (match) => {
      // Extrair linhas da tabela
      const rows = extractContent(match, "tr")
      if (rows.length === 0) return ""

      let markdownTable = ""
      let headerProcessed = false

      rows.forEach((row, rowIndex) => {
        const cells = extractContent(row, "td").length > 0 ? extractContent(row, "td") : extractContent(row, "th")

        if (cells.length === 0) return

        // Processar células
        const markdownRow = cells
          .map((cell) => {
            // Limpar a célula de tags HTML
            let cleanCell = cell.replace(/<[^>]*>/g, "").trim()
            // Escapar pipes em células
            cleanCell = cleanCell.replace(/\|/g, "\\|")
            return cleanCell || " "
          })
          .join(" | ")

        markdownTable += `| ${markdownRow} |\n`

        // Adicionar separador após o cabeçalho
        if (rowIndex === 0 && !headerProcessed) {
          markdownTable += `| ${cells.map(() => "---").join(" | ")} |\n`
          headerProcessed = true
        }
      })

      return markdownTable
    })
  }

  // Função para converter listas HTML para listas Markdown
  const convertLists = (html: string): string => {
    // Converter listas não ordenadas
    let result = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
      const items = extractContent(match, "li")
      return items.map((item) => `- ${item.trim()}`).join("\n") + "\n\n"
    })

    // Converter listas ordenadas
    result = result.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
      const items = extractContent(match, "li")
      return items.map((item, index) => `${index + 1}. ${item.trim()}`).join("\n") + "\n\n"
    })

    return result
  }

  // Função para converter links e imagens
  const convertLinksAndImages = (html: string): string => {
    // Converter links
    let result = html.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (match, url, text) => {
      // Limpar o texto do link de tags HTML
      const cleanText = text.replace(/<[^>]*>/g, "").trim()
      return `[${cleanText}](${url})`
    })

    // Converter imagens
    result = result.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, (match, src, alt) => {
      return `![${alt}](${src})`
    })

    // Caso a imagem não tenha alt
    result = result.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
      return `![](${src})`
    })

    return result
  }

  // Função para converter formatação de texto
  const convertTextFormatting = (html: string): string => {
    // Converter cabeçalhos
    let result = html
    for (let i = 1; i <= 6; i++) {
      const hashes = "#".repeat(i)
      const regex = new RegExp(`<h${i}[^>]*>(.*?)<\\/h${i}>`, "gi")
      result = result.replace(regex, `${hashes} $1\n\n`)
    }

    // Converter negrito
    result = result.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, "**$2**")

    // Converter itálico
    result = result.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, "*$2*")

    // Converter código inline
    result = result.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")

    // Converter parágrafos
    result = result.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")

    // Converter quebras de linha
    result = result.replace(/<br\s*\/?>/gi, "\n")

    // Converter divisores horizontais
    result = result.replace(/<hr[^>]*>/gi, "---\n\n")

    return result
  }

  // Função para limpar tags HTML restantes
  const cleanRemainingTags = (markdown: string): string => {
    // Remover atributos de estilo, classe, id
    let result = markdown.replace(/ (style|class|id|align|width|height|cellpadding|cellspacing)="[^"]*"/gi, "")

    // Remover tags <div> e </div>
    result = result.replace(/<div[^>]*>/gi, "")
    result = result.replace(/<\/div>/gi, "\n")

    // Remover tags <span> e </span>
    result = result.replace(/<span[^>]*>/gi, "")
    result = result.replace(/<\/span>/gi, "")

    // Remover tags <td> e </td>
    result = result.replace(/<td[^>]*>/gi, "")
    result = result.replace(/<\/td>/gi, "")

    // Remover tags <tr> e </tr>
    result = result.replace(/<tr[^>]*>/gi, "")
    result = result.replace(/<\/tr>/gi, "\n")

    // Remover tags <table> e </table>
    result = result.replace(/<table[^>]*>/gi, "")
    result = result.replace(/<\/table>/gi, "\n")

    // Remover todas as tags HTML restantes
    result = result.replace(/<[^>]*>/g, "")

    return result
  }

  // Função para formatar o Markdown final
  const formatMarkdown = (markdown: string): string => {
    // Remover múltiplas linhas em branco
    let result = markdown.replace(/\n{3,}/g, "\n\n")

    // Garantir que haja uma linha em branco após cabeçalhos
    result = result.replace(/^(#+.*)\n([^#\n])/gm, "$1\n\n$2")

    // Garantir que haja uma linha em branco após listas
    result = result.replace(/^(- .*)\n([^-\n])/gm, "$1\n\n$2")
    result = result.replace(/^(\d+\. .*)\n([^\d\n])/gm, "$1\n\n$2")

    // Remover espaços em branco no início e fim
    result = result.trim()

    return result
  }

  // Função para processar o conteúdo específico de emails
  const processEmailContent = (html: string): string => {
    // Extrair o conteúdo principal do email (dentro da tabela principal)
    const mainContentRegex = /<table[^>]*>[\s\S]*?<\/table>/i
    const mainContentMatch = html.match(mainContentRegex)

    if (mainContentMatch) {
      return mainContentMatch[0]
    }

    return html
  }

  // Processo de conversão principal
  const cleaned = cleanHtml(html)
  const emailContent = processEmailContent(cleaned)

  // Aplicar conversões em ordem específica
  let markdown = convertTables(emailContent)
  markdown = convertLists(markdown)
  markdown = convertLinksAndImages(markdown)
  markdown = convertTextFormatting(markdown)
  markdown = cleanRemainingTags(markdown)
  markdown = formatMarkdown(markdown)

  // Adicionar título ao documento Markdown
  markdown = `# Email Template\n\n${markdown}`

  return markdown
}

// Função auxiliar para converter HTML de cabeçalho para Markdown
export function convertHeaderToMarkdown(headerHtml: string): string {
  let markdown = convertHtmlToMarkdown(headerHtml)

  // Remover o título "Email Template" que é adicionado automaticamente
  markdown = markdown.replace(/^# Email Template\n\n/, "")

  // Adicionar um título específico para o cabeçalho
  return `## Cabeçalho\n\n${markdown}`
}

// Função auxiliar para converter HTML de rodapé para Markdown
export function convertFooterToMarkdown(footerHtml: string): string {
  let markdown = convertHtmlToMarkdown(footerHtml)

  // Remover o título "Email Template" que é adicionado automaticamente
  markdown = markdown.replace(/^# Email Template\n\n/, "")

  // Adicionar um título específico para o rodapé
  return `## Rodapé\n\n${markdown}`
}
