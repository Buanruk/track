const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const sql = require('mssql');
require('dotenv').config();

const PORT = process.env.PORT || 4200;
const PUBLIC_DIR = path.join(__dirname, 'public');

// SQL Server Configuration for PBGM8G > WareOut
const dbConfig = {
  user: process.env.DB_USER || 'Cost_Team',
  password: process.env.DB_PASSWORD || 'Cost@User1',
  server: process.env.DB_SERVER || 'PBGM8G',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'WareOut',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

// Database Connection & Auto Schema Initialization
async function getDB() {
  if (!pool) {
    try {
      console.log(`🔌 [Database] Connecting to SQL Server: ${dbConfig.server}:${dbConfig.port} > ${dbConfig.database}...`);
      pool = await sql.connect(dbConfig);
      console.log(`✅ [Database] Connected successfully to SQL Server: ${dbConfig.server} > ${dbConfig.database}!`);
      await ensureDatabaseSchema(pool);
    } catch (err) {
      console.error(`❌ [Database] Connection failed to ${dbConfig.server} > ${dbConfig.database}:`, err.message);
      throw err;
    }
  }
  return pool;
}

// Ensure required tables & columns exist (Users.Role, AuditLog, Master tables)
async function ensureDatabaseSchema(db) {
  try {
    // 1. Role in dbo.Users
    const checkRole = await db.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'Role'
    `);
    if (checkRole.recordset.length === 0) {
      console.log('📦 [Schema] Adding Role column to dbo.Users...');
      await db.request().query(`
        ALTER TABLE dbo.Users ADD Role VARCHAR(20) NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'User'
      `);
    }

    // Ensure default admin user
    await db.request().query(`
      UPDATE dbo.Users SET Role = 'Admin' WHERE EmployeeId = '6298B';
      IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Role = 'Admin')
      BEGIN
        UPDATE TOP (1) dbo.Users SET Role = 'Admin';
      END
    `);

    // 2. dbo.AuditLog table
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
      BEGIN
        CREATE TABLE dbo.AuditLog (
          log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          action VARCHAR(50) NOT NULL,
          target_table VARCHAR(50) NOT NULL,
          target_id VARCHAR(50) NOT NULL,
          old_values NVARCHAR(MAX) NULL,
          new_values NVARCHAR(MAX) NULL,
          timestamp DATETIME DEFAULT GETDATE(),
          ip_address VARCHAR(50) NULL
        );
        PRINT 'Created AuditLog table';
      END
    `);

    // 3. dbo.VendorMaster
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VendorMaster')
      BEGIN
        CREATE TABLE dbo.VendorMaster (
          VendorId INT IDENTITY(1,1) PRIMARY KEY,
          VendorCode VARCHAR(50) NULL,
          VendorName NVARCHAR(255) NOT NULL,
          ContactPerson NVARCHAR(150) NULL,
          Phone VARCHAR(50) NULL,
          CreatedAt DATETIME DEFAULT GETDATE()
        );
      END
    `);

    // 4. dbo.ProductMaster
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductMaster')
      BEGIN
        CREATE TABLE dbo.ProductMaster (
          ProductId INT IDENTITY(1,1) PRIMARY KEY,
          ProductCode VARCHAR(50) NOT NULL,
          ProductName NVARCHAR(255) NOT NULL,
          Category NVARCHAR(100) NULL,
          DefaultUnit NVARCHAR(50) NULL,
          CreatedAt DATETIME DEFAULT GETDATE()
        );
      END
    `);

    // 5. dbo.UnitMaster
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UnitMaster')
      BEGIN
        CREATE TABLE dbo.UnitMaster (
          UnitId INT IDENTITY(1,1) PRIMARY KEY,
          UnitCode VARCHAR(50) NULL,
          UnitName NVARCHAR(50) NOT NULL,
          CreatedAt DATETIME DEFAULT GETDATE()
        );
      END
    `);

    // Seed VendorMaster if empty
    const vCount = await db.request().query('SELECT COUNT(*) AS cnt FROM dbo.VendorMaster');
    if (vCount.recordset[0].cnt === 0) {
      await db.request().query(`
        INSERT INTO dbo.VendorMaster (VendorCode, VendorName, ContactPerson, Phone) VALUES
        ('VEND001', N'บจก. สยาม โลจิสติกส์ ซัพพลาย', N'สมชาย ใจดี', '02-123-4567'),
        ('VEND002', N'Apex Intertrade Co., Ltd.', N'John Smith', '02-987-6543'),
        ('VEND003', N'บมจ. ไทยอินดัสเทรียล พาร์ทส์', N'วิภาวรรณ มีสุข', '081-555-8899'),
        ('VEND004', N'Global Express & Cargo Ltd.', N'David Lee', '02-333-1122'),
        ('VEND005', N'บจก. เคมีภัณฑ์ แอดวานซ์', N'ประสิทธิ์ พูลสวัสดิ์', '089-444-7711')
      `);
    }

    // Seed ProductMaster if empty
    const pCount = await db.request().query('SELECT COUNT(*) AS cnt FROM dbo.ProductMaster');
    if (pCount.recordset[0].cnt === 0) {
      await db.request().query(`
        INSERT INTO dbo.ProductMaster (ProductCode, ProductName, Category, DefaultUnit) VALUES
        ('SKU-885001', N'กล่องพัสดุลูกฟูก เบอร์ A (14x20x6 ซม.)', N'บรรจุภัณฑ์', N'กล่อง'),
        ('SKU-885002', N'สายรัดพลาสติก PP Band สีดำ 12mm', N'อุปกรณ์แพ็คเกจจิ้ง', N'ม้วน'),
        ('SKU-885003', N'ฟิล์มยืดพันพาเลท Stretch Film 15 Micron', N'อุปกรณ์แพ็คเกจจิ้ง', N'ม้วน'),
        ('SKU-885004', N'พาเลทไม้รมยามาตรฐาน IPPC (100x120 ซม.)', N'อุปกรณ์ขนถ่าย', N'พาเลท'),
        ('SKU-885005', N'ตลับเทปใสปิดกล่อง 2 นิ้ว 100 หลา', N'อุปกรณ์แพ็คเกจจิ้ง', N'ชิ้น'),
        ('SKU-885006', N'เครื่องอ่านบาร์โค้ดไร้สาย Wireless 2D Barcode Scanner', N'เครื่องมือ/อุปกรณ์', N'เครื่อง'),
        ('SKU-885007', N'ถุงมือไนไตรกันบาด Kevlar Size L', N'อุปกรณ์ความปลอดภัย', N'คู่'),
        ('SKU-885008', N'สารดูดความชื้น Silica Gel 50g', N'เคมีภัณฑ์/กันชื้น', N'ห่อ')
      `);
    }

    // Seed UnitMaster if empty
    const uCount = await db.request().query('SELECT COUNT(*) AS cnt FROM dbo.UnitMaster');
    if (uCount.recordset[0].cnt === 0) {
      await db.request().query(`
        INSERT INTO dbo.UnitMaster (UnitCode, UnitName) VALUES
        ('PCS', N'ชิ้น'),
        ('BOX', N'กล่อง'),
        ('CTN', N'ลัง'),
        ('PLT', N'พาเลท'),
        ('KG', N'กก.'),
        ('UNIT', N'เครื่อง'),
        ('ROLL', N'ม้วน'),
        ('PAIR', N'คู่'),
        ('PACK', N'ห่อ'),
        ('SET', N'ชุด')
      `);
    }

    console.log('✅ [Schema] Database schema & Master tables verified successfully.');
  } catch (err) {
    console.error('⚠️ [Schema] Schema verification warning:', err.message);
  }
}

// Audit Trail Logger Helper
async function recordAuditLog({ userId, action, targetTable, targetId, oldValues = null, newValues = null, ipAddress = '127.0.0.1' }) {
  try {
    const db = await getDB();
    const req = db.request();
    req.input('userId', sql.VarChar(50), userId || 'ANONYMOUS');
    req.input('action', sql.VarChar(50), action);
    req.input('targetTable', sql.VarChar(50), targetTable);
    req.input('targetId', sql.VarChar(50), String(targetId || '-'));
    req.input('oldValues', sql.NVarChar(sql.MAX), oldValues ? JSON.stringify(oldValues) : null);
    req.input('newValues', sql.NVarChar(sql.MAX), newValues ? JSON.stringify(newValues) : null);
    req.input('ipAddress', sql.VarChar(50), ipAddress || '127.0.0.1');

    await req.query(`
      INSERT INTO dbo.AuditLog (user_id, action, target_table, target_id, old_values, new_values, timestamp, ip_address)
      VALUES (@userId, @action, @targetTable, @targetId, @oldValues, @newValues, GETDATE(), @ipAddress)
    `);
    console.log(`📝 [AuditLog] ${action} on ${targetTable}:${targetId} by ${userId} recorded.`);
  } catch (err) {
    console.error('⚠️ [AuditLog] Failed to record audit log:', err.message);
  }
}

// Client IP extractor
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

// Admin Role verification helper
async function checkIsAdmin(employeeId) {
  if (!employeeId) return false;
  try {
    const db = await getDB();
    const req = db.request();
    req.input('empId', sql.VarChar(50), employeeId.trim());
    const res = await req.query(`SELECT Role FROM dbo.Users WHERE LOWER(EmployeeId) = LOWER(@empId)`);
    if (res.recordset.length > 0 && res.recordset[0].Role === 'Admin') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Helper to escape CSV fields for Excel export
function escapeCSV(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

// Helper to send JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-user-id, x-user-role'
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

// Database Query Helpers
async function fetchAllRecordsFromDB() {
  const db = await getDB();
  const query = `
    SELECT 
      Id,
      PoNumber,
      TransactionType,
      Vendor,
      ItemName,
      Quantity,
      Unit,
      CONVERT(varchar(10), RecordDate, 120) AS date,
      CONVERT(varchar(5), RecordTime, 108) AS time,
      CONVERT(varchar(10), PickupDateTime, 120) AS pickupDate,
      CONVERT(varchar(5), PickupDateTime, 108) AS pickupTime,
      Status,
      ClosedBy,
      CONVERT(varchar(19), ClosedAt, 120) AS closedAt,
      CONVERT(varchar(19), CreatedAt, 120) AS createdAt
    FROM dbo.GoodsRecords
    ORDER BY CreatedAt DESC
  `;
  const result = await db.request().query(query);
  return result.recordset.map(row => ({
    id: row.Id,
    poNumber: row.PoNumber || '',
    type: row.TransactionType || 'รับเข้า',
    vendor: row.Vendor || '',
    itemName: row.ItemName || '',
    quantity: typeof row.Quantity === 'number' ? row.Quantity : parseFloat(row.Quantity) || 0,
    unit: row.Unit || '',
    date: row.date || '',
    time: row.time || '',
    pickupDate: row.pickupDate || row.date || '',
    pickupTime: row.pickupTime || row.time || '',
    status: row.Status || 'pending',
    closedBy: row.ClosedBy || '',
    closedAt: row.closedAt || '',
    createdAt: row.createdAt || ''
  }));
}

// Single Record fetch helper
async function fetchSingleRecord(id) {
  const db = await getDB();
  const req = db.request();
  req.input('id', sql.VarChar(50), id);
  const result = await req.query(`
    SELECT 
      Id, PoNumber, TransactionType, Vendor, ItemName, Quantity, Unit,
      CONVERT(varchar(10), RecordDate, 120) AS date,
      CONVERT(varchar(5), RecordTime, 108) AS time,
      CONVERT(varchar(10), PickupDateTime, 120) AS pickupDate,
      CONVERT(varchar(5), PickupDateTime, 108) AS pickupTime,
      Status, ClosedBy,
      CONVERT(varchar(19), ClosedAt, 120) AS closedAt,
      CONVERT(varchar(19), CreatedAt, 120) AS createdAt
    FROM dbo.GoodsRecords
    WHERE Id = @id
  `);
  if (result.recordset.length === 0) return null;
  const row = result.recordset[0];
  return {
    id: row.Id,
    poNumber: row.PoNumber || '',
    type: row.TransactionType || 'รับเข้า',
    vendor: row.Vendor || '',
    itemName: row.ItemName || '',
    quantity: typeof row.Quantity === 'number' ? row.Quantity : parseFloat(row.Quantity) || 0,
    unit: row.Unit || '',
    date: row.date || '',
    time: row.time || '',
    pickupDate: row.pickupDate || row.date || '',
    pickupTime: row.pickupTime || row.time || '',
    status: row.Status || 'pending',
    closedBy: row.ClosedBy || '',
    closedAt: row.closedAt || '',
    createdAt: row.createdAt || ''
  };
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id, x-user-role'
    });
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const clientIp = getClientIp(req);
  const requesterId = req.headers['x-user-id'] || urlObj.searchParams.get('requesterId') || '';

  try {
    // -------------------------------------------------------------
    // DB HEALTH & STATUS API: GET /api/db-status
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/db-status') {
      try {
        const db = await getDB();
        const counts = await db.request().query(`
          SELECT 
            (SELECT COUNT(*) FROM dbo.Users) AS userCount,
            (SELECT COUNT(*) FROM dbo.GoodsRecords) AS recordCount,
            (SELECT COUNT(*) FROM dbo.AuditLog) AS auditCount,
            (SELECT COUNT(*) FROM dbo.VendorMaster) AS vendorCount,
            (SELECT COUNT(*) FROM dbo.ProductMaster) AS productCount
        `);
        return sendJSON(res, 200, {
          connected: true,
          server: dbConfig.server,
          database: dbConfig.database,
          user: dbConfig.user,
          userCount: counts.recordset[0].userCount,
          recordCount: counts.recordset[0].recordCount,
          auditCount: counts.recordset[0].auditCount,
          vendorCount: counts.recordset[0].vendorCount,
          productCount: counts.recordset[0].productCount
        });
      } catch (dbErr) {
        return sendJSON(res, 500, {
          connected: false,
          server: dbConfig.server,
          database: dbConfig.database,
          error: dbErr.message
        });
      }
    }

    // -------------------------------------------------------------
    // AUTH API: POST /api/auth/login
    // -------------------------------------------------------------
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const payload = await parseJSONBody(req);
      const { employeeId } = payload;

      if (!employeeId || !employeeId.trim()) {
        return sendJSON(res, 400, { error: 'กรุณากรอกรหัสพนักงาน' });
      }

      const db = await getDB();
      const request = db.request();
      request.input('empId', sql.VarChar(50), employeeId.trim());

      const result = await request.query(`
        SELECT EmployeeId, FullName, Role, CONVERT(varchar(19), RegisteredAt, 120) AS RegisteredAt
        FROM dbo.Users
        WHERE LOWER(EmployeeId) = LOWER(@empId)
      `);

      if (result.recordset.length === 0) {
        return sendJSON(res, 404, {
          error: `ไม่พบรหัสพนักงาน "${employeeId.trim()}" ในระบบ WareOut กรุณาสมัครสมาชิกก่อน`
        });
      }

      const user = result.recordset[0];
      const role = user.Role || 'User';

      return sendJSON(res, 200, {
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        user: {
          employeeId: user.EmployeeId,
          fullName: user.FullName,
          role: role
        }
      });
    }

    // -------------------------------------------------------------
    // AUTH API: POST /api/auth/register
    // -------------------------------------------------------------
    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const payload = await parseJSONBody(req);
      const { employeeId, fullName, role = 'User' } = payload;

      if (!employeeId || !employeeId.trim() || !fullName || !fullName.trim()) {
        return sendJSON(res, 400, { error: 'กรุณากรอกรหัสพนักงาน และชื่อ-สกุลภาษาอังกฤษให้ครบถ้วน' });
      }

      const assignedRole = (role === 'Admin') ? 'Admin' : 'User';
      const db = await getDB();
      const checkReq = db.request();
      checkReq.input('empId', sql.VarChar(50), employeeId.trim());
      const checkResult = await checkReq.query(`
        SELECT EmployeeId FROM dbo.Users WHERE LOWER(EmployeeId) = LOWER(@empId)
      `);

      if (checkResult.recordset.length > 0) {
        return sendJSON(res, 400, { error: `รหัสพนักงาน "${employeeId.trim()}" มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบ` });
      }

      const insertReq = db.request();
      insertReq.input('empId', sql.VarChar(50), employeeId.trim());
      insertReq.input('fullName', sql.NVarChar(150), fullName.trim());
      insertReq.input('role', sql.VarChar(20), assignedRole);
      await insertReq.query(`
        INSERT INTO dbo.Users (EmployeeId, FullName, Role, RegisteredAt)
        VALUES (@empId, @fullName, @role, GETDATE())
      `);

      // Audit Log for user registration
      await recordAuditLog({
        userId: employeeId.trim(),
        action: 'CREATE',
        targetTable: 'Users',
        targetId: employeeId.trim(),
        oldValues: null,
        newValues: { employeeId: employeeId.trim(), fullName: fullName.trim(), role: assignedRole },
        ipAddress: clientIp
      });

      return sendJSON(res, 201, {
        success: true,
        message: 'สมัครสมาชิกและบันทึกลงฐานข้อมูลสำเร็จ',
        user: {
          employeeId: employeeId.trim(),
          fullName: fullName.trim(),
          role: assignedRole
        }
      });
    }

    // -------------------------------------------------------------
    // RBAC: USER MANAGEMENT API (Admin Only)
    // -------------------------------------------------------------
    // GET /api/users - List all users
    if (req.method === 'GET' && pathname === '/api/users') {
      const isAdmin = await checkIsAdmin(requesterId);
      if (!isAdmin) {
        return sendJSON(res, 403, { error: 'สิทธิ์ไม่เพียงพอ: ฟังก์ชันนี้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น' });
      }

      const db = await getDB();
      const usersRes = await db.request().query(`
        SELECT EmployeeId, FullName, Role, CONVERT(varchar(19), RegisteredAt, 120) AS RegisteredAt
        FROM dbo.Users
        ORDER BY RegisteredAt DESC
      `);

      return sendJSON(res, 200, usersRes.recordset.map(u => ({
        employeeId: u.EmployeeId,
        fullName: u.FullName,
        role: u.Role || 'User',
        registeredAt: u.RegisteredAt
      })));
    }

    // PUT /api/users/:id/role - Update user role
    if (req.method === 'PUT' && pathname.startsWith('/api/users/') && pathname.endsWith('/role')) {
      const parts = pathname.split('/');
      const targetEmpId = decodeURIComponent(parts[3]);
      const isAdmin = await checkIsAdmin(requesterId);
      if (!isAdmin) {
        return sendJSON(res, 403, { error: 'สิทธิ์ไม่เพียงพอ: ฟังก์ชันนี้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น' });
      }

      const payload = await parseJSONBody(req);
      const { role } = payload;
      if (!['Admin', 'User'].includes(role)) {
        return sendJSON(res, 400, { error: 'Role ต้องเป็น Admin หรือ User เท่านั้น' });
      }

      const db = await getDB();
      const curReq = db.request();
      curReq.input('empId', sql.VarChar(50), targetEmpId);
      const curUser = await curReq.query(`SELECT EmployeeId, FullName, Role FROM dbo.Users WHERE LOWER(EmployeeId) = LOWER(@empId)`);
      if (curUser.recordset.length === 0) {
        return sendJSON(res, 404, { error: 'ไม่พบผู้ใช้ที่ระบุ' });
      }

      const oldRole = curUser.recordset[0].Role;

      const updReq = db.request();
      updReq.input('empId', sql.VarChar(50), targetEmpId);
      updReq.input('role', sql.VarChar(20), role);
      await updReq.query(`UPDATE dbo.Users SET Role = @role WHERE LOWER(EmployeeId) = LOWER(@empId)`);

      await recordAuditLog({
        userId: requesterId,
        action: 'UPDATE',
        targetTable: 'Users',
        targetId: targetEmpId,
        oldValues: { role: oldRole },
        newValues: { role },
        ipAddress: clientIp
      });

      return sendJSON(res, 200, { success: true, message: `อัปเดตสิทธิ์ของ ${targetEmpId} เป็น ${role} เรียบร้อย` });
    }

    // DELETE /api/users/:id - Delete a user
    if (req.method === 'DELETE' && pathname.startsWith('/api/users/')) {
      const parts = pathname.split('/');
      const targetEmpId = decodeURIComponent(parts[3]);
      const isAdmin = await checkIsAdmin(requesterId);
      if (!isAdmin) {
        return sendJSON(res, 403, { error: 'สิทธิ์ไม่เพียงพอ: ฟังก์ชันนี้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น' });
      }

      if (targetEmpId.toLowerCase() === requesterId.toLowerCase()) {
        return sendJSON(res, 400, { error: 'ไม่อนุญาตให้ลบบัญชีของตนเอง' });
      }

      const db = await getDB();
      const curReq = db.request();
      curReq.input('empId', sql.VarChar(50), targetEmpId);
      const curUser = await curReq.query(`SELECT EmployeeId, FullName, Role FROM dbo.Users WHERE LOWER(EmployeeId) = LOWER(@empId)`);
      if (curUser.recordset.length === 0) {
        return sendJSON(res, 404, { error: 'ไม่พบผู้ใช้ที่ระบุ' });
      }

      const delReq = db.request();
      delReq.input('empId', sql.VarChar(50), targetEmpId);
      await delReq.query(`DELETE FROM dbo.Users WHERE LOWER(EmployeeId) = LOWER(@empId)`);

      await recordAuditLog({
        userId: requesterId,
        action: 'DELETE',
        targetTable: 'Users',
        targetId: targetEmpId,
        oldValues: curUser.recordset[0],
        newValues: null,
        ipAddress: clientIp
      });

      return sendJSON(res, 200, { success: true, message: `ลบผู้ใช้ ${targetEmpId} สำเร็จ` });
    }

    // -------------------------------------------------------------
    // RECORDS API: GET /api/records
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/records') {
      let records = await fetchAllRecordsFromDB();

      const search = (urlObj.searchParams.get('search') || '').trim().toLowerCase();
      const type = urlObj.searchParams.get('type') || 'all';

      if (type !== 'all') {
        records = records.filter(r => r.type === type);
      }

      if (search) {
        records = records.filter(r =>
          (r.id && r.id.toLowerCase().includes(search)) ||
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
    // RECORDS API: POST /api/records - Add new record (User & Admin)
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
      const reqDate = date.trim();
      const rawReqTime = time.trim();
      const reqTime = rawReqTime.length === 5 ? `${rawReqTime}:00` : rawReqTime;

      const pDate = (pickupDate || date).trim();
      const rawPickupTime = (pickupTime || time).trim();
      const pTime = rawPickupTime.length === 5 ? `${rawPickupTime}:00` : rawPickupTime;
      const pickupDateTimeStr = `${pDate} ${pTime}`;

      const db = await getDB();
      const insertReq = db.request();
      insertReq.input('id', sql.VarChar(50), id);
      insertReq.input('poNumber', sql.NVarChar(50), (poNumber || '').trim().toUpperCase() || null);
      insertReq.input('type', sql.NVarChar(20), type);
      insertReq.input('vendor', sql.NVarChar(255), vendor.trim());
      insertReq.input('itemName', sql.NVarChar(255), itemName.trim());
      insertReq.input('quantity', sql.Decimal(18, 2), parseFloat(quantity) || 0);
      insertReq.input('unit', sql.NVarChar(50), unit.trim());
      insertReq.input('recordDate', sql.VarChar(10), reqDate);
      insertReq.input('recordTime', sql.VarChar(8), reqTime);
      insertReq.input('pickupDateTime', sql.VarChar(19), pickupDateTimeStr);

      await insertReq.query(`
        INSERT INTO dbo.GoodsRecords (
          Id, PoNumber, TransactionType, Vendor, ItemName, Quantity, Unit,
          RecordDate, RecordTime, PickupDateTime, Status, CreatedAt
        ) VALUES (
          @id, @poNumber, @type, @vendor, @itemName, @quantity, @unit,
          CAST(@recordDate AS DATE),
          CAST(@recordTime AS TIME),
          CAST(@pickupDateTime AS DATETIME),
          'pending',
          GETDATE()
        )
      `);

      const newRecordData = {
        id,
        poNumber: (poNumber || '').trim().toUpperCase(),
        type,
        vendor: vendor.trim(),
        itemName: itemName.trim(),
        quantity: parseFloat(quantity) || 0,
        unit: unit.trim(),
        date: reqDate,
        time: reqTime.slice(0, 5),
        pickupDate: pDate,
        pickupTime: pTime.slice(0, 5),
        status: 'pending'
      };

      // Record in AuditLog
      await recordAuditLog({
        userId: requesterId || 'USER',
        action: 'CREATE',
        targetTable: 'GoodsRecords',
        targetId: id,
        oldValues: null,
        newValues: newRecordData,
        ipAddress: clientIp
      });

      return sendJSON(res, 201, {
        success: true,
        message: 'บันทึกลงฐานข้อมูล WareOut สำเร็จ',
        record: newRecordData
      });
    }

    // -------------------------------------------------------------
    // RECORDS API: PUT /api/records/:id - Edit Historical Record (Admin Only)
    // -------------------------------------------------------------
    if (req.method === 'PUT' && pathname.startsWith('/api/records/')) {
      const parts = pathname.split('/');
      const id = parts[3];
      if (!id) return sendJSON(res, 400, { error: 'Missing record ID' });

      // RBAC check: only Admin can edit past records
      const isAdmin = await checkIsAdmin(requesterId);
      if (!isAdmin) {
        return sendJSON(res, 403, {
          error: 'สิทธิ์ไม่เพียงพอ: ผู้ใช้งานทั่วไป (User) ไม่มีสิทธิ์แก้ไขข้อมูลย้อนหลัง ฟังก์ชันนี้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น'
        });
      }

      const oldRecord = await fetchSingleRecord(id);
      if (!oldRecord) {
        return sendJSON(res, 404, { error: 'ไม่พบรายการที่ต้องการแก้ไข' });
      }

      const payload = await parseJSONBody(req);
      const {
        poNumber,
        type = oldRecord.type,
        vendor = oldRecord.vendor,
        itemName = oldRecord.itemName,
        quantity = oldRecord.quantity,
        unit = oldRecord.unit,
        date = oldRecord.date,
        time = oldRecord.time,
        pickupDate = oldRecord.pickupDate,
        pickupTime = oldRecord.pickupTime,
        status = oldRecord.status
      } = payload;

      const reqDate = date.trim();
      const rawReqTime = time.trim();
      const reqTime = rawReqTime.length === 5 ? `${rawReqTime}:00` : rawReqTime;

      const pDate = (pickupDate || date).trim();
      const rawPickupTime = (pickupTime || time).trim();
      const pTime = rawPickupTime.length === 5 ? `${rawPickupTime}:00` : rawPickupTime;
      const pickupDateTimeStr = `${pDate} ${pTime}`;

      const db = await getDB();
      const updateReq = db.request();
      updateReq.input('id', sql.VarChar(50), id);
      updateReq.input('poNumber', sql.NVarChar(50), (poNumber || '').trim().toUpperCase() || null);
      updateReq.input('type', sql.NVarChar(20), type);
      updateReq.input('vendor', sql.NVarChar(255), vendor.trim());
      updateReq.input('itemName', sql.NVarChar(255), itemName.trim());
      updateReq.input('quantity', sql.Decimal(18, 2), parseFloat(quantity) || 0);
      updateReq.input('unit', sql.NVarChar(50), unit.trim());
      updateReq.input('recordDate', sql.VarChar(10), reqDate);
      updateReq.input('recordTime', sql.VarChar(8), reqTime);
      updateReq.input('pickupDateTime', sql.VarChar(19), pickupDateTimeStr);
      updateReq.input('status', sql.VarChar(20), status);

      await updateReq.query(`
        UPDATE dbo.GoodsRecords
        SET 
          PoNumber = @poNumber,
          TransactionType = @type,
          Vendor = @vendor,
          ItemName = @itemName,
          Quantity = @quantity,
          Unit = @unit,
          RecordDate = CAST(@recordDate AS DATE),
          RecordTime = CAST(@recordTime AS TIME),
          PickupDateTime = CAST(@pickupDateTime AS DATETIME),
          Status = @status
        WHERE Id = @id
      `);

      const updatedRecord = await fetchSingleRecord(id);

      // Trigger automatic Audit Log
      await recordAuditLog({
        userId: requesterId,
        action: 'UPDATE',
        targetTable: 'GoodsRecords',
        targetId: id,
        oldValues: oldRecord,
        newValues: updatedRecord,
        ipAddress: clientIp
      });

      return sendJSON(res, 200, {
        success: true,
        message: `แก้ไขรายการ ${id} และบันทึกลง Audit Trail สำเร็จ`,
        record: updatedRecord
      });
    }

    // -------------------------------------------------------------
    // RECORDS API: DELETE /api/records/:id - Delete Record (Admin Only)
    // -------------------------------------------------------------
    if (req.method === 'DELETE' && pathname.startsWith('/api/records/')) {
      const id = pathname.split('/')[3];
      if (!id) return sendJSON(res, 400, { error: 'Missing record ID' });

      // RBAC check: only Admin can delete
      const isAdmin = await checkIsAdmin(requesterId);
      if (!isAdmin) {
        return sendJSON(res, 403, {
          error: 'สิทธิ์ไม่เพียงพอ: ผู้ใช้งานทั่วไป (User) ไม่มีสิทธิ์ลบรายการ ฟังก์ชันนี้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น'
        });
      }

      const oldRecord = await fetchSingleRecord(id);
      if (!oldRecord) {
        return sendJSON(res, 404, { error: 'ไม่พบรายการที่ต้องการลบ' });
      }

      const db = await getDB();
      const delReq = db.request();
      delReq.input('id', sql.VarChar(50), id);
      const delRes = await delReq.query(`DELETE FROM dbo.GoodsRecords WHERE Id = @id`);

      if (delRes.rowsAffected[0] === 0) {
        return sendJSON(res, 404, { error: 'ไม่พบรายการที่ต้องการลบ' });
      }

      // Trigger automatic Audit Log
      await recordAuditLog({
        userId: requesterId,
        action: 'DELETE',
        targetTable: 'GoodsRecords',
        targetId: id,
        oldValues: oldRecord,
        newValues: null,
        ipAddress: clientIp
      });

      return sendJSON(res, 200, {
        success: true,
        message: `ลบรายการ ${id} ออกจากฐานข้อมูลและบันทึกลง Audit Trail สำเร็จ`
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

      const db = await getDB();

      // Check user in dbo.Users
      const userReq = db.request();
      userReq.input('empId', sql.VarChar(50), employeeId.trim());
      const userRes = await userReq.query(`
        SELECT EmployeeId, FullName, Role FROM dbo.Users WHERE LOWER(EmployeeId) = LOWER(@empId)
      `);

      if (userRes.recordset.length === 0) {
        return sendJSON(res, 401, { error: 'ไม่พบข้อมูลผู้ใช้งานที่กำลังเข้าสู่ระบบ' });
      }

      const user = userRes.recordset[0];

      // STRICT VALIDATION: check if confirmedName matches user.FullName
      const normalizedInput = confirmedName.trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizedExpected = user.FullName.trim().toLowerCase().replace(/\s+/g, ' ');

      if (normalizedInput !== normalizedExpected) {
        return sendJSON(res, 403, {
          error: `ชื่อไม่ตรงกับผู้ใช้งานที่เข้าสู่ระบบ! ท่านต้องพิมพ์ชื่อเต็มภาษาอังกฤษของคุณคือ "${user.FullName}" เท่านั้น ไม่อนุญาตให้ผู้อื่นปิดงานแทน`
        });
      }

      const oldRecord = await fetchSingleRecord(id);
      if (!oldRecord) {
        return sendJSON(res, 404, { error: 'ไม่พบรายการที่ต้องการปิดงาน' });
      }

      // Update record in database
      const updateReq = db.request();
      updateReq.input('id', sql.VarChar(50), id);
      updateReq.input('closedBy', sql.NVarChar(150), user.FullName);
      await updateReq.query(`
        UPDATE dbo.GoodsRecords
        SET Status = 'completed',
            ClosedBy = @closedBy,
            ClosedAt = GETDATE()
        WHERE Id = @id
      `);

      // Record Audit Log for Close Job
      await recordAuditLog({
        userId: user.EmployeeId,
        action: 'CLOSE_JOB',
        targetTable: 'GoodsRecords',
        targetId: id,
        oldValues: { status: oldRecord.status, closedBy: oldRecord.closedBy },
        newValues: { status: 'completed', closedBy: user.FullName },
        ipAddress: clientIp
      });

      return sendJSON(res, 200, {
        success: true,
        message: `ยืนยันความถูกต้องเรียบร้อย ปิดงานโดยคุณ "${user.FullName}" สำเร็จ`,
        record: { id, status: 'completed', closedBy: user.FullName }
      });
    }

    // -------------------------------------------------------------
    // AUDIT LOGS API: GET /api/audit-logs (Admin Only)
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/audit-logs') {
      const isAdmin = await checkIsAdmin(requesterId);
      if (!isAdmin) {
        return sendJSON(res, 403, { error: 'สิทธิ์ไม่เพียงพอ: ฟังก์ชันนี้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น' });
      }

      const db = await getDB();
      const limit = parseInt(urlObj.searchParams.get('limit') || '100', 10);
      const actionFilter = urlObj.searchParams.get('action') || '';
      const search = (urlObj.searchParams.get('search') || '').trim();

      let query = `
        SELECT TOP (${Math.min(limit, 500)})
          log_id,
          user_id,
          action,
          target_table,
          target_id,
          old_values,
          new_values,
          CONVERT(varchar(19), timestamp, 120) AS timestamp,
          ip_address
        FROM dbo.AuditLog
        WHERE 1=1
      `;

      const request = db.request();
      if (actionFilter) {
        query += ` AND action = @action`;
        request.input('action', sql.VarChar(50), actionFilter);
      }
      if (search) {
        query += ` AND (user_id LIKE @search OR target_id LIKE @search OR action LIKE @search OR old_values LIKE @search OR new_values LIKE @search)`;
        request.input('search', sql.NVarChar(100), `%${search}%`);
      }

      query += ` ORDER BY timestamp DESC, log_id DESC`;

      const result = await request.query(query);
      return sendJSON(res, 200, result.recordset);
    }

    // -------------------------------------------------------------
    // MASTER DATA APIS: Vendors, Products, Units
    // -------------------------------------------------------------
    // GET /api/master/vendors
    if (req.method === 'GET' && pathname === '/api/master/vendors') {
      const db = await getDB();
      const resData = await db.request().query(`
        SELECT VendorId, VendorCode, VendorName, ContactPerson, Phone 
        FROM dbo.VendorMaster 
        ORDER BY VendorName ASC
      `);
      return sendJSON(res, 200, resData.recordset);
    }

    // GET /api/master/products
    if (req.method === 'GET' && pathname === '/api/master/products') {
      const db = await getDB();
      const resData = await db.request().query(`
        SELECT ProductId, ProductCode, ProductName, Category, DefaultUnit 
        FROM dbo.ProductMaster 
        ORDER BY ProductName ASC
      `);
      return sendJSON(res, 200, resData.recordset);
    }

    // GET /api/master/units
    if (req.method === 'GET' && pathname === '/api/master/units') {
      const db = await getDB();
      const resData = await db.request().query(`
        SELECT UnitId, UnitCode, UnitName 
        FROM dbo.UnitMaster 
        ORDER BY UnitName ASC
      `);
      return sendJSON(res, 200, resData.recordset);
    }

    // POST /api/master/quick-add - Fallback & Quick Add for master items
    if (req.method === 'POST' && pathname === '/api/master/quick-add') {
      const payload = await parseJSONBody(req);
      const { type, name, code, defaultUnit } = payload;

      if (!type || !name || !name.trim()) {
        return sendJSON(res, 400, { error: 'กรุณาระบุประเภทและชื่อข้อมูล Master' });
      }

      const db = await getDB();
      const trimmedName = name.trim();

      if (type === 'vendor') {
        const check = await db.request().input('name', sql.NVarChar(255), trimmedName)
          .query('SELECT VendorId FROM dbo.VendorMaster WHERE LOWER(VendorName) = LOWER(@name)');
        if (check.recordset.length === 0) {
          const vCode = code || `VEND-${Date.now().toString().slice(-4)}`;
          await db.request().input('code', sql.VarChar(50), vCode)
            .input('name', sql.NVarChar(255), trimmedName)
            .query('INSERT INTO dbo.VendorMaster (VendorCode, VendorName) VALUES (@code, @name)');
        }
        return sendJSON(res, 200, { success: true, message: `เพิ่ม Vendor: ${trimmedName} เรียบร้อย` });
      }

      if (type === 'product') {
        const check = await db.request().input('name', sql.NVarChar(255), trimmedName)
          .query('SELECT ProductId FROM dbo.ProductMaster WHERE LOWER(ProductName) = LOWER(@name)');
        if (check.recordset.length === 0) {
          const pCode = code || `SKU-${Date.now().toString().slice(-4)}`;
          await db.request().input('code', sql.VarChar(50), pCode)
            .input('name', sql.NVarChar(255), trimmedName)
            .input('unit', sql.NVarChar(50), defaultUnit || 'ชิ้น')
            .query('INSERT INTO dbo.ProductMaster (ProductCode, ProductName, DefaultUnit) VALUES (@code, @name, @unit)');
        }
        return sendJSON(res, 200, { success: true, message: `เพิ่ม Product: ${trimmedName} เรียบร้อย` });
      }

      if (type === 'unit') {
        const check = await db.request().input('name', sql.NVarChar(50), trimmedName)
          .query('SELECT UnitId FROM dbo.UnitMaster WHERE LOWER(UnitName) = LOWER(@name)');
        if (check.recordset.length === 0) {
          const uCode = code || `U-${Date.now().toString().slice(-4)}`;
          await db.request().input('code', sql.VarChar(50), uCode)
            .input('name', sql.NVarChar(50), trimmedName)
            .query('INSERT INTO dbo.UnitMaster (UnitCode, UnitName) VALUES (@code, @name)');
        }
        return sendJSON(res, 200, { success: true, message: `เพิ่ม Unit: ${trimmedName} เรียบร้อย` });
      }

      return sendJSON(res, 400, { error: 'Unknown master type' });
    }

    // -------------------------------------------------------------
    // EXECUTIVE DASHBOARD / REPORTS API: GET /api/reports/summary (Admin Only)
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/reports/summary') {
      const isAdmin = await checkIsAdmin(requesterId);
      if (!isAdmin) {
        return sendJSON(res, 403, { error: 'สิทธิ์ไม่เพียงพอ: ฟังก์ชันนี้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น' });
      }

      const records = await fetchAllRecordsFromDB();
      const now = new Date().getTime();

      let inboundCount = 0;
      let outboundCount = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let delayCount = 0;
      let urgentCount = 0;

      const vendorMap = {};
      const productMap = {};
      const closerMap = {};
      const dailyMap = {};

      for (const r of records) {
        if (r.type === 'รับเข้า') inboundCount++;
        else if (r.type === 'ส่งออก') outboundCount++;

        // Status counts
        if (r.status === 'completed') {
          completedCount++;
          if (r.closedBy) {
            closerMap[r.closedBy] = (closerMap[r.closedBy] || 0) + 1;
          }
        } else {
          pendingCount++;
          const dueDateTimeStr = `${r.pickupDate || r.date}T${r.pickupTime || r.time || '00:00'}:00`;
          const dueTime = new Date(dueDateTimeStr).getTime();
          const diffMs = dueTime - now;
          const diffHours = diffMs / (1000 * 60 * 60);

          if (diffMs < 0) {
            delayCount++;
          } else if (diffHours <= 2) {
            urgentCount++;
          }
        }

        // Vendor frequency
        if (r.vendor) {
          vendorMap[r.vendor] = (vendorMap[r.vendor] || 0) + 1;
        }

        // Product frequency
        if (r.itemName) {
          productMap[r.itemName] = (productMap[r.itemName] || 0) + 1;
        }

        // Daily trend
        const dayKey = r.date || (r.createdAt ? r.createdAt.slice(0, 10) : 'Unknown');
        dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;
      }

      const topVendors = Object.entries(vendorMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const topProducts = Object.entries(productMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const topClosers = Object.entries(closerMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const dailyTrend = Object.entries(dailyMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7);

      const totalRecords = records.length;
      const completionRate = totalRecords > 0 ? Math.round((completedCount / totalRecords) * 100) : 0;

      return sendJSON(res, 200, {
        totalRecords,
        inboundCount,
        outboundCount,
        completedCount,
        pendingCount,
        delayCount,
        urgentCount,
        completionRate,
        topVendors,
        topProducts,
        topClosers,
        dailyTrend
      });
    }

    // -------------------------------------------------------------
    // API: GET /api/stats (Standard Stats for Header)
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/stats') {
      const records = await fetchAllRecordsFromDB();

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
        database: dbConfig.database,
        server: dbConfig.server
      });
    }

    // -------------------------------------------------------------
    // EXPORT API: GET /api/download-excel (Export live SQL records to Excel CSV)
    // -------------------------------------------------------------
    if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/api/download-excel') {
      const records = await fetchAllRecordsFromDB();
      const header = '\uFEFFรหัสรายการ,หมายเลข PO,ประเภท,ชื่อ Vendor,ชื่อสินค้า,จำนวน,หน่วย,วันที่บันทึก,เวลาบันทึก,วันนัดรับของ,เวลานัดรับของ,สถานะ,ผู้ปิดงาน,เวลาที่ปิดงาน,บันทึกเมื่อ\n';
      let csvContent = header;

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
          escapeCSV(r.createdAt || '')
        ].join(',');
        csvContent += row + '\n';
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="goods_records_${new Date().toISOString().split('T')[0]}.csv"`
      });
      if (req.method === 'HEAD') return res.end();
      return res.end(csvContent);
    }

    // -------------------------------------------------------------
    // EXPORT API: GET /api/download-audit-logs (Export live Audit Logs to CSV)
    // -------------------------------------------------------------
    if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/api/download-audit-logs') {
      const isAdmin = await checkIsAdmin(requesterId);
      if (!isAdmin) {
        return sendJSON(res, 403, { error: 'สิทธิ์ไม่เพียงพอ' });
      }

      const db = await getDB();
      const logsRes = await db.request().query(`
        SELECT log_id, user_id, action, target_table, target_id, old_values, new_values, CONVERT(varchar(19), timestamp, 120) AS timestamp, ip_address
        FROM dbo.AuditLog
        ORDER BY timestamp DESC
      `);

      const header = '\uFEFFLog ID,User ID,Action,Target Table,Target ID,Old Values,New Values,Timestamp,IP Address\n';
      let csvContent = header;

      for (const l of logsRes.recordset) {
        const row = [
          escapeCSV(l.log_id),
          escapeCSV(l.user_id),
          escapeCSV(l.action),
          escapeCSV(l.target_table),
          escapeCSV(l.target_id),
          escapeCSV(l.old_values),
          escapeCSV(l.new_values),
          escapeCSV(l.timestamp),
          escapeCSV(l.ip_address)
        ].join(',');
        csvContent += row + '\n';
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`
      });
      if (req.method === 'HEAD') return res.end();
      return res.end(csvContent);
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

server.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🍎 Goods Tracker + RBAC + AuditLog + Master + Barcode`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database: ${dbConfig.server} > ${dbConfig.database}`);
  console.log(`📤 Excel Export: Active via /api/download-excel`);
  console.log(`=======================================================`);
  try {
    await getDB();
  } catch (e) {
    console.warn(`⚠️ Warning: Could not connect to database on startup:`, e.message);
  }
});
