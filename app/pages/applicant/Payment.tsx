import { useState, useEffect, type FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { DollarSign, CheckCircle, Clock, XCircle, UploadCloud, FileText, CreditCard, X, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function Payment() {
  const { user } = useAuth();
  const { residents, payments, refreshData } = useData();
  const navigate = useNavigate();
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentType, setPaymentType] = useState('residence_fee');
  const [amount, setAmount] = useState(1200);
  const [month, setMonth] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CBE');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
    }
  }, [user, navigate]);

  const userResident = residents.find((r) => r.applicantId === user?.id);
  const userPayments = payments.filter((p) => String(p.residentId) === String(user?.id));

  // Auto-set amount based on payment type
  useEffect(() => {
    if (paymentType === 'application_fee') {
      setAmount(500); // Example fee
    } else {
      setAmount(1200);
    }
  }, [paymentType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setScreenshot(file);
      } else {
        toast.error('Please upload a valid image file for the screenshot.');
      }
    }
  };

  const clearFile = () => {
    setScreenshot(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();

    if (!userResident && paymentType === 'residence_fee') {
      toast.error('You must be an assigned resident to pay residence fees. Choose Application Fee instead.');
      return;
    }

    if (paymentType === 'residence_fee' && !month) {
      toast.error('Please select the payment month.');
      return;
    }

    const isCbe = paymentMethod === 'CBE' || paymentMethod === 'CBE Birr';
    const requiredLength = isCbe ? 12 : 10;

    if (!transactionId.startsWith('FT')) {
      toast.error('Transaction ID must start with "FT".');
      return;
    }

    if (transactionId.length !== requiredLength) {
      toast.error(`Transaction ID must be exactly ${requiredLength} characters for ${paymentMethod}.`);
      return;
    }

    if (!screenshot) {
      toast.error('Please upload a screenshot of your transaction receipt.');
      return;
    }

    setIsSubmitting(true);

    try {
      const referenceNumber = `${month || 'AppFee'}-${Date.now()}`;
      const formData = new FormData();
      formData.append('userId', user!.id);
      formData.append('amount', amount.toString());
      formData.append('paymentType', paymentType);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId);
      formData.append('referenceNumber', referenceNumber);
      formData.append('screenshot', screenshot);

      const response = await fetch(`${API_BASE_URL}/applicant/pay.php`, {
        method: 'POST',
        body: formData,
      });
      
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(result.message ?? 'Payment submission failed');
        return;
      }

      await refreshData();
      toast.success('Payment submitted securely for verification!');
      setShowPaymentForm(false);
      setAmount(1200);
      setMonth('');
      setTransactionId('');
      setPaymentMethod('CBE');
      clearFile();
    } catch (error) {
      console.error('Payment submit failed:', error);
      toast.error('Unable to submit payment due to network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="applicant">
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm border border-blue-200">
              <CreditCard className="w-7 h-7 text-blue-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payment Center</h1>
              <p className="text-gray-500 mt-1">Manage your application and monthly housing payments</p>
            </div>
          </div>

          {!userResident && !showPaymentForm ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm flex items-start space-x-4">
              <Clock className="w-6 h-6 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-900 mb-1 text-lg">Housing Assignment Pending</h3>
                <p className="text-yellow-800">
                  You have not been assigned a condominium yet. You can only pay the <strong>Application Fee</strong> at this time.
                </p>
              </div>
            </div>
          ) : null}

          {/* Payment Summary */}
          {!showPaymentForm && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-gray-500 uppercase tracking-wider text-xs">Monthly Rate</p>
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-black text-gray-900 mb-1">1,200 <span className="text-lg font-bold text-gray-400">Birr</span></p>
                <p className="text-sm text-gray-500 font-medium">Standard residence fee</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-gray-500 uppercase tracking-wider text-xs">Total Payments</p>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-black text-gray-900 mb-1">{userPayments.length}</p>
                <p className="text-sm text-gray-500 font-medium">Submitted transactions</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-gray-500 uppercase tracking-wider text-xs">Total Paid</p>
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-3xl font-black text-indigo-600 mb-1">
                  {userPayments
                    .filter((p) => p.paymentStatus === 'verified')
                    .reduce((sum, p) => sum + p.amount, 0).toLocaleString()} 
                  <span className="text-lg font-bold text-indigo-400 ml-1">Birr</span>
                </p>
                <p className="text-sm text-gray-500 font-medium">Verified payments only</p>
              </div>
            </div>
          )}

          {/* Action Header */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 px-2">
              {showPaymentForm ? 'Secure Payment Portal' : 'Transaction History'}
            </h2>
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                showPaymentForm 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              {showPaymentForm ? 'Cancel Payment' : '+ Submit New Payment'}
            </button>
          </div>

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-blue-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-900 flex items-center">
                    <ShieldCheck className="w-6 h-6 mr-2 text-blue-600" />
                    Secure Transaction Submission
                  </h3>
                  <p className="text-sm text-blue-700 mt-1 font-medium">Please ensure all details match your bank receipt exactly.</p>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  
                  {/* Payment Type */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-700">
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      Payment Type *
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium"
                    >
                      <option value="application_fee">Application Fee</option>
                      <option value="residence_fee">Residence Fee (Monthly)</option>
                    </select>
                  </div>

                  {/* Payment Month */}
                  {paymentType === 'residence_fee' && (
                    <div className="space-y-2 animate-in fade-in">
                      <label className="flex items-center text-sm font-bold text-gray-700">
                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                        Payment Month *
                      </label>
                      <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-700">
                      <CreditCard className="w-4 h-4 mr-2 text-blue-500" />
                      Bank / Wallet Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium"
                    >
                      <option value="CBE">CBE (Commercial Bank of Ethiopia)</option>
                      <option value="CBE Birr">CBE Birr</option>
                      <option value="Tele Birr">Tele Birr</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-700">
                      <DollarSign className="w-4 h-4 mr-2 text-blue-500" />
                      Amount (Birr) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(parseInt(e.target.value))}
                        required
                        min="1"
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-900"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">ETB</span>
                    </div>
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <label className="flex items-center text-sm font-bold text-gray-700">
                      <ShieldCheck className="w-4 h-4 mr-2 text-blue-500" />
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                      placeholder={paymentMethod === 'Tele Birr' ? "e.g. FT26124F39" : "e.g. FT26124F3918"}
                      maxLength={paymentMethod === 'Tele Birr' ? 10 : 12}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-mono font-bold tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:font-normal"
                    />
                    <p className="text-xs text-gray-500 font-medium">Must be exactly {paymentMethod === 'Tele Birr' ? '10' : '12'} characters starting with "FT"</p>
                  </div>
                </div>

                {/* Screenshot Upload */}
                <div className="mb-8">
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                    <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />
                    Transaction Screenshot Receipt *
                  </label>
                  
                  <div 
                    className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                      screenshot ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/50'
                    }`}
                    onClick={() => !screenshot && fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                      required
                    />
                    
                    {screenshot ? (
                      <div className="flex flex-col items-center w-full z-10 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-sm">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="font-bold text-green-900 text-lg mb-1 px-4 text-center">{screenshot.name}</p>
                        <p className="text-sm font-bold text-green-700 bg-green-200/50 px-3 py-1 rounded-full mb-4">
                          {(screenshot.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); clearFile(); }}
                          className="flex items-center space-x-2 text-sm text-red-600 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Remove Screenshot</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center pointer-events-none">
                        <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-4 text-blue-500 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <p className="text-gray-900 font-bold text-lg mb-1">Click to upload screenshot</p>
                        <p className="text-gray-500 text-sm font-medium">JPEG, PNG, or JPG only</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmitting || !screenshot || (paymentMethod === 'Tele Birr' ? transactionId.length !== 10 : transactionId.length !== 12)}
                    className="w-full md:w-auto flex items-center justify-center space-x-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <ShieldCheck className={`w-6 h-6 ${isSubmitting ? 'animate-pulse' : ''}`} />
                    <span>{isSubmitting ? 'Verifying & Submitting...' : 'Submit Payment for Review'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment History List */}
          {!showPaymentForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {userPayments.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Transactions Yet</h3>
                  <p className="text-gray-500 font-medium">Your payment history will appear here once you submit a payment.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {userPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center space-x-4 mb-4 md:mb-0">
                        <div className={`p-3 rounded-full flex shrink-0 ${
                          payment.paymentStatus === 'verified' ? 'bg-green-100' :
                          payment.paymentStatus === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {payment.paymentStatus === 'verified' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : payment.paymentStatus === 'pending' ? (
                            <Clock className="w-6 h-6 text-yellow-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-gray-900 text-lg">
                              {payment.month || 'Application Fee'}
                            </p>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase tracking-wider">
                              {payment.paymentMethod}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 font-medium flex items-center mt-1">
                            {new Date(payment.paymentDate).toLocaleDateString(undefined, { 
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-0 border-gray-100 pt-4 md:pt-0">
                        <p className="font-black text-gray-900 text-xl">{payment.amount.toLocaleString()} <span className="text-sm text-gray-500">Birr</span></p>
                        <span
                          className={`mt-1 text-xs font-bold px-3 py-1 rounded-full border ${
                            payment.paymentStatus === 'verified'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : payment.paymentStatus === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {payment.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
