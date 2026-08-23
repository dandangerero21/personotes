import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LandingBackground from './components/LandingBackground';
import './styles/index.css';
import './styles/dashboard.css';

interface Note {
    id: number;
    title: string;
    content: string;
}

function Dashboard() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');

    const token = localStorage.getItem('token');

    const getAuthHeaders = () => {
        const rawToken = localStorage.getItem('token') || '';
        const authHeader = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
        return {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
        };
    };

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const fetchNotes = async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/notes/get`, {
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setNotes(data);
            } else if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleOpenModal = (note?: Note) => {
        if (note) {
            setEditingNote(note);
            setNoteTitle(note.title);
            setNoteContent(note.content);
        } else {
            setEditingNote(null);
            setNoteTitle('');
            setNoteContent('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNote(null);
        setNoteTitle('');
        setNoteContent('');
    };

    const handleSaveNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteTitle.trim() && !noteContent.trim()) return;

        try {
            if (editingNote) {
                // Update note
                const response = await fetch(`${API_BASE_URL}/notes/update/${editingNote.id}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        title: noteTitle,
                        content: noteContent,
                    }),
                });

                if (response.ok) {
                    await fetchNotes();
                    handleCloseModal();
                }
            } else {
                // Create note
                const response = await fetch(`${API_BASE_URL}/notes/create`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        title: noteTitle,
                        content: noteContent,
                    }),
                });

                if (response.ok) {
                    await fetchNotes();
                    handleCloseModal();
                }
            }
        } catch (error) {
            console.error('Failed to save note:', error);
        }
    };

    const handleDeleteNote = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this note?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setNotes(notes.filter((n) => n.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const filteredNotes = notes.filter(
        (n) =>
            n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <LandingBackground />

            <div className="dashboard-container">
                {/* 1. Header Navigation Bar */}
                <header className="dashboard-nav">
                    <Link to="/" className="dashboard-logo">
                        <span>PersoNotes</span>
                    </Link>

                    <div className="dashboard-search">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="dashboard-actions">
                        <button className="btn-new-note" onClick={() => handleOpenModal()}>
                            <span>+</span> New Note
                        </button>
                        <button className="btn-logout" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                {/* 2. Main Notes Content */}
                <main className="notes-main">
                    <div className="notes-header-bar">
                        <span className="notes-count">
                            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="empty-notes">
                            <p>Loading notes...</p>
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="empty-notes">
                            <div className="empty-icon-wrap">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="12" y1="18" x2="12" y2="12" />
                                    <line x1="9" y1="15" x2="15" y2="15" />
                                </svg>
                            </div>
                            <h3 className="empty-title">
                                {searchTerm ? 'No matching notes' : 'No notes yet'}
                            </h3>
                            <p className="empty-sub">
                                {searchTerm
                                    ? 'Try searching for something else.'
                                    : 'Create your first note to get started.'}
                            </p>
                            {!searchTerm && (
                                <button className="btn-new-note" onClick={() => handleOpenModal()}>
                                    <span>+</span> New Note
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="notes-grid">
                            {filteredNotes.map((note) => (
                                <article
                                    key={note.id}
                                    className="note-item"
                                    onClick={() => handleOpenModal(note)}
                                >
                                    <div>
                                        <h3 className="note-item-title">{note.title || 'Untitled'}</h3>
                                        <p className="note-item-body">{note.content}</p>
                                    </div>

                                    <div className="note-item-footer">
                                        <div className="note-card-actions">
                                            <button
                                                className="btn-card-action"
                                                title="Edit note"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenModal(note);
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn-card-action delete"
                                                title="Delete note"
                                                onClick={(e) => handleDeleteNote(note.id, e)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </main>

                {/* 3. Create / Edit Note Modal */}
                {isModalOpen && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {editingNote ? 'Edit Note' : 'New Note'}
                                </h3>
                                <button className="modal-close" onClick={handleCloseModal} title="Close">
                                    ✕
                                </button>
                            </div>

                            <form className="modal-form" onSubmit={handleSaveNote}>
                                <input
                                    type="text"
                                    className="modal-input-title"
                                    placeholder="Title"
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                    autoFocus
                                />

                                <textarea
                                    className="modal-textarea-content"
                                    placeholder="Write something..."
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    rows={8}
                                />

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={handleCloseModal}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-save">
                                        {editingNote ? 'Save Changes' : 'Create Note'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default Dashboard;
