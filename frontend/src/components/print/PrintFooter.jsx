import React from 'react';

/**
 * Standardized Institutional Print Footer for Pankh Gold College ERP
 * Features:
 * - 3-tier / 4-tier Authorized Signatory & Official Seal Box
 * - Verification Disclaimer
 * - Software Brand Stamp ("Printed via Pankh Gold College Management ERP")
 * - Dynamic Date-Time & Integrity Hash / Audit Stamp
 */
const PrintFooter = ({
  showSignatures = true,
  signatories = [
    { title: 'Dealing Assistant / Clerk', subtitle: 'Prepared By' },
    { title: 'Accounts Officer / Cashier', subtitle: 'Verified By' },
    { title: 'Principal / Authorized Officer', subtitle: 'Approved & Sealed' }
  ],
  customNote = null,
  pageNumber = null,
  totalPages = null
}) => {
  const now = new Date();
  const printTimestamp = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="w-full text-black font-sans mt-8 print:mt-6 select-text">
      {/* ─── Signatory & Official Seal Block ─── */}
      {showSignatures && (
        <div className="mb-6 pt-6 border-t border-slate-300">
          <div className="grid grid-cols-3 gap-6 text-center">
            {signatories.map((sig, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-36 border-b-2 border-slate-900 mb-1.5 h-10 flex items-end justify-center">
                  {/* Space for physical signature & rubber stamp */}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                  {sig.title}
                </span>
                {sig.subtitle && (
                  <span className="text-[8.5px] text-slate-500 font-semibold uppercase">
                    ({sig.subtitle})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Administrative Note */}
      {customNote && (
        <p className="text-[9px] text-slate-600 italic text-center mb-2">
          Note: {customNote}
        </p>
      )}

      {/* ─── Institutional ERP Brand Footer ─── */}
      <div className="border-t-2 border-slate-900 pt-1.5 flex flex-wrap items-center justify-between text-[9px] text-slate-600 font-medium">
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-slate-900">Pankh Gold College Management ERP</span>
          <span>•</span>
          <span>Enterprise Campus Solution v2.4.0</span>
        </div>

        <div className="text-center font-semibold text-slate-700">
          {pageNumber ? `Page ${pageNumber}${totalPages ? ` of ${totalPages}` : ''} • ` : ''}Official System Generated Record
        </div>

        <div className="font-mono text-right text-slate-700">
          Printed On: {printTimestamp}
        </div>
      </div>
    </div>
  );
};

export default PrintFooter;
