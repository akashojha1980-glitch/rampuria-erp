import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, User, X, Sparkles } from 'lucide-react';

const SearchableStudentSelect = ({ 
  students = [], 
  value, 
  onChange, 
  placeholder = "-- Search & Select Registered Student --",
  label = "Select Registered Student"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const selectedStudent = students.find(s => (s._id || s.id) === value);

  // Filter students based on searchTerm
  const filteredStudents = students.filter(s => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.fullName && s.fullName.toLowerCase().includes(term)) ||
      (s.registrationId && s.registrationId.toLowerCase().includes(term)) ||
      (s.courseApplied && s.courseApplied.toLowerCase().includes(term)) ||
      (s.mobileNumber && s.mobileNumber.includes(term)) ||
      (s.fatherName && s.fatherName.toLowerCase().includes(term))
    );
  });

  const handleSelect = (studentId) => {
    onChange(studentId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-warm-900 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500/20 bg-white dark:bg-darkbg-surface shadow-md'
            : 'border-warm-200 dark:border-darkbg-border bg-warm-50/70 dark:bg-darkbg-base hover:bg-white dark:hover:bg-darkbg-surface'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {selectedStudent ? (selectedStudent.fullName?.[0] || 'S') : <User className="w-4 h-4" />}
          </div>
          {selectedStudent ? (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-warm-900 dark:text-slate-100 truncate">
                  {selectedStudent.fullName}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-300 text-[10px] font-mono font-bold">
                  {selectedStudent.registrationId}
                </span>
              </div>
              <span className="text-[10px] text-warm-800/60 dark:text-slate-400 truncate">
                {selectedStudent.courseApplied} • S/o {selectedStudent.fatherName || 'N/A'} • {selectedStudent.academicSession}
              </span>
            </div>
          ) : (
            <span className="text-xs text-warm-800/50 dark:text-slate-500 font-medium">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
          {selectedStudent && (
            <span 
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-500' : ''}`} />
        </div>
      </button>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-darkbg-surface rounded-2xl border border-warm-200 dark:border-darkbg-border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Search Header Bar */}
          <div className="p-3 bg-warm-50 dark:bg-darkbg-base border-b border-warm-200/50 dark:border-darkbg-border flex items-center space-x-2">
            <Search className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, Reg ID, Mobile, Father..."
              className="w-full bg-transparent text-xs text-warm-900 dark:text-slate-100 placeholder-warm-800/40 dark:placeholder-slate-500 outline-none font-medium"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Counter */}
          <div className="px-3.5 py-1.5 bg-warm-100/40 dark:bg-darkbg-base/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-warm-100 dark:border-darkbg-border">
            <span>{filteredStudents.length} Students Available</span>
            <span>Click to select</span>
          </div>

          {/* Scrollable Students List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-warm-100 dark:divide-darkbg-border custom-scrollbar">
            {filteredStudents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-warm-900 dark:text-slate-200">No matching students found</p>
                <p className="text-[11px]">Try searching with a different name or registration ID.</p>
              </div>
            ) : (
              filteredStudents.map((s) => {
                const sId = s._id || s.id;
                const isSelected = sId === value;

                return (
                  <button
                    key={sId}
                    type="button"
                    onClick={() => handleSelect(sId)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold'
                        : 'hover:bg-warm-100/50 dark:hover:bg-darkbg-base text-warm-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isSelected 
                          ? 'bg-brand-500 text-white shadow-sm' 
                          : 'bg-warm-200/60 dark:bg-darkbg-border text-slate-700 dark:text-slate-300'
                      }`}>
                        {s.fullName?.[0] || 'S'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold truncate">{s.fullName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-darkbg-border text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">
                            {s.registrationId}
                          </span>
                        </div>
                        <span className="text-[10px] text-warm-800/60 dark:text-slate-400 truncate">
                          {s.courseApplied} • S/o {s.fatherName || 'N/A'} • {s.academicSession}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableStudentSelect;