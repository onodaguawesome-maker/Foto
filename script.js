// AUTH CHECK - dashboard, how-to-use, cart, contact ALL require login
const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || 'index';
const protectedPages = ['dashboard', 'how-to-use', 'cart', 'contact'];

if (protectedPages.includes(currentPath)) {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (isLoggedIn !== 'true') {
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.replace('/login');
  }
}

// Redirect after login to page they tried to access
const redirectPath = localStorage.getItem('redirectAfterLogin');
if ((currentPath === 'login' || currentPath === 'signup') && localStorage.getItem('isLoggedIn') === 'true' && redirectPath) {
  localStorage.removeItem('redirectAfterLogin');
  window.location.replace(redirectPath);
}

// MOBILE MENU TOGGLE
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
  
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });
}

// Update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) cartCountEl.textContent = cart.length;
}
updateCartCount();

// Logout - clears session and blocks back button
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.replace('/');
  });
}

// Signup Form
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', document.getElementById('email').value);
    
    setTimeout(() => {
      const redirect = localStorage.getItem('redirectAfterLogin') || '/dashboard';
      localStorage.removeItem('redirectAfterLogin');
      window.location.replace(redirect);
    }, 500);
  });
}

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', document.getElementById('loginEmail').value);
    
    setTimeout(() => {
      const redirect = localStorage.getItem('redirectAfterLogin') || '/dashboard';
      localStorage.removeItem('redirectAfterLogin');
      window.location.replace(redirect);
    }, 500);
  });
}

// Apple Liquid Glass Scroll Down Button
const scrollDownBtn = document.getElementById('scrollDownBtn');
if (scrollDownBtn) {
  scrollDownBtn.addEventListener('click', () => {
    document.querySelector('.features').scrollIntoView({ 
      behavior: 'smooth' 
    });
  });
  
  // Hide button when user scrolls down
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      scrollDownBtn.style.opacity = '0';
      scrollDownBtn.style.pointerEvents = 'none';
    } else {
      scrollDownBtn.style.opacity = '1';
      scrollDownBtn.style.pointerEvents = 'all';
    }
  });
}

// Apps with logos
const apps = [
  { name: 'WhatsApp', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg', multiplier: 1.2 },
  { name: 'Telegram', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg', multiplier: 1.0 },
  { name: 'Facebook', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg', multiplier: 0.9 },
  { name: 'Instagram', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png', multiplier: 1.1 },
  { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', multiplier: 1.3 },
  { name: 'Twitter/X', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023_original.svg', multiplier: 1.0 },
  { name: 'TikTok', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg', multiplier: 0.8 },
  { name: 'Discord', logo: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png', multiplier: 0.7 }
];

// Naira pricing
function getCountryPrice(countryCode, appMultiplier = 1) {
  const tier1 = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'NL', 'SE', 'CH'];
  const tier2 = ['NG', 'ZA', 'KE', 'GH', 'IN', 'BR', 'MX', 'ES', 'IT', 'RU', 'UA', 'PL'];
  
  let basePrice;
  if (tier1.includes(countryCode)) {
    basePrice = Math.floor(Math.random() * 1200) + 2000;
  } else if (tier2.includes(countryCode)) {
    basePrice = Math.floor(Math.random() * 800) + 1200;
  } else if (['CN', 'JP', 'KR', 'SG', 'AE', 'SA', 'TR'].includes(countryCode)) {
    basePrice = Math.floor(Math.random() * 400) + 800;
  } else {
    basePrice = Math.floor(Math.random() * 400) + 400;
  }
  
  return Math.round((basePrice * appMultiplier) / 50) * 50;
}

// Show app list
const appsList = document.getElementById('appsList');
if (appsList) {
  apps.forEach(app => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item-left">
        <img src="${app.logo}" alt="${app.name}" class="list-item-logo">
        <div class="list-item-info">
          <h3>${app.name}</h3>
          <p>Virtual number for ${app.name}</p>
        </div>
      </div>
      <button class="btn btn-primary btn-small" onclick="showCountries('${app.name}', '${app.logo}', ${app.multiplier})">
        Select
      </button>
    `;
    item.onclick = () => showCountries(app.name, app.logo, app.multiplier);
    appsList.appendChild(item);
  });
}

// Show countries list
let selectedApp = null;
function showCountries(appName, appLogo, multiplier) {
  selectedApp = { name: appName, logo: appLogo, multiplier: multiplier };
  
  document.getElementById('appListView').classList.add('hidden');
  document.getElementById('countryListView').classList.remove('hidden');
  document.getElementById('selectedAppTitle').textContent = `Select Country`;
  document.getElementById('selectedAppName').textContent = appName;
  
  const countriesList = document.getElementById('countriesList');
  const loader = document.getElementById('servicesLoader');
  countriesList.innerHTML = '';
  loader.classList.remove('hidden');
  
  fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,idd')
    .then(res => res.json())
    .then(data => {
      loader.classList.add('hidden');
      
      const popular = ['NG', 'US', 'GB', 'CA', 'ZA', 'KE', 'GH', 'IN', 'DE', 'FR'];
      data.sort((a, b) => {
        const aIndex = popular.indexOf(a.cca2);
        const bIndex = popular.indexOf(b.cca2);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.common.localeCompare(b.name.common);
      });
      
      data.slice(0, 50).forEach(country => {
        const price = getCountryPrice(country.cca2, multiplier);
        const phoneCode = country.idd.root ? `${country.idd.root}${country.idd.suffixes?.[0] || ''}` : '+1';
        
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div class="list-item-left">
            <img src="${country.flags.png}" alt="${country.name.common}" class="list-item-flag">
            <div class="list-item-info">
              <h3>${country.name.common}</h3>
              <p>${phoneCode}</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="list-item-price">₦${price.toLocaleString()}</div>
            <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); addToCart('${appName}', '${country.name.common}', '${country.cca2}', ${price})">
              Add
            </button>
          </div>
        `;
        item.onclick = () => addToCart(appName, country.name.common, country.cca2, price);
        countriesList.appendChild(item);
      });
    })
    .catch(err => {
      loader.classList.add('hidden');
      countriesList.innerHTML = '<p style="text-align:center; padding:2rem;">Failed to load countries. Please refresh.</p>';
    });
}

// Back to apps
const backToApps = document.getElementById('backToApps');
if (backToApps) {
  backToApps.addEventListener('click', () => {
    document.getElementById('countryListView').classList.add('hidden');
    document.getElementById('appListView').classList.remove('hidden');
  });
}

// Add to cart
function addToCart(appName, countryName, countryCode, price) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.push({ appName, countryName, countryCode, price: parseInt(price), id: Date.now() });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`${appName} - ${countryName} added for ₦${price.toLocaleString()}!`);
}

// Cart page
const cartItems = document.getElementById('cartItems');
if (cartItems) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartSummary = document.getElementById('cartSummary');
  
  if (cart.length === 0) {
    cartEmpty.classList.remove('hidden');
  } else {
    cartSummary.classList.remove('hidden');
    let total = 0;
    
    cart.forEach(item => {
      total += item.price;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div>
          <h4>${item.appName} - ${item.countryName}</h4>
          <p>Code: ${item.countryCode}</p>
        </div>
        <div>
          <strong>₦${item.price.toLocaleString()}</strong>
          <button class="btn btn-secondary" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
      `;
      cartItems.appendChild(div);
    });
    
    document.getElementById('cartTotal').textContent = total.toLocaleString();
  }
}

// Remove from cart
function removeFromCart(id) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('cart', JSON.stringify(cart));
  location.reload();
}

// Checkout to WhatsApp
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const userEmail = localStorage.getItem('userEmail') || 'Guest';
    
    let message = `Hello! I want to order SMS virtual numbers:%0A%0A`;
    message += `Email: ${userEmail}%0A%0AItems:%0A`;
    
    let total = 0;
    cart.forEach((item, i) => {
      message += `${i+1}. ${item.appName} - ${item.countryName} (${item.countryCode}) - ₦${item.price.toLocaleString()}%0A`;
      total += item.price;
    });
    
    message += `%0ATotal: ₦${total.toLocaleString()}%0A%0APlease confirm my order.`;
    window.open(`https://wa.me/2348088639901?text=${message}`, '_blank');
  });
}
