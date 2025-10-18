let cart = [];

document.addEventListener("DOMContentLoaded", () => {
  const savedCart = localStorage.getItem('cartData');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    renderCartSummary();
  }
});

function renderCartSummary() {
  const cartSummary = document.getElementById('cartSummary');
  const cartTotal = document.getElementById('cartTotal');
  const cartCount = document.getElementById('cartCount'); 

  let total = 0;
  cartSummary.innerHTML = '';

  cart.forEach(item => {
    total += item.price * item.qty;
    const li = document.createElement('li');
    li.textContent = `${item.name} × ${item.qty} — ₦${(item.price * item.qty).toLocaleString()}`;
    cartSummary.appendChild(li);
  });

  cartTotal.textContent = total.toLocaleString();
  if (cartCount) cartCount.textContent = cart.length;
}

/// =============== DELIVERY FORM SUBMIT ===============
document.getElementById('deliveryForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phoneNumber').value.trim();
  const address = document.getElementById('deliveryAddress').value.trim();
  const state = document.getElementById('deliveryState').value.trim();
  const useWallet = document.getElementById('useWallet')?.checked || false;
  const spinner = document.getElementById('spinner');
  const confirmBtn = document.getElementById('confirmBtn');

  if (!fullName || !phone || !address || !state) {
    alert("Please fill in all delivery details.");
    return;
  }

  const cart = JSON.parse(localStorage.getItem('cartData')) || [];

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const validCart = cart.every(item =>
    item.id && item.name && item.price && item.qty
  );

  if (!validCart) {
    alert("Cart contains invalid items.");
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    alert("You must be logged in to place an order.");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (spinner) spinner.style.display = 'block';
  if (confirmBtn) confirmBtn.classList.add('disabled');

  const orderPayload = {
    use_wallet: useWallet,
    cart: cart,
    shipping: {
      name: fullName,
      phone,
      address,
      state
    },
    total,
    payment_method: useWallet ? 'wallet' : 'paystack'
  };

  console.log("Submitting order to /api/checkout...");

  try {
    const res = await fetch('http://127.0.0.1:8000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(orderPayload)
    });

    const rawText = await res.text();
    let data;

    try {
      data = JSON.parse(rawText);
      console.log("Checkout response:", data);
    } catch (jsonErr) {
      console.error("Raw response (not JSON):", rawText);
      alert("Server returned unexpected response. Check console.");
      if (spinner) spinner.style.display = 'none';
      if (confirmBtn) confirmBtn.classList.remove('disabled');
      return;
    }

    if (!res.ok) throw new Error(data.message || 'Checkout failed');

    localStorage.setItem('orderId', data.order_id);
    localStorage.setItem('orderTimestamp', new Date().toISOString());

    if (useWallet) {
      alert("Order placed using wallet!");
      localStorage.setItem('orderSummary', JSON.stringify(cart));
      cart.length = 0;
      localStorage.removeItem('cartData');
      localStorage.removeItem('cart');
      renderCartSummary();
      window.location.href = "thankyou.html";
    } else {
      payWithPaystack(total * 100, phone + '@example.com', fullName, data.order_id);
    }

  } catch (err) {
    console.error("Checkout error:", err);
    alert("Something went wrong: " + err.message);
    if (spinner) spinner.style.display = 'none';
    if (confirmBtn) confirmBtn.classList.remove('disabled');
  }
});

function payWithPaystack(amount, email, fullName, orderId) {8
  console.log("Launching Paystack V2 payment...");

  const paystack = new PaystackPop();
  paystack.newTransaction({
    key: 'pk_test_e891bdb45728b769cb3ae91601643bd8c0c412ca',
    email: email,
    amount: amount,
    currency: 'NGN',
    reference: 'ORD-' + Math.floor(Math.random() * 1000000000),
    metadata: {
      custom_fields: [
        {
          display_name: fullName,
          variable_name: "customer_name",
          value: fullName
        }
      ]
    },
    onSuccess: function(transaction) {
      console.log("Payment successful:", transaction.reference);

      fetch('http://127.0.0.1:8000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: transaction.reference,
          order_id: orderId
        })
      })
      .then(res => res.json())
      .then(data => {
        alert("Payment verified!");
        localStorage.setItem('orderSummary', JSON.stringify(cart));
        cart.length = 0;
        localStorage.removeItem('cartData');
        localStorage.removeItem('cart');
        renderCartSummary();
        window.location.href = "thankyou.html";
      })
      .catch(err => {
        console.error("Verification error:", err);
        alert("Payment verification failed. Please contact support.");
      });
    },

    onCancel: function() {
      alert("Transaction was cancelled");
      const spinner = document.getElementById('spinner');
      const confirmBtn = document.getElementById('confirmBtn');
      if (spinner) spinner.style.display = 'none';
      if (confirmBtn) confirmBtn.classList.remove('disabled');
    }
  });
}
