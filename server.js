const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 4200;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

const USERS_CSV_FILE = path.join(DATA_DIR, 'users.csv');
const RECORDS_CSV_FILE = path.join(DATA_DIR, 'goods_records.csv');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// --------------------------------------------------------------------------
// CSV Headers with UTF-8 BOM
// --------------------------------------------------------------------------
const USERS_HEADER = '\uFEFFรหัสพนักงาน,ชื่อ-นามสกุล (ภาษาอังกฤษ),วันที่สมัคร\n';
const RECORDS_HEADER = '\uFEFFรหัสรายการ,หมายเลข PO,ประเภท,ชื่อ Vendor,ชื่อสินค้า,จำนวน,หน่วย,วันที่บันทึก,เวลาบันทึก,วันนัดรับของ,เวลานัดรับของ,สถานะ,ผู้ปิดงาน,เวลาที่ปิดงาน,บันทึกเมื่อ\n';

// Initialize Users CSV
function initUsersFile() {
  if (!fs.existsSync(USERS_CSV_FILE)) {
    const seedUser = `EMP001,Peerapat Buasa,${new Date().toISOString()}`;
    fs.writeFileSync(USERS_CSV_FILE, USERS_HEADER + seedUser + '\n', 'utf8');
    console.log(`Initialized users database at: ${USERS_CSV_FILE}`);
  }
}

// Initialize Records CSV
function initRecordsFile() {
  if (!fs.existsSync(RECORDS_CSV_FILE)) {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    // Create 3 sample records with varied pickup times (one delay, one urgent 2h, one normal)
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 3);
    const pastDateStr = pastDate.toISOString().split('T')[0];
    const pastTimeStr = pastDate.toTimeString().slice(0, 5);

    const urgentDate = new Date();
    urgentDate.setHours(urgentDate.getHours() + 1);
    const urgentDateStr = urgentDate.toISOString().split('T')[0];
    const urgentTimeStr = urgentDate.toTimeString().slice(0, 5);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const initialRows = [
      `REC-1001,A9991A,ส่งออก,Apex Intertrade (Thailand) Co., Ltd.,กล่องกระดาษลูกฟูก 5 ชั้น Export Grade,1500,กล่อง,${today},09:00,${pastDateStr},${pastTimeStr},pending,,,${new Date().toISOString()}`,
      `REC-1002,A9992B,ส่งออก,บริษัท สยาม ฟู๊ด เอ็กซ์พอร์ต จำกัด,เครื่องซีลสูญญากาศ DZ-600,2,ชุด,${today},10:00,${urgentDateStr},${urgentTimeStr},pending,,,${new Date().toISOString()}`,
      `REC-1003,A9993C,รับเข้า,บจก. สยาม ออโตโมทีฟ พาร์ทส์,เพลาขับ CNC Hardened Steel #AX-402,50,ชิ้น,${today},${nowTime},${futureDateStr},14:00,pending,,,${new Date().toISOString()}`
    ];

    fs.writeFileSync(RECORDS_CSV_FILE, RECORDS_HEADER + initialRows.join('\n') + '\n', 'utf8');
    console.log(`Initialized records database at: ${RECORDS_CSV_FILE}`);
  }
}

initUsersFile();
initRecordsFile();

// Helper to escape CSV fields
function escapeCSV(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

// Simple and robust CSV line parser
function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

// --------------------------------------------------------------------------
// Users Operations
// --------------------------------------------------------------------------
function readUsersFromCSV() {
  if (!fs.existsSync(USERS_CSV_FILE)) return [];
  const content = fs.readFileSync(USERS_CSV_FILE, 'utf8');
  const cleanContent = content.startsWith('\uFEFF') ? content.slice(1) : content;
  const lines = cleanContent.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const users = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = parseCSVLine(line);
    if (row.length >= 2) {
      users.push({
        employeeId: row[0].trim(),
        fullName: row[1].trim(),
        registeredAt: row[2] || ''
      });
    }
  }
  return users;
}

function appendUserToCSV(employeeId, fullName) {
  const row = [
    escapeCSV(employeeId.trim()),
    escapeCSV(fullName.trim()),
    escapeCSV(new Date().toISOString())
  ].join(',') + '\n';
  fs.appendFileSync(USERS_CSV_FILE, row, 'utf8');
}

// --------------------------------------------------------------------------
// Records Operations
// --------------------------------------------------------------------------
function readRecordsFromCSV() {
  if (!fs.existsSync(RECORDS_CSV_FILE)) return [];
  const content = fs.readFileSync(RECORDS_CSV_FILE, 'utf8');
  const cleanContent = content.startsWith('\uFEFF') ? content.slice(1) : content;
  const lines = cleanContent.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = parseCSVLine(line);
    if (row.length >= 10) {
      records.push({
        id: row[0],
        poNumber: row[1] || '',
        type: row[2] || 'รับเข้า',
        vendor: row[3] || '',
        itemName: row[4] || '',
        quantity: parseFloat(row[5]) || 0,
        unit: row[6] || '',
        date: row[7] || '',
        time: row[8] || '',
        pickupDate: row[9] || '',
        pickupTime: row[10] || '',
        status: row[11] || 'pending',
        closedBy: row[12] || '',
        closedAt: row[13] || '',
        createdAt: row[14] || ''
      });
    }
  }
  return records.reverse(); // Newest first
}

function writeAllRecordsToCSV(records) {
  let content = RECORDS_HEADER;
  for (const r of records) {
    const row = [
      escapeCSV(r.id),
      escapeCSV(r.poNumber),
      escapeCSV(r.type),
      escapeCSV(r.vendor),
      escapeCSV(r.itemName),
      r.quantity,
      escapeCSV(r.unit),
      escapeCSV(r.date),
      escapeCSV(r.time),
      escapeCSV(r.pickupDate),
      escapeCSV(r.pickupTime),
      escapeCSV(r.status || 'pending'),
      escapeCSV(r.closedBy || ''),
      escapeCSV(r.closedAt || ''),
      escapeCSV(r.createdAt || new Date().toISOString())
    ].join(',');
    content += row + '\n';
  }
  fs.writeFileSync(RECORDS_CSV_FILE, content, 'utf8');
}

// Helper to send JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body
function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        if (!body) return resolve({});
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8'
};

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  try {
    // -------------------------------------------------------------
    // AUTH API: POST /api/auth/login
    // -------------------------------------------------------------
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const payload = await parseJSONBody(req);
      const { employeeId } = payload;

      if (!employeeId || !employeeId.trim()) {
        return sendJSON(res, 400, { error: 'กรุณากรอกรหัสพนักงาน' });
      }

      const users = readUsersFromCSV();
      const user = users.find(u => u.employeeId.toLowerCase() === employeeId.trim().toLowerCase());

      if (!user) {
        return sendJSON(res, 404, {
          error: `ไม่พบรหัสพนักงาน "${employeeId.trim()}" ในระบบ กรุณาสมัครสมาชิกก่อน`
        });
      }

      return sendJSON(res, 200, {
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        user: {
          employeeId: user.employeeId,
          fullName: user.fullName
        }
      });
    }

    // -------------------------------------------------------------
    // AUTH API: POST /api/auth/register
    // -------------------------------------------------------------
    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const payload = await parseJSONBody(req);
      const { employeeId, fullName } = payload;

      if (!employeeId || !employeeId.trim() || !fullName || !fullName.trim()) {
        return sendJSON(res, 400, { error: 'กรุณากรอกรหัสพนักงาน และชื่อ-สกุลภาษาอังกฤษให้ครบถ้วน' });
      }

      const users = readUsersFromCSV();
      const exists = users.some(u => u.employeeId.toLowerCase() === employeeId.trim().toLowerCase());

      if (exists) {
        return sendJSON(res, 400, { error: `รหัสพนักงาน "${employeeId.trim()}" มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบ` });
      }

      appendUserToCSV(employeeId.trim(), fullName.trim());

      return sendJSON(res, 201, {
        success: true,
        message: 'สมัครสมาชิกและบันทึกลงไฟล์ Excel สำเร็จ',
        user: {
          employeeId: employeeId.trim(),
          fullName: fullName.trim()
        }
      });
    }

    // -------------------------------------------------------------
    // RECORDS API: GET /api/records
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/records') {
      let records = readRecordsFromCSV();

      const search = (urlObj.searchParams.get('search') || '').trim().toLowerCase();
      const type = urlObj.searchParams.get('type') || 'all'; // all, รับเข้า, ส่งออก

      if (type !== 'all') {
        records = records.filter(r => r.type === type);
      }

      if (search) {
        records = records.filter(r =>
          (r.poNumber && r.poNumber.toLowerCase().includes(search)) ||
          (r.vendor && r.vendor.toLowerCase().includes(search)) ||
          (r.itemName && r.itemName.toLowerCase().includes(search)) ||
          (r.unit && r.unit.toLowerCase().includes(search)) ||
          (r.date && r.date.includes(search)) ||
          (r.pickupDate && r.pickupDate.includes(search)) ||
          (r.closedBy && r.closedBy.toLowerCase().includes(search))
        );
      }

      return sendJSON(res, 200, records);
    }

    // -------------------------------------------------------------
    // RECORDS API: POST /api/records - Add new record
    // -------------------------------------------------------------
    if (req.method === 'POST' && pathname === '/api/records') {
      const payload = await parseJSONBody(req);
      const {
        poNumber,
        type = 'รับเข้า',
        vendor,
        itemName,
        quantity,
        unit,
        date,
        time,
        pickupDate,
        pickupTime
      } = payload;

      if (!vendor || !itemName || !quantity || !unit || !date || !time) {
        return sendJSON(res, 400, { error: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (Vendor, ชื่อสินค้า, จำนวน, หน่วย, วันที่, เวลา)' });
      }

      const id = `REC-${Date.now().toString().slice(-6)}`;
      const createdAt = new Date().toISOString();

      const newRow = [
        escapeCSV(id),
        escapeCSV((poNumber || '').trim().toUpperCase()),
        escapeCSV(type),
        escapeCSV(vendor.trim()),
        escapeCSV(itemName.trim()),
        parseFloat(quantity) || 0,
        escapeCSV(unit.trim()),
        escapeCSV(date.trim()),
        escapeCSV(time.trim()),
        escapeCSV((pickupDate || date).trim()),
        escapeCSV((pickupTime || time).trim()),
        escapeCSV('pending'),
        escapeCSV(''), // closedBy
        escapeCSV(''), // closedAt
        escapeCSV(createdAt)
      ].join(',') + '\n';

      fs.appendFileSync(RECORDS_CSV_FILE, newRow, 'utf8');

      return sendJSON(res, 201, {
        success: true,
        message: 'บันทึกลงไฟล์ Excel สำเร็จ',
        record: {
          id, poNumber, type, vendor, itemName, quantity, unit, date, time, pickupDate, pickupTime, status: 'pending'
        }
      });
    }

    // -------------------------------------------------------------
    // RECORDS API: POST /api/records/:id/complete - Signature Verification
    // -------------------------------------------------------------
    if (req.method === 'POST' && pathname.includes('/complete')) {
      const parts = pathname.split('/');
      const id = parts[3];
      const payload = await parseJSONBody(req);
      const { confirmedName, employeeId } = payload;

      if (!confirmedName || !confirmedName.trim() || !employeeId) {
        return sendJSON(res, 400, { error: 'กรุณากรอกชื่อ-นามสกุลเพื่อยืนยันการปิดงาน' });
      }

      // Check user in users.csv
      const users = readUsersFromCSV();
      const user = users.find(u => u.employeeId.toLowerCase() === employeeId.trim().toLowerCase());

      if (!user) {
        return sendJSON(res, 401, { error: 'ไม่พบข้อมูลผู้ใช้งานที่กำลังเข้าสู่ระบบ' });
      }

      // STRICT VALIDATION: check if confirmedName matches user.fullName
      const normalizedInput = confirmedName.trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizedExpected = user.fullName.trim().toLowerCase().replace(/\s+/g, ' ');

      if (normalizedInput !== normalizedExpected) {
        return sendJSON(res, 403, {
          error: `ชื่อไม่ตรงกับผู้ใช้งานที่เข้าสู่ระบบ! ท่านต้องพิมพ์ชื่อเต็มภาษาอังกฤษของคุณคือ "${user.fullName}" เท่านั้น ไม่อนุญาตให้ผู้อื่นปิดงานแทน`
        });
      }

      // Update record in CSV
      let records = readRecordsFromCSV();
      const targetRecord = records.find(r => r.id === id);

      if (!targetRecord) {
        return sendJSON(res, 404, { error: 'ไม่พบรายการที่ต้องการปิดงาน' });
      }

      targetRecord.status = 'completed';
      targetRecord.closedBy = user.fullName;
      targetRecord.closedAt = new Date().toISOString();

      writeAllRecordsToCSV(records.reverse());

      return sendJSON(res, 200, {
        success: true,
        message: `ยืนยันความถูกต้องเรียบร้อย ปิดงานโดยคุณ "${user.fullName}" สำเร็จ`,
        record: targetRecord
      });
    }

    // -------------------------------------------------------------
    // RECORDS API: DELETE /api/records/:id
    // -------------------------------------------------------------
    if (req.method === 'DELETE' && pathname.startsWith('/api/records/')) {
      const id = pathname.split('/')[3];
      if (!id) return sendJSON(res, 400, { error: 'Missing record ID' });

      let records = readRecordsFromCSV();
      const initialLen = records.length;
      records = records.filter(r => r.id !== id);

      if (records.length === initialLen) {
        return sendJSON(res, 404, { error: 'ไม่พบรายการที่ต้องการลบ' });
      }

      writeAllRecordsToCSV(records.reverse());
      return sendJSON(res, 200, { success: true, message: `ลบรายการ ${id} ออกจากไฟล์ Excel สำเร็จ` });
    }

    // -------------------------------------------------------------
    // API: GET /api/stats
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/stats') {
      const records = readRecordsFromCSV();
      const today = new Date().toISOString().split('T')[0];

      let inboundCount = 0;
      let outboundCount = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let delayCount = 0;
      let urgentCount = 0;

      const nowTime = new Date().getTime();

      for (const r of records) {
        if (r.type === 'รับเข้า') inboundCount++;
        else if (r.type === 'ส่งออก') outboundCount++;

        if (r.status === 'completed') {
          completedCount++;
        } else {
          pendingCount++;

          // Check alert level
          const dueDateTimeStr = `${r.pickupDate || r.date}T${r.pickupTime || r.time || '00:00'}:00`;
          const dueTime = new Date(dueDateTimeStr).getTime();
          const diffMs = dueTime - nowTime;
          const diffHours = diffMs / (1000 * 60 * 60);

          if (diffMs < 0) {
            delayCount++;
          } else if (diffHours <= 2) {
            urgentCount++;
          }
        }
      }

      return sendJSON(res, 200, {
        totalRecords: records.length,
        inboundCount,
        outboundCount,
        completedCount,
        pendingCount,
        delayCount,
        urgentCount,
        excelRecordsFile: RECORDS_CSV_FILE,
        excelUsersFile: USERS_CSV_FILE
      });
    }

    // -------------------------------------------------------------
    // API: GET /api/download-excel
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/download-excel') {
      if (!fs.existsSync(RECORDS_CSV_FILE)) initRecordsFile();
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="goods_records_${new Date().toISOString().split('T')[0]}.csv"`
      });
      return fs.createReadStream(RECORDS_CSV_FILE).pipe(res);
    }

    // -------------------------------------------------------------
    // API: GET /api/download-users
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/download-users') {
      if (!fs.existsSync(USERS_CSV_FILE)) initUsersFile();
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"`
      });
      return fs.createReadStream(USERS_CSV_FILE).pipe(res);
    }

    // -------------------------------------------------------------
    // Serve Static Files from /public
    // -------------------------------------------------------------
    let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    const fullFilePath = path.join(PUBLIC_DIR, safePath);

    if (fs.existsSync(fullFilePath) && fs.statSync(fullFilePath).isFile()) {
      const ext = path.extname(fullFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      return fs.createReadStream(fullFilePath).pipe(res);
    }

    // SPA fallback
    const indexHtml = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(indexHtml).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');

  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, { error: 'Internal Server Error', message: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🍎 Goods Tracker + Auth + Antigravity Particles Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 Records CSV: ${RECORDS_CSV_FILE}`);
  console.log(`👥 Users CSV: ${USERS_CSV_FILE}`);
  console.log(`=======================================================`);
});
