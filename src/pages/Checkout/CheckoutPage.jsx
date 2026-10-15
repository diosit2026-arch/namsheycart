import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Lock, ArrowRight, Banknote } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useUserStore } from '../../store/useUserStore';
import Seo from '../../components/seo/Seo';
import { siteUrl } from '../../utils/siteContent';

const MotionDiv = motion.div;
const FREE_SHIPPING_THRESHOLD = 4000;
const SHIPPING_CHARGE = 199;
const formatInr = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[6-9]\d{9}$/;
const pinCodePattern = /^\d{6}$/;
const createGuestOrderId = () => `#ORD-${Date.now().toString().slice(-6)}`;

const CheckoutPage = () => {
  const { items, getCartTotal, clearCart } = useCartStore();
  const { isAuthenticated, user, placeOrder } = useUserStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [hasSubmittedOrder, setHasSubmittedOrder] = useState(false);
  const paymentMethod = 'cod';
  const [shippingErrors, setShippingErrors] = useState({});
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Telangana',
    postalCode: '',
    country: 'India',
  });

  const subtotal = getCartTotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const total = subtotal + shipping;

  useEffect(() => {
    if (items.length === 0 && step !== 3 && !hasSubmittedOrder) {
      navigate('/cart');
    }
  }, [hasSubmittedOrder, items.length, navigate, step]);

  const updateField = (field, value) => {
    setCheckoutForm((state) => ({ ...state, [field]: value }));
    setShippingErrors((state) => ({ ...state, [field]: '' }));
  };

  const validateShippingForm = () => {
    const errors = {};

    if (!checkoutForm.firstName.trim()) errors.firstName = 'First name is required.';
    if (!checkoutForm.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!emailPattern.test(checkoutForm.email.trim())) errors.email = 'Enter a valid email address.';
    if (!phonePattern.test(checkoutForm.phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number.';
    if (!checkoutForm.addressLine1.trim()) errors.addressLine1 = 'Street address is required.';
    if (!checkoutForm.city.trim()) errors.city = 'City is required.';
    if (!checkoutForm.state.trim()) errors.state = 'State is required.';
    if (!pinCodePattern.test(checkoutForm.postalCode.trim())) errors.postalCode = 'Enter a valid 6-digit PIN code.';
    if (!checkoutForm.country.trim()) errors.country = 'Country is required.';

    return errors;
  };

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    const errors = validateShippingForm();
    setShippingErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const submitPayment = () => {
    const shippingAddress = {
      title: 'Delivery Address',
      fullName: `${checkoutForm.firstName} ${checkoutForm.lastName}`.trim(),
      phone: checkoutForm.phone,
      line1: checkoutForm.addressLine1,
      line2: checkoutForm.addressLine2,
      city: checkoutForm.city,
      state: checkoutForm.state,
      postalCode: checkoutForm.postalCode,
      country: checkoutForm.country,
    };

    const orderResult = isAuthenticated
      ? placeOrder({
          items,
          totals: { subtotal, shipping, total },
          shippingAddress,
        })
      : { success: false, order: null };

    const nextOrderConfirmation = orderResult.order
      ? { ...orderResult.order, paymentMethod }
      : {
          id: createGuestOrderId(),
          address: shippingAddress,
          paymentMethod,
        };

    setHasSubmittedOrder(true);
    clearCart();
    navigate('/order-confirmed', {
      state: {
        orderConfirmation: nextOrderConfirmation,
      },
    });
    window.scrollTo(0, 0);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    submitPayment();
  };

  if (items.length === 0 && step !== 3 && !hasSubmittedOrder) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-10 pb-20">
      <Seo
        title="Secure Checkout"
        description="Complete your order on NamshyCart with secure checkout, shipping details, payment confirmation, and a simple purchase flow."
        keywords="NamshyCart checkout, secure payment, shipping details, online order"
        canonical={`${siteUrl}/checkout`}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-b border-gray-800 pb-8">
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Secure order flow</p>
            <h1 className="mt-3 text-3xl font-bold text-white">Checkout with confidence on NamshyCart</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-400">Fast checkout steps, protected payment messaging, and clear order totals help create a better customer experience.</p>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-12">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${step >= 1 ? 'bg-primary text-white' : 'bg-surface text-gray-500'}`}>1</div>
              <span className="font-semibold hidden sm:inline">Shipping details</span>
            </div>
            <div className="w-12 sm:w-24 h-px bg-gray-700"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${step >= 2 ? 'bg-primary text-white' : 'bg-surface text-gray-500'}`}>2</div>
              <span className="font-semibold hidden sm:inline">Payment options</span>
            </div>
            <div className="w-12 sm:w-24 h-px bg-gray-700"></div>
            <div className={`flex items-center ${step === 3 ? 'text-accent' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${step === 3 ? 'bg-accent text-white' : 'bg-surface text-gray-500'}`}>3</div>
              <span className="font-semibold hidden sm:inline">Order complete</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <MotionDiv
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-10"
            >
              <div className="lg:w-2/3 max-w-2xl">
                <div className="bg-surface rounded-2xl border border-gray-800 p-8 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-6">Contact & Shipping setup</h2>

                  {!isAuthenticated && (
                    <div className="mb-8 p-4 border border-gray-700 rounded-xl bg-gray-800 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium mb-1">Already have an account?</p>
                        <p className="text-sm text-gray-400">Log in for saved order history and addresses.</p>
                      </div>
                      <button onClick={() => navigate('/account')} className="px-4 py-2 bg-background border border-gray-600 rounded-lg text-white font-medium hover:bg-gray-700 transition-colors">
                        Log in
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleInfoSubmit} noValidate>
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-white mb-4">Contact info</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">First name</label>
                          <input value={checkoutForm.firstName} onChange={(e) => updateField('firstName', e.target.value)} required className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                          {shippingErrors.firstName && <p className="mt-2 text-xs text-red-400">{shippingErrors.firstName}</p>}
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Last name</label>
                          <input value={checkoutForm.lastName} onChange={(e) => updateField('lastName', e.target.value)} required className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                          {shippingErrors.lastName && <p className="mt-2 text-xs text-red-400">{shippingErrors.lastName}</p>}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                        <input type="email" value={checkoutForm.email} onChange={(e) => updateField('email', e.target.value)} required className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                        {shippingErrors.email && <p className="mt-2 text-xs text-red-400">{shippingErrors.email}</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone number</label>
                        <input type="tel" value={checkoutForm.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                        {shippingErrors.phone && <p className="mt-2 text-xs text-red-400">{shippingErrors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Shipping address</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Street address</label>
                        <input value={checkoutForm.addressLine1} onChange={(e) => updateField('addressLine1', e.target.value)} required className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                        {shippingErrors.addressLine1 && <p className="mt-2 text-xs text-red-400">{shippingErrors.addressLine1}</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Apartment, suite, etc. (optional)</label>
                        <input value={checkoutForm.addressLine2} onChange={(e) => updateField('addressLine2', e.target.value)} className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                          <input value={checkoutForm.city} onChange={(e) => updateField('city', e.target.value)} required className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                          {shippingErrors.city && <p className="mt-2 text-xs text-red-400">{shippingErrors.city}</p>}
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">State / Province</label>
                          <select value={checkoutForm.state} onChange={(e) => updateField('state', e.target.value)} className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary">
                            <option>Telangana</option>
                            <option>Maharashtra</option>
                            <option>Karnataka</option>
                            <option>Tamil Nadu</option>
                          </select>
                          {shippingErrors.state && <p className="mt-2 text-xs text-red-400">{shippingErrors.state}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">PIN code</label>
                          <input value={checkoutForm.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} required className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors" />
                          {shippingErrors.postalCode && <p className="mt-2 text-xs text-red-400">{shippingErrors.postalCode}</p>}
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                          <select value={checkoutForm.country} onChange={(e) => updateField('country', e.target.value)} className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary">
                            <option>India</option>
                          </select>
                          {shippingErrors.country && <p className="mt-2 text-xs text-red-400">{shippingErrors.country}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end">
                      <button
                        type="submit"
                        className="px-8 py-4 bg-primary hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center"
                      >
                        Continue to Payment <ArrowRight size={20} className="ml-2" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-surface rounded-2xl border border-gray-800 p-8 sticky top-24 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

                  <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center gap-4 border-b border-gray-800 pb-4">
                        <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-900">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <div className="font-bold text-white whitespace-nowrap">{formatInr(item.price * item.quantity)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Subtotal</span>
                      <span className="font-medium text-white">{formatInr(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Shipping</span>
                      <span className="font-medium text-white">{shipping === 0 ? 'Free' : formatInr(shipping)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Taxes</span>
                      <span className="font-medium text-white">Calculated next step</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4 flex justify-between">
                    <span className="text-lg font-bold text-white">Total due</span>
                    <span className="text-xl font-extrabold text-white">{formatInr(total)}</span>
                  </div>
                </div>
              </div>
            </MotionDiv>
          )}

          {step === 2 && (
            <MotionDiv
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-surface rounded-2xl border border-gray-800 p-8 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-white">Payment Method</h2>
                  <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-white underline">Edit Shipping step</button>
                </div>

                <form onSubmit={handlePaymentSubmit} noValidate>
                  <div className="mb-8">
                    <div className="relative flex rounded-xl border border-primary bg-gray-800/50 p-4">
                      <span className="flex flex-1 items-center">
                        <span className="flex flex-col">
                          <span className="block text-sm font-bold text-white flex items-center">
                            <Banknote className="mr-2 text-primary" size={20} /> Cash on Delivery
                          </span>
                          <span className="mt-1 text-xs text-gray-400">Pay when your order reaches your address.</span>
                        </span>
                      </span>
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="mb-8 rounded-xl border border-gray-700 bg-background p-6">
                    <div className="flex items-start space-x-4">
                      <Banknote className="mt-1 text-primary" size={24} />
                      <div>
                        <h4 className="text-white font-bold mb-1">Cash on Delivery selected</h4>
                        <p className="text-sm text-gray-400">You can place the order now and pay in cash when the delivery arrives.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-6 mb-8 flex items-start space-x-4">
                    <Lock className="text-green-500 flex-shrink-0" size={24} />
                    <div>
                      <h4 className="text-white font-bold mb-1">Cash on delivery confirmation</h4>
                      <p className="text-sm text-gray-400">Your order will be confirmed now and payment will be collected at delivery.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitPayment}
                    className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-opacity"
                  >
                    {`Place COD Order for ${formatInr(total)}`}
                  </button>
                </form>
              </div>
            </MotionDiv>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default CheckoutPage;
