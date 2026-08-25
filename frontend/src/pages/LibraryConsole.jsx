import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BookOpen, Plus, Search, Calendar, FileText, 
  User, CheckCircle, Clock, Trash2, Edit, AlertCircle, X, Check,
  Settings, EyeOff, Eye
} from 'lucide-react';
import Loading from '../components/Loading';
import Toast from '../components/Toast';

const LibraryConsole = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('catalog');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeIssues: 0,
    overdueIssues: 0,
    totalFines: 0
  });

  // Book Catalog States
  const [books, setBooks] = useState([]);
  const [bookSearch, setBookSearch] = useState('');
  const [bookPage, setBookPage] = useState(1);
  const [bookPages, setBookPages] = useState(1);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    bookNo: '',
    title: '',
    author: '',
    publisher: '',
    subject: '',
    totalCopies: 1,
    shelfLocation: '',
    remarks: '',
    price: '',
    isHidden: false
  });

  // Library settings states
  const [defaultBookPrice, setDefaultBookPrice] = useState(400);
  const [savingSettings, setSavingSettings] = useState(false);

  // Transaction Issue/Return States
  const [issues, setIssues] = useState([]);
  const [issueSearch, setIssueSearch] = useState('');
  const [issueStatusFilter, setIssueStatusFilter] = useState('Issued');
  const [issuePage, setIssuePage] = useState(1);
  const [issuePages, setIssuePages] = useState(1);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeReturnIssue, setActiveReturnIssue] = useState(null);
  const [returnForm, setReturnForm] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Issue Book Form States
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString().split('T')[0];
    })(),
    remarks: ''
  });

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/library/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/library/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDefaultBookPrice(data.defaultBookPrice || 400);
      }
    } catch (err) {
      console.error('[Settings fetch] error:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/library/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ defaultBookPrice })
      });
      if (res.ok) {
        showToastMsg('Library settings saved successfully!');
      } else {
        showToastMsg('Failed to save library settings', 'error');
      }
    } catch (err) {
      console.error('[Settings save] error:', err);
      showToastMsg('Database connection error', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchBooks = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/library/books?search=${bookSearch}&page=${bookPage}&includeHidden=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBooks(data.books);
        setBookPages(data.pages);
      }
    } catch (err) {
      showToastMsg('Database connection offline', 'error');
    }
  };

  const fetchIssues = async () => {
    const token = localStorage.getItem('token');
    try {
      const url = `/api/library/issues?status=${issueStatusFilter}&search=${issueSearch}&page=${issuePage}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setIssues(data.issues);
        setIssuePages(data.pages);
      }
    } catch (err) {
      showToastMsg('Database offline', 'error');
    }
  };

  // Autocomplete student lookup
  const searchStudents = async (query) => {
    if (!query) {
      setStudentResults([]);
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students?search=${query}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudentResults(data.students);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Autocomplete book lookup
  const searchBooksLookup = async (query) => {
    if (!query) {
      setBookResults([]);
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/library/books?search=${query}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBookResults(data.books);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      await fetchStats();
      await fetchSettings();
      await fetchBooks();
      setLoading(false);
    };
    loadDashboard();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const studentId = searchParams.get('studentId');
    if (studentId) {
      const fetchSelectedStudent = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`/api/students/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setSelectedStudent(data);
            setStudentQuery(data.fullName);
            setActiveTab('issueForm');
          }
        } catch (err) {
          console.error('[LibraryConsole] Prefill fetch error:', err);
        }
      };
      fetchSelectedStudent();
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchBooks();
    } else if (activeTab === 'issues') {
      fetchIssues();
    }
  }, [activeTab, bookSearch, bookPage, issueSearch, issueStatusFilter, issuePage]);

  // Book Add / Edit Handler
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const method = editingBook ? 'PUT' : 'POST';
    const url = editingBook ? `/api/library/books/${editingBook._id}` : '/api/library/books';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg(editingBook ? 'Book details updated' : 'Book added to catalog successfully');
        setShowBookModal(false);
        fetchBooks();
        fetchStats();
      } else {
        showToastMsg(data.message || 'Error processing book details', 'error');
      }
    } catch (err) {
      showToastMsg('Database connection offline', 'error');
    }
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book from the catalog?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/library/books/${bookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg('Book deleted successfully');
        fetchBooks();
        fetchStats();
      } else {
        showToastMsg(data.message || 'Error deleting book', 'error');
      }
    } catch (err) {
      showToastMsg('Database offline', 'error');
    }
  };

  const toggleBookVisibility = async (book) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/library/books/${book.id || book._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isHidden: !book.isHidden })
      });
      if (res.ok) {
        showToastMsg(book.isHidden ? 'Book is now visible in checkout' : 'Book is now hidden from checkout');
        fetchBooks();
      } else {
        showToastMsg('Failed to change book visibility', 'error');
      }
    } catch (err) {
      console.error(err);
      showToastMsg('Connection error', 'error');
    }
  };

  // Issue Book Handler
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      showToastMsg('Please select a student first', 'error');
      return;
    }
    if (selectedBooks.length === 0) {
      showToastMsg('Please select at least one book first', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/library/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent._id,
          bookNos: selectedBooks.map(b => b.bookNo),
          issueDate: checkoutForm.issueDate,
          dueDate: checkoutForm.dueDate,
          remarks: checkoutForm.remarks
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.errors && data.errors.length > 0) {
          showToastMsg(`Partially issued. Issues: ${data.issued.length}. Errors: ${data.errors.join(', ')}`, 'warning');
        } else {
          showToastMsg('Books issued successfully!');
        }
        setSelectedStudent(null);
        setSelectedBooks([]);
        setStudentQuery('');
        setBookQuery('');
        setCheckoutForm({
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 14);
            return d.toISOString().split('T')[0];
          })(),
          remarks: ''
        });
        setActiveTab('issues');
        fetchStats();
      } else {
        showToastMsg(data.message || 'Error issuing books', 'error');
      }
    } catch (err) {
      showToastMsg('Database offline', 'error');
    }
  };

  // Return Book Handler
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/library/return/${activeReturnIssue._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(returnForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg(data.fineAmount > 0 
          ? `Book returned successfully. Late fine of ₹${data.fineAmount} charged.` 
          : 'Book returned successfully.'
        );
        setShowReturnModal(false);
        fetchIssues();
        fetchStats();
      } else {
        showToastMsg(data.message || 'Error returning book', 'error');
      }
    } catch (err) {
      showToastMsg('Database offline', 'error');
    }
  };

  // Mark Book as Lost
  const markAsLost = async (issueId) => {
    if (!window.confirm('Are you sure you want to mark this book as LOST? This will charge a standard ₹500 replacement fine to the student.')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/library/lost/${issueId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg('Book marked as lost. Replacement fine charged.');
        fetchIssues();
        fetchStats();
      } else {
        showToastMsg(data.message || 'Error updating status', 'error');
      }
    } catch (err) {
      showToastMsg('Database offline', 'error');
    }
  };

  const openBookModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setBookForm({
        bookNo: book.bookNo,
        title: book.title,
        author: book.author,
        publisher: book.publisher || '',
        subject: book.subject || '',
        totalCopies: book.totalCopies,
        shelfLocation: book.shelfLocation || '',
        remarks: book.remarks || '',
        price: book.price !== null && book.price !== undefined ? book.price : '',
        isHidden: book.isHidden === true
      });
    } else {
      setEditingBook(null);
      setBookForm({
        bookNo: '',
        title: '',
        author: '',
        publisher: '',
        subject: '',
        totalCopies: 1,
        shelfLocation: '',
        remarks: '',
        price: '',
        isHidden: false
      });
    }
    setShowBookModal(true);
  };

  const getOverdueDays = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date(new Date().toISOString().split('T')[0]);
    if (today > due) {
      const diffTime = Math.abs(today - due);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  if (loading) {
    return <Loading size="lg" text="Loading Library Inventory and Console..." />;
  }

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Toast message alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white uppercase leading-none">Library Management Console</h2>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Issue books, manage catalog lists, and verify checkout histories.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openBookModal(null)}
            className="classy-btn-primary py-2.5 text-xs font-bold flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book to Catalog</span>
          </button>
        </div>
      </div>

      {/* Financial stats summaries */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Books */}
        <div className="classy-card p-4 flex items-center space-x-4">
          <div className="p-3 bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 rounded-2xl flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Catalog Books</span>
            <strong className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 block">{stats.totalBooks}</strong>
          </div>
        </div>

        {/* Checked Out */}
        <div className="classy-card p-4 flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-2xl flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Checkouts</span>
            <strong className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{stats.activeIssues}</strong>
          </div>
        </div>

        {/* Overdue Checkouts */}
        <div className="classy-card p-4 flex items-center space-x-4 border-l-4 border-l-rose-500">
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 rounded-2xl flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Returns</span>
            <strong className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block">{stats.overdueIssues}</strong>
          </div>
        </div>

        {/* Fines Collected */}
        <div className="classy-card p-4 flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-2xl flex-shrink-0">
            <span className="text-lg font-extrabold">₹</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penalty Fines Collected</span>
            <strong className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">₹{stats.totalFines.toLocaleString()}/-</strong>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-warm-200/40 dark:border-darkbg-border flex space-x-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 transition-colors relative ${activeTab === 'catalog' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Book Catalog Inventory
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`pb-3 transition-colors relative ${activeTab === 'issues' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Active Issues & History
        </button>
        <button
          onClick={() => setActiveTab('issueForm')}
          className={`pb-3 transition-colors relative ${activeTab === 'issueForm' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Issue New Book
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 transition-colors relative ${activeTab === 'settings' ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Library Settings
        </button>
      </div>

      {/* ─── TAB CONTENT 1: BOOK CATALOG ─── */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col space-y-4">
          
          {/* Search bar options */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <span className="absolute left-3.5 top-3.5 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => { setBookSearch(e.target.value); setBookPage(1); }}
                placeholder="Search catalog by title, author, or book accession no..."
                className="classy-input"
                style={{ paddingLeft: '2.6rem' }}
              />
            </div>
          </div>

          {/* Catalog Table */}
          <div className="classy-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200/30 dark:divide-darkbg-border text-xs text-left">
                <thead className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Accession No</th>
                    <th className="px-5 py-3.5">Book Title</th>
                    <th className="px-5 py-3.5">Author</th>
                    <th className="px-5 py-3.5">Price</th>
                    <th className="px-5 py-3.5">Subject</th>
                    <th className="px-5 py-3.5 text-center">Available / Total Copies</th>
                    <th className="px-5 py-3.5">Shelf Location</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border font-medium text-slate-700 dark:text-slate-300">
                  {books.length > 0 ? (
                    books.map((book) => (
                      <tr key={book.id || book._id} className="hover:bg-warm-50/30 dark:hover:bg-darkbg-surface/30 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-brand-600 dark:text-brand-400">#{book.bookNo}</td>
                        <td className="px-5 py-4 font-bold text-warm-900 dark:text-slate-200">
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1.5">
                              {book.title}
                              {book.isHidden && (
                                <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-250/20 rounded font-bold text-[8px] tracking-wide uppercase">Hidden</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">{book.author}</td>
                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                          {book.price ? `₹${book.price}` : `₹${defaultBookPrice} (Default)`}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md font-bold text-[10px] uppercase">{book.subject || 'Law'}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${
                            book.availableCopies === 0 
                              ? 'bg-rose-550/10 text-rose-500' 
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {book.availableCopies} / {book.totalCopies}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold">{book.shelfLocation || '-'}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => toggleBookVisibility(book)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                book.isHidden 
                                  ? 'hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-500' 
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
                              }`}
                              title={book.isHidden ? "Unhide book from checkout" : "Hide book from checkout"}
                            >
                              {book.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openBookModal(book)}
                              className="p-1.5 hover:bg-brand-50 dark:hover:bg-brand-950/20 text-brand-600 dark:text-brand-400 rounded-lg transition-colors"
                              title="Edit book properties"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteBook(book.id || book._id)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg transition-colors"
                              title="Remove book from library"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                        <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No books matching your query found in the library catalog.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {bookPages > 1 && (
            <div className="flex items-center justify-between border-t border-warm-200/30 dark:border-darkbg-border pt-4">
              <span className="text-xs text-slate-400 font-medium">Page {bookPage} of {bookPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={bookPage === 1}
                  onClick={() => setBookPage(prev => Math.max(1, prev - 1))}
                  className="classy-btn-secondary py-1.5 px-3 text-xs"
                >
                  Previous
                </button>
                <button
                  disabled={bookPage === bookPages}
                  onClick={() => setBookPage(prev => Math.min(bookPages, prev + 1))}
                  className="classy-btn-secondary py-1.5 px-3 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT 2: ACTIVE ISSUES & HISTORY ─── */}
      {activeTab === 'issues' && (
        <div className="flex flex-col space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <span className="absolute left-3.5 top-3.5 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={issueSearch}
                onChange={(e) => { setIssueSearch(e.target.value); setIssuePage(1); }}
                placeholder="Search transaction logs by Student Name or Reg ID..."
                className="classy-input"
                style={{ paddingLeft: '2.6rem' }}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status filter:</label>
              <select
                value={issueStatusFilter}
                onChange={(e) => { setIssueStatusFilter(e.target.value); setIssuePage(1); }}
                className="classy-input py-2.5 text-xs w-40"
              >
                <option value="Issued">Active Issues</option>
                <option value="Returned">Returned Books</option>
                <option value="Lost">Lost Books</option>
                <option value="">All Transactions</option>
              </select>
            </div>
          </div>

          {/* Issues Logs Table */}
          <div className="classy-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200/30 dark:divide-darkbg-border text-xs text-left">
                <thead className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Student Details</th>
                    <th className="px-5 py-3.5">Book Acc. No</th>
                    <th className="px-5 py-3.5">Title / Author</th>
                    <th className="px-5 py-3.5">Issue Date</th>
                    <th className="px-5 py-3.5">Due Date</th>
                    <th className="px-5 py-3.5">Return Date</th>
                    <th className="px-5 py-3.5">Fine Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    {issueStatusFilter === 'Issued' && <th className="px-5 py-3.5 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border font-medium text-slate-700 dark:text-slate-300">
                  {issues.length > 0 ? (
                    issues.map((issue) => {
                      const overdueDays = issue.status === 'Issued' ? getOverdueDays(issue.dueDate) : 0;
                      return (
                        <tr key={issue.id || issue._id} className="hover:bg-warm-50/30 dark:hover:bg-darkbg-surface/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-warm-900 dark:text-slate-200">{issue.student?.fullName}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Reg ID: {issue.student?.registrationId} • SR: #{issue.student?.srNo}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            #{issue.book?.bookNo}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-warm-850 dark:text-slate-400">{issue.book?.title}</span>
                              <span className="text-[10px] text-slate-400 italic mt-0.5">By {issue.book?.author}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                            {new Date(issue.issueDate).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                            {new Date(issue.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                            {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-5 py-4 font-bold">
                            {issue.fineAmount > 0 ? (
                              <span className="text-rose-500">₹{issue.fineAmount}</span>
                            ) : (
                              <span className="text-slate-400">Nil</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap inline-block ${
                              issue.status === 'Returned' 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-550/15 dark:text-emerald-400'
                                : issue.status === 'Lost'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-550/15 dark:text-rose-400'
                                : overdueDays > 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-550/15 dark:text-indigo-400'
                            }`}>
                              {issue.status === 'Issued' && overdueDays > 0 ? `Overdue (${overdueDays} Days)` : issue.status}
                            </span>
                          </td>
                          {issueStatusFilter === 'Issued' && (
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-2.5">
                                <button
                                  onClick={() => {
                                    setActiveReturnIssue(issue);
                                    setReturnForm({
                                      returnDate: new Date().toISOString().split('T')[0],
                                      remarks: ''
                                    });
                                    setShowReturnModal(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm shadow-emerald-500/10"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Return</span>
                                </button>
                                <button
                                  onClick={() => markAsLost(issue.id || issue._id)}
                                  className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm shadow-rose-500/10"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Lost</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-5 py-8 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No active issues or history logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {issuePages > 1 && (
            <div className="flex items-center justify-between border-t border-warm-200/30 dark:border-darkbg-border pt-4">
              <span className="text-xs text-slate-400 font-medium">Page {issuePage} of {issuePages}</span>
              <div className="flex gap-2">
                <button
                  disabled={issuePage === 1}
                  onClick={() => setIssuePage(prev => Math.max(1, prev - 1))}
                  className="classy-btn-secondary py-1.5 px-3 text-xs"
                >
                  Previous
                </button>
                <button
                  disabled={issuePage === issuePages}
                  onClick={() => setIssuePage(prev => Math.min(issuePages, prev + 1))}
                  className="classy-btn-secondary py-1.5 px-3 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT 3: ISSUE NEW BOOK FORM ─── */}
      {activeTab === 'issueForm' && (
        <div className="classy-card max-w-xl mx-auto flex flex-col space-y-6">
          <div className="flex items-center space-x-3 border-b border-warm-100 dark:border-darkbg-border pb-3.5">
            <BookOpen className="w-5 h-5 text-brand-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-warm-900 dark:text-white">Issue Book Registry</h3>
          </div>

          <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs font-semibold text-warm-850 dark:text-slate-200">
            
            {/* Student search input autocomplete */}
            <div className="flex flex-col space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Student (Search by Name / Reg ID) *</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => {
                    setStudentQuery(e.target.value);
                    searchStudents(e.target.value);
                    if (selectedStudent) setSelectedStudent(null);
                  }}
                  placeholder={selectedStudent ? selectedStudent.fullName : "e.g. Akash Sharma..."}
                  className="classy-input"
                  style={{ paddingLeft: '2.4rem' }}
                  required={!selectedStudent}
                />
                {selectedStudent && (
                  <span className="absolute right-3.5 top-3 flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    ✓ SELECTED
                  </span>
                )}
              </div>
              
              {/* Autocomplete list dropdown */}
              {studentResults.length > 0 && (
                <div className="absolute top-[102%] left-0 right-0 z-30 bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border shadow-xl rounded-xl divide-y divide-warm-100 dark:divide-darkbg-border max-h-48 overflow-y-auto">
                  {studentResults.map((std) => (
                    <button
                      key={std.id || std._id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(std);
                        setStudentQuery(std.fullName);
                        setStudentResults([]);
                      }}
                      className="w-full text-left p-3 hover:bg-warm-50 dark:hover:bg-darkbg-base transition-colors flex justify-between items-center"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-warm-900 dark:text-slate-200">{std.fullName}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Reg ID: {std.registrationId} • Course: {std.courseApplied}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">SR #{std.srNo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Book search input autocomplete */}
            <div className="flex flex-col space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Books (Search by Title / Accession No) *</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={bookQuery}
                  onChange={(e) => {
                    setBookQuery(e.target.value);
                    searchBooksLookup(e.target.value);
                  }}
                  placeholder={selectedBooks.length > 0 ? `Selected ${selectedBooks.length} book(s)` : "e.g. Constitutional Law..."}
                  className="classy-input"
                  style={{ paddingLeft: '2.4rem' }}
                  required={selectedBooks.length === 0}
                />
                {selectedBooks.length > 0 && (
                  <span className="absolute right-3.5 top-3 flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    ✓ {selectedBooks.length} SELECTED
                  </span>
                )}
              </div>

              {/* Selected Books Tags */}
              {selectedBooks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 pb-1">
                  {selectedBooks.map((bk) => (
                    <span 
                      key={bk.id || bk._id} 
                      className="flex items-center gap-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-brand-500/20"
                    >
                      <span>#{bk.bookNo} - {bk.title}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedBooks(prev => prev.filter(b => b._id !== bk._id && b.id !== bk.id))}
                        className="p-0.5 hover:bg-brand-500/20 rounded text-slate-400 hover:text-rose-500 transition-colors font-black leading-none"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Autocomplete list dropdown */}
              {bookResults.length > 0 && (
                <div className="absolute top-[102%] left-0 right-0 z-30 bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border shadow-xl rounded-xl divide-y divide-warm-100 dark:divide-darkbg-border max-h-48 overflow-y-auto">
                  {bookResults.map((bk) => {
                    const isAlreadySelected = selectedBooks.some(b => b.id === bk.id || b._id === bk._id);
                    return (
                      <button
                        key={bk.id || bk._id}
                        type="button"
                        disabled={bk.availableCopies <= 0 || isAlreadySelected}
                        onClick={() => {
                          setSelectedBooks(prev => [...prev, bk]);
                          setBookQuery('');
                          setBookResults([]);
                        }}
                        className={`w-full text-left p-3 hover:bg-warm-50 dark:hover:bg-darkbg-base transition-colors flex justify-between items-center ${(bk.availableCopies <= 0 || isAlreadySelected) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-warm-900 dark:text-slate-200">{bk.title}</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">Author: {bk.author} • Subject: {bk.subject}</span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[9px] font-mono font-bold text-indigo-500">#{bk.bookNo}</span>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-bold">
                            {isAlreadySelected ? 'Already Selected' : `Avail: ${bk.availableCopies}/${bk.totalCopies}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dates grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Date *</label>
                <input
                  type="date"
                  value={checkoutForm.issueDate}
                  onChange={(e) => {
                    const newIssueDate = e.target.value;
                    const d = new Date(newIssueDate);
                    d.setDate(d.getDate() + 14);
                    setCheckoutForm(prev => ({
                      ...prev,
                      issueDate: newIssueDate,
                      dueDate: d.toISOString().split('T')[0]
                    }));
                  }}
                  className="classy-input"
                  required
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Return Due Date *</label>
                <input
                  type="date"
                  value={checkoutForm.dueDate}
                  onChange={(e) => setCheckoutForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="classy-input"
                  required
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Notes</label>
              <textarea
                value={checkoutForm.remarks}
                onChange={(e) => setCheckoutForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter issue instructions or notes..."
                className="classy-input h-20 resize-none py-2"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="classy-btn-primary py-2.5 px-6 font-bold flex items-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Confirm Book Checkout</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB CONTENT 4: LIBRARY SETTINGS ─── */}
      {activeTab === 'settings' && (
        <div className="classy-card max-w-lg p-6 flex flex-col space-y-6 animate-fade-in no-print">
          <div className="border-b border-warm-100 dark:border-darkbg-border pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-warm-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-500" />
              Library System Configuration
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
              Manage global penalties and replacements for the college catalog
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Default Book Replacement Price (₹) *
              </label>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                This price is charged automatically if a book without an individual price set is marked as "Lost" in the system.
              </p>
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-3 text-warm-650 font-bold text-sm select-none">₹</span>
                <input
                  type="number"
                  value={defaultBookPrice}
                  onChange={(e) => setDefaultBookPrice(e.target.value)}
                  className="classy-input font-bold"
                  style={{ paddingLeft: '3rem' }}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-warm-100 dark:border-darkbg-border flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="classy-btn-primary py-2.5 px-6 font-bold flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* ADD / EDIT BOOK INVENTORY MODAL           */}
      {/* ========================================== */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col space-y-5">
            
            <div className="flex justify-between items-center border-b border-warm-100 dark:border-darkbg-border pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-warm-900 dark:text-white">
                {editingBook ? 'Modify Book Registry' : 'Add Book to Catalog'}
              </h3>
              <button 
                onClick={() => setShowBookModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-border"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4 text-xs font-semibold text-warm-850 dark:text-slate-200">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Accession No */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accession / Barcode No *</label>
                  <input
                    type="text"
                    value={bookForm.bookNo}
                    onChange={(e) => setBookForm(prev => ({ ...prev, bookNo: e.target.value }))}
                    placeholder="e.g. B-5049"
                    className="classy-input"
                    required
                  />
                </div>

                {/* Subject */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Classification *</label>
                  <input
                    type="text"
                    value={bookForm.subject}
                    onChange={(e) => setBookForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. Constitutional Law"
                    className="classy-input"
                    required
                  />
                </div>
              </div>

              {/* Title */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Book Title *</label>
                <input
                  type="text"
                  value={bookForm.title}
                  onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Principles of Law of Torts"
                  className="classy-input"
                  required
                />
              </div>

              {/* Author */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Author Full Name *</label>
                <input
                  type="text"
                  value={bookForm.author}
                  onChange={(e) => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="e.g. Dr. R.K. Bangia"
                  className="classy-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Publisher */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Publisher</label>
                  <input
                    type="text"
                    value={bookForm.publisher}
                    onChange={(e) => setBookForm(prev => ({ ...prev, publisher: e.target.value }))}
                    placeholder="e.g. Allahabad Law Agency"
                    className="classy-input"
                  />
                </div>

                {/* Shelf Rack */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shelf / Rack Location</label>
                  <input
                    type="text"
                    value={bookForm.shelfLocation}
                    onChange={(e) => setBookForm(prev => ({ ...prev, shelfLocation: e.target.value }))}
                    placeholder="e.g. Rack A-4"
                    className="classy-input"
                  />
                </div>
              </div>

              {/* Total Copies */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Copies In Stock *</label>
                <input
                  type="number"
                  value={bookForm.totalCopies}
                  onChange={(e) => setBookForm(prev => ({ ...prev, totalCopies: e.target.value }))}
                  placeholder="1"
                  min="1"
                  className="classy-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Book Replacement Price */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Replacement Price (₹)</label>
                  <input
                    type="number"
                    value={bookForm.price || ''}
                    onChange={(e) => setBookForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Leave blank to use default"
                    className="classy-input"
                  />
                </div>

                {/* Hidden Checkbox */}
                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="isHidden"
                    checked={bookForm.isHidden || false}
                    onChange={(e) => setBookForm(prev => ({ ...prev, isHidden: e.target.checked }))}
                    className="rounded border-warm-300 dark:border-darkbg-border text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isHidden" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                    Hide from checkout
                  </label>
                </div>
              </div>

              {/* Remarks */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Notes</label>
                <textarea
                  value={bookForm.remarks}
                  onChange={(e) => setBookForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Catalog shelf details..."
                  className="classy-input h-16 resize-none py-2"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-warm-100 dark:border-darkbg-border">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="classy-btn-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="classy-btn-primary py-2 px-5"
                >
                  {editingBook ? 'Update details' : 'Add to catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* RETURN BOOK TRANSACTION MODAL             */}
      {/* ========================================== */}
      {showReturnModal && activeReturnIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col space-y-5">
            
            <div className="flex justify-between items-center border-b border-warm-100 dark:border-darkbg-border pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-warm-900 dark:text-white">
                Process Book Return
              </h3>
              <button 
                onClick={() => setShowReturnModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-border"
              >
                ✕
              </button>
            </div>

            <div className="bg-warm-50 dark:bg-darkbg-base p-4 rounded-xl space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] tracking-wider">Book Checked Out</span>
                <span className="text-warm-900 dark:text-slate-200">{activeReturnIssue.book?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] tracking-wider">Issued to Student</span>
                <span className="text-warm-900 dark:text-slate-200">{activeReturnIssue.student?.fullName}</span>
              </div>
              <div className="flex justify-between border-t border-warm-200/40 dark:border-darkbg-border/60 pt-2 mt-2">
                <span className="text-slate-400 uppercase text-[9px] tracking-wider">Due Date</span>
                <span className="text-slate-600 dark:text-slate-300">{new Date(activeReturnIssue.dueDate).toLocaleDateString()}</span>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs font-semibold text-warm-850 dark:text-slate-200">
              
              {/* Return Date */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Return Date *</label>
                <input
                  type="date"
                  value={returnForm.returnDate}
                  onChange={(e) => setReturnForm(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="classy-input"
                  required
                />
              </div>

              {/* Late Fee Notice */}
              {(() => {
                const overdue = getOverdueDays(activeReturnIssue.dueDate);
                if (overdue > 0) {
                  return (
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center space-x-2 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Overdue return: {overdue} days. A late penalty fine of <strong>₹{overdue * 5.0}</strong> will be charged.</span>
                    </div>
                  );
                }
                return (
                  <div className="p-3 bg-emerald-555/5 border border-emerald-500/10 rounded-xl flex items-center space-x-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Return is within schedule. No penalty dues apply.</span>
                  </div>
                );
              })()}

              {/* Remarks */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Return State Notes</label>
                <textarea
                  value={returnForm.remarks}
                  onChange={(e) => setReturnForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="e.g. Book returned in good physical condition..."
                  className="classy-input h-16 resize-none py-2"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-warm-100 dark:border-darkbg-border">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="classy-btn-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="classy-btn-primary py-2 px-5 bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LibraryConsole;
