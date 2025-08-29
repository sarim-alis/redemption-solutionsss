document.addEventListener('DOMContentLoaded', function() {
    const giftCardForms = document.querySelectorAll('.gift-card-add-form');
    
    giftCardForms.forEach(form => {
      const minusBtn = form.querySelector('.minus-btn');
      const plusBtn = form.querySelector('.plus-btn');
      const quantityInput = form.querySelector('.quantity-input');
      const amountInput = form.querySelector('.amount-input');
      const submitBtn = form.querySelector('.add-to-cart-btn');
      
      // Quantity Controls
      minusBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
          quantityInput.value = currentValue - 1;
        }
      });
      
      plusBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue < 10) {
          quantityInput.value = currentValue + 1;
        }
      });
      
      // Amount Input Validation
      amountInput.addEventListener('input', function() {
        const value = parseFloat(this.value);
        const min = parseFloat(this.getAttribute('min'));
        const max = parseFloat(this.getAttribute('max'));
        
        if (value < min) {
          this.setCustomValidity(`Minimum amount is $${min}`);
        } else if (value > max) {
          this.setCustomValidity(`Maximum amount is $${max}`);
        } else {
          this.setCustomValidity('');
        }
      });
      
      // Form Submission
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseFloat(amountInput.value);
        if (!amount || amount <= 0) {
          alert('Please enter a valid amount');
          return;
        }
        
        // Add loading state
        form.classList.add('loading');
        submitBtn.textContent = 'Adding...';
        
        // Create form data
        const formData = new FormData(form);
        
        // Add to cart via fetch
        fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          // Success - redirect to cart or show success message
          window.location.href = '/cart';
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Sorry, there was an error adding the gift card to your cart.');
        })
        .finally(() => {
          // Remove loading state
          form.classList.remove('loading');
          submitBtn.textContent = form.querySelector('.add-to-cart-btn').getAttribute('data-original-text') || 'ADD TO CART';
        });
      });
    });
  });
  