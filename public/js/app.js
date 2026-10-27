/**
 * Goods Tracker - Complete Client Application Logic
 * Authentication, Antigravity Particles, Smart 3-Tier Alert, and Signature Verification
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentUser: null,
    selectedType: 'รับเข้า',
    searchQuery: '',
    records: [],
    completingRecordId: null
  };

  // DOM Elements - Auth
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
  const btnLogout = document.getElementById('btnLogout');

  // DOM Elements - Form
  const typeSegmentedControl = document.getElementById('typeSegmentedControl');
  const recordForm = document.getElementById('recordForm');
  const inputPoNumber = document.getElementById('inputPoNumber');
  const inputVendor = document.getElementById('inputVendor');
  const inputItemName = document.getElementById('inputItemName');
  const inputQuantity = document.getElementById('inputQuantity');
  const inputUnit = document.getElementById('inputUnit');
  const inputDate = document.getElementById('inputDate');
  const inputTime = document.getElementById('inputTime');
  const inputPickupDate = document.getElementById('inputPickupDate');
  const inputPickupTime = document.getElementById('inputPickupTime');
  const btnFillToday = document.getElementById('btnFillToday');
  const btnSubmit = document.getElementById('btnSubmit');

  // Stats
  const statTotal = document.getElementById('statTotal');
  const statInbound = document.getElementById('statInbound');
  const statOutbound = document.getElementById('statOutbound');
  const statUrgent = document.getElementById('statUrgent');

  // Table & Search
  const searchInput = document.getElementById('searchInput');
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

  // Helper to re-render all icons (offline local + lucide fallback)
  function refreshIcons() {
    if (window.renderLocalIcons) {
      window.renderLocalIcons();
    } else if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (e) {}
    }
  }

  // -------------------------------------------------------------
  // Apple Toast Notification
  // -------------------------------------------------------------
  function showToast(message, icon = 'check-circle') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'apple-toast';
    toast.innerHTML = `
      <i data-lucide="${icon}" style="width: 17px; height: 17px; color: #34c759;"></i>
      <span>${message}</span>
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
  // Authentication (Login / Register / Session)
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
      userProfileBar.style.display = 'flex';
      userNameDisplay.textContent = `${state.currentUser.fullName} (${state.currentUser.employeeId})`;
      userAvatarText.textContent = (state.currentUser.fullName || 'U').charAt(0).toUpperCase();
    } else {
      userProfileBar.style.display = 'none';
    }
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
      showToast(`ยินดีต้อนรับคุณ ${data.user.fullName}!`, 'user-check');
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
  // Date & Time Auto-Fill Helpers
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

    // Default pickup time: +2 hours from now
    const pickupDefault = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    inputPickupDate.value = `${pickupDefault.getFullYear()}-${String(pickupDefault.getMonth() + 1).padStart(2, '0')}-${String(pickupDefault.getDate()).padStart(2, '0')}`;
    inputPickupTime.value = `${String(pickupDefault.getHours()).padStart(2, '0')}:${String(pickupDefault.getMinutes()).padStart(2, '0')}`;

    if (showNotice) {
      showToast('กรอกวันที่และเวลาปัจจุบันเรียบร้อยแล้ว', 'zap');
    }
  }

  btnFillToday.addEventListener('click', () => fillCurrentDateTime(true));

  // Pickup Due Presets (+2h, +24h, +3d)
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

  // Quick Unit Chips
  document.querySelectorAll('.unit-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      inputUnit.value = e.currentTarget.getAttribute('data-unit');
      inputUnit.focus();
    });
  });

  // Segmented Control (รับเข้า / ส่งออก)
  typeSegmentedControl.querySelectorAll('.apple-segmented-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      typeSegmentedControl.querySelectorAll('.apple-segmented-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      state.selectedType = target.getAttribute('data-type');
    });
  });

  // -------------------------------------------------------------
  // Data Fetching: Records & Stats
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

  // -------------------------------------------------------------
  // Smart 3-Tier Alert Engine & Thai Date Helpers
  // -------------------------------------------------------------
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

    // 1. DELAY (เวลาเลยกำหนดแล้ว)
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

    // 2. เตือนด่วนมาก (ก่อนถึง 2 ชั่วโมง)
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

    // 3. เตือนใกล้กำหนด (ก่อนถึง 24 ชั่วโมง)
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

    // 4. ปกติตามกำหนด
    const remainDays = Math.round(diffHours / 24);
    return {
      rowClass: '',
      badgeClass: 'badge-alert-schedule',
      icon: 'calendar',
      label: `🟢 ตามกำหนด (อีก ${remainDays} วัน)`,
      subtitle: `นัด: ${formatThaiDate(r.pickupDate)} ${r.pickupTime} น.`
    };
  }

  // -------------------------------------------------------------
  // Render Records Table (Fixed Centered Empty State)
  // -------------------------------------------------------------
  function renderRecords(records) {
    recordsCountText.textContent = `แสดง ${records.length} รายการ (จัดเก็บบนไฟล์ Excel)`;

    // Fixed: Clean centered empty state row inside tbody spanning all 9 columns
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
                ท่านสามารถกรอกแบบฟอร์มด้านบนเพื่อบันทึกรายการสินค้าใหม่ลงในไฟล์ Excel
              </div>
            </div>
          </td>
        </tr>
      `;
      refreshIcons();
      return;
    }

    recordsTableBody.innerHTML = records.map(r => {
      const isReceive = r.type === 'รับเข้า';
      const typeBadgeClass = isReceive ? 'badge-inbound' : 'badge-outbound';
      const typeIcon = isReceive ? 'arrow-down-left' : 'arrow-up-right';

      const alert = calculateAlertStatus(r);
      const poDisplay = r.poNumber ? `<span class="badge-po">${escapeHtml(r.poNumber)}</span>` : '<span style="color:var(--apple-text-muted);">—</span>';

      // Action button
      let actionBtn = '';
      if (r.status === 'completed') {
        actionBtn = `
          <div style="font-size:0.75rem; color:#059669; font-weight:600; text-align:center;">
            <i data-lucide="check" style="width:13px;height:13px;display:inline;"></i> เสร็จสิ้น
          </div>
        `;
      } else {
        actionBtn = `
          <button type="button" class="btn-action-complete btnOpenVerifySignature" data-id="${r.id}" data-po="${r.poNumber || '-'}" data-item="${escapeHtml(r.itemName)}">
            <i data-lucide="check-circle" style="width:13px;height:13px;"></i>
            <span>ปิดงาน</span>
          </button>
        `;
      }

      return `
        <tr class="${alert.rowClass}">
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
          <td style="text-align: center;">
            <button type="button" class="btn-delete-row" data-id="${r.id}" title="ลบรายการ">
              <i data-lucide="trash-2" style="width:15px;height:15px;"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    refreshIcons();

    // Attach Signature Verification Triggers
    document.querySelectorAll('.btnOpenVerifySignature').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!state.currentUser) {
          showToast('กรุณาเข้าสู่ระบบก่อนทำการปิดงาน', 'alert-circle');
          openAuthModal();
          return;
        }

        const id = e.currentTarget.getAttribute('data-id');
        const po = e.currentTarget.getAttribute('data-po');
        const item = e.currentTarget.getAttribute('data-item');

        state.completingRecordId = id;
        modalRecordId.value = id;
        modalPoNumber.textContent = po;
        modalItemName.textContent = item;
        modalExpectedUser.textContent = `${state.currentUser.fullName} (${state.currentUser.employeeId})`;

        inputSignatureName.value = '';
        signatureErrorMessage.style.display = 'none';
        confirmCompleteModal.classList.add('active');
        setTimeout(() => inputSignatureName.focus(), 150);
      });
    });

    // Attach Delete Handler
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('คุณต้องการลบรายการนี้ออกจากไฟล์ Excel หรือไม่?')) {
          try {
            const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'ลบไม่สำเร็จ');
            showToast('ลบรายการสำเร็จ');
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
  // Signature Verification Modal Submit
  // -------------------------------------------------------------
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

    // Client-side instant comparison
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
      showToast(`ตรวจชื่อผ่าน! ปิดงานโดยคุณ "${expectedName}" เรียบร้อย`, 'check-circle-2');
      loadRecords();

    } catch (err) {
      signatureErrorMessage.textContent = `❌ ${err.message}`;
      signatureErrorMessage.style.display = 'block';
    }
  });

  // -------------------------------------------------------------
  // Form Submit: Add New Record
  // -------------------------------------------------------------
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
      btnSubmit.innerHTML = `<span>กำลังบันทึกลง Excel...</span>`;

      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i data-lucide="plus-circle" style="width: 17px; height: 17px;"></i> <span>บันทึกลง Excel</span>`;

      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');

      showToast(`บันทึก ${state.selectedType} PO: ${poNumber || '-'} ลง Excel เรียบร้อย!`);

      // Reset form but keep current dates
      inputPoNumber.value = '';
      inputItemName.value = '';
      inputQuantity.value = '';
      fillCurrentDateTime(false);
      inputPoNumber.focus();

      loadRecords();

    } catch (err) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i data-lucide="plus-circle" style="width: 17px; height: 17px;"></i> <span>บันทึกลง Excel</span>`;
      showToast(err.message, 'alert-circle');
    }
  });

  // Search input with debounce
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.searchQuery = searchInput.value.trim();
      loadRecords();
    }, 250);
  });

  // Auto-refresh alerts every 30 seconds
  setInterval(() => {
    loadRecords();
  }, 30000);

  // Initialize
  refreshIcons();
  fillCurrentDateTime(false);
  checkAuth();
  loadRecords();
});
