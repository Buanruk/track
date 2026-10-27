// High-fidelity SVG Mock Documents encoded as Data URLs for realistic previews
window.MOCK_DOCUMENTS = {
  tempInbound: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:#fcfbf9; font-family:'Prompt', sans-serif;">
      <rect width="600" height="800" fill="#fefdfb"/>
      <rect x="20" y="20" width="560" height="760" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6 4" rx="8"/>
      
      <!-- Header Badge -->
      <rect x="40" y="40" width="160" height="32" rx="6" fill="#fef3c7"/>
      <text x="120" y="62" font-size="14" font-weight="bold" fill="#b45309" text-anchor="middle">บิลชั่วคราว (ของเข้า)</text>
      
      <!-- Company Info -->
      <text x="40" y="110" font-size="20" font-weight="bold" fill="#0f172a">บจก. สยาม ออโตโมทีฟ พาร์ทส์</text>
      <text x="40" y="132" font-size="12" fill="#64748b">88 หมู่ 4 นิคมอุตสาหกรรมบางปู จ.สมุทรปราการ โทร. 081-944-1234</text>
      
      <!-- Doc Info -->
      <line x1="40" y1="150" x2="560" y2="150" stroke="#cbd5e1" stroke-width="1"/>
      <text x="40" y="175" font-size="12" fill="#64748b">เลขที่เอกสารชั่วคราว:</text>
      <text x="160" y="175" font-size="13" font-weight="bold" fill="#0f172a">TMP-INB-2026-0101</text>
      <text x="360" y="175" font-size="12" fill="#64748b">วันที่รับของ:</text>
      <text x="440" y="175" font-size="13" font-weight="bold" fill="#0f172a">22 ต.ค. 2026</text>
      
      <text x="40" y="200" font-size="12" fill="#64748b">ผู้รับสินค้าเข้าคลัง:</text>
      <text x="160" y="200" font-size="13" font-weight="bold" fill="#0f172a">วิชัย (คลังสินค้า A)</text>
      <text x="360" y="200" font-size="12" fill="#64748b">กำหนดบิลจริง:</text>
      <text x="440" y="200" font-size="13" font-weight="bold" fill="#d97706">29 ต.ค. 2026</text>
      
      <!-- Table Header -->
      <rect x="40" y="230" width="520" height="36" fill="#f1f5f9" rx="4"/>
      <text x="60" y="253" font-size="12" font-weight="bold" fill="#334155">ลำดับ</text>
      <text x="120" y="253" font-size="12" font-weight="bold" fill="#334155">รายการสินค้า / Part No.</text>
      <text x="360" y="253" font-size="12" font-weight="bold" fill="#334155" text-anchor="end">จำนวน</text>
      <text x="450" y="253" font-size="12" font-weight="bold" fill="#334155" text-anchor="end">ราคา/หน่วย</text>
      <text x="540" y="253" font-size="12" font-weight="bold" fill="#334155" text-anchor="end">รวมเงิน</text>
      
      <!-- Table Rows -->
      <text x="60" y="285" font-size="12" fill="#475569">1</text>
      <text x="120" y="285" font-size="12" fill="#0f172a">เพลาขับ CNC Hardened Steel #AX-402</text>
      <text x="360" y="285" font-size="12" fill="#475569" text-anchor="end">50 ชิ้น</text>
      <text x="450" y="285" font-size="12" fill="#475569" text-anchor="end">1,800.00</text>
      <text x="540" y="285" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">90,000.00</text>
      <line x1="40" y1="300" x2="560" y2="300" stroke="#f1f5f9" stroke-width="1"/>
      
      <text x="60" y="325" font-size="12" fill="#475569">2</text>
      <text x="120" y="325" font-size="12" fill="#0f172a">ตลับลูกปืนความเร็วสูง NSK 6205ZZ</text>
      <text x="360" y="325" font-size="12" fill="#475569" text-anchor="end">100 ชิ้น</text>
      <text x="450" y="325" font-size="12" fill="#475569" text-anchor="end">350.00</text>
      <text x="540" y="325" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">35,000.00</text>
      <line x1="40" y1="340" x2="560" y2="340" stroke="#f1f5f9" stroke-width="1"/>
      
      <!-- Totals Box -->
      <rect x="340" y="370" width="220" height="110" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
      <text x="360" y="395" font-size="12" fill="#64748b">มูลค่ารวม (Subtotal):</text>
      <text x="540" y="395" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">125,000.00</text>
      
      <text x="360" y="420" font-size="12" fill="#64748b">ภาษีมูลค่าเพิ่ม (VAT 7%):</text>
      <text x="540" y="420" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">8,750.00</text>
      
      <line x1="360" y1="435" x2="540" y2="435" stroke="#cbd5e1" stroke-width="1"/>
      <text x="360" y="460" font-size="13" font-weight="bold" fill="#0f172a">ยอดสุทธิ (Grand Total):</text>
      <text x="540" y="460" font-size="14" font-weight="bold" fill="#0284c7" text-anchor="end">133,750.00 บ.</text>
      
      <!-- Stamp & Signature -->
      <rect x="60" y="550" width="200" height="90" fill="#fff" stroke="#cbd5e1" stroke-width="1" rx="4"/>
      <text x="160" y="580" font-size="11" fill="#94a3b8" text-anchor="middle">ลงชื่อผู้ส่งมอบ (Supplier)</text>
      <path d="M90 610 Q 140 590 180 620 T 230 605" fill="none" stroke="#2563eb" stroke-width="2"/>
      <text x="160" y="630" font-size="10" fill="#64748b" text-anchor="middle">(คุณศุภชัย)</text>
      
      <rect x="340" y="550" width="200" height="90" fill="#fff" stroke="#cbd5e1" stroke-width="1" rx="4"/>
      <text x="440" y="580" font-size="11" fill="#94a3b8" text-anchor="middle">ลงชื่อผู้รับสินค้า (คลังสินค้า)</text>
      <path d="M370 615 Q 410 595 460 625 T 510 610" fill="none" stroke="#059669" stroke-width="2"/>
      <text x="440" y="630" font-size="10" fill="#64748b" text-anchor="middle">(นายวิชัย มีสุข)</text>
      
      <!-- Watermark stamp -->
      <g transform="translate(250, 480) rotate(-15)">
        <rect x="0" y="0" width="180" height="50" rx="8" fill="none" stroke="#ef4444" stroke-width="2.5" opacity="0.6"/>
        <text x="90" y="32" font-size="18" font-weight="bold" fill="#ef4444" text-anchor="middle" opacity="0.6">บิลชั่วคราว / รอใบจริง</text>
      </g>
    </svg>
  `)},

  officialTaxInvoice: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:#ffffff; font-family:'Prompt', sans-serif;">
      <rect width="600" height="800" fill="#ffffff"/>
      <rect x="20" y="20" width="560" height="760" fill="none" stroke="#0f172a" stroke-width="1.5" rx="4"/>
      
      <!-- Header -->
      <text x="40" y="55" font-size="18" font-weight="bold" fill="#0f172a">ใบกำกับภาษี / ใบเสร็จรับเงิน</text>
      <text x="40" y="75" font-size="12" fill="#64748b">TAX INVOICE / RECEIPT (ต้นฉบับ / ORIGINAL)</text>
      <rect x="420" y="35" width="140" height="40" rx="4" fill="#ecfdf5" stroke="#10b981"/>
      <text x="490" y="60" font-size="13" font-weight="bold" fill="#047857" text-anchor="middle">เอกสารจริงสมบูรณ์</text>
      
      <line x1="40" y1="95" x2="560" y2="95" stroke="#0f172a" stroke-width="1"/>
      
      <text x="40" y="125" font-size="13" font-weight="bold" fill="#0f172a">ผู้จำหน่าย / ผู้ให้บริการ:</text>
      <text x="40" y="145" font-size="12" fill="#334155">บริษัท สยาม ออโตโมทีฟ พาร์ทส์ จำกัด (สำนักงานใหญ่)</text>
      <text x="40" y="165" font-size="11" fill="#64748b">เลขประจำตัวผู้เสียภาษีอากร: 0-1055-58012-34-5</text>
      
      <text x="350" y="125" font-size="12" fill="#64748b">เลขที่บิลจริง:</text>
      <text x="440" y="125" font-size="13" font-weight="bold" fill="#059669">INV-2026-04921</text>
      <text x="350" y="145" font-size="12" fill="#64748b">วันที่ออกบิล:</text>
      <text x="440" y="145" font-size="12" font-weight="bold" fill="#0f172a">25 ต.ค. 2026</text>
      <text x="350" y="165" font-size="12" fill="#64748b">อ้างอิงบิลเดิม:</text>
      <text x="440" y="165" font-size="12" fill="#64748b">TMP-INB-2026-0065</text>
      
      <!-- Table Header -->
      <rect x="40" y="200" width="520" height="32" fill="#0f172a"/>
      <text x="60" y="221" font-size="11" font-weight="bold" fill="#ffffff">ลำดับ</text>
      <text x="120" y="221" font-size="11" font-weight="bold" fill="#ffffff">รายละเอียดสินค้า</text>
      <text x="360" y="221" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="end">จำนวน</text>
      <text x="450" y="221" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="end">หน่วยละ</text>
      <text x="540" y="221" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="end">จำนวนเงิน</text>
      
      <text x="60" y="260" font-size="12" fill="#0f172a">1</text>
      <text x="120" y="260" font-size="12" fill="#0f172a">ท่อสแตนเลสกลม 304 ขนาด 2 นิ้ว หนา 2 มม. (ยาว 6 ม.)</text>
      <text x="360" y="260" font-size="12" fill="#0f172a" text-anchor="end">85 เส้น</text>
      <text x="450" y="260" font-size="12" fill="#0f172a" text-anchor="end">1,550.00</text>
      <text x="540" y="260" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">131,750.00</text>
      
      <text x="60" y="295" font-size="12" fill="#0f172a">2</text>
      <text x="120" y="295" font-size="12" fill="#0f172a">ข้องอ 90 องศา สแตนเลส 304 เชื่อม 2 นิ้ว</text>
      <text x="360" y="295" font-size="12" fill="#0f172a" text-anchor="end">150 ตัว</text>
      <text x="450" y="295" font-size="12" fill="#0f172a" text-anchor="end">350.00</text>
      <text x="540" y="295" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">52,500.00</text>
      
      <line x1="40" y1="330" x2="560" y2="330" stroke="#e2e8f0" stroke-width="1"/>
      
      <!-- Total Summary -->
      <rect x="320" y="360" width="240" height="110" fill="#f8fafc" stroke="#e2e8f0" rx="4"/>
      <text x="340" y="385" font-size="12" fill="#64748b">จำนวนเงินรวมทั้งสิ้น:</text>
      <text x="540" y="385" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">184,500.00</text>
      <text x="340" y="415" font-size="12" fill="#64748b">ภาษีมูลค่าเพิ่ม 7%:</text>
      <text x="540" y="415" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">12,915.00</text>
      <line x1="340" y1="430" x2="540" y2="430" stroke="#cbd5e1"/>
      <text x="340" y="455" font-size="13" font-weight="bold" fill="#059669">ยอดสุทธิรวมภาษี:</text>
      <text x="540" y="455" font-size="15" font-weight="bold" fill="#059669" text-anchor="end">197,415.00 บ.</text>
      
      <!-- Official Stamp -->
      <circle cx="160" cy="560" r="45" fill="none" stroke="#2563eb" stroke-width="2"/>
      <circle cx="160" cy="560" r="41" fill="none" stroke="#2563eb" stroke-width="1" stroke-dasharray="3 3"/>
      <text x="160" y="555" font-size="10" font-weight="bold" fill="#2563eb" text-anchor="middle">บจก. สยาม ออโตโมทีฟ</text>
      <text x="160" y="570" font-size="9" font-weight="bold" fill="#2563eb" text-anchor="middle">★ PAID / จ่ายแล้ว ★</text>
    </svg>
  `)},

  exportSlip: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:#f8fafc; font-family:'Prompt', sans-serif;">
      <rect width="600" height="800" fill="#ffffff"/>
      <rect x="20" y="20" width="560" height="760" fill="none" stroke="#3b82f6" stroke-width="2" rx="8"/>
      
      <rect x="40" y="40" width="160" height="32" rx="6" fill="#dbeafe"/>
      <text x="120" y="62" font-size="14" font-weight="bold" fill="#1d4ed8" text-anchor="middle">ใบส่งของชั่วคราว (ส่งออก)</text>
      
      <text x="40" y="110" font-size="20" font-weight="bold" fill="#0f172a">Apex Intertrade (Thailand) Co., Ltd.</text>
      <text x="40" y="132" font-size="12" fill="#64748b">Laem Chabang Port Terminal B4, Chonburi</text>
      
      <line x1="40" y1="150" x2="560" y2="150" stroke="#cbd5e1" stroke-width="1"/>
      <text x="40" y="175" font-size="12" fill="#64748b">เลขที่บิลส่งออกชั่วคราว:</text>
      <text x="190" y="175" font-size="13" font-weight="bold" fill="#0f172a">TMP-EXP-2026-0084</text>
      <text x="360" y="175" font-size="12" fill="#64748b">กำหนดเปิดบิลจริง:</text>
      <text x="470" y="175" font-size="13" font-weight="bold" fill="#d97706">31 ต.ค. 2026</text>
      
      <rect x="40" y="210" width="520" height="34" fill="#eff6ff" rx="4"/>
      <text x="60" y="232" font-size="12" font-weight="bold" fill="#1e40af">รายการสินค้าส่งออก</text>
      <text x="420" y="232" font-size="12" font-weight="bold" fill="#1e40af">จำนวน</text>
      <text x="540" y="232" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="end">ราคารวม</text>
      
      <text x="60" y="270" font-size="12" fill="#1e293b">กล่องกระดาษลูกฟูก 5 ชั้น Export Grade 60x40x40cm</text>
      <text x="420" y="270" font-size="12" fill="#475569">1,500 ใบ</text>
      <text x="540" y="270" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="end">67,500.00</text>
      
      <text x="60" y="305" font-size="12" fill="#1e293b">ฟิล์มยืดพันพาเลท LLDEP 17 ไมครอน</text>
      <text x="420" y="305" font-size="12" fill="#475569">22 ม้วน</text>
      <text x="540" y="305" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="end">11,000.00</text>
      
      <line x1="40" y1="335" x2="560" y2="335" stroke="#e2e8f0"/>
      <text x="380" y="370" font-size="14" font-weight="bold" fill="#1e40af">ยอดรวมทั้งสิ้น:</text>
      <text x="540" y="370" font-size="16" font-weight="bold" fill="#1d4ed8" text-anchor="end">83,995.00 บ.</text>
      
      <g transform="translate(240, 480) rotate(-10)">
        <rect x="0" y="0" width="170" height="45" rx="6" fill="none" stroke="#2563eb" stroke-width="2" opacity="0.7"/>
        <text x="85" y="28" font-size="15" font-weight="bold" fill="#2563eb" text-anchor="middle" opacity="0.7">รอใบกำกับภาษีขาย</text>
      </g>
    </svg>
  `)
};
