const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function generateInvoice(outputPath) {
  // Use autoPageBreak: false so we have 100% strict control over page breaks!
  const doc = new PDFDocument({
    size: 'A4',
    margin: 30, // 30 pt margins all around
    autoPageBreak: false,
    info: {
      Title: 'Commercial Invoice - B.J.S. Rampuria Jain Law College',
      Author: 'Ruchika Software Solution',
      Subject: 'Pankh Gold College Management ERP Software Implementation',
      Keywords: 'Invoice, ERP, Rampuria College, Pankh Gold, Software'
    }
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;   // 595.28
  const pageHeight = doc.page.height; // 841.89
  const margin = 30;
  const contentWidth = pageWidth - (margin * 2); // 535.28

  // Corporate Color Palette
  const primaryDark  = '#0F172A'; // Slate 900
  const brandIndigo  = '#3730A3'; // Indigo 800
  const brandBlue    = '#1D4ED8'; // Blue 700
  const accentGold   = '#B45309'; // Amber 700
  const goldBg       = '#FEF3C7'; // Amber 100
  const slateHeader  = '#1E293B'; // Slate 800
  const lightBg      = '#F8FAFC'; // Slate 50
  const cardBg       = '#F1F5F9'; // Slate 100
  const borderLight  = '#CBD5E1'; // Slate 300
  const borderDark   = '#94A3B8'; // Slate 400
  const textDark     = '#0F172A'; // Crisp Dark Text
  const textMuted    = '#475569'; // Slate 600
  const emeraldDark  = '#065F46'; // Emerald 800
  const emeraldBg    = '#ECFDF5'; // Emerald 50
  const emeraldLine  = '#059669'; // Emerald 600

  // ════════════════════════════════════════════════════════════════
  // PAGE 1: COMMERCIAL INVOICE & MILESTONE PAYMENT REQUEST
  // ════════════════════════════════════════════════════════════════

  // Top Accent Header Bar
  doc.rect(margin, margin, contentWidth, 5).fill(brandIndigo);

  // Logo & Header Info
  const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
  const topY = margin + 12; // y = 42

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, margin + 2, topY, { width: 50, height: 50 });
    } catch (e) {
      console.warn('Logo load error:', e.message);
    }
  }

  // Ruchika Software Solution Branding (Left-Center)
  const headerLeftX = margin + 58;
  const headerLeftW = 295; // Strictly constrained so it never touches the right box!

  doc.font('Helvetica-Bold').fontSize(15).fillColor(primaryDark);
  doc.text('RUCHIKA SOFTWARE SOLUTION', headerLeftX, topY, { width: headerLeftW });

  doc.font('Helvetica-Bold').fontSize(8).fillColor(accentGold);
  doc.text('ENTERPRISE IT SOLUTIONS & ACADEMIC ERP DEVELOPMENT', headerLeftX, topY + 18, { width: headerLeftW });

  doc.font('Helvetica').fontSize(7.5).fillColor(textMuted);
  doc.text('Web: ruchikasoftwaresolution.com   |   Email: admn@ruchikasoftwaresolution.com', headerLeftX, topY + 30, { width: headerLeftW });
  
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(textDark);
  doc.text('Direct Support: ', headerLeftX, topY + 41, { continued: true });
  doc.font('Helvetica').fontSize(7.5).fillColor(textMuted);
  doc.text('+91 96100 77159 (Deepak Ojha)  |  +91 63756 45010 (Akash Ojha)', { width: headerLeftW });

  doc.font('Helvetica-Oblique').fontSize(7).fillColor(brandIndigo);
  doc.text('Authorized Developer & Licensor of Pankh Gold College Management ERP', headerLeftX, topY + 53, { width: headerLeftW });

  // Right Top: TAX INVOICE Box
  const boxW = 170;
  const boxX = pageWidth - margin - boxW; // 595.28 - 30 - 170 = 395.28
  const boxH = 68;

  doc.roundedRect(boxX, topY, boxW, boxH, 4).lineWidth(1).strokeColor(brandIndigo).stroke();
  doc.rect(boxX, topY, boxW, 20).fill(brandIndigo);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#FFFFFF');
  doc.text('TAX INVOICE / BILL', boxX, topY + 5, { width: boxW, align: 'center' });

  // Inside Invoice Details
  const printInvField = (lbl, val, yOff, isHighlight = false) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(textDark);
    doc.text(lbl, boxX + 8, topY + yOff, { width: 62 });
    doc.font(isHighlight ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor(isHighlight ? brandIndigo : textDark);
    doc.text(val, boxX + 68, topY + yOff, { width: boxW - 74 });
  };

  printInvField('Invoice No:', 'RSS/2026-27/INV-108', 25, true);
  printInvField('Invoice Date:', '01 November 2026', 38);
  printInvField('Billing Type:', 'Milestone (50% Demand)', 51, true);

  // Horizontal Divider Line
  let currY = topY + 76; // y = 118
  doc.moveTo(margin, currY).lineTo(pageWidth - margin, currY).lineWidth(0.8).strokeColor(borderDark).stroke();

  // ─── BILL TO & CLIENT INFORMATION BOX ───
  currY += 8; // y = 126
  const clientBoxH = 74;
  doc.rect(margin, currY, contentWidth, clientBoxH).fill(lightBg);
  doc.rect(margin, currY, contentWidth, clientBoxH).lineWidth(0.8).strokeColor(borderLight).stroke();

  // Left Column: Client Details (Width constrained to 320 pt)
  const clientLeftW = 320;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(brandIndigo);
  doc.text('BILL TO (CLIENT INSTITUTION):', margin + 10, currY + 7, { width: clientLeftW });

  doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryDark);
  doc.text('B.J.S. RAMPURIA JAIN LAW COLLEGE', margin + 10, currY + 20, { width: clientLeftW });

  doc.font('Helvetica').fontSize(7.5).fillColor(textMuted);
  doc.text('Affiliated to Maharaja Ganga Singh University (MGSU) & Dr. Bhimrao Ambedkar Law University (ALU)', margin + 10, currY + 35, { width: clientLeftW, lineGap: 1.5 });
  doc.text('Approved by Bar Council of India (BCI)  |  Near Fort, Bikaner - 334001 (Rajasthan)', margin + 10, currY + 54, { width: clientLeftW });

  // Vertical Separator in Client Box
  const clientDividerX = margin + 335;
  doc.moveTo(clientDividerX, currY + 6).lineTo(clientDividerX, currY + clientBoxH - 6).lineWidth(0.5).strokeColor(borderLight).stroke();

  // Right Column: Reference & Contact Details
  const clientRightX = clientDividerX + 12;
  const clientRightW = contentWidth - (clientDividerX - margin) - 18;

  const printClientRightRow = (lbl, val, yOff, isBlue = false) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryDark);
    doc.text(lbl, clientRightX, currY + yOff, { width: 68 });
    doc.font(isBlue ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor(isBlue ? brandBlue : textDark);
    doc.text(val, clientRightX + 70, currY + yOff, { width: clientRightW - 70 });
  };

  printClientRightRow('College Code:', 'MGSU-104', 8, true);
  printClientRightRow('Kind Attn:', 'The Principal / Management', 23);
  printClientRightRow('Campus Email:', 'info@rampurialaw.com', 38);
  printClientRightRow('Deployment:', 'On-Premise Local ERP Node', 53);

  // ─── MAIN COMMERCIAL ITEMS TABLE ───
  currY += clientBoxH + 10; // y = 210

  // Column Boundaries (Strictly Partitioned)
  const colSNoW   = 28;
  const colDescW  = 265;
  const colTypeW  = 72;
  const colRateW  = 80;
  const colTotalW = contentWidth - (colSNoW + colDescW + colTypeW + colRateW); // 90.28 pt

  const colSNoX   = margin;
  const colDescX  = colSNoX + colSNoW;
  const colTypeX  = colDescX + colDescW;
  const colRateX  = colTypeX + colTypeW;
  const colTotalX = colRateX + colRateW;

  // Table Header
  const tableHeaderH = 20;
  doc.rect(margin, currY, contentWidth, tableHeaderH).fill(slateHeader);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');
  doc.text('#', colSNoX, currY + 6, { width: colSNoW, align: 'center' });
  doc.text('DESCRIPTION OF SERVICE / DELIVERABLE', colDescX + 6, currY + 6, { width: colDescW - 12 });
  doc.text('TYPE / TERM', colTypeX, currY + 6, { width: colTypeW, align: 'center' });
  doc.text('RATE (INR)', colRateX, currY + 6, { width: colRateW - 8, align: 'right' });
  doc.text('AMOUNT (INR)', colTotalX, currY + 6, { width: colTotalW - 8, align: 'right' });

  currY += tableHeaderH; // y = 230

  // Row 1: ERP Implementation
  const row1H = 64;
  doc.rect(margin, currY, contentWidth, row1H).fill('#FFFFFF');
  doc.rect(margin, currY, contentWidth, row1H).lineWidth(0.5).strokeColor(borderLight).stroke();

  doc.font('Helvetica-Bold').fontSize(8).fillColor(textDark);
  doc.text('1', colSNoX, currY + 8, { width: colSNoW, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(primaryDark);
  doc.text('Pankh Gold College Management ERP - Enterprise Local Edition', colDescX + 6, currY + 8, { width: colDescW - 12 });

  doc.font('Helvetica').fontSize(7).fillColor(textMuted);
  const row1Desc = 'Full-scale desktop & local LAN college management system tailored for B.J.S. Rampuria Jain Law College. Modules: Multi-Session Student Admission, Bulk Excel Importer, Fees & Installments Engine, Double-Entry Day Book Finance, Merit & Promotion System, Student 360 Dossier, Institutional Print Engine with MGSU-104 Crest & MS SQL Server 2022 Local Synchronization.';
  doc.text(row1Desc, colDescX + 6, currY + 20, { width: colDescW - 14, lineGap: 1.5 });

  doc.font('Helvetica').fontSize(7.5).fillColor(textDark);
  doc.text('One-Time License', colTypeX, currY + 14, { width: colTypeW, align: 'center' });
  doc.text('79,999.00', colRateX, currY + 14, { width: colRateW - 8, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryDark);
  doc.text('79,999.00', colTotalX, currY + 14, { width: colTotalW - 8, align: 'right' });

  currY += row1H; // y = 294

  // Row 2: Goodwill Institutional Discount
  const row2H = 26;
  doc.rect(margin, currY, contentWidth, row2H).fill(lightBg);
  doc.rect(margin, currY, contentWidth, row2H).lineWidth(0.5).strokeColor(borderLight).stroke();

  doc.font('Helvetica-Bold').fontSize(8).fillColor(accentGold);
  doc.text('2', colSNoX, currY + 7, { width: colSNoW, align: 'center' });
  doc.text('Special Institutional Discount / Goodwill Concession', colDescX + 6, currY + 7, { width: colDescW - 12 });

  doc.font('Helvetica').fontSize(6.5).fillColor(textMuted);
  doc.text('Special commercial concession approved for B.J.S. Rampuria Jain Law College', colDescX + 6, currY + 17, { width: colDescW - 12 });

  doc.font('Helvetica').fontSize(7.5).fillColor(textMuted);
  doc.text('Concession', colTypeX, currY + 7, { width: colTypeW, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(accentGold);
  doc.text('- 9,400.00', colRateX, currY + 7, { width: colRateW - 8, align: 'right' });
  doc.text('- 9,400.00', colTotalX, currY + 7, { width: colTotalW - 8, align: 'right' });

  currY += row2H; // y = 320

  // Row 3: Net Software Amount (Subtotal Highlight)
  const row3H = 22;
  doc.rect(margin, currY, contentWidth, row3H).fill('#EFF6FF');
  doc.rect(margin, currY, contentWidth, row3H).lineWidth(0.8).strokeColor(brandBlue).stroke();

  doc.font('Helvetica-Bold').fontSize(8).fillColor(brandBlue);
  doc.text('NET FINAL PAYABLE ERP SOFTWARE IMPLEMENTATION AMOUNT', colDescX + 6, currY + 6, { width: colDescW + colTypeW });

  doc.font('Helvetica-Bold').fontSize(9).fillColor(brandBlue);
  doc.text('Rs. 70,599.00', colTotalX, currY + 5, { width: colTotalW - 8, align: 'right' });

  currY += row3H; // y = 342

  // Row 4: Annual Maintenance Contract (AMC)
  const row4H = 46;
  doc.rect(margin, currY, contentWidth, row4H).fill('#FFFFFF');
  doc.rect(margin, currY, contentWidth, row4H).lineWidth(0.5).strokeColor(borderLight).stroke();

  doc.font('Helvetica-Bold').fontSize(8).fillColor(textDark);
  doc.text('3', colSNoX, currY + 8, { width: colSNoW, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(primaryDark);
  doc.text('Annual Maintenance Contract (AMC) - Annual Support', colDescX + 6, currY + 8, { width: colDescW - 12 });

  doc.font('Helvetica').fontSize(7).fillColor(textMuted);
  const row4Desc = 'Includes routine database health monitoring, software updates, academic session rollover, technical bug resolutions & offline LAN backup support. (Note: Year 1 support is covered under warranty; recurring renewal rate is Rs. 17,500/year).';
  doc.text(row4Desc, colDescX + 6, currY + 19, { width: colDescW - 14, lineGap: 1.5 });

  doc.font('Helvetica').fontSize(7.5).fillColor(textDark);
  doc.text('Annual (1 Year)', colTypeX, currY + 12, { width: colTypeW, align: 'center' });
  doc.text('17,500.00', colRateX, currY + 12, { width: colRateW - 8, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(textDark);
  doc.text('17,500.00 / yr', colTotalX, currY + 12, { width: colTotalW - 8, align: 'right' });

  currY += row4H + 8; // y = 396

  // ─── MILESTONE PAYMENT & 50% ADVANCE DEMAND BOX ───
  const mileBoxH = 92;
  doc.rect(margin, currY, contentWidth, mileBoxH).fill('#F8FAFC');
  doc.rect(margin, currY, contentWidth, mileBoxH).lineWidth(1).strokeColor(brandIndigo).stroke();

  // Milestone Header Strip
  doc.rect(margin, currY, contentWidth, 18).fill(brandIndigo);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
  doc.text('PAYMENT MILESTONES & CURRENT ADVANCE DEMAND (50% STAGE)', margin + 10, currY + 5);

  const mInnerY = currY + 24;

  // Left explanation column (Width = 260 pt)
  doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryDark);
  doc.text('Project Implementation Status:', margin + 10, mInnerY);

  doc.font('Helvetica').fontSize(7).fillColor(textMuted);
  const statusNote = 'Full software core development, local database architecture (SQL Server 2022), bulk student data migration across 3 sessions, and single-click local executable package are 100% built and deployed on college premises. Custom print adjustments and live staff testing are currently underway.';
  doc.text(statusNote, margin + 10, mInnerY + 12, { width: 260, lineGap: 1.5 });

  // Divider inside Milestone Box
  const mDividerX = margin + 280;
  doc.moveTo(mDividerX, mInnerY).lineTo(mDividerX, currY + mileBoxH - 8).lineWidth(0.5).strokeColor(borderLight).stroke();

  // Right milestone figures table (Width = contentWidth - 290)
  const mFigX = mDividerX + 10;
  const mFigW = contentWidth - 290 - 10;

  // Row A: Total Software Cost
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(textDark);
  doc.text('Total Agreed ERP Cost (Discounted):', mFigX, mInnerY);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryDark);
  doc.text('Rs. 70,599.00', mFigX + mFigW - 75, mInnerY, { width: 75, align: 'right' });

  // Row B: Current Demand - 50%
  const m2Y = mInnerY + 15;
  doc.rect(mFigX - 3, m2Y - 2, mFigW + 6, 24).fill(emeraldBg);
  doc.rect(mFigX - 3, m2Y - 2, mFigW + 6, 24).lineWidth(0.8).strokeColor(emeraldLine).stroke();

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(emeraldDark);
  doc.text('1st Milestone (50% Advance Demand):', mFigX + 2, m2Y + 2);
  doc.font('Helvetica').fontSize(6.5).fillColor(emeraldLine);
  doc.text('(Payable Now upon software delivery & staging)', mFigX + 2, m2Y + 13);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(emeraldDark);
  doc.text('Rs. 35,300.00', mFigX + mFigW - 85, m2Y + 4, { width: 85, align: 'right' });

  // Row C: Remaining Balance - 50%
  const m3Y = m2Y + 28;
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(textDark);
  doc.text('2nd Milestone (50% Balance on Handover):', mFigX, m3Y);
  doc.font('Helvetica').fontSize(6.5).fillColor(textMuted);
  doc.text('(Payable on final testing & training sign-off)', mFigX, m3Y + 10);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(textDark);
  doc.text('Rs. 35,299.00', mFigX + mFigW - 75, m3Y + 3, { width: 75, align: 'right' });

  currY += mileBoxH + 6; // y = 494

  // Amount In Words Highlight Box
  const wordBoxH = 20;
  doc.rect(margin, currY, contentWidth, wordBoxH).fill(goldBg);
  doc.rect(margin, currY, contentWidth, wordBoxH).lineWidth(0.8).strokeColor(accentGold).stroke();

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(accentGold);
  doc.text('CURRENT ADVANCE DEMAND IN WORDS:', margin + 8, currY + 6);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryDark);
  doc.text('Rupees Thirty-Five Thousand Three Hundred Only', margin + 195, currY + 6);

  currY += wordBoxH + 8; // y = 522

  // ─── PAYMENT INSTRUCTIONS & AUTHORIZED SIGNATORY ───
  const footerBoxH = 92;

  // Left: Payment Terms & Instructions Box (Width = 305 pt)
  const leftBoxW = 305;
  doc.rect(margin, currY, leftBoxW, footerBoxH).fill(lightBg);
  doc.rect(margin, currY, leftBoxW, footerBoxH).lineWidth(0.8).strokeColor(borderLight).stroke();

  doc.rect(margin, currY, leftBoxW, 16).fill(slateHeader);
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF');
  doc.text('PAYMENT TERMS & INVOICE INSTRUCTIONS', margin + 8, currY + 4);

  let bY = currY + 22;
  const printNoteLine = (lbl, val, isBold = false) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(textDark);
    doc.text(lbl, margin + 8, bY, { width: 95 });
    doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7).fillColor(isBold ? brandIndigo : textDark);
    doc.text(val, margin + 105, bY, { width: leftBoxW - 112 });
    bY += 13;
  };

  printNoteLine('Payment Mode:', 'Cheque / DD / Mutual Institutional Mode', true);
  printNoteLine('Payee Name:', 'In favor of "Ruchika Software Solution"');
  printNoteLine('Milestone Stage:', '50% Advance Demand (Rs. 35,300.00)', true);
  printNoteLine('Receipt Acknowledgment:', 'Official stamped receipt issued upon realization');
  printNoteLine('Jurisdiction & Terms:', 'Subject to Bikaner Jurisdiction | Valid for 30 Days');

  // Right: Authorized Signatory Box (Width = contentWidth - leftBoxW - 10 = 220.28 pt)
  const signBoxX = margin + leftBoxW + 10;
  const signBoxW = contentWidth - leftBoxW - 10;

  doc.rect(signBoxX, currY, signBoxW, footerBoxH).fill('#FFFFFF');
  doc.rect(signBoxX, currY, signBoxW, footerBoxH).lineWidth(0.8).strokeColor(borderLight).stroke();

  doc.rect(signBoxX, currY, signBoxW, 16).fill(slateHeader);
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF');
  doc.text('FOR RUCHIKA SOFTWARE SOLUTION', signBoxX, currY + 4, { width: signBoxW, align: 'center' });

  // Signature line & stamp placeholder
  doc.font('Helvetica-Oblique').fontSize(6.5).fillColor(borderDark);
  doc.text('[ Authorized Seal & Digital Signature ]', signBoxX, currY + 44, { width: signBoxW, align: 'center' });

  doc.moveTo(signBoxX + 20, currY + 68).lineTo(signBoxX + signBoxW - 20, currY + 68).lineWidth(0.8).strokeColor(borderDark).stroke();

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryDark);
  doc.text('Authorized Signatory / Founder', signBoxX, currY + 72, { width: signBoxW, align: 'center' });

  doc.font('Helvetica').fontSize(6.5).fillColor(textMuted);
  doc.text('Ruchika Software Solution, Bikaner', signBoxX, currY + 82, { width: signBoxW, align: 'center' });

  // Bottom Notice
  currY += footerBoxH + 6;
  doc.font('Helvetica-Oblique').fontSize(6.5).fillColor(textMuted);
  doc.text('* Computer-generated commercial tax invoice and formal milestone payment request. Page 1 of 2. See Page 2 for module deliverables, SLA terms & acceptance notes.', margin, currY, { width: contentWidth, align: 'center' });


  // ════════════════════════════════════════════════════════════════
  // PAGE 2: DELIVERABLES, SCOPE OF WORK & INSTITUTIONAL SLA
  // ════════════════════════════════════════════════════════════════
  doc.addPage({ margin: 30, size: 'A4', autoPageBreak: false });

  // Top Accent Header Bar
  doc.rect(margin, margin, contentWidth, 5).fill(brandIndigo);

  let p2Y = margin + 12;

  // Annexure Header
  doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryDark);
  doc.text('ANNEXURE A: SCOPE OF DELIVERABLES & TECHNICAL SPECIFICATIONS', margin, p2Y, { width: contentWidth });

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(accentGold);
  doc.text('PANKH GOLD COLLEGE MANAGEMENT ERP v2.4   |   B.J.S. RAMPURIA JAIN LAW COLLEGE, BIKANER', margin, p2Y + 16, { width: contentWidth });

  p2Y += 30;
  doc.moveTo(margin, p2Y).lineTo(pageWidth - margin, p2Y).lineWidth(0.8).strokeColor(borderDark).stroke();
  p2Y += 10;

  // Section 1: Delivered Modules Grid (Spacious 2-column cards)
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(brandIndigo);
  doc.text('1. DELIVERED ERP MODULES & CORE CAPABILITIES (100% IMPLEMENTED)', margin, p2Y);
  p2Y += 14;

  const modules = [
    {
      title: 'Student Admission & Bulk Excel Importer',
      desc: 'Seamless multi-session registration, auto-generation of A/C numbers (1001 series) & Registration IDs, support for 300+ legacy student bulk Excel imports with duplicate suppression.'
    },
    {
      title: 'Student 360 Dossier & Document Vault',
      desc: 'Complete academic profile with photo, signature, 10th/12th/UG marks, caste/domicile certificate tracking, verified status badges & quick candidate inspection.'
    },
    {
      title: 'Comprehensive Fee Console & Cashflow',
      desc: 'Dynamic fee structures configured by course, category & admission base. Installment collection, partial dues tracking, thermal/A4 receipt generator & ledger maintenance.'
    },
    {
      title: 'Double-Entry Day Book & Financial Hub',
      desc: 'Audit-ready daily cash register, credit & debit entry recording, expense vouchers, category breakdowns, daily summaries & single-click Excel report exports.'
    },
    {
      title: 'Institutional Print & Master Roll Hub',
      desc: 'Official semester-wise student rolls featuring MGSU-104 college crest, BCI/ALU affiliations, 23 customizable columns, landscape/portrait mode & 3-tier signature blocks.'
    },
    {
      title: 'MS SQL Server 2022 & Offline LAN Architecture',
      desc: 'Engineered for 100% offline local college network. Enterprise SQL Server 2022 integration with automated transaction log safeguards, simple recovery & multi-PC sync.'
    },
    {
      title: 'Academic Promotion & Annual Roll-Over',
      desc: 'Automated 1-click student batch promotion across 1st Year, 2nd Year, 3rd Year & semester progressions without data loss or re-registration friction.'
    },
    {
      title: 'Standalone Executable (.exe) Desktop App',
      desc: 'Packaged into an all-in-one standalone Windows binary (College_Admission_ERP.exe) for effortless desktop launch without technical commands.'
    }
  ];

  const modColW = (contentWidth - 10) / 2; // 262.64 pt
  for (let i = 0; i < modules.length; i += 2) {
    const mod1 = modules[i];
    const mod2 = modules[i + 1];
    const boxH = 46;

    // Left Module Card
    doc.rect(margin, p2Y, modColW, boxH).fill(lightBg);
    doc.rect(margin, p2Y, modColW, boxH).lineWidth(0.5).strokeColor(borderLight).stroke();
    doc.rect(margin, p2Y, 3, boxH).fill(brandIndigo);

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryDark);
    doc.text(`[✓] ${mod1.title}`, margin + 8, p2Y + 5, { width: modColW - 14 });

    doc.font('Helvetica').fontSize(6.5).fillColor(textMuted);
    doc.text(mod1.desc, margin + 8, p2Y + 16, { width: modColW - 14, lineGap: 1.2 });

    // Right Module Card
    if (mod2) {
      const rightX = margin + modColW + 10;
      doc.rect(rightX, p2Y, modColW, boxH).fill(lightBg);
      doc.rect(rightX, p2Y, modColW, boxH).lineWidth(0.5).strokeColor(borderLight).stroke();
      doc.rect(rightX, p2Y, 3, boxH).fill(brandIndigo);

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryDark);
      doc.text(`[✓] ${mod2.title}`, rightX + 8, p2Y + 5, { width: modColW - 14 });

      doc.font('Helvetica').fontSize(6.5).fillColor(textMuted);
      doc.text(mod2.desc, rightX + 8, p2Y + 16, { width: modColW - 14, lineGap: 1.2 });
    }

    p2Y += boxH + 5;
  }

  p2Y += 6;

  // Section 2: Project Phase & Milestone Summary
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(brandIndigo);
  doc.text('2. PROJECT IMPLEMENTATION STAGES & MILESTONE SCHEDULE', margin, p2Y);
  p2Y += 12;

  const phaseTableH = 68;
  doc.rect(margin, p2Y, contentWidth, phaseTableH).fill('#FFFFFF');
  doc.rect(margin, p2Y, contentWidth, phaseTableH).lineWidth(0.8).strokeColor(borderLight).stroke();

  // Phase Table Header
  doc.rect(margin, p2Y, contentWidth, 16).fill(slateHeader);
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF');
  doc.text('STAGE / PHASE', margin + 8, p2Y + 5, { width: 110 });
  doc.text('SCOPE & ACTIVITIES', margin + 120, p2Y + 5, { width: 230 });
  doc.text('STATUS', margin + 355, p2Y + 5, { width: 85, align: 'center' });
  doc.text('PAYMENT MILESTONE', margin + 440, p2Y + 5, { width: 85, align: 'right' });

  let rY = p2Y + 20;
  const printPhaseRow = (stage, scope, status, statusColor, amount) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(primaryDark);
    doc.text(stage, margin + 8, rY, { width: 110 });

    doc.font('Helvetica').fontSize(6.5).fillColor(textMuted);
    doc.text(scope, margin + 120, rY, { width: 230, lineGap: 1 });

    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(statusColor);
    doc.text(status, margin + 355, rY, { width: 85, align: 'center' });

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryDark);
    doc.text(amount, margin + 440, rY, { width: 85, align: 'right' });

    rY += 21;
  };

  printPhaseRow(
    'Phase 1: Build & Deploy',
    'Core architecture, database setup, bulk Excel data ingestion, desktop exe packaging & local node installation.',
    'COMPLETED (100%)',
    '#059669',
    'Rs. 35,300 (50%)'
  );

  printPhaseRow(
    'Phase 2: Custom Fine-Tuning',
    'College-specific adjustments, semester print templates, 23 column customization & live staff testing.',
    'IN PROGRESS (ACTIVE)',
    '#D97706',
    'Current Demand'
  );

  printPhaseRow(
    'Phase 3: Final Sign-Off',
    'Final verification, institutional staff operational training & formal system handover certificate.',
    'UPON HANDOVER',
    '#2563EB',
    'Rs. 35,299 (50%)'
  );

  p2Y += phaseTableH + 10;

  // Section 3: Commercial Terms, Warranty & AMC SLA
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(brandIndigo);
  doc.text('3. COMMERCIAL TERMS, WARRANTY & ANNUAL MAINTENANCE (AMC) SLA', margin, p2Y);
  p2Y += 10;

  const terms = [
    'Software Delivery: Complete operational software has been packaged and installed as a standalone desktop system on college infrastructure.',
    'Milestone Payment Request: In accordance with software delivery milestones, 50% advance payment (Rs. 35,300/-) is requested now to facilitate ongoing live fine-tuning, with remaining 50% balance (Rs. 35,299/-) due upon final user sign-off.',
    '1-Year Free Technical Warranty: Ruchika Software Solution provides 12 months of free bug-fixing, patch updates, and institutional support starting from the date of handover.',
    'Annual Maintenance Contract (AMC): Post-warranty renewal is fixed at Rs. 17,500/- per year, covering database integrity maintenance, annual student session migration, and continuous remote/offline technical support.',
    'Data Ownership & Confidentiality: 100% of student records, financial logs, and credentials remain private on college premises under local database storage.'
  ];

  terms.forEach((term, idx) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(accentGold);
    doc.text(`3.${idx + 1}`, margin + 4, p2Y, { width: 16 });

    doc.font('Helvetica').fontSize(6.8).fillColor(textDark);
    doc.text(term, margin + 22, p2Y, { width: contentWidth - 26, lineGap: 1.2 });

    p2Y += 16;
  });

  p2Y += 4;

  // Dual Sign-off Block
  const dualSignH = 56;
  doc.rect(margin, p2Y, contentWidth, dualSignH).fill(lightBg);
  doc.rect(margin, p2Y, contentWidth, dualSignH).lineWidth(0.8).strokeColor(borderLight).stroke();

  const dualColW = contentWidth / 2;

  // Left Signatory (Service Provider)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryDark);
  doc.text('PREPARED & SUBMITTED BY:', margin + 12, p2Y + 7);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(brandIndigo);
  doc.text('RUCHIKA SOFTWARE SOLUTION', margin + 12, p2Y + 18);
  doc.font('Helvetica').fontSize(6.5).fillColor(textMuted);
  doc.text('Deepak Ojha (+91 96100 77159)  |  Akash Ojha (+91 63756 45010)', margin + 12, p2Y + 29);
  doc.text('Email: admn@ruchikasoftwaresolution.com  |  Bikaner (Raj.)', margin + 12, p2Y + 39);

  // Right Signatory (Client Institution)
  const rightDualX = margin + dualColW + 10;
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryDark);
  doc.text('ACCEPTED & CONFIRMED BY:', rightDualX, p2Y + 7);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryDark);
  doc.text('B.J.S. RAMPURIA JAIN LAW COLLEGE, BIKANER', rightDualX, p2Y + 18);
  doc.font('Helvetica-Oblique').fontSize(6.5).fillColor(textMuted);
  doc.text('Authorized Signatory (Principal / Secretary / Accounts)', rightDualX, p2Y + 29);
  doc.text('Official Seal & Date: ______________________________', rightDualX, p2Y + 40);

  // Footer Tagline
  p2Y += dualSignH + 8;
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(brandIndigo);
  doc.text('Pankh Gold College Management ERP  •  Engineered by Ruchika Software Solution  •  Page 2 of 2', margin, p2Y, { width: contentWidth, align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', (err) => reject(err));
  });
}

// Generate in project root
const outPath = path.join(__dirname, '..', '..', 'Invoice_BJS_Rampuria_Law_College_PankhGold.pdf');
console.log('Generating revised spacious PDF to:', outPath);
generateInvoice(outPath)
  .then((file) => {
    console.log('Spacious Invoice PDF generated successfully at:', file);
  })
  .catch((err) => {
    console.error('Error generating PDF:', err);
  });
