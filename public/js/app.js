/**
 * Goods Tracker - Complete Client Application Logic
 * 1. Role-Based Access Control (RBAC: Admin & User)
 * 2. Audit Trail (AuditLog integration)
 * 3. Master Data & Searchable Combobox Dropdowns (Vendor, Product, Unit + Fallback)
 * 4. Barcode / QR Code Scanner (Keypress Detection, F2 Shortcut, Instant Search, Quick Close Job)
 * 5. Executive Dashboard & User Management
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentUser: null,
    selectedType: 'รับเข้า',
    searchQuery: '',
    records: [],
    completingRecordId: null,
    editingRecordId: null,
    scannerActive: false,
    master: {
      vendors: [],
      products: [],
      units: []
    }
  };

  // DOM Elements - Auth & RBAC
  const authModal = document.getElementById('authModal');
  const authTabs = document.getElementById('authTabs');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginEmployeeId = document.getElementById('loginEmployeeId');
  const registerFullName = document.getElementById('registerFullName');
  const registerEmployeeId = document.getElementById('registerEmployeeId');
  const userProfileBar = document.getElementById('userProfileBar');
  const userAvatarText = document.getElementById('userAvatarText');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const userRoleBadge = document.getElementById('userRoleBadge');
  const adminNavActions = document.getElementById('adminNavActions');
  const btnLogout = document.getElementById('btnLogout');

  // Admin Modals & Buttons
  const btnOpenDashboard = document.getElementById('btnOpenDashboard');
  const btnOpenUserMgmt = document.getElementById('btnOpenUserMgmt');
  const btnOpenAuditLog = document.getElementById('btnOpenAuditLog');
  const dashboardModal = document.getElementById('dashboardModal');
  const btnCloseDashboard = document.getElementById('btnCloseDashboard');
  const userMgmtModal = document.getElementById('userMgmtModal');
  const btnCloseUserMgmt = document.getElementById('btnCloseUserMgmt');
  const userMgmtTableBody = document.getElementById('userMgmtTableBody');
  const auditModal = document.getElementById('auditModal');
  const btnCloseAudit = document.getElementById('btnCloseAudit');
  const auditActionFilter = document.getElementById('auditActionFilter');
  const auditSearchInput = document.getElementById('auditSearchInput');
  const btnRefreshAudit = document.getElementById('btnRefreshAudit');
  const auditTableBody = document.getElementById('auditTableBody');

  // Edit Record Modal
  const editRecordModal = document.getElementById('editRecordModal');
  const editRecordForm = document.getElementById('editRecordForm');
  const editRecordId = document.getElementById('editRecordId');
  const editPoNumber = document.getElementById('editPoNumber');
  const editType = document.getElementById('editType');
  const editVendor = document.getElementById('editVendor');
  const editItemName = document.getElementById('editItemName');
  const editQuantity = document.getElementById('editQuantity');
  const editUnit = document.getElementById('editUnit');
  const editDate = document.getElementById('editDate');
  const editTime = document.getElementById('editTime');
  const editPickupDate = document.getElementById('editPickupDate');
  const editPickupTime = document.getElementById('editPickupTime');
  const editStatus = document.getElementById('editStatus');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  // Form & Master Combobox Elements
  const typeSegmentedControl = document.getElementById('typeSegmentedControl');
  const recordForm = document.getElementById('recordForm');
  const inputPoNumber = document.getElementById('inputPoNumber');
  const inputVendor = document.getElementById('inputVendor');
  const dropdownVendor = document.getElementById('dropdownVendor');
  const inputItemName = document.getElementById('inputItemName');
  const dropdownItem = document.getElementById('dropdownItem');
  const inputQuantity = document.getElementById('inputQuantity');
  const inputUnit = document.getElementById('inputUnit');
  const dropdownUnit = document.getElementById('dropdownUnit');
  const inputDate = document.getElementById('inputDate');
  const inputTime = document.getElementById('inputTime');
  const inputPickupDate = document.getElementById('inputPickupDate');
  const inputPickupTime = document.getElementById('inputPickupTime');
  const btnFillToday = document.getElementById('btnFillToday');
  const btnSubmit = document.getElementById('btnSubmit');

  // Barcode Scanner & Search Elements
  const searchInput = document.getElementById('searchInput');
  const searchBoxWrap = document.getElementById('searchBoxWrap');
  const btnToggleScanner = document.getElementById('btnToggleScanner');
  const quickScanBanner = document.getElementById('quickScanBanner');
  const quickScanPo = document.getElementById('quickScanPo');
  const quickScanItem = document.getElementById('quickScanItem');
  const quickScanDesc = document.getElementById('quickScanDesc');
  const btnQuickCloseJob = document.getElementById('btnQuickCloseJob');

  // Barcode Test Modal Elements
  const barcodeModal = document.getElementById('barcodeModal');
  const btnOpenBarcodeModal = document.getElementById('btnOpenBarcodeModal');
  const btnCloseBarcode = document.getElementById('btnCloseBarcode');
  const modalBarcodeInput = document.getElementById('modalBarcodeInput');
  const modalBarcodePreview = document.getElementById('modalBarcodePreview');
  const btnSimulateCustomScan = document.getElementById('btnSimulateCustomScan');
  const modalPresetGrid = document.getElementById('modalPresetGrid');

  // Stats Elements
  const statTotal = document.getElementById('statTotal');
  const statInbound = document.getElementById('statInbound');
  const statOutbound = document.getElementById('statOutbound');
  const statUrgent = document.getElementById('statUrgent');

  // Table Elements
  const recordsTableBody = document.getElementById('recordsTableBody');
  const recordsCountText = document.getElementById('recordsCountText');

  // Modal: Signature Verification
  const confirmCompleteModal = document.getElementById('confirmCompleteModal');
  const verifySignatureForm = document.getElementById('verifySignatureForm');
  const modalRecordId = document.getElementById('modalRecordId');
  const modalPoNumber = document.getElementById('modalPoNumber');
  const modalItemName = document.getElementById('modalItemName');
  const modalExpectedUser = document.getElementById('modalExpectedUser');
  const inputSignatureName = document.getElementById('inputSignatureName');
  const signatureErrorMessage = document.getElementById('signatureErrorMessage');
  const btnCancelSignature = document.getElementById('btnCancelSignature');

  // Refresh icon helper
  function refreshIcons() {
    if (window.renderLocalIcons) {
      window.renderLocalIcons();
    } else if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch {}
    }
  }

  // Toast Notification
  function showToast(message, icon = 'check-circle') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'apple-toast';
    toast.innerHTML = `
      <i data-lucide="${icon}" style="width: 17px; height: 17px; color: #34c759;"></i>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    refreshIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px) scale(0.96)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // -------------------------------------------------------------
  // 1. Role-Based Access Control (RBAC) & Authentication
  // -------------------------------------------------------------
  function checkAuth() {
    const saved = localStorage.getItem('goods_tracker_user');
    if (saved) {
      try {
        state.currentUser = JSON.parse(saved);
        updateUserUI();
        closeAuthModal();
      } catch {
        openAuthModal();
      }
    } else {
      openAuthModal();
    }
  }

  function updateUserUI() {
    if (state.currentUser) {
      userProfileBar.style.display = 'inline-flex';
      
      const nameParts = (state.currentUser.fullName || '').trim().split(/\s+/);
      let shortName = state.currentUser.fullName || '';
      if (nameParts.length >= 2) {
        shortName = `${nameParts[0]} ${nameParts[1].charAt(0)}.`;
      }
      userNameDisplay.textContent = `${shortName} (${state.currentUser.employeeId})`;
      userNameDisplay.title = `${state.currentUser.fullName} (${state.currentUser.employeeId})`;
      userAvatarText.textContent = (state.currentUser.fullName || 'U').charAt(0).toUpperCase();

      const role = state.currentUser.role || 'User';
      userRoleBadge.textContent = role === 'Admin' ? '👑 Admin' : '👤 User';
      userRoleBadge.className = `user-role-badge ${role.toLowerCase()}`;

      // Admin navigation action buttons
      if (role === 'Admin') {
        adminNavActions.style.display = 'flex';
      } else {
        adminNavActions.style.display = 'none';
      }

      // Update audit link download parameter
      const btnDownloadAuditLogs = document.getElementById('btnDownloadAuditLogs');
      if (btnDownloadAuditLogs) {
        btnDownloadAuditLogs.href = `/api/download-audit-logs?requesterId=${encodeURIComponent(state.currentUser.employeeId)}`;
      }
    } else {
      userProfileBar.style.display = 'none';
      adminNavActions.style.display = 'none';
    }
    renderRecords(state.records);
  }

  function openAuthModal() {
    authModal.classList.add('active');
    setTimeout(() => loginEmployeeId.focus(), 150);
  }

  function closeAuthModal() {
    authModal.classList.remove('active');
  }

  // Auth Tabs (Login vs Register)
  authTabs.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      authTabs.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      const tab = target.getAttribute('data-tab');

      if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginEmployeeId.focus();
      } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        registerFullName.focus();
      }
    });
  });

  // Login Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const employeeId = loginEmployeeId.value.trim();
    if (!employeeId) return;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');

      state.currentUser = data.user;
      localStorage.setItem('goods_tracker_user', JSON.stringify(data.user));
      updateUserUI();
      closeAuthModal();
      showToast(`ยินดีต้อนรับคุณ ${data.user.fullName} (${data.user.role})!`, 'user-check');
      loadRecords();

    } catch (err) {
      showToast(err.message, 'alert-circle');
      loginEmployeeId.classList.add('shake-error');
      setTimeout(() => loginEmployeeId.classList.remove('shake-error'), 500);
    }
  });

  // Register Submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = registerFullName.value.trim();
    const employeeId = registerEmployeeId.value.trim();

    if (!fullName || !employeeId) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, employeeId })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'สมัครสมาชิกไม่สำเร็จ');

      state.currentUser = data.user;
      localStorage.setItem('goods_tracker_user', JSON.stringify(data.user));
      updateUserUI();
      closeAuthModal();
      showToast(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ ${data.user.fullName}`, 'check-circle-2');
      loadRecords();

    } catch (err) {
      showToast(err.message, 'alert-circle');
      registerEmployeeId.classList.add('shake-error');
      setTimeout(() => registerEmployeeId.classList.remove('shake-error'), 500);
    }
  });

  // Logout
  btnLogout.addEventListener('click', () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      localStorage.removeItem('goods_tracker_user');
      state.currentUser = null;
      updateUserUI();
      openAuthModal();
    }
  });

  // -------------------------------------------------------------
  // 2. Master Data & Searchable Combobox Dropdowns
  // -------------------------------------------------------------
  async function loadMasterData() {
    try {
      const [vRes, pRes, uRes] = await Promise.all([
        fetch('/api/master/vendors'),
        fetch('/api/master/products'),
        fetch('/api/master/units')
      ]);

      if (vRes.ok) state.master.vendors = await vRes.json();
      if (pRes.ok) state.master.products = await pRes.json();
      if (uRes.ok) state.master.units = await uRes.json();

      setupComboboxes();
    } catch (err) {
      console.warn('Could not load master data:', err);
    }
  }

  function setupComboboxes() {
    // 1. Vendor Combobox
    setupSingleCombobox({
      inputEl: inputVendor,
      dropdownEl: dropdownVendor,
      getItems: (query) => {
        const q = (query || '').toLowerCase().trim();
        return state.master.vendors.filter(v =>
          !q ||
          v.VendorName.toLowerCase().includes(q) ||
          (v.VendorCode && v.VendorCode.toLowerCase().includes(q))
        );
      },
      renderItem: (v) => `
        <div class="combobox-option" data-value="${escapeHtml(v.VendorName)}">
          <span>${escapeHtml(v.VendorName)}</span>
          <span class="combobox-option-meta">${escapeHtml(v.VendorCode || 'Vendor')}</span>
        </div>
      `,
      onSelect: (item, val) => {
        inputVendor.value = val;
      },
      type: 'vendor'
    });

    // 2. Product Name Combobox (with SKU & Auto-fill DefaultUnit)
    setupSingleCombobox({
      inputEl: inputItemName,
      dropdownEl: dropdownItem,
      getItems: (query) => {
        const q = (query || '').toLowerCase().trim();
        return state.master.products.filter(p =>
          !q ||
          p.ProductName.toLowerCase().includes(q) ||
          (p.ProductCode && p.ProductCode.toLowerCase().includes(q))
        );
      },
      renderItem: (p) => `
        <div class="combobox-option" data-value="${escapeHtml(p.ProductName)}" data-unit="${escapeHtml(p.DefaultUnit || '')}">
          <div>
            <div style="font-weight: 500;">${escapeHtml(p.ProductName)}</div>
            <div style="font-size: 0.72rem; color: var(--apple-text-tertiary);">รหัส: ${escapeHtml(p.ProductCode)}</div>
          </div>
          <span class="combobox-option-meta">${escapeHtml(p.DefaultUnit || 'ชิ้น')}</span>
        </div>
      `,
      onSelect: (item, val) => {
        inputItemName.value = val;
        // Auto-fill DefaultUnit if present
        const unit = item.getAttribute('data-unit');
        if (unit && !inputUnit.value) {
          inputUnit.value = unit;
          showToast(`เติมหน่วยนับอัตโนมัติ: ${unit}`, 'sparkles');
        }
      },
      type: 'product'
    });

    // 3. Unit Combobox
    setupSingleCombobox({
      inputEl: inputUnit,
      dropdownEl: dropdownUnit,
      getItems: (query) => {
        const q = (query || '').toLowerCase().trim();
        return state.master.units.filter(u =>
          !q ||
          u.UnitName.toLowerCase().includes(q) ||
          (u.UnitCode && u.UnitCode.toLowerCase().includes(q))
        );
      },
      renderItem: (u) => `
        <div class="combobox-option" data-value="${escapeHtml(u.UnitName)}">
          <span>${escapeHtml(u.UnitName)}</span>
          <span class="combobox-option-meta">${escapeHtml(u.UnitCode || 'UOM')}</span>
        </div>
      `,
      onSelect: (item, val) => {
        inputUnit.value = val;
      },
      type: 'unit'
    });
  }

  // Generic Searchable Combobox Helper with Fallback Handling
  function setupSingleCombobox({ inputEl, dropdownEl, getItems, renderItem, onSelect, type }) {
    const parent = inputEl.closest('.apple-combobox-wrap');
    const toggleBtn = parent.querySelector('.combobox-toggle-btn');

    function renderList() {
      const query = inputEl.value;
      const items = getItems(query);

      let html = items.map(renderItem).join('');

      // Fallback item: if typed query doesn't exactly match master, allow custom entry / quick-add
      const trimmed = query.trim();
      if (trimmed) {
        const hasExact = items.some(i => {
          const name = i.VendorName || i.ProductName || i.UnitName;
          return name && name.toLowerCase() === trimmed.toLowerCase();
        });

        if (!hasExact) {
          html += `
            <div class="combobox-fallback-item" data-custom="${escapeHtml(trimmed)}">
              <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i>
              <span>ใช้ค่าที่พิมพ์: "<b>${escapeHtml(trimmed)}</b>" (บันทึกอัตโนมัติ)</span>
            </div>
          `;
        }
      }

      if (!html) {
        html = `<div style="padding: 0.75rem 1rem; font-size: 0.8rem; color: var(--apple-text-tertiary); text-align: center;">ไม่พบข้อมูล Master</div>`;
      }

      dropdownEl.innerHTML = html;
      refreshIcons();

      // Attach clicks
      dropdownEl.querySelectorAll('.combobox-option').forEach(opt => {
        opt.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const val = opt.getAttribute('data-value');
          onSelect(opt, val);
          dropdownEl.classList.remove('active');
        });
      });

      dropdownEl.querySelectorAll('.combobox-fallback-item').forEach(btn => {
        btn.addEventListener('mousedown', async (e) => {
          e.preventDefault();
          const customVal = btn.getAttribute('data-custom');
          inputEl.value = customVal;
          dropdownEl.classList.remove('active');

          // Asynchronously add to master in background so user doesn't wait
          try {
            await fetch('/api/master/quick-add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, name: customVal })
            });
            loadMasterData();
          } catch {}
        });
      });
    }

    inputEl.addEventListener('focus', () => {
      renderList();
      dropdownEl.classList.add('active');
    });

    inputEl.addEventListener('input', () => {
      renderList();
      dropdownEl.classList.add('active');
    });

    inputEl.addEventListener('blur', () => {
      // Delay so mousedown on dropdown items registers
      setTimeout(() => dropdownEl.classList.remove('active'), 200);
    });

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        inputEl.focus();
        renderList();
        dropdownEl.classList.toggle('active');
      });
    }
  }

  // -------------------------------------------------------------
  // 3. Barcode & QR Code Scanning System (Hardware & Camera)
  // -------------------------------------------------------------
  let lastKeyTime = Date.now();
  let barcodeBuffer = '';
  let isScanningBurst = false;
  let burstTargetInput = null;
  let burstTargetInitialVal = '';
  let burstTimer = null;

  // Toggle Barcode Scanner indicator & auto-focus
  function toggleScannerMode(forceState = null) {
    state.scannerActive = forceState !== null ? forceState : !state.scannerActive;
    if (state.scannerActive) {
      searchBoxWrap.classList.add('scanner-active-pulse');
      btnToggleScanner.classList.add('active');
      btnToggleScanner.innerHTML = `<i data-lucide="scan" style="width: 14px; height: 14px;"></i> <span>สแกนบาร์โค้ด...</span>`;
      searchInput.placeholder = '📷 กำลังรอสแกน Barcode/QR Code (กด Enter เมื่อสแกนเสร็จ)...';
      searchInput.focus();
      showToast('โหมดสแกนเนอร์พร้อมทำงาน (Auto-focus Active)', 'barcode');
    } else {
      searchBoxWrap.classList.remove('scanner-active-pulse');
      btnToggleScanner.classList.remove('active');
      btnToggleScanner.innerHTML = `<i data-lucide="scan" style="width: 14px; height: 14px;"></i> <span>Scanner (F2)</span>`;
      searchInput.placeholder = 'ค้นหา หรือสแกน Barcode/QR (PO, รหัสสินค้า, Vendor)...';
    }
    refreshIcons();
  }

  btnToggleScanner.addEventListener('click', () => toggleScannerMode());

  // Global F2 Key shortcut to quickly toggle scanner mode
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      toggleScannerMode();
    }
  });

  // Helper to ensure barcode/PO string is clean English uppercase/trimmed
  function toCleanEnglishBarcode(str) {
    if (!str) return '';
    const converted = window.convertThaiKedmaneeToEnglish ? window.convertThaiKedmaneeToEnglish(str) : str;
    return converted.trim();
  }

  // Subtle audio confirmation chime (Apple-style 1760Hz POS chime)
  function playScanSuccessTone() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  // Parse structured QR payload (JSON, Key-Value, Delimited)
  function parseScannedPayload(rawText) {
    if (!rawText) return null;
    const text = String(rawText).trim();

    // 1. JSON (standard in industrial 2D barcodes)
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      try {
        const obj = JSON.parse(text);
        if (typeof obj === 'object' && obj !== null) {
          return {
            poNumber: obj.po || obj.poNumber || obj.po_number || obj.id || '',
            vendor: obj.vendor || obj.vendorName || obj.supplier || '',
            itemName: obj.itemName || obj.item || obj.product || obj.name || '',
            quantity: obj.quantity !== undefined ? obj.quantity : (obj.qty !== undefined ? obj.qty : ''),
            unit: obj.unit || obj.uom || '',
            type: obj.type || obj.transactionType || '',
            pickupDate: obj.pickupDate || obj.date || '',
            pickupTime: obj.pickupTime || obj.time || ''
          };
        }
      } catch {}
    }

    // 2. Key-Value pairs: e.g. PO: PO-2026-8801 \n Vendor: บจก. สยาม
    if (text.includes(':') && (text.includes('\n') || text.includes(';') || text.includes('|'))) {
      const lines = text.split(/[\r\n;|]+/);
      const parsed = {};
      for (const line of lines) {
        const idx = line.indexOf(':');
        if (idx > -1) {
          const k = line.slice(0, idx).trim().toLowerCase();
          const v = line.slice(idx + 1).trim();
          if (k.includes('po') || k.includes('เลข')) parsed.poNumber = v;
          else if (k.includes('vendor') || k.includes('คู่ค้า') || k.includes('ผู้ขาย')) parsed.vendor = v;
          else if (k.includes('item') || k.includes('product') || k.includes('สินค้า')) parsed.itemName = v;
          else if (k.includes('qty') || k.includes('จำนวน') || k.includes('quantity')) parsed.quantity = parseFloat(v) || v;
          else if (k.includes('unit') || k.includes('หน่วย')) parsed.unit = v;
          else if (k.includes('type') || k.includes('ประเภท')) parsed.type = v;
          else if (k.includes('date') || k.includes('วัน')) parsed.pickupDate = v;
          else if (k.includes('time') || k.includes('เวลา')) parsed.pickupTime = v;
        }
      }
      if (parsed.poNumber || parsed.itemName || parsed.vendor) {
        return parsed;
      }
    }

    // 3. Delimited (Pipe or Comma): e.g. PO-SCAN-99 | บจก. สยาม | กล่องพัสดุ | 120 | กล่อง
    if (text.includes('|') || (text.includes(',') && !text.includes(' '))) {
      const parts = text.split(/[|,]/).map(s => s.trim());
      if (parts.length >= 3) {
        return {
          poNumber: parts[0],
          vendor: parts[1] || '',
          itemName: parts[2] || '',
          quantity: parts[3] ? parseFloat(parts[3]) || parts[3] : '',
          unit: parts[4] || '',
          type: parts[5] || ''
        };
      }
    }

    return null;
  }

  // Visual pulse animation on filled form fields
  function animateFormScanSuccess() {
    const fields = [inputPoNumber, inputVendor, inputItemName, inputQuantity, inputUnit, inputPickupDate, inputPickupTime];
    fields.forEach(el => {
      if (!el) return;
      el.classList.remove('scan-autofill-pulse');
      void el.offsetWidth;
      el.classList.add('scan-autofill-pulse');
    });
    const card = document.querySelector('.apple-card');
    if (card) {
      card.classList.remove('card-scan-pulse');
      void card.offsetWidth;
      card.classList.add('card-scan-pulse');
    }
  }

  // Master Scanned Input Processor: Handles QR Code / Barcode from scanner guns, camera, or inputs
  // Automatically populates PO field and all other details completely without needing to click on PO field!
  window.handleScannedInput = async function (rawScannedCode) {
    if (!rawScannedCode) return;

    // 1. Translate Thai Kedmanee keys into US English
    let clean = toCleanEnglishBarcode(rawScannedCode);
    if (!clean) return;

    playScanSuccessTone();

    // 2. Parse payload if structured QR
    const payload = parseScannedPayload(clean);

    let targetPo = '';
    let targetVendor = '';
    let targetItem = '';
    let targetQty = '';
    let targetUnit = '';
    let targetType = '';
    let targetPickupDate = '';
    let targetPickupTime = '';
    let matchedRecord = null;

    if (payload) {
      targetPo = payload.poNumber || '';
      targetVendor = payload.vendor || '';
      targetItem = payload.itemName || '';
      targetQty = payload.quantity !== undefined ? payload.quantity : '';
      targetUnit = payload.unit || '';
      targetType = payload.type || '';
      targetPickupDate = payload.pickupDate || '';
      targetPickupTime = payload.pickupTime || '';
    } else {
      targetPo = clean;
    }

    targetPo = targetPo.trim().toUpperCase();
    const q = targetPo.toLowerCase();

    // 3. Lookup in local state.records
    matchedRecord = state.records.find(r =>
      (r.poNumber && r.poNumber.toUpperCase() === targetPo) ||
      (r.id && r.id.toUpperCase() === targetPo) ||
      (r.itemName && r.itemName.toLowerCase() === q)
    );

    // 4. If not found locally in state.records, query database API
    if (!matchedRecord && targetPo) {
      try {
        const res = await fetch(`/api/records?search=${encodeURIComponent(targetPo)}`);
        if (res.ok) {
          const records = await res.json();
          matchedRecord = records.find(r =>
            (r.poNumber && r.poNumber.toUpperCase() === targetPo) ||
            (r.id && r.id.toUpperCase() === targetPo)
          ) || (records.length === 1 ? records[0] : null);
        }
      } catch (err) {
        console.warn('DB lookup failed:', err);
      }
    }

    // 5. Populate details from matched record
    if (matchedRecord) {
      targetPo = matchedRecord.poNumber || matchedRecord.id || targetPo;
      if (!targetVendor) targetVendor = matchedRecord.vendor || '';
      if (!targetItem) targetItem = matchedRecord.itemName || '';
      if (targetQty === '' || targetQty === undefined) targetQty = matchedRecord.quantity || '';
      if (!targetUnit) targetUnit = matchedRecord.unit || '';
      if (!targetType) targetType = matchedRecord.type || '';
      if (!targetPickupDate) targetPickupDate = matchedRecord.pickupDate || matchedRecord.date || '';
      if (!targetPickupTime) targetPickupTime = matchedRecord.pickupTime || matchedRecord.time || '';
    } else {
      // Check SKU in ProductMaster
      const matchedProduct = state.master.products.find(p =>
        (p.ProductCode && p.ProductCode.toLowerCase() === q) ||
        (p.ProductName && p.ProductName.toLowerCase().includes(q))
      );
      if (matchedProduct) {
        if (!targetItem) targetItem = matchedProduct.ProductName;
        if (!targetUnit) targetUnit = matchedProduct.DefaultUnit || 'ชิ้น';
      }

      // Check Vendor in VendorMaster
      const matchedVendor = state.master.vendors.find(v =>
        (v.VendorCode && v.VendorCode.toLowerCase() === q) ||
        (v.VendorName && v.VendorName.toLowerCase().includes(q))
      );
      if (matchedVendor) {
        if (!targetVendor) targetVendor = matchedVendor.VendorName;
      }
    }

    // 6. POPULATE MAIN FORM FIELDS DIRECTLY (No need to click PO field!)
    inputPoNumber.value = targetPo;
    if (targetVendor) inputVendor.value = targetVendor;
    if (targetItem) inputItemName.value = targetItem;
    if (targetQty !== '' && targetQty !== undefined) inputQuantity.value = targetQty;
    if (targetUnit) inputUnit.value = targetUnit;
    if (targetType) setTransactionType(targetType);
    if (targetPickupDate) inputPickupDate.value = targetPickupDate;
    if (targetPickupTime) inputPickupTime.value = targetPickupTime;

    // 7. If Edit Record Modal is active, populate edit fields too
    if (editRecordModal.classList.contains('active')) {
      if (targetPo) editPoNumber.value = targetPo;
      if (targetVendor) editVendor.value = targetVendor;
      if (targetItem) editItemName.value = targetItem;
      if (targetQty !== '' && targetQty !== undefined) editQuantity.value = targetQty;
      if (targetUnit) editUnit.value = targetUnit;
      if (targetType) editType.value = targetType;
      if (targetPickupDate) editPickupDate.value = targetPickupDate;
      if (targetPickupTime) editPickupTime.value = targetPickupTime;
      if (matchedRecord && matchedRecord.status) editStatus.value = matchedRecord.status;
    }

    // 8. Update search bar & filter table
    searchInput.value = targetPo;
    state.searchQuery = targetPo;
    await loadRecords();

    // 9. Show Quick Scan Banner with complete details
    showQuickScanBannerWithDetails({
      poNumber: targetPo,
      vendor: targetVendor,
      itemName: targetItem,
      quantity: targetQty,
      unit: targetUnit,
      type: targetType || state.selectedType,
      pickupDate: targetPickupDate,
      pickupTime: targetPickupTime,
      status: matchedRecord ? matchedRecord.status : 'pending',
      record: matchedRecord
    });

    // 10. Trigger green glow animation on all fields
    animateFormScanSuccess();

    // 11. Toast notification
    if (matchedRecord) {
      showToast(`⚡ สแกนสำเร็จ: PO "${targetPo}" • ดึงข้อมูล ${targetItem || ''} ครบถ้วน!`, 'check-circle');
    } else {
      showToast(`⚡ สแกน PO "${targetPo}" • เติมลงช่อง PO เรียบร้อย (พร้อมกรอกข้อมูลบันทึก)`, 'zap');
    }
  };

  // Evaluate scanned match and show Quick Close Action Banner with complete details
  function showQuickScanBannerWithDetails({ poNumber, vendor, itemName, quantity, unit, type, pickupDate, pickupTime, status, record }) {
    if (!poNumber && !itemName) {
      quickScanBanner.style.display = 'none';
      return;
    }

    quickScanPo.textContent = poNumber || '-';
    quickScanItem.textContent = itemName ? `• ${itemName} ${quantity ? `(${quantity} ${unit || ''})` : ''}` : '';

    let desc = '';
    if (vendor) desc += `คู่ค้า: ${vendor} • `;
    if (type) desc += `ประเภท: ${type} • `;
    if (pickupDate) desc += `นัดรับ: ${pickupDate} ${pickupTime || ''} น. • `;
    desc += `สถานะ: ${status === 'completed' ? '✅ เสร็จสิ้นแล้ว' : '⏳ รอดำเนินการ'}`;
    quickScanDesc.textContent = desc;

    if (record && record.status !== 'completed') {
      btnQuickCloseJob.style.display = 'inline-flex';
      btnQuickCloseJob.onclick = () => openSignatureModal(record);
    } else if (record && record.status === 'completed') {
      btnQuickCloseJob.style.display = 'none';
    } else {
      btnQuickCloseJob.style.display = 'none';
    }

    quickScanBanner.style.display = 'flex';
    refreshIcons();
  }

  // Global Hardware Scanner detection (key intervals < 50ms followed by Enter)
  // Automatically decodes physical keys so it works even if Windows keyboard is set to Thai!
  // Works from ANYWHERE on the page without needing to focus on the PO field!
  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isSearchFocused = activeEl === searchInput;
    const isPoFocused = activeEl === inputPoNumber;

    const currentTime = Date.now();
    const diff = currentTime - lastKeyTime;
    lastKeyTime = currentTime;

    // Enter key triggers scan evaluation
    if (e.key === 'Enter') {
      if (barcodeBuffer.length >= 2 || isScanningBurst) {
        e.preventDefault();
        e.stopPropagation();

        // If the scanner typed into another input field, restore its original value
        if (burstTargetInput && burstTargetInput !== inputPoNumber && burstTargetInput.tagName === 'INPUT') {
          burstTargetInput.value = burstTargetInitialVal;
        }

        const raw = barcodeBuffer;
        barcodeBuffer = '';
        isScanningBurst = false;
        burstTargetInput = null;
        clearTimeout(burstTimer);

        window.handleScannedInput(raw);
        return;
      } else if (isSearchFocused) {
        e.preventDefault();
        window.handleScannedInput(searchInput.value);
        return;
      } else if (isPoFocused) {
        e.preventDefault();
        window.handleScannedInput(inputPoNumber.value);
        return;
      }
      return;
    }

    // Decode char: If Windows is in Thai language mode, decode physical key directly to English
    const char = window.decodeKeyEventToEnglish ? window.decodeKeyEventToEnglish(e) : (e.key && e.key.length === 1 ? e.key : '');
    if (char) {
      if (diff < 50) {
        // High speed burst (< 50ms) -> Definitely hardware scanner
        if (!isScanningBurst) {
          isScanningBurst = true;
          burstTargetInput = activeEl;
          burstTargetInitialVal = (activeEl && activeEl.value !== undefined) ? activeEl.value : '';
        }
        barcodeBuffer += char;
      } else {
        // Normal human typing or start of a scan
        barcodeBuffer = char;
        isScanningBurst = false;
        burstTargetInput = activeEl;
        burstTargetInitialVal = (activeEl && activeEl.value !== undefined) ? activeEl.value : '';
      }

      // Safety timer: complete scan if scanner does not send Enter
      clearTimeout(burstTimer);
      if (isScanningBurst) {
        burstTimer = setTimeout(() => {
          if (barcodeBuffer.length >= 3 && isScanningBurst) {
            if (burstTargetInput && burstTargetInput !== inputPoNumber && burstTargetInput.tagName === 'INPUT') {
              burstTargetInput.value = burstTargetInitialVal;
            }
            const raw = barcodeBuffer;
            barcodeBuffer = '';
            isScanningBurst = false;
            burstTargetInput = null;
            window.handleScannedInput(raw);
          }
        }, 75);
      }
    }
  });

  // -------------------------------------------------------------
  // 4. Data Fetching & Table Rendering
  // -------------------------------------------------------------
  async function loadRecords() {
    try {
      const params = new URLSearchParams();
      if (state.searchQuery) params.append('search', state.searchQuery);

      const res = await fetch(`/api/records?${params.toString()}`);
      if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');
      const records = await res.json();
      state.records = records;

      renderRecords(records);
      loadStats();

      if (state.searchQuery) {
        handleScanMatched(state.searchQuery);
      }

    } catch (err) {
      console.error(err);
    }
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const stats = await res.json();

      statTotal.textContent = stats.totalRecords || 0;
      statInbound.textContent = stats.inboundCount || 0;
      statOutbound.textContent = stats.outboundCount || 0;
      statUrgent.textContent = (stats.delayCount + stats.urgentCount) || 0;
    } catch (err) {
      console.error('Stats error:', err);
    }
  }

  function formatThaiDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const day = parseInt(parts[2], 10);
        const month = months[parseInt(parts[1], 10) - 1];
        const year = parseInt(parts[0], 10) + 543;
        return `${day} ${month} ${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  function calculateAlertStatus(r) {
    if (r.status === 'completed') {
      return {
        rowClass: '',
        badgeClass: 'badge-alert-completed',
        icon: 'check-circle',
        label: 'สำเร็จ (Completed)',
        subtitle: r.closedBy ? `ปิดโดย: ${r.closedBy}` : ''
      };
    }

    const dueStr = `${r.pickupDate || r.date}T${r.pickupTime || r.time || '00:00'}:00`;
    const dueTime = new Date(dueStr).getTime();
    const now = new Date().getTime();
    const diffMs = dueTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      const overHours = Math.abs(Math.round(diffHours));
      const overDays = Math.floor(overHours / 24);
      const text = overDays > 0 ? `เกิน ${overDays} วัน ${overHours % 24} ชม.` : `เกิน ${overHours} ชม.`;
      return {
        rowClass: 'row-delay',
        badgeClass: 'badge-alert-delay',
        icon: 'alert-octagon',
        label: `⛔ DELAY (${text})`,
        subtitle: 'เลยกำหนดเวลานัดรับของแล้ว!'
      };
    }

    if (diffHours <= 2) {
      const remainMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return {
        rowClass: 'row-urgent',
        badgeClass: 'badge-alert-urgent',
        icon: 'alert-triangle',
        label: `🔴 ด่วนมาก! (เหลือ ${remainMins} นาที)`,
        subtitle: 'ใกล้ถึงเวลานัดรับของใน 2 ชม.'
      };
    }

    if (diffHours <= 24) {
      const remainHours = Math.round(diffHours);
      return {
        rowClass: '',
        badgeClass: 'badge-alert-warning',
        icon: 'clock',
        label: `🟡 เตือน (อีก ${remainHours} ชม.)`,
        subtitle: 'นัดรับของภายใน 24 ชม.'
      };
    }

    const remainDays = Math.round(diffHours / 24);
    return {
      rowClass: '',
      badgeClass: 'badge-alert-schedule',
      icon: 'calendar',
      label: `🟢 ตามกำหนด (อีก ${remainDays} วัน)`,
      subtitle: `นัด: ${formatThaiDate(r.pickupDate)} ${r.pickupTime} น.`
    };
  }

  function renderRecords(records) {
    recordsCountText.textContent = `แสดง ${records.length} รายการ (PBGM8G > WareOut)`;

    if (!records || records.length === 0) {
      recordsTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 4rem 1.5rem; background: transparent;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.85rem; max-width: 420px; margin: 0 auto;">
              <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(0, 0, 0, 0.04); display: flex; align-items: center; justify-content: center; color: var(--apple-text-tertiary);">
                <i data-lucide="inbox" style="width: 28px; height: 28px; opacity: 0.6;"></i>
              </div>
              <div style="font-size: 1rem; font-weight: 600; color: var(--apple-text-primary);">
                ยังไม่มีรายการบันทึก หรือไม่พบข้อมูลตามคำค้นหา
              </div>
              <div style="font-size: 0.82rem; color: var(--apple-text-secondary); line-height: 1.5;">
                กรอกฟอร์มด้านบนเพื่อบันทึกรายการสินค้าใหม่ หรือสแกนบาร์โค้ด
              </div>
            </div>
          </td>
        </tr>
      `;
      refreshIcons();
      return;
    }

    const isAdmin = state.currentUser && state.currentUser.role === 'Admin';

    recordsTableBody.innerHTML = records.map(r => {
      const isReceive = r.type === 'รับเข้า';
      const typeBadgeClass = isReceive ? 'badge-inbound' : 'badge-outbound';
      const typeIcon = isReceive ? 'arrow-down-left' : 'arrow-up-right';

      const alert = calculateAlertStatus(r);
      const poDisplay = r.poNumber ? `<span class="badge-po">${escapeHtml(r.poNumber)}</span>` : '<span style="color:var(--apple-text-muted);">—</span>';

      // Close job action button
      let actionBtn = '';
      if (r.status === 'completed') {
        actionBtn = `
          <div style="font-size:0.75rem; color:#059669; font-weight:600; text-align:center;">
            <i data-lucide="check" style="width:13px;height:13px;display:inline;"></i> เสร็จสิ้น
          </div>
        `;
      } else {
        actionBtn = `
          <button type="button" class="btn-action-complete btnOpenVerifySignature" data-id="${r.id}" data-po="${escapeHtml(r.poNumber || '-')}" data-item="${escapeHtml(r.itemName)}">
            <i data-lucide="check-circle" style="width:13px;height:13px;"></i>
            <span>ปิดงาน</span>
          </button>
        `;
      }

      // Admin Management Controls (Edit / Delete)
      let adminActionsHtml = '';
      if (isAdmin) {
        adminActionsHtml = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.2rem;">
            <button type="button" class="btn-edit-row btnEditRecord" data-id="${r.id}" title="แก้ไขรายการย้อนหลัง (Admin)">
              <i data-lucide="edit" style="width:14px;height:14px;"></i>
            </button>
            <button type="button" class="btn-delete-row btnDeleteRecord" data-id="${r.id}" title="ลบรายการ (Admin)">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            </button>
          </div>
        `;
      } else {
        adminActionsHtml = `
          <div style="text-align: center; color: var(--apple-text-muted);" title="สิทธิ์เฉพาะ Admin เท่านั้น">
            <i data-lucide="shield" style="width: 14px; height: 14px; opacity: 0.4;"></i>
          </div>
        `;
      }

      return `
        <tr class="${alert.rowClass}" data-record-id="${r.id}">
          <td>
            <span class="apple-badge ${typeBadgeClass}">
              <i data-lucide="${typeIcon}" style="width:12px;height:12px;"></i>
              <span>${r.type}</span>
            </span>
          </td>
          <td>${poDisplay}</td>
          <td style="font-weight: 600;">${escapeHtml(r.vendor)}</td>
          <td>${escapeHtml(r.itemName)}</td>
          <td>
            <span style="font-weight:600;">${(r.quantity || 0).toLocaleString()}</span>
            <span style="color:var(--apple-text-secondary);font-size:0.8rem;">${escapeHtml(r.unit)}</span>
          </td>
          <td>
            <div style="font-size:0.82rem;">${formatThaiDate(r.date)}</div>
            <div style="font-size:0.72rem;color:var(--apple-text-secondary);">เวลา ${escapeHtml(r.time)} น.</div>
          </td>
          <td>
            <div class="apple-badge ${alert.badgeClass}">
              <i data-lucide="${alert.icon}" style="width:12px;height:12px;"></i>
              <span>${alert.label}</span>
            </div>
            ${alert.subtitle ? `<div style="font-size:0.7rem;color:var(--apple-text-secondary);margin-top:0.2rem;">${alert.subtitle}</div>` : ''}
          </td>
          <td style="text-align: center;">${actionBtn}</td>
          <td style="text-align: center;">${adminActionsHtml}</td>
        </tr>
      `;
    }).join('');

    refreshIcons();

    // Attach Signature Verification Triggers
    document.querySelectorAll('.btnOpenVerifySignature').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const rec = state.records.find(r => r.id === id);
        if (rec) openSignatureModal(rec);
      });
    });

    // Attach Admin Edit Triggers
    document.querySelectorAll('.btnEditRecord').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const rec = state.records.find(r => r.id === id);
        if (rec) openEditModal(rec);
      });
    });

    // Attach Admin Delete Triggers
    document.querySelectorAll('.btnDeleteRecord').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm(`คุณต้องการลบรายการ ${id} ออกจากฐานข้อมูล WareOut หรือไม่?\n(การลบนี้จะถูกบันทึกประวัติลงใน Audit Trail)`)) {
          try {
            const res = await fetch(`/api/records/${id}`, {
              method: 'DELETE',
              headers: { 'x-user-id': state.currentUser ? state.currentUser.employeeId : '' }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'ลบไม่สำเร็จ');
            showToast('ลบรายการและบันทึกประวัติสำเร็จ');
            loadRecords();
          } catch (err) {
            showToast(err.message, 'alert-circle');
          }
        }
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------
  // 5. Signature Verification Modal
  // -------------------------------------------------------------
  function openSignatureModal(rec) {
    if (!state.currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนทำการปิดงาน', 'alert-circle');
      openAuthModal();
      return;
    }

    state.completingRecordId = rec.id;
    modalRecordId.value = rec.id;
    modalPoNumber.textContent = rec.poNumber || '-';
    modalItemName.textContent = rec.itemName;
    modalExpectedUser.textContent = `${state.currentUser.fullName} (${state.currentUser.employeeId})`;

    inputSignatureName.value = '';
    signatureErrorMessage.style.display = 'none';
    confirmCompleteModal.classList.add('active');
    setTimeout(() => inputSignatureName.focus(), 150);
  }

  btnCancelSignature.addEventListener('click', () => {
    confirmCompleteModal.classList.remove('active');
  });

  verifySignatureForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!state.currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อน', 'alert-circle');
      return;
    }

    const inputName = inputSignatureName.value.trim();
    const expectedName = state.currentUser.fullName.trim();

    const normInput = inputName.toLowerCase().replace(/\s+/g, ' ');
    const normExpected = expectedName.toLowerCase().replace(/\s+/g, ' ');

    if (normInput !== normExpected) {
      signatureErrorMessage.textContent = `❌ ชื่อไม่ถูกต้อง: ต้องพิมพ์ "${expectedName}" เท่านั้น ไม่อนุญาตให้ผู้อื่นปิดงานแทน`;
      signatureErrorMessage.style.display = 'block';
      inputSignatureName.classList.add('shake-error');
      setTimeout(() => inputSignatureName.classList.remove('shake-error'), 450);
      return;
    }

    signatureErrorMessage.style.display = 'none';

    try {
      const res = await fetch(`/api/records/${state.completingRecordId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmedName: inputName,
          employeeId: state.currentUser.employeeId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ปิดงานไม่สำเร็จ');

      confirmCompleteModal.classList.remove('active');
      quickScanBanner.style.display = 'none';
      showToast(`ตรวจชื่อผ่าน! ปิดงานโดยคุณ "${expectedName}" เรียบร้อย (Audit Log บันทึกสำเร็จ)`, 'check-circle-2');
      loadRecords();

    } catch (err) {
      signatureErrorMessage.textContent = `❌ ${err.message}`;
      signatureErrorMessage.style.display = 'block';
    }
  });

  // -------------------------------------------------------------
  // 6. Admin Historical Record Edit Modal
  // -------------------------------------------------------------
  function openEditModal(rec) {
    state.editingRecordId = rec.id;
    editRecordId.value = rec.id;
    editPoNumber.value = rec.poNumber || '';
    editType.value = rec.type || 'รับเข้า';
    editVendor.value = rec.vendor || '';
    editItemName.value = rec.itemName || '';
    editQuantity.value = rec.quantity || 1;
    editUnit.value = rec.unit || 'ชิ้น';
    editDate.value = rec.date || '';
    editTime.value = rec.time || '';
    editPickupDate.value = rec.pickupDate || rec.date || '';
    editPickupTime.value = rec.pickupTime || rec.time || '';
    editStatus.value = rec.status || 'pending';

    editRecordModal.classList.add('active');
  }

  btnCancelEdit.addEventListener('click', () => {
    editRecordModal.classList.remove('active');
  });

  editRecordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentUser || state.currentUser.role !== 'Admin') {
      showToast('เฉพาะ Admin เท่านั้นที่สามารถแก้ไขข้อมูลย้อนหลังได้', 'alert-circle');
      return;
    }

    const payload = {
      poNumber: editPoNumber.value.trim(),
      type: editType.value,
      vendor: editVendor.value.trim(),
      itemName: editItemName.value.trim(),
      quantity: parseFloat(editQuantity.value),
      unit: editUnit.value.trim(),
      date: editDate.value.trim(),
      time: editTime.value.trim(),
      pickupDate: editPickupDate.value.trim(),
      pickupTime: editPickupTime.value.trim(),
      status: editStatus.value
    };

    try {
      const res = await fetch(`/api/records/${state.editingRecordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': state.currentUser.employeeId
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'แก้ไขข้อมูลไม่สำเร็จ');

      editRecordModal.classList.remove('active');
      showToast(`บันทึกการแก้ไขรายการ ${state.editingRecordId} สำเร็จ (บันทึกลง Audit Trail แล้ว)`);
      loadRecords();

    } catch (err) {
      showToast(err.message, 'alert-circle');
    }
  });

  // -------------------------------------------------------------
  // 7. Executive Dashboard / Reports Modal
  // -------------------------------------------------------------
  btnOpenDashboard.addEventListener('click', async () => {
    dashboardModal.classList.add('active');
    loadDashboardData();
  });

  btnCloseDashboard.addEventListener('click', () => {
    dashboardModal.classList.remove('active');
  });

  async function loadDashboardData() {
    try {
      const res = await fetch('/api/reports/summary', {
        headers: { 'x-user-id': state.currentUser ? state.currentUser.employeeId : '' }
      });
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลรายงานได้');
      const data = await res.json();

      document.getElementById('dashTotal').textContent = data.totalRecords || 0;
      document.getElementById('dashCompRate').textContent = `${data.completionRate || 0}%`;
      document.getElementById('dashInOut').textContent = `${data.inboundCount} / ${data.outboundCount}`;
      document.getElementById('dashUrgent').textContent = (data.delayCount + data.urgentCount) || 0;

      // Render Top Vendors
      const maxVendor = Math.max(...data.topVendors.map(v => v.count), 1);
      document.getElementById('dashTopVendors').innerHTML = data.topVendors.map(v => `
        <div class="chart-bar-item">
          <div class="chart-bar-header">
            <span>${escapeHtml(v.name)}</span>
            <b>${v.count} รายการ</b>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${(v.count / maxVendor) * 100}%;"></div>
          </div>
        </div>
      `).join('') || '<div style="font-size:0.8rem;color:var(--apple-text-muted);">ไม่มีข้อมูล</div>';

      // Render Top Products
      const maxProduct = Math.max(...data.topProducts.map(p => p.count), 1);
      document.getElementById('dashTopProducts').innerHTML = data.topProducts.map(p => `
        <div class="chart-bar-item">
          <div class="chart-bar-header">
            <span>${escapeHtml(p.name)}</span>
            <b>${p.count} รายการ</b>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="background:#ff9500; width: ${(p.count / maxProduct) * 100}%;"></div>
          </div>
        </div>
      `).join('') || '<div style="font-size:0.8rem;color:var(--apple-text-muted);">ไม่มีข้อมูล</div>';

      // Render Top Closers
      const maxCloser = Math.max(...data.topClosers.map(c => c.count), 1);
      document.getElementById('dashTopClosers').innerHTML = data.topClosers.map(c => `
        <div class="chart-bar-item">
          <div class="chart-bar-header">
            <span>${escapeHtml(c.name)}</span>
            <b>${c.count} รายการ</b>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="background:#34c759; width: ${(c.count / maxCloser) * 100}%;"></div>
          </div>
        </div>
      `).join('') || '<div style="font-size:0.8rem;color:var(--apple-text-muted);">ยังไม่มีรายการปิดงาน</div>';

      // Render Daily Trend
      const maxTrend = Math.max(...data.dailyTrend.map(d => d.count), 1);
      document.getElementById('dashDailyTrend').innerHTML = data.dailyTrend.map(d => `
        <div class="chart-bar-item">
          <div class="chart-bar-header">
            <span>${escapeHtml(d.date)}</span>
            <b>${d.count} รายการ</b>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="background:#af52de; width: ${(d.count / maxTrend) * 100}%;"></div>
          </div>
        </div>
      `).join('') || '<div style="font-size:0.8rem;color:var(--apple-text-muted);">ไม่มีข้อมูล</div>';

    } catch (err) {
      showToast(err.message, 'alert-circle');
    }
  }

  // -------------------------------------------------------------
  // 8. User Management Modal (Admin Only)
  // -------------------------------------------------------------
  btnOpenUserMgmt.addEventListener('click', () => {
    userMgmtModal.classList.add('active');
    loadUsersList();
  });

  btnCloseUserMgmt.addEventListener('click', () => {
    userMgmtModal.classList.remove('active');
  });

  async function loadUsersList() {
    try {
      const res = await fetch('/api/users', {
        headers: { 'x-user-id': state.currentUser ? state.currentUser.employeeId : '' }
      });
      if (!res.ok) throw new Error('ไม่สามารถดึงรายชื่อผู้ใช้ได้');
      const users = await res.json();

      userMgmtTableBody.innerHTML = users.map(u => `
        <tr>
          <td><b style="font-family: monospace;">${escapeHtml(u.employeeId)}</b></td>
          <td>${escapeHtml(u.fullName)}</td>
          <td>
            <span class="user-role-badge ${u.role.toLowerCase()}">
              ${u.role === 'Admin' ? '👑 Admin' : '👤 User'}
            </span>
          </td>
          <td><span style="font-size:0.78rem;color:var(--apple-text-secondary);">${escapeHtml(u.registeredAt || '-')}</span></td>
          <td style="text-align: center;">
            <select class="apple-input selChangeRole" data-emp-id="${escapeHtml(u.employeeId)}" style="padding: 0.25rem 0.5rem; font-size: 0.78rem; width: auto;">
              <option value="User" ${u.role === 'User' ? 'selected' : ''}>User</option>
              <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
            </select>
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-delete-row btnDeleteUser" data-emp-id="${escapeHtml(u.employeeId)}" title="ลบผู้ใช้">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </td>
        </tr>
      `).join('');

      refreshIcons();

      // Role change listeners
      document.querySelectorAll('.selChangeRole').forEach(sel => {
        sel.addEventListener('change', async (e) => {
          const empId = e.currentTarget.getAttribute('data-emp-id');
          const newRole = e.currentTarget.value;
          try {
            const updRes = await fetch(`/api/users/${encodeURIComponent(empId)}/role`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': state.currentUser.employeeId
              },
              body: JSON.stringify({ role: newRole })
            });
            const data = await updRes.json();
            if (!updRes.ok) throw new Error(data.error || 'เปลี่ยนสิทธิ์ไม่สำเร็จ');
            showToast(`อัปเดตสิทธิ์ ${empId} เป็น ${newRole} สำเร็จ`);
            loadUsersList();
          } catch (err) {
            showToast(err.message, 'alert-circle');
            loadUsersList();
          }
        });
      });

      // User delete listeners
      document.querySelectorAll('.btnDeleteUser').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const empId = e.currentTarget.getAttribute('data-emp-id');
          if (confirm(`คุณต้องการลบผู้ใช้ "${empId}" หรือไม่?`)) {
            try {
              const delRes = await fetch(`/api/users/${encodeURIComponent(empId)}`, {
                method: 'DELETE',
                headers: { 'x-user-id': state.currentUser.employeeId }
              });
              const data = await delRes.json();
              if (!delRes.ok) throw new Error(data.error || 'ลบผู้ใช้ไม่สำเร็จ');
              showToast(`ลบผู้ใช้ ${empId} สำเร็จ`);
              loadUsersList();
            } catch (err) {
              showToast(err.message, 'alert-circle');
            }
          }
        });
      });

    } catch (err) {
      showToast(err.message, 'alert-circle');
    }
  }

  // -------------------------------------------------------------
  // 9. Audit Trail Modal (Admin Only)
  // -------------------------------------------------------------
  btnOpenAuditLog.addEventListener('click', () => {
    auditModal.classList.add('active');
    loadAuditLogs();
  });

  btnCloseAudit.addEventListener('click', () => {
    auditModal.classList.remove('active');
  });

  btnRefreshAudit.addEventListener('click', () => loadAuditLogs());
  auditActionFilter.addEventListener('change', () => loadAuditLogs());
  let auditSearchTimer = null;
  auditSearchInput.addEventListener('input', () => {
    clearTimeout(auditSearchTimer);
    auditSearchTimer = setTimeout(() => loadAuditLogs(), 250);
  });

  async function loadAuditLogs() {
    try {
      const params = new URLSearchParams();
      if (auditActionFilter.value) params.append('action', auditActionFilter.value);
      if (auditSearchInput.value.trim()) params.append('search', auditSearchInput.value.trim());

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: { 'x-user-id': state.currentUser ? state.currentUser.employeeId : '' }
      });
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูล Audit Log ได้');
      const logs = await res.json();

      auditTableBody.innerHTML = logs.map(l => {
        let actionClass = 'badge-action-update';
        if (l.action === 'CREATE') actionClass = 'badge-action-create';
        else if (l.action === 'DELETE') actionClass = 'badge-action-delete';
        else if (l.action === 'CLOSE_JOB') actionClass = 'badge-action-close';

        return `
          <tr>
            <td style="font-family: monospace; font-size: 0.76rem;">${escapeHtml(l.timestamp)}</td>
            <td><b style="font-family: monospace;">${escapeHtml(l.user_id)}</b></td>
            <td><span class="badge-action ${actionClass}">${escapeHtml(l.action)}</span></td>
            <td><span style="font-size: 0.76rem;">${escapeHtml(l.target_table)}:${escapeHtml(l.target_id)}</span></td>
            <td>
              ${l.old_values ? `<span class="json-bubble" title="${escapeHtml(l.old_values)}">${escapeHtml(l.old_values)}</span>` : '<span style="color:var(--apple-text-muted);">-</span>'}
            </td>
            <td>
              ${l.new_values ? `<span class="json-bubble" title="${escapeHtml(l.new_values)}">${escapeHtml(l.new_values)}</span>` : '<span style="color:var(--apple-text-muted);">-</span>'}
            </td>
            <td style="font-size: 0.74rem; color: var(--apple-text-secondary);">${escapeHtml(l.ip_address || '-')}</td>
          </tr>
        `;
      }).join('') || `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--apple-text-muted);">ไม่มีประวัติการบันทึก</td></tr>`;

      refreshIcons();

    } catch (err) {
      showToast(err.message, 'alert-circle');
    }
  }

  // -------------------------------------------------------------
  // 10. Barcode Test Modal Handlers
  // -------------------------------------------------------------
  if (btnOpenBarcodeModal) {
    btnOpenBarcodeModal.addEventListener('click', () => {
      barcodeModal.classList.add('active');
      renderBarcodeModalPresets();
      updateModalLiveBarcode();
    });
  }

  if (btnCloseBarcode) {
    btnCloseBarcode.addEventListener('click', () => {
      barcodeModal.classList.remove('active');
    });
  }

  function updateModalLiveBarcode() {
    if (!modalBarcodeInput || !modalBarcodePreview) return;
    const val = modalBarcodeInput.value.trim() || 'PO-SCAN-99';
    let barcodeSvg = '';
    let qrSvg = '';
    if (window.generateBarcodeSVG) {
      barcodeSvg = window.generateBarcodeSVG(val, { barWidth: 2, height: 68, fontSize: 13 });
    }
    if (window.generateQRCodeSVG) {
      qrSvg = window.generateQRCodeSVG(val, { size: 125, margin: 2, title: 'QR Code' });
    }
    modalBarcodePreview.innerHTML = `
      <div style="display:flex;gap:1.5rem;align-items:center;justify-content:center;flex-wrap:wrap;width:100%;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;">
          <span style="font-size:0.75rem;font-weight:600;color:var(--apple-text-secondary);">1D Barcode (Code 128)</span>
          ${barcodeSvg}
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;">
          <span style="font-size:0.75rem;font-weight:600;color:var(--apple-text-secondary);">2D QR Code</span>
          ${qrSvg}
        </div>
      </div>
    `;
  }

  if (modalBarcodeInput) {
    modalBarcodeInput.addEventListener('input', updateModalLiveBarcode);
  }

  if (btnSimulateCustomScan) {
    btnSimulateCustomScan.addEventListener('click', () => {
      const code = modalBarcodeInput.value.trim();
      if (!code) return;
      barcodeModal.classList.remove('active');
      window.handleScannedInput(code);
    });
  }

  function renderBarcodeModalPresets() {
    if (!modalPresetGrid) return;
    const presets = [
      {
        po: 'PO-SCAN-99',
        badge: '📥 รับเข้า',
        badgeClass: 'badge-inbound',
        status: '⏳ รอดำเนินการ (Pending)',
        statusClass: 'badge-alert-schedule',
        item: 'กล่องพัสดุลูกฟูก เบอร์ A (14x20x6 ซม.)',
        vendor: 'บจก. สยาม โลจิสติกส์ ซัพพลาย (120 กล่อง)',
        canClose: true
      },
      {
        po: 'PO-URGENT-99',
        badge: '📤 ส่งออก',
        badgeClass: 'badge-outbound',
        status: '🔴 ด่วนมาก (< 2 ชม.)',
        statusClass: 'badge-alert-urgent',
        item: 'เทป OPP ใส 2 นิ้ว x 45 หลา (300 ม้วน)',
        vendor: 'บมจ. ไทยอินดัสเทรียล พาร์ทส',
        canClose: true
      },
      {
        po: 'PO-2026-8801',
        badge: '📥 รับเข้า',
        badgeClass: 'badge-inbound',
        status: '⏳ รอดำเนินการ (Pending)',
        statusClass: 'badge-alert-schedule',
        item: 'พาเลทไม้มาตรฐาน (100x120 ซม.) (50 ตัว)',
        vendor: 'บจก. สยาม โลจิสติกส์ ซัพพลาย',
        canClose: true
      },
      {
        po: 'TEST0001',
        badge: '📥 รับเข้า',
        badgeClass: 'badge-inbound',
        status: '✅ เสร็จสิ้นแล้ว (Completed)',
        statusClass: 'badge-alert-completed',
        item: 'test1 (1 ชิ้น)',
        vendor: 'TEST1',
        canClose: false
      },
      {
        po: 'BOX-A-01',
        badge: 'SKU Code',
        badgeClass: 'badge-po',
        status: '📦 Master Item',
        statusClass: '',
        item: 'กล่องพัสดุลูกฟูก เบอร์ A (14x20x6 ซม.)',
        vendor: 'Default Unit: กล่อง',
        canClose: false
      },
      {
        po: 'TAPE-CLR-01',
        badge: 'SKU Code',
        badgeClass: 'badge-po',
        status: '📦 Master Item',
        statusClass: '',
        item: 'เทป OPP ใส 2 นิ้ว x 45 หลา',
        vendor: 'Default Unit: ม้วน',
        canClose: false
      }
    ];

    modalPresetGrid.innerHTML = presets.map((p) => {
      const barcodeSvg = window.generateBarcodeSVG ? window.generateBarcodeSVG(p.po, { barWidth: 1.6, height: 50, fontSize: 11 }) : '';
      const qrSvg = window.generateQRCodeSVG ? window.generateQRCodeSVG(p.po, { size: 85, margin: 1 }) : '';
      return `
        <div style="background:#ffffff;border:1px solid var(--apple-border);border-radius:12px;padding:1.15rem;display:flex;flex-direction:column;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;width:100%;margin-bottom:0.6rem;font-size:0.75rem;">
            <span class="apple-badge ${p.badgeClass}">${p.badge}</span>
            <span class="apple-badge ${p.statusClass}">${p.status}</span>
          </div>
          <div style="display:flex;gap:0.75rem;align-items:center;justify-content:center;width:100%;background:#ffffff;padding:0.5rem;border-radius:6px;border:1px dashed rgba(0,0,0,0.1);margin-bottom:0.65rem;">
            <div style="flex:1;display:flex;justify-content:center;">${barcodeSvg}</div>
            <div style="flex-shrink:0;">${qrSvg}</div>
          </div>
          <div style="width:100%;font-size:0.8rem;color:var(--apple-text-secondary);border-top:1px solid rgba(0,0,0,0.05);padding-top:0.65rem;text-align:left;">
            <div><b style="color:var(--apple-text-primary);">${escapeHtml(p.item)}</b></div>
            <div style="font-size:0.75rem;">${escapeHtml(p.vendor)}</div>
          </div>
          <div style="display:flex;gap:0.4rem;width:100%;margin-top:0.75rem;">
            <button type="button" class="btnSimScanCard apple-btn apple-btn-secondary" data-po="${escapeHtml(p.po)}" style="flex:1;padding:0.4rem 0.6rem;font-size:0.78rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:0.3rem;">
              <i data-lucide="zap" style="width:13px;height:13px;color:var(--apple-blue);"></i>
              <span>⚡ จำลองยิง</span>
            </button>
            <button type="button" class="btnCopyPoCard apple-btn" data-po="${escapeHtml(p.po)}" style="padding:0.4rem 0.75rem;font-size:0.78rem;background:var(--apple-bg);border:1px solid var(--apple-border);">
              <span>คัดลอก</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    refreshIcons();

    // Wire up card buttons
    modalPresetGrid.querySelectorAll('.btnSimScanCard').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const po = e.currentTarget.getAttribute('data-po');
        barcodeModal.classList.remove('active');
        window.handleScannedInput(po);
      });
    });

    modalPresetGrid.querySelectorAll('.btnCopyPoCard').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const po = e.currentTarget.getAttribute('data-po');
        navigator.clipboard.writeText(po).then(() => {
          showToast(`คัดลอก "${po}" เรียบร้อยแล้ว`);
        }).catch(() => {
          showToast(`PO: ${po}`);
        });
      });
    });
  }

  // -------------------------------------------------------------
  // Camera Barcode & QR Code Scanner Engine
  // -------------------------------------------------------------
  const cameraScannerModal = document.getElementById('cameraScannerModal');
  const btnOpenCameraScan = document.getElementById('btnOpenCameraScan');
  const btnPoCameraScan = document.getElementById('btnPoCameraScan');
  const btnCloseCamera = document.getElementById('btnCloseCamera');
  const btnSwitchCamera = document.getElementById('btnSwitchCamera');
  const cameraVideo = document.getElementById('cameraVideo');
  const cameraStatusText = document.getElementById('cameraStatusText');

  let cameraStream = null;
  let currentCameraFacing = 'environment';
  let cameraDetectTimer = null;
  let barcodeDetector = null;

  if ('BarcodeDetector' in window) {
    try {
      barcodeDetector = new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'ean_13', 'data_matrix', 'code_39']
      });
    } catch {}
  }

  async function startCameraScanner() {
    if (!cameraScannerModal) return;
    cameraScannerModal.classList.add('active');
    if (cameraStatusText) cameraStatusText.textContent = 'กำลังเปิดกล้อง...';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (cameraStatusText) cameraStatusText.textContent = 'เบราว์เซอร์ไม่รองรับการเปิดกล้องโดยตรง';
      showToast('เบราว์เซอร์ไม่อนุญาตให้เข้าถึงกล้อง กรุณาใช้เครื่องสแกนบาร์โค้ด', 'alert-circle');
      return;
    }

    try {
      stopCameraScanner(false);
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: currentCameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      if (cameraVideo) {
        cameraVideo.srcObject = cameraStream;
        await cameraVideo.play();
        if (cameraStatusText) cameraStatusText.textContent = 'กล้องพร้อมทำงาน • นำ QR หรือบาร์โค้ดมาส่องในกรอบ';
        startDetectingFrames();
      }
    } catch (err) {
      console.warn('Camera error:', err);
      if (cameraStatusText) cameraStatusText.textContent = 'ไม่สามารถเข้าถึงกล้องได้: ' + (err.message || 'Permission denied');
      showToast('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งานกล้อง', 'alert-circle');
    }
  }

  function stopCameraScanner(closeModal = true) {
    cancelAnimationFrame(cameraDetectTimer);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    if (cameraVideo) {
      cameraVideo.srcObject = null;
    }
    if (closeModal && cameraScannerModal) {
      cameraScannerModal.classList.remove('active');
    }
  }

  async function startDetectingFrames() {
    if (!cameraVideo || !cameraStream) return;

    if (barcodeDetector) {
      const detect = async () => {
        if (!cameraStream) return;
        try {
          if (cameraVideo.readyState === cameraVideo.HAVE_ENOUGH_DATA) {
            const barcodes = await barcodeDetector.detect(cameraVideo);
            if (barcodes && barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              if (detected) {
                stopCameraScanner(true);
                window.handleScannedInput(detected);
                return;
              }
            }
          }
        } catch {}
        cameraDetectTimer = requestAnimationFrame(detect);
      };
      cameraDetectTimer = requestAnimationFrame(detect);
    } else {
      if (cameraStatusText) {
        cameraStatusText.textContent = 'กล้องทำงานแล้ว (พร้อมยิงสแกนจากกล้องหรือเครื่องสแกน)';
      }
    }
  }

  if (btnOpenCameraScan) btnOpenCameraScan.addEventListener('click', startCameraScanner);
  if (btnPoCameraScan) btnPoCameraScan.addEventListener('click', startCameraScanner);
  if (btnCloseCamera) btnCloseCamera.addEventListener('click', () => stopCameraScanner(true));
  if (btnSwitchCamera) {
    btnSwitchCamera.addEventListener('click', () => {
      currentCameraFacing = currentCameraFacing === 'environment' ? 'user' : 'environment';
      startCameraScanner();
    });
  }

  // -------------------------------------------------------------
  // 11. Form Submit & Quick Presets
  // -------------------------------------------------------------
  function fillCurrentDateTime(showNotice = false) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    inputDate.value = `${yyyy}-${mm}-${dd}`;

    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    inputTime.value = `${hh}:${min}`;

    const pickupDefault = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    inputPickupDate.value = `${pickupDefault.getFullYear()}-${String(pickupDefault.getMonth() + 1).padStart(2, '0')}-${String(pickupDefault.getDate()).padStart(2, '0')}`;
    inputPickupTime.value = `${String(pickupDefault.getHours()).padStart(2, '0')}:${String(pickupDefault.getMinutes()).padStart(2, '0')}`;

    if (showNotice) {
      showToast('กรอกวันที่และเวลาปัจจุบันเรียบร้อยแล้ว', 'zap');
    }
  }

  btnFillToday.addEventListener('click', () => fillCurrentDateTime(true));

  // Presets for pickup due
  document.querySelectorAll('.btnPickupPreset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const hours = parseInt(e.currentTarget.getAttribute('data-hours'), 10);
      const base = new Date();
      base.setTime(base.getTime() + hours * 60 * 60 * 1000);

      const yyyy = base.getFullYear();
      const mm = String(base.getMonth() + 1).padStart(2, '0');
      const dd = String(base.getDate()).padStart(2, '0');
      const hh = String(base.getHours()).padStart(2, '0');
      const min = String(base.getMinutes()).padStart(2, '0');

      inputPickupDate.value = `${yyyy}-${mm}-${dd}`;
      inputPickupTime.value = `${hh}:${min}`;
      showToast(`ตั้งเวลานัดรับของ: +${hours} ชั่วโมงเรียบร้อย`, 'clock');
    });
  });

  // Unit quick chips
  document.querySelectorAll('.unit-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      inputUnit.value = e.currentTarget.getAttribute('data-unit');
      inputUnit.focus();
    });
  });

  // Transaction Type Segmented Control Helper
  function setTransactionType(type) {
    if (!type) return;
    state.selectedType = type;
    typeSegmentedControl.querySelectorAll('.apple-segmented-btn').forEach(b => {
      if (b.getAttribute('data-type') === type) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // Segmented control (รับเข้า / ส่งออก)
  typeSegmentedControl.querySelectorAll('.apple-segmented-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      setTransactionType(e.currentTarget.getAttribute('data-type'));
    });
  });

  // Record Form Submit
  recordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!state.currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนบันทึกรายการ', 'alert-circle');
      openAuthModal();
      return;
    }

    const poNumber = inputPoNumber.value.trim();
    const vendor = inputVendor.value.trim();
    const itemName = inputItemName.value.trim();
    const quantity = parseFloat(inputQuantity.value);
    const unit = inputUnit.value.trim();
    const date = inputDate.value.trim();
    const time = inputTime.value.trim();
    const pickupDate = inputPickupDate.value.trim();
    const pickupTime = inputPickupTime.value.trim();

    if (!vendor || !itemName || isNaN(quantity) || !unit || !date || !time) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'alert-circle');
      return;
    }

    const payload = {
      poNumber,
      type: state.selectedType,
      vendor,
      itemName,
      quantity,
      unit,
      date,
      time,
      pickupDate,
      pickupTime
    };

    try {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span>กำลังบันทึก...</span>`;

      const res = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': state.currentUser.employeeId
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i data-lucide="plus-circle" style="width: 17px; height: 17px;"></i> <span>บันทึกลงฐานข้อมูล</span>`;

      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');

      showToast(`บันทึก ${state.selectedType} PO: ${poNumber || '-'} ลงฐานข้อมูลและ AuditLog เรียบร้อย!`);

      // Reset form but keep dates
      inputPoNumber.value = '';
      inputItemName.value = '';
      inputQuantity.value = '';
      fillCurrentDateTime(false);
      inputPoNumber.focus();

      loadRecords();

    } catch (err) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i data-lucide="plus-circle" style="width: 17px; height: 17px;"></i> <span>บันทึกลงฐานข้อมูล</span>`;
      showToast(err.message, 'alert-circle');
    }
  });

  // Live auto-correction: converts Thai Kedmanee characters to English
  function attachThaiToEnglishAutoConvert(inputEl, label = '') {
    if (!inputEl) return;
    inputEl.addEventListener('input', () => {
      if (window.convertThaiKedmaneeToEnglish) {
        const orig = inputEl.value;
        const converted = window.convertThaiKedmaneeToEnglish(orig);
        if (converted !== orig) {
          const start = inputEl.selectionStart;
          const end = inputEl.selectionEnd;
          inputEl.value = converted;
          if (typeof start === 'number') {
            inputEl.setSelectionRange(start, end);
          }
          if (label) {
            showToast(`🌐 สลับภาษา ${label} เป็นอังกฤษอัตโนมัติ: ${converted}`, 'zap');
          }
        }
      }
    });
  }

  // Attach auto-conversion to all PO/Barcode input fields
  attachThaiToEnglishAutoConvert(inputPoNumber, 'เลข PO');
  attachThaiToEnglishAutoConvert(editPoNumber, 'เลข PO');
  attachThaiToEnglishAutoConvert(modalBarcodeInput, 'บาร์โค้ด');

  // Smart paste conversion on all form inputs
  [inputVendor, inputItemName, inputUnit, editVendor, editItemName, editUnit].forEach(el => {
    if (!el) return;
    el.addEventListener('paste', (e) => {
      const pasteText = (e.clipboardData || window.clipboardData).getData('text');
      if (pasteText && (pasteText.startsWith('ญฯข') || pasteText.startsWith('ยนข') || pasteText.startsWith('ฑฎฉข'))) {
        e.preventDefault();
        const converted = window.convertThaiKedmaneeToEnglish ? window.convertThaiKedmaneeToEnglish(pasteText) : pasteText;
        window.handleScannedInput(converted);
      }
    });
  });

  // Search input live filtering with debounce & auto-translation
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    if (window.convertThaiKedmaneeToEnglish) {
      const orig = searchInput.value;
      const converted = window.convertThaiKedmaneeToEnglish(orig);
      if (converted !== orig) {
        const start = searchInput.selectionStart;
        const end = searchInput.selectionEnd;
        searchInput.value = converted;
        if (typeof start === 'number') {
          searchInput.setSelectionRange(start, end);
        }
        showToast(`🌐 สลับตัวอักษรไทยเป็นอังกฤษอัตโนมัติ: ${converted}`, 'zap');
      }
    }

    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.searchQuery = searchInput.value.trim();
      loadRecords();
    }, 250);
  });

  // Auto-refresh every 30 seconds
  setInterval(() => {
    loadRecords();
  }, 30000);

  // -------------------------------------------------------------
  // Universal Modal Maximize / Fullscreen Toggle
  // -------------------------------------------------------------
  document.querySelectorAll('.modal-maximize-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.apple-modal-card');
      const overlay = btn.closest('.apple-modal-overlay');
      if (!card || !overlay) return;

      const isMax = card.classList.toggle('is-fullscreen');
      overlay.classList.toggle('has-fullscreen', isMax);

      btn.innerHTML = isMax
        ? `<i data-lucide="minimize-2" style="width: 15px; height: 15px;"></i>`
        : `<i data-lucide="maximize-2" style="width: 15px; height: 15px;"></i>`;
      btn.title = isMax ? 'ย่อขนาดกลับ' : 'ขยายเต็มจอ (Fullscreen)';
      refreshIcons();
    });
  });

  // Double click modal header to maximize/restore (native OS desktop behavior)
  document.querySelectorAll('.modal-header').forEach(header => {
    header.addEventListener('dblclick', (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('select')) return;
      const maxBtn = header.querySelector('.modal-maximize-btn');
      if (maxBtn) {
        maxBtn.click();
      }
    });
  });

  // Initialize
  refreshIcons();
  fillCurrentDateTime(false);
  checkAuth();
  loadMasterData();
  loadRecords();

  // Process URL search / scan parameter if opened with e.g. /?search=PO-SCAN-99 or /?scan=...
  const urlParams = new URLSearchParams(window.location.search);
  const initialScan = urlParams.get('scan') || urlParams.get('search');
  if (initialScan) {
    setTimeout(() => {
      window.handleScannedInput(initialScan);
    }, 400);
  }
});
