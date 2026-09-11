import React, { useRef } from 'react';
import { X, Printer, CheckCircle, ShieldCheck, Download } from 'lucide-react';

// Number to English Words conversion helper
const numberToWords = (num) => {
  if (!num || isNaN(num) || num === 0) return 'Zero Rupees Only';
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(num);
  const words = inWords(integerPart);
  return `Rupees ${words} Only`;
};

const PrintReceiptModal = ({ isOpen, onClose, payment, student }) => {
  const printRef = useRef();

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentData = student || payment.student || {};
  const amountPaid = Number(payment.amountPaid) || 0;
  const amountDue = Number(payment.amountDue) || 0;
  const wordsText = numberToWords(amountPaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* Container */}
      <div className="bg-white dark:bg-darkbg-surface w-full max-w-3xl rounded-2xl shadow-2xl border border-warm-200/60 dark:border-darkbg-border overflow-hidden my-8 flex flex-col">
        
        {/* Modal Controls Header (Hidden during Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base no-print">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100">
                Official Fee Receipt Preview
              </h3>
              <p className="text-xs text-warm-700 dark:text-slate-400">
                Receipt No: <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{payment.receiptNo}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-warm-100 dark:hover:bg-darkbg-base rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Area */}
        <div className="p-8 bg-white text-slate-900 overflow-y-auto" ref={printRef} id="printable-receipt">
          
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <div className="flex items-center justify-center space-x-3 mb-1">
              <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-xl font-serif font-black text-xl">
                BJS
              </div>
              <div className="text-left">
                <h1 className="font-serif font-black text-xl tracking-tight text-slate-950 uppercase leading-tight">
                  B.J.S. Rampuria Jain Law College
                </h1>
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Affiliated to Maharaja Ganga Singh University (MGSU) | Approved by Bar Council of India (BCI)
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Near Fort, Bikaner - 334001 (Rajasthan) | Phone: 0151-2200115 | Email: info@rampurialaw.com
            </p>

            <div className="inline-block mt-3 px-4 py-0.5 border border-slate-900 rounded-full font-black text-xs uppercase tracking-widest bg-slate-100">
              Fee Collection Receipt (Student / Office Copy)
            </div>
          </div>

          {/* Receipt Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-300 text-xs">
            <div className="space-y-1.5">
              <div>
                <span className="font-bold text-slate-600">Receipt No: </span>
                <span className="font-mono font-black text-slate-950">{payment.receiptNo}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Student Name: </span>
                <span className="font-black text-slate-950 uppercase">{studentData.fullName || 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Father's Name: </span>
                <span className="font-semibold text-slate-800 uppercase">{studentData.fatherName || 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Scholar / Reg. No: </span>
                <span className="font-mono font-bold text-slate-900">{studentData.registrationId || studentData.srNo || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <div>
                <span className="font-bold text-slate-600">Date: </span>
                <span className="font-bold text-slate-900">{payment.paymentDate || new Date().toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Academic Session: </span>
                <span className="font-bold text-slate-900">{payment.academicSession || studentData.academicSession || '2025-26'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Course / Programme: </span>
                <span className="font-black text-slate-950">{studentData.courseApplied || 'LL.B. Course'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Year / Semester: </span>
                <span className="font-semibold text-slate-800">{payment.academicYear || studentData.currentYear || '1st Year'} ({payment.semester || studentData.currentSemester || 'Annual'})</span>
              </div>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="py-4">
            <table className="w-full text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3 text-left w-12 border-r border-slate-300">S.No.</th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-300">Fee Particulars / Head</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-300">Payment Mode</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-300">Ref / UTR No.</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="py-3 px-3 text-center border-r border-slate-300 font-mono">01</td>
                  <td className="py-3 px-3 border-r border-slate-300">
                    <span className="font-bold text-slate-900 block">{payment.installmentName || 'College Tuition & Admission Fees'}</span>
                    <span className="text-[10px] text-slate-500">{payment.remarks || 'Standard academic session installment fees'}</span>
                  </td>
                  <td className="py-3 px-3 text-center border-r border-slate-300 uppercase font-semibold">
                    {payment.paymentMode || 'Cash'}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-slate-300 font-mono text-[11px]">
                    {payment.transactionNo || payment.transactionRef || '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-950">
                    ₹{amountPaid.toLocaleString('en-IN')}/-
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-900 font-bold">
                  <td colSpan="4" className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-700">
                    Total Amount Received:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-slate-950">
                    ₹{amountPaid.toLocaleString('en-IN')}/-
                  </td>
                </tr>
                {amountDue > 0 && (
                  <tr className="bg-rose-50/50 border-t border-slate-200 text-rose-800 text-[11px]">
                    <td colSpan="4" className="py-1.5 px-3 text-right font-bold">
                      Outstanding Dues for this Term:
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700">
                      ₹{amountDue.toLocaleString('en-IN')}/-
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-bold text-slate-600">Amount in Words: </span>
            <span className="font-black text-slate-900 italic">{wordsText}</span>
          </div>

          {/* Terms & Signatures Box */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-400 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="flex flex-col justify-end items-center h-20">
              <div className="w-36 border-t border-slate-700 pt-1 text-[11px] font-bold text-slate-800">
                Student Signature
              </div>
            </div>

            <div className="flex flex-col justify-end items-center h-20">
              <div className="w-24 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                College Seal
              </div>
            </div>

            <div className="flex flex-col justify-end items-center h-20">
              <div className="w-36 border-t border-slate-700 pt-1 text-[11px] font-bold text-slate-800">
                Authorised Cashier
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center text-[9px] text-slate-400 border-t border-slate-200 pt-2">
            * This is a computer-generated official receipt. Fees once paid are non-refundable under college rules.
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrintReceiptModal;
