const PDFDocument = require("pdfkit");

const GOLD = "#f2ca50";
const TEXT = "#1a1a1a";
const MUTED = "#666666";
const RULE = "#cccccc";
const DANGER = "#9a3a2f";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const drawHeader = (doc, order) => {
  doc.fillColor(GOLD).fontSize(22).font("Helvetica-Bold");
  doc.text("SAGA ELITE", 50, 50);
  doc
    .fillColor(MUTED)
    .fontSize(9)
    .font("Helvetica")
    .text("Limited-edition streetwear · Sri Lanka", 50, 76);

  // Right-aligned invoice meta
  const right = 545;
  doc
    .fillColor(TEXT)
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("INVOICE", right - 90, 50, { width: 90, align: "right" });
  doc
    .fillColor(MUTED)
    .fontSize(9)
    .font("Helvetica")
    .text(
      `Reference: ${order.referenceNumber || String(order._id).slice(-12)}`,
      right - 220,
      78,
      { width: 220, align: "right" }
    )
    .text(`Issued: ${formatDate(new Date())}`, right - 220, 92, {
      width: 220,
      align: "right",
    })
    .text(`Order placed: ${formatDate(order.createdAt)}`, right - 220, 106, {
      width: 220,
      align: "right",
    });

  doc
    .strokeColor(GOLD)
    .lineWidth(1)
    .moveTo(50, 130)
    .lineTo(545, 130)
    .stroke();
};

const drawCustomer = (doc, order) => {
  const top = 150;
  const customerName =
    order.user?.userName ||
    order.user?.name ||
    order.guestEmail ||
    "Guest customer";
  const customerEmail = order.user?.email || order.guestEmail || "—";
  const phone = order.contactNumber || "—";

  doc
    .fillColor(MUTED)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("BILL TO", 50, top, { characterSpacing: 1.5 });
  doc
    .fillColor(TEXT)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(customerName, 50, top + 14);
  doc
    .fillColor(TEXT)
    .fontSize(9)
    .font("Helvetica")
    .text(customerEmail, 50, top + 30)
    .text(phone, 50, top + 44);
  if (order.shippingAddress) {
    doc.text(String(order.shippingAddress).trim(), 50, top + 58, {
      width: 240,
    });
  }

  // Right column: payment + status
  const right = 320;
  doc
    .fillColor(MUTED)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("PAYMENT", right, top, { characterSpacing: 1.5 });
  doc
    .fillColor(TEXT)
    .fontSize(9)
    .font("Helvetica")
    .text(
      `Method: ${String(order.paymentMethod || "—").toUpperCase()}`,
      right,
      top + 14
    )
    .text(
      `Status: ${String(order.paymentStatus || "—").toUpperCase()}`,
      right,
      top + 28
    )
    .text(
      `Order status: ${String(order.status || "—").replace(/_/g, " ").toUpperCase()}`,
      right,
      top + 42
    );
  if (order.couponCode) {
    doc
      .fillColor(GOLD)
      .text(
        `Coupon: ${order.couponCode} (-LKR ${formatCurrency(order.couponDiscount || 0)})`,
        right,
        top + 56
      );
  }
};

const drawItemsTable = (doc, order) => {
  let y = 250;
  const colX = { item: 50, qty: 360, unit: 410, total: 490 };

  // Header row
  doc.rect(50, y, 495, 22).fill(GOLD);
  doc
    .fillColor(TEXT)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("ITEM", colX.item + 8, y + 7, { characterSpacing: 1.2 })
    .text("QTY", colX.qty, y + 7, { width: 40, align: "right", characterSpacing: 1.2 })
    .text("UNIT", colX.unit, y + 7, { width: 70, align: "right", characterSpacing: 1.2 })
    .text("TOTAL", colX.total, y + 7, { width: 55, align: "right", characterSpacing: 1.2 });

  y += 30;
  doc.fillColor(TEXT).font("Helvetica").fontSize(9);

  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach((line, idx) => {
    if (y > 720) {
      doc.addPage();
      y = 60;
    }
    const name = line.productName || line.name || "Item";
    const variantBits = [line.size, line.color]
      .filter((v) => v && String(v).trim())
      .join(" / ");
    const sku = line.productArtNo || line.variantSku || "";

    doc
      .fillColor(TEXT)
      .text(name, colX.item, y, { width: 290 });
    if (variantBits || sku) {
      doc
        .fillColor(MUTED)
        .fontSize(8)
        .text(
          [variantBits, sku].filter(Boolean).join(" · "),
          colX.item,
          y + 14,
          { width: 290 }
        )
        .fontSize(9);
    }
    doc
      .fillColor(TEXT)
      .text(String(line.quantity || 1), colX.qty, y, {
        width: 40,
        align: "right",
      })
      .text(`LKR ${formatCurrency(line.unitPrice)}`, colX.unit, y, {
        width: 70,
        align: "right",
      })
      .text(`LKR ${formatCurrency(line.totalPrice)}`, colX.total, y, {
        width: 55,
        align: "right",
      });

    y += variantBits || sku ? 32 : 22;
    doc
      .strokeColor(RULE)
      .lineWidth(0.5)
      .moveTo(50, y - 4)
      .lineTo(545, y - 4)
      .stroke();
  });

  return y;
};

const drawTotals = (doc, order, startY) => {
  let y = startY + 8;
  if (y > 700) {
    doc.addPage();
    y = 60;
  }

  const labelX = 380;
  const valueX = 545;

  const subtotal =
    Number(order.totalAmount || 0) + Number(order.couponDiscount || 0);

  doc.font("Helvetica").fontSize(9).fillColor(MUTED);

  doc
    .text("Subtotal", labelX, y, { width: 120, align: "left" })
    .fillColor(TEXT)
    .text(`LKR ${formatCurrency(subtotal)}`, labelX, y, {
      width: valueX - labelX,
      align: "right",
    });
  y += 18;

  if (order.couponDiscount && order.couponDiscount > 0) {
    doc
      .fillColor(MUTED)
      .text(
        `Coupon ${order.couponCode || ""}`.trim(),
        labelX,
        y,
        { width: 120, align: "left" }
      )
      .fillColor(DANGER)
      .text(
        `- LKR ${formatCurrency(order.couponDiscount)}`,
        labelX,
        y,
        { width: valueX - labelX, align: "right" }
      );
    y += 18;
  }

  if (order.refundAmount && order.refundAmount > 0) {
    doc
      .fillColor(MUTED)
      .text("Refunded", labelX, y, { width: 120, align: "left" })
      .fillColor(DANGER)
      .text(
        `- LKR ${formatCurrency(order.refundAmount)}`,
        labelX,
        y,
        { width: valueX - labelX, align: "right" }
      );
    y += 18;
  }

  doc.strokeColor(GOLD).lineWidth(1.2);
  doc.moveTo(labelX, y).lineTo(valueX, y).stroke();
  y += 8;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(TEXT)
    .text("TOTAL", labelX, y, { width: 120, align: "left" })
    .fillColor(GOLD)
    .text(
      `LKR ${formatCurrency(order.totalAmount)}`,
      labelX,
      y,
      { width: valueX - labelX, align: "right" }
    );

  return y + 22;
};

const drawBankDetails = (doc, bankConfig, startY) => {
  let y = startY + 14;
  if (y > 680) {
    doc.addPage();
    y = 60;
  }

  doc
    .fillColor(MUTED)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("BANK DETAILS", 50, y, { characterSpacing: 1.5 });
  y += 14;

  doc.fillColor(TEXT).fontSize(9).font("Helvetica");

  if (!bankConfig) {
    doc
      .fillColor(MUTED)
      .text(
        "Bank transfer details available on request — message us on WhatsApp.",
        50,
        y,
        { width: 495 }
      );
    return y + 16;
  }

  const rows = [
    ["Bank", bankConfig.bankName],
    ["Branch", bankConfig.branch],
    ["Account name", bankConfig.accountName],
    ["Account number", bankConfig.accountNumber],
    ["WhatsApp", bankConfig.whatsapp],
  ].filter(([, v]) => v && String(v).trim());

  rows.forEach(([label, value]) => {
    doc
      .fillColor(MUTED)
      .text(label, 50, y, { width: 110 })
      .fillColor(TEXT)
      .text(String(value), 165, y, { width: 380 });
    y += 14;
  });
  return y;
};

const drawFooter = (doc, order) => {
  const bottom = 770;
  doc
    .strokeColor(GOLD)
    .lineWidth(0.6)
    .moveTo(50, bottom - 18)
    .lineTo(545, bottom - 18)
    .stroke();
  doc
    .fillColor(MUTED)
    .fontSize(8)
    .font("Helvetica")
    .text(
      "Thank you for choosing Saga Elite. Hand-finished in Sri Lanka.",
      50,
      bottom - 10,
      { width: 495, align: "center" }
    )
    .text(
      `Invoice ${order.referenceNumber || String(order._id)} · generated ${new Date().toISOString()}`,
      50,
      bottom,
      { width: 495, align: "center" }
    );
};

/**
 * Stream a Saga Elite invoice PDF for the given order to the response.
 * @param {object} options
 * @param {object} options.order - populated order document
 * @param {object} [options.bankConfig] - { bankName, branch, accountName, accountNumber, whatsapp }
 * @param {import('http').ServerResponse} options.stream - the writable stream (res)
 */
const streamInvoicePdf = ({ order, bankConfig, stream }) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(stream);

  drawHeader(doc, order);
  drawCustomer(doc, order);
  const itemsEndY = drawItemsTable(doc, order);
  const totalsEndY = drawTotals(doc, order, itemsEndY);
  drawBankDetails(doc, bankConfig, totalsEndY);
  drawFooter(doc, order);

  doc.end();
};

module.exports = { streamInvoicePdf };
