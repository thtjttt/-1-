/* ===== ข้อมูลชุดเบิก (เก็บไว้ในเบราว์เซอร์) ===== */

// ชื่อช่องเก็บข้อมูลในเบราว์เซอร์
const STORAGE_KEY = "claimDocs.v1";

// ชนิดเอกสารในชุดเบิก 1 ชุด
const DOC_TYPES = [
  { key: "tax", label: "ใบกำกับภาษี" },
  { key: "po", label: "ใบสั่งซื้อ" },
  { key: "shop", label: "เอกสารร้าน" },
  { key: "appoint", label: "หนังสือแต่งตั้ง" },
  { key: "cert", label: "หนังสือรับรอง" }
];

// สถานะ: pending = ยังไม่ส่ง, sent = ส่งแล้ว รอถึง, delivered = ถึงลูกค้าแล้ว
const STATUS_LABELS = {
  pending: "ยังไม่ส่ง",
  sent: "ส่งแล้ว รอถึง",
  delivered: "ถึงลูกค้าแล้ว"
};

// ส่งเกินกี่วันแล้วยังไม่ถึง ให้เตือน
const LATE_DAYS = 7;

// ข้อมูลสมมติ 8 ชุด (ชื่อร้านและชื่อคนเป็นชื่อสมมติทั้งหมด)
const SAMPLE_CLAIMS = [
  {
    id: 1, claimNo: "CB-2569-001", shop: "ร้านหนังสือใบไม้ เชียงใหม่",
    docs: { tax: 3, po: 3, shop: 1, appoint: 1, cert: 1 },
    status: "delivered", sentDate: "2026-09-22", tracking: "EF100200301TH",
    deliveredDate: "2026-09-25", receiver: "คุณมาลี ใจดี"
  },
  {
    id: 2, claimNo: "CB-2569-002", shop: "ร้านนายอินทร์สมมติ สาขาบางนา",
    docs: { tax: 5, po: 5, shop: 2, appoint: 1, cert: 1 },
    status: "delivered", sentDate: "2026-09-28", tracking: "EF100200302TH",
    deliveredDate: "2026-10-01", receiver: "คุณสมชาย ทดสอบ"
  },
  {
    id: 3, claimNo: "CB-2569-003", shop: "ร้านดอกแก้วบุ๊คส์ ขอนแก่น",
    docs: { tax: 2, po: 2, shop: 1, appoint: 1, cert: 1 },
    status: "sent", sentDate: "2026-09-30", tracking: "EF100200303TH",
    deliveredDate: "", receiver: ""
  },
  {
    id: 4, claimNo: "CB-2569-004", shop: "ร้านหนังสือทะเลใต้ หาดใหญ่",
    docs: { tax: 4, po: 4, shop: 1, appoint: 1, cert: 1 },
    status: "sent", sentDate: "2026-10-03", tracking: "EF100200304TH",
    deliveredDate: "", receiver: ""
  },
  {
    id: 5, claimNo: "CB-2569-005", shop: "ร้านบ้านหนังสือ นครราชสีมา",
    docs: { tax: 1, po: 1, shop: 1, appoint: 1, cert: 1 },
    status: "sent", sentDate: "2026-10-09", tracking: "EF100200305TH",
    deliveredDate: "", receiver: ""
  },
  {
    id: 6, claimNo: "CB-2569-006", shop: "ร้านหนังสือริมน้ำ อยุธยา",
    docs: { tax: 6, po: 6, shop: 2, appoint: 1, cert: 1 },
    status: "delivered", sentDate: "2026-10-06", tracking: "EF100200306TH",
    deliveredDate: "2026-10-08", receiver: "คุณวิภา สมมุติ"
  },
  {
    id: 7, claimNo: "CB-2569-007", shop: "ร้านต้นกล้าบุ๊คส์ พิษณุโลก",
    docs: { tax: 2, po: 2, shop: 1, appoint: 1, cert: 1 },
    status: "pending", sentDate: "", tracking: "",
    deliveredDate: "", receiver: ""
  },
  {
    id: 8, claimNo: "CB-2569-008", shop: "ร้านหนังสือฟ้าใส ชลบุรี",
    docs: { tax: 3, po: 3, shop: 1, appoint: 1, cert: 1 },
    status: "pending", sentDate: "", tracking: "",
    deliveredDate: "", receiver: ""
  }
];

// อ่านข้อมูลทั้งหมด (ครั้งแรกจะใส่ข้อมูลสมมติให้)
function loadClaims() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // เบราว์เซอร์ไม่ให้เก็บข้อมูล ใช้ข้อมูลสมมติแทน
  }
  saveClaims(SAMPLE_CLAIMS);
  return JSON.parse(JSON.stringify(SAMPLE_CLAIMS));
}

// บันทึกข้อมูลทั้งหมด
function saveClaims(claims) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
  } catch (e) {
    // บันทึกไม่ได้ ข้ามไป
  }
}

// รวมจำนวนเอกสารในชุด
function totalDocs(claim) {
  return DOC_TYPES.reduce((sum, t) => sum + (Number(claim.docs[t.key]) || 0), 0);
}

// นับจำนวนวันจากวันที่ (ปี-เดือน-วัน) ถึงวันนี้
function daysSince(isoDate) {
  if (!isoDate) return 0;
  const [y, m, d] = isoDate.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / 86400000);
}

// ส่งแล้วเกินกำหนดแต่ยังไม่ถึง
function isLate(claim) {
  return claim.status === "sent" && daysSince(claim.sentDate) > LATE_DAYS;
}

// แสดงวันที่แบบไทย พ.ศ. เช่น 12 ต.ค. 2569
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatThaiDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  return d + " " + THAI_MONTHS[m - 1] + " " + (y + 543);
}
