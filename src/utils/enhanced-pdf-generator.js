/**
 * Enhanced PDF Generator for Invoices and Estimates
 * 
 * This utility provides improved PDF generation with proper pagination,
 * professional formatting, and consistent styling across multiple pages.
 */

// Helper function to generate professional PDFs for invoices and estimates
export const generateProfessionalPdf = async (data, options = {}) => {
  const {
    type = 'invoice',  // or 'estimate'
    action = 'download', // or 'whatsapp'
    filename = 'document.pdf',
    logoImage = null,   // Base64 logo data
  } = options;

  // Ensure PDFKit is available
  if (!window.PDFDocument || !window.blobStream) {
    throw new Error("PDF generation libraries not loaded. Please try again later.");
  }

  try {
    // Create a new PDF document
    const doc = new window.PDFDocument({
      size: "A4",
      margin: 30, // Reduced margins from 40 to 30
      bufferPages: true, // Enable buffer pages for page numbering
      autoFirstPage: true, // Automatically create the first page
    });

    // Create a stream to capture the PDF data
    const stream = doc.pipe(window.blobStream());
    
    // Document constants - OPTIMIZED FOR BETTER PAGINATION
    const DOCUMENT_MARGIN = 30; // Reduced margins from 40 to 30
    const PAGE_WIDTH = doc.page.width - (DOCUMENT_MARGIN * 2);
    const PAGE_HEIGHT = doc.page.height - (DOCUMENT_MARGIN * 2);
    const TABLE_TOP = 380; // Reduced top position to address spacing issues
    const ROW_HEIGHT = 18; // Smaller row height for compact display
    const ITEMS_PER_PAGE_FIRST = Math.floor((PAGE_HEIGHT - TABLE_TOP + DOCUMENT_MARGIN) / ROW_HEIGHT) - 1; // Further adjusted to prevent empty pages
    const ITEMS_PER_PAGE = Math.floor((PAGE_HEIGHT - 100) / ROW_HEIGHT) - 1; // Increased to fit more items on subsequent pages

    // Set column positions
    const ITEM_COLUMNS = {
      item: { x: DOCUMENT_MARGIN, width: PAGE_WIDTH * 0.30 },
      description: { x: DOCUMENT_MARGIN + (PAGE_WIDTH * 0.30), width: PAGE_WIDTH * 0.20 },
      unitCost: { x: DOCUMENT_MARGIN + (PAGE_WIDTH * 0.50), width: PAGE_WIDTH * 0.15 },
      quantity: { x: DOCUMENT_MARGIN + (PAGE_WIDTH * 0.65), width: PAGE_WIDTH * 0.10 },
      lineTotal: { x: DOCUMENT_MARGIN + (PAGE_WIDTH * 0.75), width: PAGE_WIDTH * 0.25 },
    };

    // Company and document info
    const documentInfo = {
      title: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
      number: data[`${type}_nr`] || data.number,
      date: data[`${type}_date`] || data.issuedAt,
      dueDate: data[`${type}_due_date`] || data.dueAt,
      subtotal: data.subtotal || 0,
      paid: data.paid || 0,
      notes: data.notes || '',
      company: data.company || {},
      banking: data.banking || {},
      customer: data.customer || {},
      recipientProfile: data.recipientProfile || null,
      items: data.items || [],
      currencySymbol: (data.company && data.company.currency_symbol) ? data.company.currency_symbol : 'R',
    };

    // Function to format currency values properly, handling NaN and undefined
    const formatCurrency = (value, symbol = documentInfo.currencySymbol) => {
      let numValue = parseFloat(value);
      if (isNaN(numValue)) numValue = 0;
      return `${symbol}${numValue.toFixed(2)}`;
    };
    
    // Function to draw horizontal line - IMPROVED STYLING
    const drawHorizontalLine = (y, options = {}) => {
      const { 
        color = "#dddddd", // Lighter color
        width = 0.5,      // Thinner line
        dash = false,     // Option for dashed line
        short = false     // Option for shorter line (for items)
      } = options;
      
      const startX = DOCUMENT_MARGIN;
      const endX = short 
        ? DOCUMENT_MARGIN + PAGE_WIDTH * 0.95 // Slightly shorter for item separators
        : doc.page.width - DOCUMENT_MARGIN;
        
      doc.strokeColor(color)
         .lineWidth(width);
         
      if (dash) {
        doc.dash(3, { space: 2 });
      }
         
      doc.moveTo(startX, y)
         .lineTo(endX, y)
         .stroke();
         
      if (dash) {
        doc.undash(); // Reset dash
      }
    };

    // Function to create a new page with compact header
    const createNewPage = () => {
      doc.addPage();
      
      // Use a compact header for continuation pages
      doc.fontSize(9)
         .fillColor("#444444")
         .text(`${documentInfo.title} #${documentInfo.number} - ${documentInfo.company.name || 'Company'}`, DOCUMENT_MARGIN, 25);
      
      // Add small logo
      if (logoImage) {
        doc.image(logoImage, doc.page.width - DOCUMENT_MARGIN - 30, 20, { width: 30 });
      }
    };

    // Generate header with logo and company details (simpler for subsequent pages)
    const generateSimpleHeader = (doc, info, logoImage) => {
      // Company logo
      if (logoImage) {
        doc.image(logoImage, DOCUMENT_MARGIN, 40, { width: 50 });
      }

      // Company info on right side
      const rightColumnX = doc.page.width - DOCUMENT_MARGIN - 200;
      
      doc.fillColor("#444444")
         .fontSize(10)
         .text(info.company.name || '', rightColumnX, 40, { align: "right", width: 200 })
         .text(info.company.address1 || '', rightColumnX, 55, { align: "right", width: 200 })
         .text(`${info.company.city || ''}, ${info.company.country || ''}`, rightColumnX, 70, { align: "right", width: 200 })
         .text(`Email: ${info.company.email || ''}`, rightColumnX, 85, { align: "right", width: 200 });
    };

    // Generate first page header with detailed company info and logo
    const generateFullHeader = (doc, info, logoImage) => {
      // Logo on left side
      if (logoImage) {
        doc.image(logoImage, DOCUMENT_MARGIN, 40, { width: 50 });
        
        // Company name and slogan below logo if space available
        doc.fillColor("#444444")
           .fontSize(12)
           .font("Helvetica-Bold")
           .text(info.company.name || '', DOCUMENT_MARGIN + 60, 45)
           .fontSize(9)
           .font("Helvetica")
           .text(info.company.slogan || '', DOCUMENT_MARGIN + 60, 60);
      } else {
        // If no logo, place company name at top left
        doc.fillColor("#444444")
           .fontSize(14)
           .font("Helvetica-Bold")
           .text(info.company.name || '', DOCUMENT_MARGIN, 45)
           .fontSize(10)
           .font("Helvetica")
           .text(info.company.slogan || '', DOCUMENT_MARGIN, 65);
      }

      // Company info on right side
      const rightColumnX = doc.page.width - DOCUMENT_MARGIN - 200;
      
      doc.fillColor("#444444")
         .fontSize(9)
         .text(info.company.name || '', rightColumnX, 40, { align: "right", width: 200 })
         .text(info.company.address1 || '', rightColumnX, 55, { align: "right", width: 200 })
         .text(`${info.company.city || ''} ${info.company.state || ''}`, rightColumnX, 70, { align: "right", width: 200 })
         .text(`${info.company.country || ''}`, rightColumnX, 85, { align: "right", width: 200 })
         .text(info.company.postal_code || '', rightColumnX, 100, { align: "right", width: 200 })
         .text(`Email: ${info.company.email || ''}`, rightColumnX, 115, { align: "right", width: 200 });
    };

    // Generate customer and document information section
    const generateDocumentInfo = (doc, info) => {
      // Document title with background
      doc.fillColor("#3366cc") // Professional blue color
         .rect(DOCUMENT_MARGIN - 5, 150, PAGE_WIDTH + 10, 36)
         .fill();
      
      // Document title (Invoice/Estimate) with number
      doc.fillColor("#ffffff")
         .fontSize(18)
         .font("Helvetica-Bold")
         .text(`${info.title} #${info.number}`, DOCUMENT_MARGIN, 160);
         
      // Document details on left
      const docDetailY = 200;
      doc.fontSize(9)
         .fillColor("#444444")
         .font("Helvetica-Bold")
         .text(`${info.title} Details:`, DOCUMENT_MARGIN, docDetailY)
         .font("Helvetica")
         .text(`Date:`, DOCUMENT_MARGIN, docDetailY + 15)
         .text(`${info.date}`, DOCUMENT_MARGIN + 80, docDetailY + 15)
         .text(`Due Date:`, DOCUMENT_MARGIN, docDetailY + 30)
         .text(`${info.dueDate}`, DOCUMENT_MARGIN + 80, docDetailY + 30)
         .font("Helvetica-Bold")
         .text(`Balance Due:`, DOCUMENT_MARGIN, docDetailY + 45)
         .text(
           formatCurrency(info.subtotal - info.paid, info.currencySymbol),
           DOCUMENT_MARGIN + 80,
           docDetailY + 45
         );
      
      // Banking details on right
      const rightColumnX = doc.page.width / 2;
      doc.fontSize(9)
         .font("Helvetica-Bold")
         .text("Banking Details:", rightColumnX, docDetailY)
         .font("Helvetica")
         .text("Bank:", rightColumnX, docDetailY + 15)
         .text(info.banking.bank || '', rightColumnX + 70, docDetailY + 15)
         .text("Account #:", rightColumnX, docDetailY + 30)
         .text(info.banking.account_number || '', rightColumnX + 70, docDetailY + 30)
         .text("Branch Code:", rightColumnX, docDetailY + 45)
         .text(info.banking.branch_code || '', rightColumnX + 70, docDetailY + 45);
      
      // Horizontal divider
      drawHorizontalLine(265, { color: "#aaaaaa", width: 0.75 });
      
      // Recipient information - IMPROVED SPACING AND WIDTH
      const recipientY = 275; // Reduced spacing
      doc.fontSize(9)
         .font("Helvetica-Bold")
         .text("Bill To:", DOCUMENT_MARGIN, recipientY)
         .font("Helvetica")
         .text("Name:", DOCUMENT_MARGIN, recipientY + 15)
         .text(info.recipientProfile?.name || info.customer?.name || '', DOCUMENT_MARGIN + 80, recipientY + 15)
         .text("Address:", DOCUMENT_MARGIN, recipientY + 30);
      
      // Improved address handling with proper width and wrapping
      const addressText = info.recipientProfile?.address || info.customer?.address || '';
      doc.text(
        addressText,
        DOCUMENT_MARGIN + 80,
        recipientY + 30,
        { 
          width: PAGE_WIDTH - 80, // Use more width for address
          lineGap: 2, // Tighter line spacing for address
        }
      );
      
      // Calculate the height of the address text to position subsequent fields properly
      const addressHeight = doc.heightOfString(
        addressText,
        { 
          width: PAGE_WIDTH - 80,
          lineGap: 2
        }
      );
      
      const phoneY = recipientY + 30 + addressHeight + 5; // Dynamically position phone field
      
      doc.text("Phone:", DOCUMENT_MARGIN, phoneY)
         .text(info.recipientProfile?.phone || info.customer?.phone || '', DOCUMENT_MARGIN + 80, phoneY)
         .text("VAT:", DOCUMENT_MARGIN, phoneY + 15)
         .text(info.recipientProfile?.vatNumber || info.customer?.vat || '', DOCUMENT_MARGIN + 80, phoneY + 15);
      
      // Final horizontal line before line items - REDUCED SPACING
      drawHorizontalLine(phoneY + 35, { color: "#aaaaaa", width: 0.75 });
    };
    
    // Generate the line items table header with background
    const generateTableHeader = (y = TABLE_TOP) => {
      // Draw subtle header background
      doc.fillColor("#f5f5f5")
         .rect(DOCUMENT_MARGIN - 2, y - 2, PAGE_WIDTH + 4, 20)
         .fill();
      
      // Draw border
      doc.strokeColor("#cccccc")
         .lineWidth(0.5)
         .rect(DOCUMENT_MARGIN - 2, y - 2, PAGE_WIDTH + 4, 20)
         .stroke();
      
      doc.font("Helvetica-Bold")
         .fontSize(9)
         .fillColor("#333333")
         .text("Item", ITEM_COLUMNS.item.x, y + 3)
         .text("Description", ITEM_COLUMNS.description.x, y + 3)
         .text("Unit Cost", ITEM_COLUMNS.unitCost.x, y + 3, { align: 'right', width: ITEM_COLUMNS.unitCost.width - 5 })
         .text("Quantity", ITEM_COLUMNS.quantity.x, y + 3, { align: 'right', width: ITEM_COLUMNS.quantity.width - 5 })
         .text("Total", ITEM_COLUMNS.lineTotal.x, y + 3, { align: 'right', width: ITEM_COLUMNS.lineTotal.width - 5 });
      
      return y + 20; // Return the new y position after the header
    };

    // Generate table row - IMPROVED for better layout
    const generateTableRow = (item, y, options = {}) => {
      const { lastRow = false, zebraStripe = false } = options;
      
      // Draw zebra stripe background if requested
      if (zebraStripe) {
        doc.fillColor("#f9f9f9")
           .rect(DOCUMENT_MARGIN - 2, y - 2, PAGE_WIDTH + 4, ROW_HEIGHT)
           .fill();
      }
      
      // Track if we need extra space for a wrapped description
      let rowHeight = ROW_HEIGHT;
      
      // Item name - truncate if too long
      doc.font("Helvetica")
         .fontSize(8)
         .fillColor("#444444")
         .text(
            item.item || item.name || '', 
            ITEM_COLUMNS.item.x, 
            y, 
            { width: ITEM_COLUMNS.item.width - 5, ellipsis: true }
         );
      
      // Description - allows for minimal wrapping
      const descriptionText = item.description || '';
      if (descriptionText) {
        // Get the text height with strict limits
        const textHeight = doc.heightOfString(
          descriptionText, 
          { 
            width: ITEM_COLUMNS.description.width - 5, 
            ellipsis: true,
            height: ROW_HEIGHT * 1.2, // Strict height cap
          }
        );
        
        if (textHeight > ROW_HEIGHT) {
          rowHeight = Math.min(textHeight + 2, ROW_HEIGHT * 1.2); // Cap maximum height
        }
        
        doc.text(
          descriptionText,
          ITEM_COLUMNS.description.x, 
          y,
          { 
            width: ITEM_COLUMNS.description.width - 5, 
            ellipsis: true,
            height: ROW_HEIGHT * 1.2, // Strict height limit
          }
        );
      }
      
      // Unit cost - with proper number handling
      const unitCost = parseFloat(item.amount);
      doc.text(
        isNaN(unitCost) ? "-" : formatCurrency(unitCost, documentInfo.currencySymbol),
        ITEM_COLUMNS.unitCost.x, 
        y,
        { width: ITEM_COLUMNS.unitCost.width - 5, align: 'right' }
      );
      
      // Quantity - with proper number handling
      const quantity = parseFloat(item.quantity);
      doc.text(
        isNaN(quantity) ? "-" : quantity.toString(),
        ITEM_COLUMNS.quantity.x, 
        y,
        { width: ITEM_COLUMNS.quantity.width - 5, align: 'right' }
      );
      
      // Line total - with proper number handling
      let lineTotal = 0;
      if (!isNaN(unitCost) && !isNaN(quantity)) {
        lineTotal = unitCost * quantity;
      }
      
      doc.text(
        formatCurrency(lineTotal, documentInfo.currencySymbol),
        ITEM_COLUMNS.lineTotal.x, 
        y,
        { width: ITEM_COLUMNS.lineTotal.width - 5, align: 'right' }
      );
      
      // Draw horizontal line but not for summary rows unless it's the last one
      if (!item.isSummaryRow || lastRow) {
        drawHorizontalLine(y + rowHeight - 2, { short: true, color: "#dddddd" });
      }
      
      return rowHeight;
    };

    // Generate footer with terms
    const generateDocumentFooter = () => {
      const y = doc.y + 30;
      
      // Notes section if available
      if (documentInfo.notes && documentInfo.notes.trim() !== '') {
        doc.font("Helvetica-Bold")
           .fontSize(10)
           .fillColor("#333333")
           .text("Notes:", DOCUMENT_MARGIN, y)
           .font("Helvetica")
           .fontSize(9)
           .fillColor("#555555")
           .text(
              documentInfo.notes,
              DOCUMENT_MARGIN,
              y + 15,
              { align: "left", width: PAGE_WIDTH }
           );
      }
      
      // Standard thank you message and payment reference
      const thanksY = documentInfo.notes ? doc.y + 20 : y + 15;
      doc.fontSize(9)
         .fillColor("#555555")
         .text(
           `Thank you for your business. Please use ${documentInfo.title} #${documentInfo.number} as your payment reference.`,
           DOCUMENT_MARGIN,
           thanksY,
           { align: "center", width: PAGE_WIDTH }
         );
    };

    // Begin generating the document
    // Generate full header on first page
    generateFullHeader(doc, documentInfo, logoImage);
    
    // Add document information section
    generateDocumentInfo(doc, documentInfo);
    
    // Generate line items table header and get starting Y position
    let currentY = TABLE_TOP;
    currentY = generateTableHeader(currentY);
    
    // Initialize page tracking variables
    let currentPage = 1;
    let itemsOnCurrentPage = 0;
    let itemIndex = 0; // Counter for zebra striping
    
    // Process all line items
    for (let i = 0; i < documentInfo.items.length; i++) {
      const item = documentInfo.items[i];
      const zebraStripe = itemIndex % 2 === 1; // Alternate row background
      itemIndex++;
      
      // Check if we need a new page
      const isLastItem = i === documentInfo.items.length - 1;
      const maxItemsForThisPage = currentPage === 1 ? ITEMS_PER_PAGE_FIRST : ITEMS_PER_PAGE;
      
      // Check remaining space on current page including summary if this is the last item
      const spaceNeededForSummary = isLastItem ? 120 : 0; // Space for summary and notes
      
      // Check if this item will fit on the current page or if we need a new page
      if (
        !isLastItem && // Don't create a new page for the last item unless absolutely necessary
        (itemsOnCurrentPage >= maxItemsForThisPage || 
         currentY + ROW_HEIGHT + spaceNeededForSummary > doc.page.height - 60)
      ) {
        // Create a new page
        currentPage++;
        doc.addPage();
        
        // Simple header for continuation page
        doc.fontSize(9)
           .fillColor("#444444")
           .text(`${documentInfo.title} #${documentInfo.number} - ${documentInfo.company.name || 'Company'}`, DOCUMENT_MARGIN, 25);
        
        // Add small logo
        if (logoImage) {
          doc.image(logoImage, doc.page.width - DOCUMENT_MARGIN - 30, 20, { width: 30 });
        }
        // Reset counters and add table header on new page
        currentY = 80; // Higher position on continuation pages
        generateTableHeader(currentY);
        currentY += 20; // Move down after header
        itemsOnCurrentPage = 0;
      }
      
      // Draw the table row and get its height - with zebra striping
      const rowHeight = generateTableRow(item, currentY, { zebraStripe });
      
      // Update position and item counter
      currentY += rowHeight;
      itemsOnCurrentPage++;
    }
    
    // Check if we have enough space for summary (at least 80 units), otherwise create a new page
    // Avoid creating a new page if possible - try to fit on current page with notes
    if (currentY + 150 > doc.page.height - 50) { // Allow more space for summary + notes
      // Create a new page
      currentPage++;
      doc.addPage();
      
      // Simple header for continuation page
      doc.fontSize(9)
         .fillColor("#444444")
         .text(`${documentInfo.title} #${documentInfo.number} - ${documentInfo.company.name || 'Company'}`, DOCUMENT_MARGIN, 25);
      
      // Add small logo
      if (logoImage) {
        doc.image(logoImage, doc.page.width - DOCUMENT_MARGIN - 30, 20, { width: 30 });
      }
      
      // Reset position
      currentY = 80;
    }
    
    // Small spacing
    currentY += 10;
    
    // IMPROVED SUMMARY LAYOUT - Fixed overlapping values issue
    // Calculate column positions for summary section (right-aligned)
    const SUMMARY_WIDTH = PAGE_WIDTH * 0.4; // Summary section width
    const SUMMARY_X = doc.page.width - DOCUMENT_MARGIN - SUMMARY_WIDTH; // Right-aligned position
    
    // Add background for summary section
    doc.fillColor("#f7f7f7")
       .rect(SUMMARY_X - 5, currentY, SUMMARY_WIDTH + 5, ROW_HEIGHT * 3 + 10)
       .fill();
    
    // Draw border around summary box
    doc.strokeColor("#cccccc")
       .lineWidth(0.5)
       .rect(SUMMARY_X - 5, currentY, SUMMARY_WIDTH + 5, ROW_HEIGHT * 3 + 10)
       .stroke();
    
    // Calculate actual subtotal value
    let subtotal = 0;
    for (const item of documentInfo.items) {
      const unitCost = parseFloat(item.amount);
      const quantity = parseFloat(item.quantity);
      if (!isNaN(unitCost) && !isNaN(quantity)) {
        subtotal += unitCost * quantity;
      }
    }
    
    // Display subtotal row with clear separation between label and value
    doc.font("Helvetica")
       .fontSize(9)
       .fillColor("#444444")
       .text("Subtotal", SUMMARY_X + 10, currentY + 5)
       .text(
         formatCurrency(subtotal, documentInfo.currencySymbol),
         SUMMARY_X + 10,
         currentY + 5,
         { width: SUMMARY_WIDTH - 20, align: 'right' }
       );
    currentY += ROW_HEIGHT;
    
    // Display paid amount row with clear separation
    const paidAmount = parseFloat(documentInfo.paid);
    doc.text(
      "Paid to Date",
      SUMMARY_X + 10,
      currentY + 5
    )
    .text(
      isNaN(paidAmount) ? formatCurrency(0) : formatCurrency(paidAmount, documentInfo.currencySymbol),
      SUMMARY_X + 10,
      currentY + 5,
      { width: SUMMARY_WIDTH - 20, align: 'right' }
    );
    currentY += ROW_HEIGHT;
    
    // Calculate and display balance due with clear separation
    const balanceDue = subtotal - (isNaN(paidAmount) ? 0 : paidAmount);
    
    // Display balance due with clear separation
    doc.font("Helvetica-Bold")
       .text(
         "Balance Due",
         SUMMARY_X + 10,
         currentY + 5
       )
       .text(
         formatCurrency(balanceDue, documentInfo.currencySymbol),
         SUMMARY_X + 10,
         currentY + 5,
         { width: SUMMARY_WIDTH - 20, align: 'right' }
       );
    currentY += ROW_HEIGHT + 10;
    
    // Add document footer with notes and thank you message
    generateDocumentFooter();
    
    // Finalize the document
    doc.end();
    
    // Return the promise that resolves with the blob
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        const blob = stream.toBlob('application/pdf');
        
        if (action === 'download') {
          // Create a download link
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          resolve(blob);
        } else {
          // Just return the blob for other actions (like WhatsApp)
          resolve(blob);
        }
      });
      
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};