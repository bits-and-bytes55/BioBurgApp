import React, { useRef } from "react";
import { Dialog, DialogContent, IconButton, Button } from "@mui/material";
import { Close, Print } from "@mui/icons-material";

const LOGO_B64 = "data:image/jpeg;base64,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";

/* ── helpers ─────────────────────────────────────────────────────────── */

function getGSTType(pincode) {
  return /^110/.test(String(pincode || "")) ? "intra" : "inter";
}

function getProd(item) {
  for (const key of ["productId", "product"]) {
    const p = item[key];
    if (p && typeof p === "object" && !Array.isArray(p) &&
      (p.brandName || p.mrp != null || p.gst_igst != null || p.hsn || p.batchNumber)) {
      return p;
    }
  }
  return {};
}

function getItemGSTRate(item) {
  const prod = getProd(item);
  const list = [item.gst_igst, item.gstRate, prod.gst_igst, prod.gstRate];
  const cgst = parseFloat(prod.gst_cgst);
  const sgst = parseFloat(prod.gst_sgst);
  if (!isNaN(cgst) && !isNaN(sgst) && cgst > 0 && sgst > 0) list.push(cgst + sgst);
  for (const v of list) { const n = parseFloat(v); if (!isNaN(n) && n > 0) return n; }
  return 12;
}

function getItemGSTSplit(item) {
  const prod = getProd(item);
  const cgst = parseFloat(item.gst_cgst ?? prod.gst_cgst ?? 0) || 0;
  const sgst = parseFloat(item.gst_sgst ?? prod.gst_sgst ?? 0) || 0;
  const igst = getItemGSTRate(item);
  if (cgst > 0 && sgst > 0) return { cgst, sgst, igst: cgst + sgst };
  return { cgst: igst / 2, sgst: igst / 2, igst };
}

function getItemHSN(item) {
  const prod = getProd(item);
  return item.hsn || prod.hsn || item.hsnCode || prod.hsnCode || "3004";
}

function getItemBatch(item) {
  const prod = getProd(item);
  return item.batchNumber || item.batchNo || item.batch || prod.batchNumber || prod.batchNo || "—";
}

function getItemMRP(item) {
  const prod = getProd(item);
  const v = item.mrp ?? item.mrpAtAdded ?? prod.mrp ?? prod.price ?? null;
  return v != null ? (parseFloat(v) || null) : null;
}

function getItemDiscount(item, basePrice, qty) {
  if (item.discountAmount != null) return parseFloat(item.discountAmount) || 0;
  if (item.discount != null && item.discount !== "") return (parseFloat(item.discount) || 0) * qty;
  if (item.discountPercent != null && item.discountPercent !== "")
    return (basePrice * qty * (parseFloat(item.discountPercent) || 0)) / 100;
  const prod = getProd(item);
  const pct = parseFloat(prod.discountB2C ?? prod.discountB2B ?? prod.discountHospital ?? prod.discountPharmacy ?? 0) || 0;
  if (pct > 0) return (basePrice * qty * pct) / 100;
  return 0;
}

function getItemDiscountPct(item) {
  if (item.discountPercent != null && item.discountPercent !== "") return parseFloat(item.discountPercent) || 0;
  const prod = getProd(item);
  return parseFloat(prod.discountB2C ?? prod.discountB2B ?? prod.discountHospital ?? 0) || 0;
}

function calcLineGST(taxable, gstRate, gstType, gstSplit) {
  if (gstType === "intra") {
    const cgstAmt = (taxable * gstSplit.cgst) / 100;
    const sgstAmt = (taxable * gstSplit.sgst) / 100;
    return { cgst: cgstAmt, sgst: sgstAmt, igst: 0, total: cgstAmt + sgstAmt };
  }
  const igstAmt = (taxable * gstRate) / 100;
  return { cgst: 0, sgst: 0, igst: igstAmt, total: igstAmt };
}

function buildGSTSummary(lineItems) {
  const map = {};
  lineItems.forEach(({ taxable, gst, gstRate }) => {
    const key = String(gstRate);
    if (!map[key]) map[key] = { gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
    map[key].taxable += taxable;
    map[key].cgst   += gst.cgst;
    map[key].sgst   += gst.sgst;
    map[key].igst   += gst.igst;
    map[key].total  += gst.total;
  });
  return Object.values(map).sort((a, b) => a.gstRate - b.gstRate);
}

function makeInvNo(invNumber, orderId = "") {
  if (invNumber) return invNumber;
  return `BB/INV/${new Date().getFullYear()}/${orderId.slice(-8).toUpperCase()}`;
}

function numToWords(amount) {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (amount === 0) return "Zero";
  const convert = (num) => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convert(num % 100) : "");
    if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
  };
  return convert(Math.floor(amount)) + " Rupees Only";
}

/* ── component ───────────────────────────────────────────────────────── */
export default function InvoiceModal({ open, onClose, order }) {
  const ref = useRef();
  if (!order) return null;

  const addr    = order.address || {};
  const items   = order.items   || [];
  const gstType = getGSTType(addr.pincode);
  const invoice = makeInvNo(order.invoiceNumber, order._id);
  const date    = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const lineItems = items.map((item) => {
    const prod        = getProd(item);
    const name        = item.name        || prod.brandName || prod.title || "Product";
    const generic     = item.genericName || prod.genericName || prod.genericCompositions || "";
    const mfr         = item.manufacturer || prod.manufacturer || "";
    const hsn         = getItemHSN(item);
    const batchNo     = getItemBatch(item);
    const gstRate     = getItemGSTRate(item);
    const gstSplit    = getItemGSTSplit(item);
    const mrp         = getItemMRP(item);
    const basePrice   = parseFloat(item.priceAtAdded ?? item.price ?? item.salePrice ?? prod.saleRatePTR ?? prod.rateB2C ?? prod.mrp ?? 0) || 0;
    const qty         = parseInt(item.quantity || 1, 10);
    const grossAmt    = basePrice * qty;
    const discount    = getItemDiscount(item, basePrice, qty);
    const discountPct = getItemDiscountPct(item);
    const taxable     = Math.max(0, grossAmt - discount);
    const gst         = calcLineGST(taxable, gstRate, gstType, gstSplit);
    const lineTotal   = taxable + gst.total;
    return { name, generic, mfr, hsn, batchNo, gstRate, gstSplit, mrp, basePrice, qty, grossAmt, discount, discountPct, taxable, gst, lineTotal };
  });

  const totalGross    = lineItems.reduce((s, l) => s + l.grossAmt,  0);
  const totalDiscount = lineItems.reduce((s, l) => s + l.discount,  0);
  const totalTaxable  = lineItems.reduce((s, l) => s + l.taxable,   0);
  const totalGSTAmt   = lineItems.reduce((s, l) => s + l.gst.total, 0);
  const grandTotal    = totalTaxable + totalGSTAmt;
  const gstSummary    = buildGSTSummary(lineItems);
  const totalCGST     = lineItems.reduce((s, l) => s + l.gst.cgst, 0);
  const totalSGST     = lineItems.reduce((s, l) => s + l.gst.sgst, 0);
  const totalIGST     = lineItems.reduce((s, l) => s + l.gst.igst, 0);

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=1050,height=800");
    win.document.write(`<!DOCTYPE html><html><head><title>${invoice}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1e293b;background:#fff}@page{size:A4;margin:12mm}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}table{border-collapse:collapse}</style>
      </head><body>${ref.current.innerHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  const S = {
    th: { padding:"8px 10px", fontSize:10, fontWeight:700, color:"#475569", background:"#f1f5f9", borderBottom:"2px solid #1e40af", textAlign:"left", letterSpacing:0.4, whiteSpace:"nowrap" },
    td: { padding:"8px 10px", fontSize:11, borderBottom:"1px solid #e2e8f0", verticalAlign:"top" },
    label: { fontSize:10, fontWeight:700, color:"#64748b", letterSpacing:1.2, textTransform:"uppercase", marginBottom:6 },
    summRow: { display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:12 },
    divider: { height:1, background:"#e2e8f0", margin:"8px 0" },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius:2, overflow:"hidden" } }}>

      {/* toolbar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"10px 18px", background:"#1e293b", color:"white" }}>
        <span style={{ fontWeight:700, fontSize:14, letterSpacing:0.5 }}>TAX INVOICE — {invoice}</span>
        <div style={{ display:"flex", gap:8 }}>
          <Button size="small" variant="contained" startIcon={<Print sx={{ fontSize:15 }} />}
            onClick={handlePrint}
            sx={{ bgcolor:"#1d4ed8","&:hover":{bgcolor:"#1e40af"}, textTransform:"none", borderRadius:1.5, fontSize:12, px:2 }}>
            Print / Save PDF
          </Button>
          <IconButton size="small" onClick={onClose} sx={{ color:"white" }}><Close fontSize="small" /></IconButton>
        </div>
      </div>

      <DialogContent sx={{ p:0, bgcolor:"#f8fafc" }}>
        <div style={{ padding:16, overflowX:"auto" }}>
          <div ref={ref} style={{ background:"#fff", fontFamily:"'Segoe UI',Arial,sans-serif", minWidth:820, maxWidth:980, margin:"0 auto" }}>

            {/* HEADER */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
              padding:"22px 28px", background:"linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#2563eb 100%)", borderRadius:"4px 4px 0 0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <img src={LOGO_B64} alt="BioBurg" style={{ height:52, borderRadius:6, background:"white", padding:4 }} />
                <div>
                  <div style={{ color:"white", fontSize:10, letterSpacing:2, textTransform:"uppercase", opacity:0.8, marginBottom:3 }}>Tax Invoice</div>
                  <div style={{ color:"white", fontSize:11, lineHeight:1.8, opacity:0.75 }}>
                    BioBurg Lifescience Pvt. Ltd.<br/>
                    Dwarka Mor, New Delhi – 110059<br/>
                    GSTIN: 07AABCB1234F1Z5 &nbsp;|&nbsp; CIN: U74999DL2020PTC000000<br/>
                    support@bioburgpharma.com &nbsp;|&nbsp; +91 98765 43210
                  </div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:6, padding:"10px 16px", display:"inline-block", marginBottom:8 }}>
                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:10, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Invoice No.</div>
                  <div style={{ color:"white", fontWeight:700, fontSize:14, letterSpacing:0.5 }}>{invoice}</div>
                </div>
                <div style={{ color:"rgba(255,255,255,0.75)", fontSize:11, lineHeight:2 }}>
                  <div>Date: {date}</div>
                  <div>Order: #{order._id?.slice(-8).toUpperCase()}</div>
                  <div>Supply Type: {gstType === "intra" ? "Intra-State" : "Inter-State"}</div>
                </div>
              </div>
            </div>

            {/* BILL TO + PAYMENT */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", border:"1px solid #e2e8f0", borderTop:"none" }}>
              <div style={{ padding:"16px 28px", borderRight:"1px solid #e2e8f0" }}>
                <div style={S.label}>Bill To</div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{addr.fullName || "—"}</div>
                <div style={{ color:"#475569", fontSize:12, lineHeight:1.9 }}>
                  {addr.addressLine && <div>{addr.addressLine}</div>}
                  <div>{[addr.city, addr.state].filter(Boolean).join(", ")}{addr.pincode ? ` – ${addr.pincode}` : ""}</div>
                  {addr.phone && <div>Ph: {addr.phone}</div>}
                </div>
              </div>
              <div style={{ padding:"16px 28px" }}>
                <div style={S.label}>Payment Details</div>
                <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
                  <tbody>
                    {[
                      ["Payment Mode",   order.paymentMode   || "COD"],
                      ["Payment Status", order.paymentStatus || "PENDING"],
                      ["Order Status",   order.orderStatus   || "—"],
                      ["GST Treatment",  gstType === "intra" ? "CGST + SGST" : "IGST (Inter-State)"],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ padding:"3px 0", color:"#64748b", width:"50%" }}>{k}</td>
                        <td style={{ padding:"3px 0", fontWeight:600, textAlign:"right" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", border:"1px solid #e2e8f0", borderTop:"none", minWidth:820 }}>
                <thead>
                  <tr>
                    {[
                      { label:"#",               align:"center", w:28  },
                      { label:"Description",     align:"left"         },
                      { label:"HSN",             align:"left",   w:55  },
                      { label:"Batch No.",       align:"left",   w:80  },
                      { label:"MRP",             align:"right",  w:70  },
                      { label:"Unit Price",      align:"right",  w:80  },
                      { label:"Qty",             align:"center", w:40  },
                      { label:"Gross Amt",       align:"right",  w:78  },
                      { label:"Discount",        align:"right",  w:70  },
                      { label:"Taxable Value",   align:"right",  w:85  },
                      { label:"GST Rate",        align:"center", w:68  },
                      { label:"GST Amount",      align:"right",  w:78  },
                      { label:"Total",           align:"right",  w:78  },
                    ].map(({ label, align, w }) => (
                      <th key={label} style={{ ...S.th, textAlign:align, width:w }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((line, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ ...S.td, textAlign:"center", color:"#94a3b8", fontSize:10 }}>{i+1}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight:600, fontSize:12 }}>{line.name}</div>
                        {line.generic && <div style={{ fontSize:10, color:"#64748b", marginTop:1 }}>{line.generic}</div>}
                        {line.mfr     && <div style={{ fontSize:10, color:"#94a3b8" }}>Mfr: {line.mfr}</div>}
                      </td>
                      <td style={{ ...S.td, color:"#64748b", fontSize:10 }}>{line.hsn}</td>
                      <td style={{ ...S.td, fontSize:10, color:"#475569" }}>{line.batchNo}</td>
                      <td style={{ ...S.td, textAlign:"right", fontSize:10, color:"#94a3b8" }}>
                        {line.mrp != null ? `Rs.${line.mrp.toFixed(2)}` : "—"}
                      </td>
                      <td style={{ ...S.td, textAlign:"right" }}>Rs.{line.basePrice.toFixed(2)}</td>
                      <td style={{ ...S.td, textAlign:"center", fontWeight:700 }}>{line.qty}</td>
                      <td style={{ ...S.td, textAlign:"right" }}>Rs.{line.grossAmt.toFixed(2)}</td>
                      <td style={{ ...S.td, textAlign:"right" }}>
                        {line.discount > 0 ? (
                          <div>
                            {line.discountPct > 0 && <div style={{ fontSize:9, color:"#16a34a", fontWeight:700, marginBottom:2 }}>{line.discountPct}% off</div>}
                            <span style={{ color:"#16a34a", fontWeight:600 }}>– Rs.{line.discount.toFixed(2)}</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td style={{ ...S.td, textAlign:"right", fontWeight:600 }}>Rs.{line.taxable.toFixed(2)}</td>
                      <td style={{ ...S.td, textAlign:"center" }}>
                        <span style={{ background:"#eff6ff", color:"#1d4ed8", padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:700 }}>
                          {line.gstRate}%
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign:"right" }}>
                        <span style={{ background:"#f0fdf4", color:"#15803d", padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:600 }}>
                          Rs.{line.gst.total.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign:"right", fontWeight:700, fontSize:12 }}>Rs.{line.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS + AMOUNT IN WORDS */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", border:"1px solid #e2e8f0", borderTop:"none" }}>
              <div style={{ padding:"16px 28px", borderRight:"1px solid #e2e8f0", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                <div style={S.label}>Amount in Words</div>
                <div style={{ fontWeight:600, fontSize:12, color:"#1e293b", fontStyle:"italic" }}>{numToWords(Math.round(grandTotal))}</div>
                <div style={{ marginTop:10, fontSize:10, color:"#94a3b8", lineHeight:1.7 }}>
                  Subject to New Delhi jurisdiction.<br/>
                  Goods once sold will not be taken back.<br/>
                  This is a computer generated invoice.
                </div>
              </div>
              <div style={{ padding:"16px 18px" }}>
                <div style={S.summRow}><span style={{ color:"#64748b" }}>Gross Amount</span><span style={{ fontWeight:600 }}>Rs.{totalGross.toFixed(2)}</span></div>
                {totalDiscount > 0 && (
                  <div style={S.summRow}><span style={{ color:"#16a34a" }}>Total Discount</span><span style={{ fontWeight:600, color:"#16a34a" }}>– Rs.{totalDiscount.toFixed(2)}</span></div>
                )}
                <div style={S.summRow}><span style={{ color:"#64748b" }}>Taxable Value</span><span style={{ fontWeight:600 }}>Rs.{totalTaxable.toFixed(2)}</span></div>
                <div style={S.divider} />
                {gstType === "intra" ? (
                  <>
                    <div style={S.summRow}><span style={{ color:"#64748b" }}>Total CGST</span><span style={{ fontWeight:600 }}>Rs.{totalCGST.toFixed(2)}</span></div>
                    <div style={S.summRow}><span style={{ color:"#64748b" }}>Total SGST</span><span style={{ fontWeight:600 }}>Rs.{totalSGST.toFixed(2)}</span></div>
                  </>
                ) : (
                  <div style={S.summRow}><span style={{ color:"#64748b" }}>Total IGST</span><span style={{ fontWeight:600 }}>Rs.{totalIGST.toFixed(2)}</span></div>
                )}
                <div style={S.divider} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  background:"#1e3a8a", borderRadius:4, padding:"11px 14px", color:"white" }}>
                  <span style={{ fontWeight:700, fontSize:13, letterSpacing:0.5 }}>GRAND TOTAL</span>
                  <span style={{ fontWeight:800, fontSize:16 }}>Rs.{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* GST SUMMARY */}
            <div style={{ border:"1px solid #e2e8f0", borderTop:"none", padding:"14px 28px" }}>
              <div style={{ ...S.label, marginBottom:10 }}>GST Summary — HSN-wise Breakup</div>
              <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#f1f5f9" }}>
                    {["HSN Code","GST Rate","Taxable Value",
                      ...(gstType === "intra" ? ["CGST Rate","CGST Amount","SGST Rate","SGST Amount"] : ["IGST Rate","IGST Amount"]),
                      "Total Tax"
                    ].map((h) => (
                      <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:"#475569", fontWeight:700, borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gstSummary.map((row, i) => {
                    const hsns = [...new Set(lineItems.filter(l => l.gstRate === row.gstRate).map(l => l.hsn))].join(", ");
                    const sample = lineItems.find(l => l.gstRate === row.gstRate);
                    const cgstRate = sample?.gstSplit?.cgst ?? row.gstRate / 2;
                    const sgstRate = sample?.gstSplit?.sgst ?? row.gstRate / 2;
                    return (
                      <tr key={i}>
                        <td style={{ padding:"6px 10px", fontWeight:700 }}>{hsns}</td>
                        <td style={{ padding:"6px 10px" }}>
                          <span style={{ background:"#eff6ff", color:"#1d4ed8", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>{row.gstRate}%</span>
                        </td>
                        <td style={{ padding:"6px 10px" }}>Rs.{row.taxable.toFixed(2)}</td>
                        {gstType === "intra" ? (
                          <>
                            <td style={{ padding:"6px 10px" }}>{cgstRate}%</td>
                            <td style={{ padding:"6px 10px" }}>Rs.{row.cgst.toFixed(2)}</td>
                            <td style={{ padding:"6px 10px" }}>{sgstRate}%</td>
                            <td style={{ padding:"6px 10px" }}>Rs.{row.sgst.toFixed(2)}</td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding:"6px 10px" }}>{row.gstRate}%</td>
                            <td style={{ padding:"6px 10px" }}>Rs.{row.igst.toFixed(2)}</td>
                          </>
                        )}
                        <td style={{ padding:"6px 10px", fontWeight:700, color:"#1d4ed8" }}>Rs.{row.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              background:"#f1f5f9", borderTop:"2px solid #1e40af", padding:"12px 28px", borderRadius:"0 0 4px 4px" }}>
              <div style={{ fontSize:10, color:"#64748b" }}>
                GSTIN: 07AABCB1234F1Z5 &nbsp;|&nbsp; Drug Lic. No.: DL/XXXXXXXXXX &nbsp;|&nbsp; FSSAI: XXXXXXXXXXXXXX
              </div>
              <div style={{ fontSize:10, color:"#94a3b8" }}>Computer generated invoice — no signature required</div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}