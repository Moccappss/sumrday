export const exportToPdf = async (containerElement, filename = 'portfolio.pdf') => {
  if (!containerElement) return;

  try {
    const { jsPDF } = await import('jspdf');
    const { toPng } = await import('html-to-image');

    // Add class to signal PDF export state
    containerElement.classList.add('pdf-export-active');

    const rect = containerElement.getBoundingClientRect();
    const width = rect.width;
    const height = containerElement.scrollHeight || rect.height;

    // Use a fixed width for the PDF if it's on mobile view, or just map 1:1 to px
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height]
    });

    // Capture as PNG with high resolution ratio to support transparency seutuhnya & keep it extremely crisp
    const dataUrl = await toPng(containerElement, {
      pixelRatio: 2.0, // increased resolution for super crisp text and assets
      width: width,
      height: height,
      fontEmbedCSS: '', // Bypass CORS / Same-Origin security checks on Google Fonts
      style: {
        transform: 'none',
        borderRadius: '0px',
        maxHeight: 'none',
        height: `${height}px`,
        overflow: 'visible'
      },
      filter: (node) => {
        const tag = node.tagName ? node.tagName.toLowerCase() : '';
        return tag !== 'iframe' && tag !== 'video';
      }
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height, undefined, 'FAST');

    // Map hyperlinks
    const links = containerElement.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      let rect = link.getBoundingClientRect();
      
      // If the link has display: contents (w/h is 0), measure its child element instead!
      if (rect.width === 0 && rect.height === 0 && link.firstElementChild) {
        rect = link.firstElementChild.getBoundingClientRect();
      }
      
      // Calculate relative position to the container
      const containerRect = containerElement.getBoundingClientRect();
      const scrollY = containerElement.scrollTop || 0;
      
      const x = rect.left - containerRect.left;
      const y = (rect.top - containerRect.top) + scrollY;
      const w = rect.width;
      const h = rect.height;
      
      if (href && w > 0 && h > 0) {
        pdf.link(x, y, w, h, { url: href });
      }
    });

    // Map selectable text elements to create an invisible searchable/selectable text layer
    const textElements = containerElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, .stk-btn, [class*="marquee"], [class*="title"]');
    textElements.forEach(el => {
      // Ignore if nested inside other block text tags to avoid duplication
      if (el.querySelector('h1, h2, h3, p')) return;
      
      const text = el.innerText || el.textContent;
      if (!text || !text.trim()) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const containerRect = containerElement.getBoundingClientRect();
      const scrollY = containerElement.scrollTop || 0;

      const x = rect.left - containerRect.left;
      const y = (rect.top - containerRect.top) + scrollY;

      // Extract styles
      const styles = window.getComputedStyle(el);
      const fontSize = parseFloat(styles.fontSize) || 12;
      const fontWeight = styles.fontWeight || '400';
      const textAlign = styles.textAlign || 'left';

      let fontStyle = 'normal';
      if (fontWeight === 'bold' || parseInt(fontWeight) >= 700) fontStyle = 'bold';

      try {
        pdf.setFont('Helvetica', fontStyle);
        pdf.setFontSize(fontSize);
        
        let pdfX = x;
        let pdfAlign = 'left';
        
        // Align selectable overlay exactly to match text alignment
        if (textAlign === 'center') {
          pdfX = x + rect.width / 2;
          pdfAlign = 'center';
        } else if (textAlign === 'right') {
          pdfX = x + rect.width;
          pdfAlign = 'right';
        }
        
        // Render invisible text exactly over the visual text coordinates (adjusting baseline by fontSize * 0.85)
        pdf.text(text.trim(), pdfX, y + (fontSize * 0.85), {
          renderingMode: 'invisible',
          align: pdfAlign,
          maxWidth: rect.width
        });
      } catch (e) {
        console.error('Error adding selectable text:', e);
      }
    });

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Gagal menghasilkan PDF: ' + (error.message || error));
  } finally {
    // Clean up the PDF export state class
    containerElement.classList.remove('pdf-export-active');
  }
};
