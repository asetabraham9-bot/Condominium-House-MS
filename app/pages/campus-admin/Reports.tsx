import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { FileText, Upload, Calendar, AlignLeft, Info, CheckCircle, UploadCloud, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { API_BASE_URL } from '../../lib/apiBase';

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reportType, setReportType] = useState('residents_report');
  const [description, setDescription] = useState('');
  const [generatedDate, setGeneratedDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'campus_admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !user?.campusId) {
      toast.error('Session error. Missing user or campus ID.');
      return;
    }

    if (!description.trim()) {
      toast.error('Please provide a description for the report.');
      return;
    }

    if (!file) {
      toast.error('Please attach a report document file.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('uploader_id', user.id);
    formData.append('campus_id', user.campusId);
    formData.append('report_type', reportType);
    formData.append('description', description);
    formData.append('generated_date', generatedDate);
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/reports/create.php`, {
        method: 'POST',
        // Note: Do not set Content-Type header when sending FormData, the browser sets it with boundaries automatically
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || 'Failed to submit report');
        return;
      }

      toast.success('Report submitted successfully to System Admin.');
      
      // Reset form
      setReportType('residents_report');
      setDescription('');
      setGeneratedDate(new Date().toISOString().split('T')[0]);
      clearFile();
      
    } catch (err) {
      toast.error('Network error occurred while uploading the report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout role="campus_admin">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm border border-blue-200">
              <UploadCloud className="w-7 h-7 text-blue-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Submit System Report</h1>
              <p className="text-gray-500 mt-1">Upload and submit campus data reports for CHMS Admin review</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)] border border-blue-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-6">
              <h2 className="text-xl font-bold text-blue-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Report Details
              </h2>
              <p className="text-sm text-blue-700 mt-1">Please fill in all required fields to attach your report document securely.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Report Type */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-gray-700">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    Report Category *
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    required
                  >
                    <option value="residents_report">Residents Report</option>
                    <option value="payments_report">Payments Report</option>
                    <option value="house_inventory_report">House Inventory Report</option>
                    <option value="maintenance_report">Maintenance Report</option>
                    <option value="general_summary">General Summary</option>
                  </select>
                </div>

                {/* Generated Date */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    Generated Date *
                  </label>
                  <input
                    type="date"
                    value={generatedDate}
                    onChange={(e) => setGeneratedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-gray-700">
                  <AlignLeft className="w-4 h-4 mr-2 text-gray-400" />
                  Report Description / Summary *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief summary of what this report contains..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
                  required
                />
              </div>

              {/* File Upload Area */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-gray-700">
                  <Upload className="w-4 h-4 mr-2 text-gray-400" />
                  Attach Report File *
                </label>
                
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                    file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/50'
                  }`}
                  onClick={() => !file && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center w-full z-10">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="font-bold text-green-900 text-lg mb-1 break-all px-4 text-center">{file.name}</p>
                      <p className="text-sm font-medium text-green-700 bg-green-100/50 px-3 py-1 rounded-full mb-4">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        className="flex items-center space-x-2 text-sm text-red-600 font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Remove File</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center pointer-events-none">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-gray-900 font-bold text-lg mb-1">Click to browse or drag file here</p>
                      <p className="text-gray-500 text-sm">Supported formats: PDF, DOCX, XLSX, CSV</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Information / Disclaimer */}
              <div className="bg-yellow-50/80 rounded-xl p-4 border border-yellow-200/60 flex items-start space-x-3">
                <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 leading-relaxed font-medium">
                  Once submitted, this report will be flagged as "Pending" until the CHMS System Admin reviews and approves it. You will be notified if the report is rejected due to formatting or data errors.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="w-full md:w-auto md:min-w-[200px] flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] ml-auto"
                >
                  <UploadCloud className={`w-5 h-5 ${isSubmitting ? 'animate-bounce' : ''}`} />
                  <span>{isSubmitting ? 'Uploading Report...' : 'Submit Report'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
