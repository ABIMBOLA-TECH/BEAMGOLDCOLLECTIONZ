// ========== GLOBAL STATE ==========
let currentFilteredProducts = [];
let currentPage = 1;
const itemsPerPage = 10;
let cart = [];
let isLoggedIn = false;

// ========== TOASTS ==========
function playToastSound(type) {
  const audio = document.getElementById(`toastSound-${type}`);
  if (audio) audio.play();
}

function showToast(message, type = 'success') {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const colors = { success: "#28a745", error: "#dc3545", info: "#17a2b8" };

  Toastify({
    text: `${icons[type] || ''} ${message}`,
    duration: 3000,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    className: `toast-${type}`,
    style: {
      background: colors[type] || "#28a745",
      color: "#fff",
      borderRadius: "6px",
      padding: "12px 20px",
      fontSize: "14px"
    }
  }).showToast();

  playToastSound(type);
}

// ========== AUTH SIDEBAR CONTROLS ==========
function signIn() { document.getElementById('signinSidebar').classList.add('active'); }
function signUp() { document.getElementById('signupSidebar').classList.add('active'); }
function closeSidebar(id) { document.getElementById(id).classList.remove('active'); }
function switchToSignup() { closeSidebar('signinSidebar'); signUp(); }
function switchToSignin() { closeSidebar('signupSidebar'); signIn(); }
function switchToSigninFromForgot() { closeSidebar('forgotPasswordSidebar'); signIn(); }
function forgotPassword() { closeSidebar('signinSidebar'); document.getElementById('forgotPasswordSidebar').classList.add('active'); }

// ========== PASSWORD TOGGLE ==========
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ========== MOVING INFORMATIONS ==========
document.addEventListener("DOMContentLoaded", () => {
  const ticker = document.getElementById('ticker');
  if (ticker) {
    ticker.addEventListener('mouseenter', () => ticker.style.animationPlayState = 'paused');
    ticker.addEventListener('mouseleave', () => ticker.style.animationPlayState = 'running');
  }
// ========== LANDING PAGE CAROUSEL ==========
  let currentSlide = 0;
  const slides = document.querySelectorAll('.carousel-slide');
  if (slides.length > 0) {
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 3000);
  }

  // ========== USER LOGIN ==========
  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('signinEmail').value.trim();
      const password = document.getElementById('signinPassword').value;

      fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      .then(res => res.json())
      .then(data => {
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.user.name);
          localStorage.setItem('is_admin', data.user.is_admin ? '1' : '0');
          updateAccountDropdown();
          closeSidebar('signinSidebar');
          showToast("Login successful, Enjoy!", "success");
        } else {
          showToast('Invalid credentials, Login Failed', "error");
        }
      })
      .catch(err => {
        console.error('Login error:', err);
        showToast("Something went wrong. Please try again.", "error");
      });
    });
  }

  // ========== ACCOUNT DROPDOWN INIT ==========
  const label = document.getElementById('accountLabel');
  const menu = document.getElementById('accountMenu');
  if (label && menu) {
    label.addEventListener('click', function (e) {
      e.preventDefault();
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function (e) {
      const dropdown = document.getElementById('account-dropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
  }

  updateAccountDropdown();

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const isAdmin = localStorage.getItem('is_admin') === '1';
  if (token && username) {
    updateAccountDropdown();
  }

  // ========== USER REGISTRATION ==========
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = document.getElementById('registerBtn');
      btn.querySelector('.btn-text').style.display = 'none';
      btn.querySelector('.btn-loader').style.display = 'inline';

      const data = {
        name: `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`,
        email: document.getElementById('signupEmail').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        password: document.getElementById('signupPassword').value,
        password_confirmation: document.getElementById('signupPasswordConfirmation').value
      };

      fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(response => {
        btn.querySelector('.btn-text').style.display = 'inline';
        btn.querySelector('.btn-loader').style.display = 'none';

        if (response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('username', response.user.name);
          localStorage.setItem('is_admin', '0');
          closeSidebar('signupSidebar');
          showToast("Registration successful!", "success");
        } else {
          showToast(response.message || "Registration failed", "error");
        }
      })
      .catch(err => {
        console.error('Registration error:', err);
        btn.querySelector('.btn-text').style.display = 'inline';
        btn.querySelector('.btn-loader').style.display = 'none';
        showToast("Something went wrong. Please try again.", "error");
      });
    });
  }

  // ✅ NEW: Load products on page load
  fetchAllProducts();
});
// FIRST-BATCH



// ========== ACCOUNT DROPDOWN ==========
function updateAccountDropdown() {
  const username = localStorage.getItem('username');
  const isAdmin = localStorage.getItem('is_admin') === '1';

  const label = document.getElementById('accountLabel');
  const guestItems = document.querySelectorAll('.guest-only');
  const userItems = document.querySelectorAll('.user-only');
  const adminItems = document.querySelectorAll('.admin-only');

  if (!username) {
    label.textContent = '👤 Account ▾';
    guestItems.forEach(el => el.style.display = 'block');
    userItems.forEach(el => el.style.display = 'none');
    adminItems.forEach(el => el.style.display = 'none');
  } else if (isAdmin) {
    label.textContent = '👤 Welcome Admin ▾';
    guestItems.forEach(el => el.style.display = 'none');
    userItems.forEach(el => el.style.display = 'none');
    adminItems.forEach(el => el.style.display = 'block');
  } else {
    label.textContent = `👤 Welcome ${username} ▾`;
    guestItems.forEach(el => el.style.display = 'none');
    userItems.forEach(el => el.style.display = 'block');
    adminItems.forEach(el => el.style.display = 'none');
  }
}

// ========== LOGOUT ==========
function logout() {
  const token = localStorage.getItem('token');

  fetch('http://127.0.0.1:8000/api/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }).finally(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('is_admin');

    const userDashboard = document.getElementById('dashboardWrapper');
    const adminDashboard = document.getElementById('adminDashboardWrapper');
    if (userDashboard) userDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';

    const menu = document.getElementById('accountMenu');
    if (menu) menu.style.display = 'none';

    updateAccountDropdown();
    showToast("Logged out successfully", "info");
  });
}

// ========== DASHBOARD ACCESS ==========
function openDashboard(sectionId) {
  const isAdmin = localStorage.getItem('is_admin') === '1';
  const username = localStorage.getItem('username');
  const adminSections = ['users', 'orders1', 'wallets', 'products'];

  if (!isAdmin && adminSections.includes(sectionId)) {
    showToast("Access denied: Admins only", "error");
    return;
  }

  if (isAdmin) {
    document.getElementById('adminDashboardWrapper').style.display = 'block';
    document.getElementById('dashboardWrapper').style.display = 'none';
    document.getElementById('adminName').textContent = username;
    loadAdminSection(sectionId || 'users');
  } else {
    document.getElementById('dashboardWrapper').style.display = 'block';
    document.getElementById('adminDashboardWrapper').style.display = 'none';
    document.getElementById('dashboardUserName').textContent = username;
    showSection(sectionId || 'profile');
  }
}

function closeDashboard() {
  const userDashboard = document.getElementById('dashboardWrapper');
  const adminDashboard = document.getElementById('adminDashboardWrapper');
  if (userDashboard) userDashboard.style.display = 'none';
  if (adminDashboard) adminDashboard.style.display = 'none';
}

// ========== ADMIN DASHBOARD INIT ==========
function loadAdminDashboard() {
  const username = localStorage.getItem('username');
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = username;
  loadAdminSection('users');
}

// ========== LOAD ADMIN SECTION ==========
function loadAdminSection(section) {
  const token = localStorage.getItem('token');
  const content = document.getElementById('adminSectionContent');
  if (!content) return;

  content.innerHTML = `
    <div class="spinner-wrapper">
      <div class="spinner-icon"></div>
      <p>Loading ${section}...</p>
    </div>
  `;

  let endpoint = '';
  switch (section) {
    case 'users': endpoint = '/api/admin/users'; break;
    case 'orders': endpoint = '/api/admin/orders'; break;
    case 'wallets': endpoint = '/api/admin/wallets'; break;
    case 'products': endpoint = '/api/admin/products'; break;
    default:
      content.innerHTML = 'Invalid section';
      return;
  }

  fetch(`http://127.0.0.1:8000${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.status === 401 ? logout() : res.json())
  .then(data => {
    renderAdminSection(section, data);
  })
  .catch(err => {
    console.error('Admin fetch error:', err);
    content.innerHTML = 'Error loading data, pls wait.';
  });
}

// SECOND - BATCH



// ========== RENDER EMPTY ROW ==========
function renderEmptyRow(colspan, message = 'No data found') {
  return `<tr><td colspan="${colspan}" style="text-align:center;">${message}</td></tr>`;
}

// ========== RENDER ADMIN SECTION ==========
function renderAdminSection(section, data) {
  const content = document.getElementById('adminSectionContent');
  if (!content) return;

  let html = '';
  switch (section) {
    case 'products':
      html = `
        <h2>🛍️ Product Management</h2>
        <form id="createProductForm" class="product-form" enctype="multipart/form-data">
          <h3>Create Product</h3>
          <input type="text" name="name" placeholder="Product Name" required />
          <input type="number" name="price" placeholder="Price" required />
          <input type="number" name="stock" placeholder="Stock Quantity" required />
          <select name="main" required>
            <option value="">Select Main Category</option>
            <option value="wholesale">Wholesales</option>
            <option value="retail">Retails</option>
          </select>
          <select name="category" required>
            <option value="">Select Subcategory</option>
            <option value="unisex">Unisex</option>
            <option value="ladieswear">Ladieswear</option>
            <option value="slides">Slides/Sneakers</option>
            <option value="accessories">Accessories</option>
            <option value="boxers">Boxer/Singlet</option>
            <option value="kidwears">Kidwears</option>
          </select>
          <input type="file" name="image" accept="image/*" required />
          <button type="submit">Create Product</button>
        </form>
        <table id="productTable">
          <thead>
            <tr>
              <th>S/N</th><th>Name</th><th>Price</th><th>Stock</th>
              <th>Main</th><th>Category</th><th>Image</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.length > 0 ? data.map((product, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${product.name}</td>
                <td>₦${product.price}</td>
                <td>${product.stock}</td>
                <td>${product.main}</td>
                <td>${product.category}</td>
                <td><img src="http://127.0.0.1:8000/storage/products/${product.image}" width="50" onclick="previewImage('http://127.0.0.1:8000/storage/products/${product.image}')" /></td>
                <td>
                  <button class="edit-btn" onclick="editProduct(${product.id})">✏️ Edit</button>
                  <button class="delete-btn" onclick="deleteProduct(${product.id})">🗑️ Delete</button>
                </td>
              </tr>
            `).join('') : renderEmptyRow(8)}
          </tbody>
        </table>
      `;
      content.innerHTML = html;

      const form = document.getElementById('createProductForm');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          const formData = new FormData(form);
          const token = localStorage.getItem('token');

          fetch('http://127.0.0.1:8000/api/admin/products', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          })
          .then(res => {
            if (!res.ok) throw new Error('Failed to create product');
            return res.json();
          })
          .then(product => {
            showToast('✅ Product created successfully!', 'success');
            form.reset();
            loadAdminSection('products');
          })
          .catch(err => {
            console.error('Create error:', err);
            showToast('❌ Failed to create product', 'error');
          });
        });
      }
      break;
    case 'users':
      html = `
        <h3>👥 All Users</h3>
        <input type="text" class="admininputsearch" id="userSearchInput" placeholder="🔍 Search by name..." oninput="filterUsers()" />
        <button class="adminsearch" onclick="exportTableToCSV('users.csv', 'userTable')">📤 Export Users</button>
        <table id="userTable">
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
          <tbody>
            ${data.length > 0 ? data.map(user => `
              <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('') : renderEmptyRow(4)}
          </tbody>
        </table>
      `;
      content.innerHTML = html;
      break;

    case 'orders':
      html = `
        <h3>📦 All Orders</h3>
        <label for="orderStatusFilter">Filter by Status:</label>
        <select id="orderStatusFilter" onchange="filterOrders()">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button class="adminsearch" onclick="exportTableToCSV('orders.csv', 'orderTable')">📤 Export Orders</button>
        <table id="orderTable">
          <thead><tr><th>ID</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
          <tbody>
            ${data.length > 0 ? data.map(order => `
              <tr>
                <td>${order.id}</td>
                <td>${order.status}</td>
                <td>₦${order.total}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('') : renderEmptyRow(4)}
          </tbody>
        </table>
      `;
      content.innerHTML = html;
      break;

    case 'wallets':
      html = `
        <h3>💰 Wallets</h3>
        <input type="text" id="walletSearchInput" placeholder="🔍 Search by User ID..." />
        <button class="adminsearch" onclick="filterWallets()">Search</button>
        <button class="adminsearch" onclick="exportTableToCSV('wallets.csv', 'walletTable')">📤 Export Wallets</button>
        <table id="walletTable">
          <thead><tr><th>User</th><th>Balance</th><th>Last Updated</th></tr></thead>
          <tbody>
            ${data.length > 0 ? data.map(wallet => `
              <tr>
                <td>${wallet.user?.name || 'Unknown'}</td>
                <td>₦${wallet.balance}</td>
                <td>${new Date(wallet.updated_at).toLocaleDateString()}</td>
              </tr>
            `).join('') : renderEmptyRow(3)}
          </tbody>
        </table>
      `;
      content.innerHTML = html;
      break;
  }
}
// ======function for add new products========
function addProductToTable(product) {
  const tbody = document.querySelector('#productTable tbody');
  if (!tbody) return;

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${product.name}</td>
    <td>₦${product.price}</td>
    <td>${product.stock}</td>
    <td>${product.main} / ${product.category}</td>
    <td><img src="http://127.0.0.1:8000/storage/products/${product.image}" width="50" onclick="previewImage('http://127.0.0.1:8000/storage/products/${product.image}')" /></td>
    <td>
      <button class="edit-btn" onclick="editProduct(${product.id})">✏️ Edit</button>
      <button class="delete-btn" onclick="deleteProduct(${product.id})">🗑️ Delete</button>
    </td>
  `;
  tbody.prepend(row);
}
// ========== PREVIEW IMAGE ==========
function previewImage(src) {
  const modal = document.getElementById('imagePreviewModal');
  const img = document.getElementById('previewedImage');
  if (img && modal) {
    img.src = src;
    modal.style.display = 'flex';
  }
}

function closeImagePreview() {
  const modal = document.getElementById('imagePreviewModal');
  if (modal) modal.style.display = 'none';
}

// ========== EDIT PRODUCT ==========
function editProduct(id) {
  const token = localStorage.getItem('token');

  fetch(`http://127.0.0.1:8000/api/admin/products/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(product => {
    renderEditProductForm(product);
  })
  .catch(err => {
    console.error('Failed to fetch product for editing:', err);
    showToast('❌ Unable to load product details.', 'error');
  });
}

// ========== RENDER EDIT PRODUCT FORM ==========
function renderEditProductForm(product = {}) {
  const container = document.getElementById('adminSectionContent');
  if (!container) return;

  container.innerHTML = `
    <form id="editProductForm" enctype="multipart/form-data">
      <input type="hidden" name="id" value="${product.id || ''}" />
      <input type="text" name="name" placeholder="Product Name" value="${product.name || ''}" required />
      <input type="number" name="price" placeholder="Price" value="${product.price || ''}" required />
      <input type="number" name="stock" placeholder="Stock Quantity" value="${product.stock || ''}" required />
      <select name="main" required>
        <option value="">Select Main Category</option>
        <option value="wholesale" ${product.main === 'wholesale' ? 'selected' : ''}>Wholesales</option>
        <option value="retail" ${product.main === 'retail' ? 'selected' : ''}>Retails</option>
      </select>
      <select name="category" required>
        <option value="">Select Subcategory</option>
        <option value="unisex" ${product.category === 'unisex' ? 'selected' : ''}>Unisex</option>
        <option value="ladieswear" ${product.category === 'ladieswear' ? 'selected' : ''}>Ladieswear</option>
        <option value="slides" ${product.category === 'slides' ? 'selected' : ''}>Slides/Sneakers</option>
        <option value="accessories" ${product.category === 'accessories' ? 'selected' : ''}>Accessories</option>
        <option value="boxers" ${product.category === 'boxers' ? 'selected' : ''}>Boxer/Singlet</option>
        <option value="kidwears" ${product.category === 'kidwears' ? 'selected' : ''}>Kidwears</option>
      </select>
      <input type="file" name="image" accept="image/*" />
      <button type="submit">Update Product</button>
    </form>
  `;

  setTimeout(() => {
    const form = document.getElementById('editProductForm');
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        updateProduct(form);
      };
    }
  }, 0);
}

// ========== UPDATE PRODUCT ==========
function updateProduct(form) {
  const id = form.elements['id'].value;
  const formData = new FormData(form);
  const token = localStorage.getItem('token');

  fetch(`http://127.0.0.1:8000/api/admin/products/${id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-HTTP-Method-Override': 'PUT'
    },
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  })
  .then(updated => {
    showToast('✅ Product updated!', 'success');
    form.reset();
    loadAdminSection('products');
  })
  .catch(err => {
    console.error('❌ Update error:', err);
    showToast('❌ Failed to update product', 'error');
  });
}

// THIRD - BATCH


// ========== EXPORT TABLE TO CSV ==========
function exportTableToCSV(filename, tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = Array.from(table.querySelectorAll('tr'));
  const csv = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('th, td'));
    return cells.map(cell => `"${cell.textContent.trim()}"`).join(',');
  }).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// ========== FILTERING ==========
function filterUsers() {
  const input = document.getElementById('userSearchInput').value.toLowerCase();
  const tableBody = document.querySelector('#userTable tbody');
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  const matching = [];
  const others = [];

  rows.forEach(row => {
    const name = row.cells[1].textContent.toLowerCase();
    if (name.includes(input)) {
      matching.push(row);
    } else {
      others.push(row);
    }
  });

  tableBody.innerHTML = '';
  [...matching, ...others].forEach(row => tableBody.appendChild(row));
}
function filterOrders() {
  const token = localStorage.getItem('token');
  const status = document.getElementById('orderStatusFilter').value;
  let url = 'http://127.0.0.1:8000/api/admin/orders';
  if (status) url += `?status=${status}`;

  fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.status === 401 ? logout() : res.json())
    .then(data => {
      renderAdminSection('orders', data);
    })
    .catch(err => {
      console.error('Order filter error:', err);
      document.getElementById('adminSectionContent').innerHTML = 'Error loading orders.';
    });
}
function filterWallets() {
  const token = localStorage.getItem('token');
  const userId = document.getElementById('walletSearchInput').value;
  let url = 'http://127.0.0.1:8000/api/admin/wallets';
  if (userId) url += `?user_id=${userId}`;

  fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.status === 401 ? logout() : res.json())
    .then(data => {
      renderAdminSection('wallets', data);
    })
    .catch(err => {
      console.error('Wallet fetch error:', err);
      document.getElementById('adminSectionContent').innerHTML = 'Error loading wallets.';
    });
}

function filterProducts() {
  const token = localStorage.getItem('token');
  const name = document.getElementById('productSearchInput').value;
  let url = 'http://127.0.0.1:8000/api/admin/products';
  if (name) url += `?name=${encodeURIComponent(name)}`;

  fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.status === 401 ? logout() : res.json())
    .then(data => {
      renderAdminSection('products', data);
    })
    .catch(err => {
      console.error('Product fetch error:', err);
      document.getElementById('adminSectionContent').innerHTML = 'Error loading products.';
    });
}

// ========== USER DASHBOARD SECTIONS ==========
function showSection(sectionId) {

  console.log("Clicked:", sectionId); // ✅ Add this
  document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
  }
  if (sectionId === 'profile') loadUserProfile();
  if (sectionId === 'orders') loadOrders();
  if (sectionId === 'payment') loadWallet();
}

function loadUserProfile() {
  const token = localStorage.getItem('token');
  fetch('http://127.0.0.1:8000/api/user', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.status === 401 ? logout() : res.json())
    .then(user => {
      document.getElementById('profileName').value = user.name || '';
      document.getElementById('profileEmail').value = user.email || '';
      document.getElementById('profilePhone').value = user.phone || '';
      document.getElementById('profileAddress').value = user.address || '';
    });
}
function loadOrders() {
  const token = localStorage.getItem('token');
  fetch('http://127.0.0.1:8000/api/dashboard/orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.status === 401 ? logout() : res.json())
    .then(orders => {
      window.allOrders = orders;
      renderOrders(orders);
    });
}
// 31------Rendering - Order---------
function renderOrders(orders) {
  const tbody = document.querySelector('#orders tbody');
  if (!tbody) return;

  tbody.innerHTML = orders.length ? orders.map(order => {
    const date = new Date(order.created_at).toLocaleDateString('en-NG');
    const total = `₦${Number(order.total || 0).toLocaleString()}`;
    const items = Array.isArray(order.items) ? order.items.length : 0;
    const status = order.status?.toLowerCase() || 'pending';
    return `
      <tr>
        <td>#${order.id}</td>
        <td>${date}</td>
        <td>${items} item${items !== 1 ? 's' : ''}</td>
        <td>${total}</td>
        <td><span class="status ${status}">${order.status}</span></td>
        <td><button onclick="viewOrder('${order.id}')">View</button></td>
      </tr>
    `;
  }).join('') : '<tr><td colspan="6">No orders found.</td></tr>';
}


// ========== VIEW-ORDER ==========
function viewOrder(orderId) {
  const token = localStorage.getItem('token');

  fetch(`http://127.0.0.1:8000/api/dashboard/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(order => {
    if (!order || !order.items) {
      showToast("Order not found", "error");
      return;
    }

    const modal = document.getElementById('orderDetailsModal');
    const content = document.getElementById('orderDetailsContent');

    if (!modal || !content) return;

    content.innerHTML = `
      <h3>Order #${order.id}</h3>
      <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Total:</strong> ₦${Number(order.total).toLocaleString()}</p>
      <h4>Items:</h4>
      <ul>
        ${order.items.map(item => `
          <li>
            ${item.qty} × ${item.product_name} @ ₦${item.price.toLocaleString()} = ₦${(item.qty * item.price).toLocaleString()}
          </li>
        `).join('')}
      </ul>
    `;

    modal.style.display = 'flex';
  })
  .catch(err => {
    console.error("Failed to load order:", err);
    showToast("Unable to load order details", "error");
  });
}



function loadWallet() {
  const token = localStorage.getItem('token');
  fetch('http://127.0.0.1:8000/api/wallet', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.status === 401 ? logout() : res.json())
  .then(data => {
    const balanceEl = document.getElementById('walletBalance');
    const tbody = document.getElementById('transactionList');

    if (balanceEl) {
      balanceEl.textContent = Number(data.balance || 0).toLocaleString();
    }

    if (tbody) {
      tbody.innerHTML = data.transactions?.length ? data.transactions.map(tx => `
        <tr>
          <td>${tx.reference}</td>
          <td>₦${Number(tx.amount).toLocaleString()}</td>
          <td>${tx.status}</td>
          <td>${tx.type}</td>
          <td>${new Date(tx.created_at).toLocaleDateString('en-NG')}</td>
        </tr>
      `).join('') : '<tr><td colspan="5">No transactions found.</td></tr>';
    }
  })
  .catch(err => {
    console.error('Wallet fetch error:', err);
    const tbody = document.getElementById('transactionList');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5">Error loading transactions.</td></tr>';
    }
  });
}

// ========== INACTIVITY LOGOUT ==========
let inactivityTimer;
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    logout();
    showToast("Session expired due to inactivity", "warning");
  }, 15 * 60 * 1000); // 15 minutes
}
['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, resetInactivityTimer);
});

// FOURTH - BATCH





// ========== DOM READY ==========
document.addEventListener("DOMContentLoaded", () => {
  // ====== DOM ELEMENTS ======
  const cartCountNavbar = document.getElementById('cart-count');
  const cartCountFallback = document.getElementById('cartCount');
  const searchInput = document.getElementById('globalSearchInput');
  const scrollBtn = document.getElementById('scrollToTop');
  const profileForm = document.getElementById('profileForm');
  const createForm = document.getElementById('createProductForm');
  const editForm = document.getElementById('editProductForm');

  // ====== INIT CART ======
  const token = localStorage.getItem('token');
  isLoggedIn = !!token;

  const savedCart = localStorage.getItem('cartData') || localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartSidebar();
  }

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountNavbar) {
    cartCountNavbar.textContent = totalItems;
    cartCountNavbar.style.display = totalItems > 0 ? 'inline-block' : 'none';
  }
  if (cartCountFallback) {
    cartCountFallback.textContent = cart.length;
  }

  // ====== Hide cart count by default ======
  if (cartCountNavbar) cartCountNavbar.style.display = 'none';

  // ====== Scroll to top button ======
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  //33 ====== User Profile Update from Userdashboard ======
  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = document.getElementById('updateProfileBtn');
      btn.querySelector('.btn-text').style.display = 'none';
      btn.querySelector('.btn-loader').style.display = 'inline';

      const data = {
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        address: document.getElementById('profileAddress').value.trim()
      };

      fetch('http://127.0.0.1:8000/api/dashboard/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(res => res.status === 401 ? logout() : res.json())
        .then(response => {
          btn.querySelector('.btn-text').style.display = 'inline';
          btn.querySelector('.btn-loader').style.display = 'none';

          if (response.name) {
            showToast("Profile updated successfully!", "success");
            localStorage.setItem('username', response.name);
            updateAccountDropdown();
          } else {
            showToast("Update failed. Please check your input.", "error");
          }
        })
        .catch(err => {
          console.error('Update error:', err);
          btn.querySelector('.btn-text').style.display = 'inline';
          btn.querySelector('.btn-loader').style.display = 'none';
          showToast("Something went wrong. Try again.", "error");
        });
    });
  }
  //35 ====== Admin Create Product Form ======
  if (createForm) {
    createForm.onsubmit = function (e) {
      e.preventDefault();
      const formData = new FormData(this);
      fetch('http://127.0.0.1:8000/api/admin/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
        .then(res => res.json())
        .then(data => alert(data.message))
        .catch(err => console.error('Create error:', err));
    };
  }

  // 36====== Admin Edit Product Form ======
  if (editForm) {
    editForm.onsubmit = function (e) {
      e.preventDefault();
      const id = this.id.value;
      const formData = new FormData(this);
      fetch(`http://127.0.0.1:8000/api/admin/products/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
        .then(res => res.json())
        .then(data => alert(data.message))
        .catch(err => console.error('Update error:', err));
    };
  }
});

// 37------ADMIN Delete Products---------
// ------ADMIN Delete Products---------
function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  fetch(`http://127.0.0.1:8000/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  })
  .then(data => {
    showToast(data.message || '✅ Product deleted successfully!', 'info');
    loadAdminSection('products'); // Refresh product list
  })
  .catch(err => {
    console.error('Delete error:', err);
    showToast('❌ Failed to delete product. Please try again.', 'error');
  });
}

//38 ========== CATEGORY NAVIGATION ==========
function navigateToProducts(subcategory) {
  const mainCategory = localStorage.getItem('mainCategory');
  if (!mainCategory) return alert("Please select a main category first.");
  window.location.href = `products.html?main=${mainCategory}&category=${subcategory}`;
}
// 39-----------   ------------
function selectMainCategory(type) {
  localStorage.setItem('mainCategory', type);
  document.getElementById('subcategoryTitle').textContent =
    type === 'wholesale' ? 'Wholesales Subcategories' : 'Retails Subcategories';
  document.getElementById('subcategorySection').classList.remove('hidden');
  document.getElementById('productDisplay').classList.add('hidden');
}

//40 ========== PRODUCT FETCHING ==========
function storeSubcategory(subcategory) {
  const mainCategory = localStorage.getItem('mainCategory');
  if (!mainCategory) return alert("Please select a main category first.");

  const display = document.getElementById('productDisplay');
  display.innerHTML = `<div class="spinner-wrapper"><div class="spinner-icon"></div><p>Loading products...</p></div>`;
  display.classList.remove('hidden');
  document.getElementById('paginationControls').classList.add('hidden');

  fetch(`http://127.0.0.1:8000/products/filter?main=${mainCategory}&category=${subcategory}`)
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(data => {
      if (!Array.isArray(data)) throw new Error("Invalid response format");
      currentFilteredProducts = data;
      currentPage = 1;
      renderProducts();
      document.getElementById('paginationControls').classList.remove('hidden');
    })
    .catch(err => {
      console.error("Error fetching products:", err);
      display.innerHTML = '<p>Failed to load products. Please try again later.</p>';
    });
}

// ========== PRODUCT RENDERING ==========
function renderProducts() {
  const display = document.getElementById('productDisplay');
  const pageIndicator = document.getElementById('pageIndicator');
  display.innerHTML = '';

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = currentFilteredProducts.slice(start, end);

  if (pageItems.length === 0) {
    display.innerHTML = `<div class="no-products"><p>😕 No products found in this category.</p><p>Try adjusting your filters or check back later.</p></div>`;
    document.getElementById('paginationControls').classList.add('hidden');
    return;
  }

  pageItems.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id); // ✅ Needed for stock updates

    const imagePath = product.image || 'http://127.0.0.1:8000/storage/products/default.jpg';

    card.innerHTML = `
      <img src="${imagePath}" alt="${product.name}"
           onerror="this.onerror=null;this.src='http://127.0.0.1:8000/storage/products/default.jpg'">
      <div class="product-name">${product.name}</div>
      <div class="product-rating">${getRatingStars(product.id)}</div>
      <div class="product-price">₦${product.price.toLocaleString()}</div>
          <div class="product-main">🛍️ ${product.main}</div> <!-- ✅ Add this line -->

      <button class="add-to-cart"
        data-id="${product.id}"
        data-name="${product.name}"
        data-price="${product.price}"
        data-image="${product.image}"
        onclick="addToCart(this)"
        ${product.stock === 0 ? 'disabled' : ''}>
        Add to Cart
      </button>
    `;
    display.appendChild(card);
  });

  document.getElementById('pageIndicator').textContent = `Page ${currentPage}`;
}

function nextPage() {
  const totalPages = Math.ceil(currentFilteredProducts.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderProducts();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderProducts();
  }
}





// ========== NEW: FETCH ALL PRODUCTS ==========
function fetchAllProducts() {
  const display = document.getElementById('productDisplay');
  const pagination = document.getElementById('paginationControls');
  const pageIndicator = document.getElementById('pageIndicator');

  // Show loading spinner
  display.innerHTML = `<div class="spinner-wrapper"><div class="spinner-icon"></div><p>Loading products...</p></div>`;
  display.classList.remove('hidden');
  pagination.classList.add('hidden');

  fetch('http://127.0.0.1:8000/api/products/filter?main=retail')
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(products => {
      if (!Array.isArray(products) || products.length === 0) {
        display.innerHTML = `<div class="no-products"><p>😕 No retail products found.</p></div>`;
        pagination.classList.add('hidden');
        return;
      }

      currentFilteredProducts = products;
      currentPage = 1;

      renderProducts(); // This handles slicing and rendering

      // Show pagination controls
      pagination.classList.remove('hidden');

      // Update page indicator
      if (pageIndicator) {
        pageIndicator.textContent = `Page ${currentPage}`;
      }
    })
    .catch(err => {
      console.error('Failed to load products:', err);
      display.innerHTML = '<p>Failed to load products. Please try again later.</p>';
      pagination.classList.add('hidden');
    });
}






// ========== NEW: UPDATE STOCK DISPLAY ==========
function updateStockDisplay(productId, newStock) {
  const productCard = document.querySelector(`[data-id="${productId}"]`);
  if (!productCard) return;

  const stockLabel = productCard.querySelector('.product-stock');
  const addToCartBtn = productCard.querySelector('.add-to-cart');

  stockLabel.textContent = newStock === 0 ? 'Out of stock' : `In stock: ${newStock}`;
  stockLabel.classList.toggle('out-of-stock', newStock === 0);
  addToCartBtn.disabled = newStock === 0;
}
//44 ========== SEARCH ==========
// ====== SEARCH TRIGGER ======
const searchInput = document.getElementById('globalSearchInput');
if (searchInput) {
  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') globalSearch();
  });
}

// ====== GLOBAL SEARCH FUNCTION ======
function globalSearch() {
  const query = searchInput.value.toLowerCase().trim();
  if (!query) return;

  const display = document.getElementById('productDisplay');
  const pagination = document.getElementById('paginationControls');
  const subcategoryTitle = document.getElementById('subcategoryTitle');
  const viewWrapper = document.getElementById('productViewWrapper');

  // ✅ Show loading state
  display.innerHTML = '<p>Searching...</p>';
  display.classList.remove('hidden');
  pagination.classList.add('hidden');
  if (viewWrapper) viewWrapper.classList.add('active');

  // ✅ Scroll to product section
  display.scrollIntoView({ behavior: 'smooth' });

  fetch(`http://127.0.0.1:8000/api/products/search?q=${encodeURIComponent(query)}`)
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        display.innerHTML = `
          <div class="no-products">
            <p>😕 No products found for "<strong>${query}</strong>".</p>
          </div>
        `;
        subcategoryTitle.textContent = `No results for "${query}"`;
        return;
      }

      // ✅ Store and render results
      currentFilteredProducts = data;
      currentPage = 1;
      renderProducts(); // Your existing render function

      display.classList.remove('hidden');
      pagination.classList.remove('hidden');
      subcategoryTitle.textContent = `Search results for "${query}"`;
    })
    .catch(err => {
      console.error("Search error:", err);
      display.innerHTML = '<p>Failed to load search results. Please try again later.</p>';
    });
}

// 45========== RATING STARS ==========
function getRatingStars(productId) {
  const ratings = {
    1: 5, 2: 4, 3: 3, 4: 5, 5: 4, 6: 3,
    7: 5, 8: 4, 9: 3, 10: 5, 11: 4, 12: 3
  };
  const stars = ratings[productId] || 3;
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

// ========== CART ==========
function addToCart(btn) {
  const isLoggedIn = !!localStorage.getItem('token'); // ✅ Check login status

  if (!isLoggedIn) {
    showToast("Please sign in to continue.", 'info');
    signIn(); // ✅ Show the sign-in sidebar
    return;
  }

  const productId = btn.dataset.id;
  const name = btn.dataset.name;
  const price = parseInt(btn.dataset.price);
  const productImage = btn.dataset.image;
  const quantity = 1;

  if (!productId || isNaN(price)) {
    showToast("Invalid product data.", "info");
    return;
  }

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += quantity;
  } else {
    cart.push({ id: productId, name, price, qty: quantity, image: productImage });
  }

  saveCartToLocalStorage();
  updateCartSidebar();
  toggleCart(true);
  showToast(`${name} added to cart`, 'success');

  fetch('http://127.0.0.1:8000/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ product_id: productId, quantity })
  }).catch(err => console.error("Cart sync failed:", err));
}

function updateCartSidebar() {
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const cartCountNavbar = document.getElementById('cart-count');
  const cartCountFallback = document.getElementById('cartCount');

  if (!cartItems || !cartTotal) return;

  cartItems.innerHTML = '';
  let total = 0;
  let totalItems = 0;

  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Your cart is empty.</p>';
    cartTotal.textContent = '0';
    if (cartCountNavbar) {
      cartCountNavbar.textContent = '0';
      cartCountNavbar.style.display = 'none';
    }
    if (cartCountFallback) cartCountFallback.textContent = '0';
    return;
  }

  cart.forEach((item, index) => {
    total += item.price * item.qty;
    totalItems += item.qty;

    // ✅ Smart image fallback
    const imageUrl = item.image?.startsWith('http')
      ? item.image
      : item.image
        ? `http://127.0.0.1:8000/storage/products/${item.image}`
        : '/images/default.jpg'; // Make sure this file exists in public/images/

    cartItems.innerHTML += `
      <div class="cart-item">
        <img src="${imageUrl}" class="cart-thumb" onerror="this.onerror=null;this.src='/images/default.jpg';">
        <div class="cart-details">
          <strong>${item.name}</strong><br>
          ₦${item.price.toLocaleString()} × ${item.qty}
          <div class="qty-controls">
            <button onclick="decreaseCartQty(${index})">−</button>
            <button onclick="increaseCartQty(${index})">+</button>
            <button onclick="removeCartItem(${index})">🗑️</button>
          </div>
        </div>
      </div>
    `;
  });

  cartTotal.textContent = total.toLocaleString();
  if (cartCountNavbar) {
    cartCountNavbar.textContent = totalItems;
    cartCountNavbar.style.display = 'inline-block';
  }
  if (cartCountFallback) {
    cartCountFallback.textContent = cart.length;
  }

  saveCartToLocalStorage();
}


function saveCartToLocalStorage() {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartData', JSON.stringify(cart));
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
}

function increaseCartQty(index) {
  cart[index].qty += 1;
  updateCartSidebar();
}

function decreaseCartQty(index) {
  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
  } else {
    cart.splice(index, 1);
  }
  updateCartSidebar();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  updateCartSidebar();
}

function toggleCart(show) {
  const sidebar = document.getElementById('cartSidebar');
  if (sidebar) {
    sidebar.classList.toggle('open', show);
  }
}

function proceedToCheckout() {
  if (cart.length === 0) {
    showToast("Your cart is empty.", "info");
    return;
  }

  const token = localStorage.getItem('token');
  const cartToSend = JSON.parse(localStorage.getItem('cart'));

  fetch('http://127.0.0.1:8000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ cart: cartToSend })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Checkout response:", data);
    // Proceed to Paystack or confirmation page
  })
  .catch(err => {
    console.error("Checkout failed:", err);
  });

  toggleCart(false);
  localStorage.setItem('cartData', JSON.stringify(cart));
  window.location.href = "checkout.html";
}


// =======about me modal=====
function openAboutModal() {
  document.getElementById('aboutMeModal').style.display = 'flex';
}
function closeAboutModal() {
  document.getElementById('aboutMeModal').style.display = 'none';
}



const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  menuToggle.textContent = navLinks.classList.contains('active') ? '✖' : '☰';
});

