document.addEventListener("DOMContentLoaded", () => {
  // ✅ Retrieve order summary (cart at time of payment)
  const orderSummary = JSON.parse(localStorage.getItem('orderSummary')) || [];

  // ✅ Retrieve delivery info
  const name = localStorage.getItem('customerName') || 'Not provided';
  const phone = localStorage.getItem('customerPhone') || 'Not provided';
  const address = localStorage.getItem('customerAddress') || 'Not provided';
  const state = localStorage.getItem('customerState') || 'Not provided';

  // ✅ Get DOM elements
  const summaryList = document.getElementById('orderItems'); // UL for items
  const totalAmount = document.getElementById('orderTotal');       // Total amount
  const deliveryInfo = document.getElementById('deliveryInfo');    // Delivery section

  let total = 0;
  summaryList.innerHTML = '';

  if (orderSummary.length === 0) {
    summaryList.innerHTML = '<p>No items found in your order.</p>';
    totalAmount.textContent = '0';
  } else {
    orderSummary.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} × ${item.qty} — ₦${(item.price * item.qty).toLocaleString()}`;
      summaryList.appendChild(li);
      total += item.price * item.qty;
    });

    totalAmount.textContent = total.toLocaleString();
  }

  // ✅ Render delivery info
  deliveryInfo.innerHTML = `
    <h3>🚚 Delivery Details</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Address:</strong> ${address}, ${state}</p>
    <p><strong>Estimated Arrival:</strong> 3–5 business days</p>
  `;


  //  localStorage.removeItem('orderSummary');
  // ✅ Optional: Clear localStorage after display
  // localStorage.removeItem('customerName');
  // localStorage.removeItem('customerPhone');
  // localStorage.removeItem('customerAddress');
  // localStorage.removeItem('customerState');
});
