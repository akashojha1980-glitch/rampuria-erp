import React, { useRef, useState } from 'react';
import { X, Printer, CheckCircle, ShieldCheck, Download, Copy } from 'lucide-react';
import collegeLogo from '../assets/logo.png';

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

// Single Receipt Template block
const ReceiptBlock = ({ payment, studentData, copyType = 'STUDENT COPY' }) => {
  const amountPaid = Number(payment.amountPaid) || 0;
  const amountDue = Number(payment.amountDue) || 0;
  const wordsText = numberToWords(amountPaid);
  const now = new Date();
  const printTimestamp = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="border border-slate-400 p-5 bg-white text-slate-900 rounded-lg select-text">
      {/* ─── Institutional Header ─── */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b-2 border-slate-900">
        <div className="w-16 h-16 shrink-0 flex items-center justify-center">
          <img
            src={collegeLogo}
            alt="College Crest"
            className="w-16 h-16 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/logo.png';
            }}
          />
        </div>

        <div className="flex-1 text-center">
          <p className="text-[9px] font-bold tracking-widest text-slate-600 uppercase">
            ESTD. 1978 • RECOGNIZED BY UGC & BCI
          </p>
          <h1 className="text-lg sm:text-xl font-serif font-black tracking-tight uppercase text-slate-950 leading-tight">
            B.J.S. Rampuria Jain Law College
          </h1>
          <p className="text-[10px] font-bold text-slate-700 leading-snug">
            Affiliated to Maharaja Ganga Singh University (MGSU) & Dr. Bhimrao Ambedkar Law University (ALU)
          </p>
          <p className="text-[9.5px] text-slate-600">
            Near Fort, Bikaner - 334001 (Raj.) | Phone: 0151-2200115 | Email: info@rampurialaw.com
          </p>
        </div>

        <div className="w-20 shrink-0 text-right">
          <span className="inline-block px-2 py-0.5 border border-slate-900 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-900">
            {copyType}
          </span>
          <div className="text-[8.5px] text-slate-500 font-mono mt-1">
            CODE: MGSU-104
          </div>
        </div>
      </div>

      {/* ─── Receipt Subheading Banner ─── */}
      <div className="bg-slate-100 border-x border-b border-slate-300 py-1 px-3 flex items-center justify-between text-xs font-bold text-slate-900 mb-3">
        <span className="uppercase tracking-wide text-[11px]">
          FEE COLLECTION RECEIPT • {payment.academicSession || studentData.academicSession || '2025-26'}
        </span>
        <span className="font-mono text-slate-800">
          RECEIPT NO: <strong className="text-black font-black">{payment.receiptNo}</strong>
        </span>
      </div>

      {/* ─── Student Information Grid ─── */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 py-2 text-xs border-b border-slate-300">
        <div className="flex">
          <span className="w-28 font-bold text-slate-600">Scholar / Reg ID:</span>
          <span className="font-mono font-black text-slate-950">{studentData.registrationId || studentData.srNo || 'N/A'}</span>
        </div>
        <div className="flex">
          <span className="w-28 font-bold text-slate-600">Payment Date:</span>
          <span className="font-semibold text-slate-950 font-mono">{payment.paymentDate || new Date().toISOString().split('T')[0]}</span>
        </div>

        <div className="flex">
          <span className="w-28 font-bold text-slate-600">Student Name:</span>
          <span className="font-black text-slate-950 uppercase">{studentData.fullName || 'N/A'}</span>
        </div>
        <div className="flex">
          <span className="w-28 font-bold text-slate-600">Course & Year:</span>
          <span className="font-bold text-slate-900">{studentData.courseApplied || 'LL.B.'} • {payment.academicYear || studentData.currentYear || '1st Year'}</span>
        </div>

        <div className="flex">
          <span className="w-28 font-bold text-slate-600">Father's Name:</span>
          <span className="font-medium text-slate-800 uppercase">{studentData.fatherName || 'N/A'}</span>
        </div>
        <div className="flex">
          <span className="w-28 font-bold text-slate-600">Payment Mode:</span>
          <span className="font-bold text-slate-950 uppercase">{payment.paymentMode || 'Cash'} {payment.transactionNo ? `(Ref: ${payment.transactionNo})` : ''}</span>
        </div>
      </div>

      {/* ─── Fee Particulars Table ─── */}
      <div className="py-3">
        <table className="w-full text-xs border border-slate-400 border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-400 text-slate-900 font-bold uppercase text-[10px]">
              <th className="py-1.5 px-2 text-center w-10 border-r border-slate-400">#</th>
              <th className="py-1.5 px-3 text-left border-r border-slate-400">Fee Particulars / Installment Description</th>
              <th className="py-1.5 px-3 text-center border-r border-slate-400 w-28">Semester / Term</th>
              <th className="py-1.5 px-3 text-right w-32">Amount Paid (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-medium">
            <tr>
              <td className="py-2 px-2 text-center border-r border-slate-400 font-mono">1</td>
              <td className="py-2 px-3 border-r border-slate-400">
                <span className="font-bold text-slate-950 block">{payment.installmentName || 'College Tuition & Admission Fees'}</span>
                {payment.remarks && <span className="text-[10px] text-slate-500 italic block">{payment.remarks}</span>}
              </td>
              <td className="py-2 px-3 text-center border-r border-slate-400 font-medium">
                {payment.semester || studentData.currentSemester || 'Annual'}
              </td>
              <td className="py-2 px-3 text-right font-mono font-black text-slate-950 text-sm">
                ₹{amountPaid.toLocaleString('en-IN')}/-
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold">
              <td colSpan="3" className="py-1.5 px-3 text-right uppercase text-[11px] text-slate-800">
                Total Received Amount:
              </td>
              <td className="py-1.5 px-3 text-right font-mono text-sm font-black text-slate-950">
                ₹{amountPaid.toLocaleString('en-IN')}/-
              </td>
            </tr>
            {amountDue > 0 && (
              <tr className="bg-rose-50 border-t border-slate-300 text-rose-800 text-[10.5px]">
                <td colSpan="3" className="py-1 px-3 text-right font-bold">
                  Remaining Due Balance for Session:
                </td>
                <td className="py-1 px-3 text-right font-mono font-bold text-rose-700">
                  ₹{amountDue.toLocaleString('en-IN')}/-
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* ─── Amount in Words ─── */}
      <div className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded text-xs mb-3 flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-600">Amount in Words: </span>
          <span className="font-bold text-slate-950 italic">{wordsText}</span>
        </div>
      </div>

      {/* ─── Authorized Signatories & Seal ─── */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4 border-t border-slate-300 mt-2">
        <div className="flex flex-col items-center justify-end">
          <div className="w-28 border-b border-slate-800 mb-1 h-6"></div>
          <span className="text-[10px] font-bold text-slate-800 uppercase">Student / Depositor</span>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-10 border border-dashed border-slate-400 rounded flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            College Seal
          </div>
        </div>

        <div className="flex flex-col items-center justify-end">
          <div className="w-28 border-b border-slate-800 mb-1 h-6"></div>
          <span className="text-[10px] font-bold text-slate-800 uppercase">Authorised Cashier</span>
        </div>
      </div>

      {/* ─── ERP Footer ─── */}
      <div className="mt-3 pt-1 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500">
        <span>Pankh Gold College Management ERP v2.4.0</span>
        <span>* Computer generated receipt • Non-refundable</span>
        <span className="font-mono">Printed: {printTimestamp}</span>
      </div>
    </div>
  );
};

const PrintReceiptModal = ({ isOpen, onClose, payment, student }) => {
  const [dualCopy, setDualCopy] = useState(false);
  const printRef = useRef();

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentData = student || payment.student || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* Modal Container */}
      <div className="bg-white dark:bg-darkbg-surface w-full max-w-4xl rounded-2xl shadow-2xl border border-warm-200/60 dark:border-darkbg-border overflow-hidden my-6 flex flex-col">
        
        {/* Modal Controls Bar (Hidden during Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base no-print">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100">
                Official Institutional Fee Receipt
              </h3>
              <p className="text-xs text-warm-700 dark:text-slate-400">
                Receipt No: <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{payment.receiptNo}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setDualCopy(!dualCopy)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                dualCopy 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                  : 'bg-white dark:bg-darkbg-surface border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{dualCopy ? 'Dual Copy (Student + Office)' : 'Single Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt (A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-warm-100 dark:hover:bg-darkbg-base rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Area */}
        <div className="p-6 bg-white overflow-y-auto max-h-[80vh]" ref={printRef} id="printable-receipt">
          {dualCopy ? (
            <div className="space-y-6">
              <ReceiptBlock payment={payment} studentData={studentData} copyType="STUDENT COPY" />
              <div className="border-t-2 border-dashed border-slate-400 my-4 text-center relative">
                <span className="bg-white px-3 py-0.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest absolute -top-2.5 left-1/2 -translate-x-1/2">
                  ✂ Perforated Line • Fold / Cut Here ✂
                </span>
              </div>
              <ReceiptBlock payment={payment} studentData={studentData} copyType="OFFICE / ACCOUNTS COPY" />
            </div>
          ) : (
            <ReceiptBlock payment={payment} studentData={studentData} copyType="STUDENT COPY" />
          )}
        </div>

      </div>
    </div>
  );
};

export default PrintReceiptModal;
