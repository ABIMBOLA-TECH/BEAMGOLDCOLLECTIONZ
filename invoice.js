document.addEventListener("DOMContentLoaded", () => {
  // ✅ Retrieve order data
  const orderId = localStorage.getItem('orderId') || 'N/A';
  const name = localStorage.getItem('customerName') || 'Not provided';
  const phone = localStorage.getItem('customerPhone') || 'Not provided';
  const address = localStorage.getItem('customerAddress') || 'Not provided';
  const state = localStorage.getItem('customerState') || 'Not provided';
  const timestamp = localStorage.getItem('orderTimestamp') || new Date().toISOString();
  const payment = "Card"; // Update if needed

  // ✅ Retrieve final order items
  const orderSummary = JSON.parse(localStorage.getItem('orderSummary')) || [];

  let total = 0;
  let itemsHTML = '';

  if (orderSummary.length === 0) {
    itemsHTML = '<tr><td colspan="4">No items found in your invoice.</td></tr>';
  } else {
    itemsHTML = orderSummary.map(item => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;
      return `<tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>₦${item.price.toLocaleString()}</td>
        <td>₦${itemTotal.toLocaleString()}</td>
      </tr>`;
    }).join('');
  }

  // ✅ Inject into DOM
  document.getElementById('invoiceContainer').innerHTML = `
       <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <img src="images/logo.png" alt="BeamGold Logo" style="height: 80px;">
      <div style="text-align: right;">
        <h1 style="margin: 0;">BeamGold Collections</h1>
        <p style="margin: 0;">Fashion Redefined</p>
        <p style="margin: 0;">www.beamgold.com.ng</p>
      </div>
    </div>
  
  
  <h2>🧾 Invoice</h2>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>Date:</strong> ${new Date(timestamp).toLocaleString()}</p>
    <p><strong>Customer:</strong> ${name}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Address:</strong> ${address}, ${state}</p>
    <p><strong>Payment Method:</strong> ${payment}</p>
    <p><strong>Estimated Delivery:</strong> 3–5 business days</p>

    <table>
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
      </thead>
      <tbody>${itemsHTML}</tbody>
    </table>

    <h3>Total: ₦${total.toLocaleString()}</h3>
  `;
});
