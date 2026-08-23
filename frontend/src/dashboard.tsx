import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LandingBackground from './components/LandingBackground';
import SplitText from './components/SplitText';
import BlurText from './components/BlurText';
import AnimatedContent from './components/AnimatedContent';
import './styles/index.css';
import './styles/dashboard.css';

interface Note {
    id: number;
    title: string;
    content: string;
    pinned?: boolean;
}

const EMPTY_SEARCH_MESSAGES = [
    {
        title: (term: string) => <>Nothing matched <span className="empty-query-highlight">"{term}"</span></>,
        subtitle: 'Check your spelling or write a fresh note about it.'
    },
    {
        title: (term: string) => <>No results for <span className="empty-query-highlight">"{term}"</span></>,
        subtitle: 'Check your keywords, or capture this thought in a new note.'
    },
    {
        title: (term: string) => <>No notes found for <span className="empty-query-highlight">"{term}"</span></>,
        subtitle: 'Try a different keyword, or turn this search into a new note.'
    },
    {
        title: (term: string) => <>Couldn't find <span className="empty-query-highlight">"{term}"</span></>,
        subtitle: 'Double-check your spelling, or start a new note with this thought.'
    },
    {
        title: (term: string) => <>Zero matches for <span className="empty-query-highlight">"{term}"</span></>,
        subtitle: 'Nothing came up in your vault. Maybe write it down now?'
    },
    {
        title: (term: string) => <>Note found 404 for <span className="empty-query-highlight">"{term}"</span></>,
        subtitle: "We searched high and low, but this note hasn't been penned yet."
    },
    {
        title: (term: string) => <>Lost in the void: <span className="empty-query-highlight">"{term}"</span></>,
        subtitle: "Looks like your thoughts on this haven't been written down yet."
    }
];

function Dashboard() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setDebouncedSearch('');
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const randomEmptyMessage = useMemo(() => {
        if (!debouncedSearch.trim()) return null;
        let hash = 0;
        for (let i = 0; i < debouncedSearch.length; i++) {
            hash = (hash << 5) - hash + debouncedSearch.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash) % EMPTY_SEARCH_MESSAGES.length;
        return EMPTY_SEARCH_MESSAGES[index];
    }, [debouncedSearch]);

    // View Modal state (for reading with SplitText & BlurText)
    const [viewingNote, setViewingNote] = useState<Note | null>(null);

    // Edit / Create Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

    const sortNotes = (noteList: Note[]) => {
        return [...noteList].sort((a, b) => {
            const aPinned = a.pinned ? 1 : 0;
            const bPinned = b.pinned ? 1 : 0;
            if (bPinned !== aPinned) {
                return bPinned - aPinned;
            }
            return b.id - a.id;
        });
    };

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
                const data: Note[] = await response.json();
                setNotes(sortNotes(data));
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

    // View Modal handlers
    const handleOpenViewModal = (note: Note) => {
        setViewingNote(note);
    };

    const handleCloseViewModal = () => {
        setViewingNote(null);
    };

    // Edit Modal handlers
    const handleOpenEditModal = (note?: Note, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (note) {
            setEditingNote(note);
            setNoteTitle(note.title);
            setNoteContent(note.content);
        } else {
            setEditingNote(null);
            setNoteTitle('');
            setNoteContent('');
        }
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingNote(null);
        setNoteTitle('');
        setNoteContent('');
    };

    const handleTogglePin = async (id: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        // Optimistic UI update
        setNotes((prevNotes) =>
            sortNotes(
                prevNotes.map((n) =>
                    n.id === id ? { ...n, pinned: !n.pinned } : n
                )
            )
        );

        if (viewingNote?.id === id) {
            setViewingNote((prev) => (prev ? { ...prev, pinned: !prev.pinned } : null));
        }

        try {
            const response = await fetch(`${API_BASE_URL}/notes/pin/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const updatedNote: Note = await response.json();
                setNotes((prevNotes) =>
                    sortNotes(
                        prevNotes.map((n) => (n.id === id ? updatedNote : n))
                    )
                );
                if (viewingNote?.id === id) {
                    setViewingNote(updatedNote);
                }
            } else {
                await fetchNotes();
            }
        } catch (error) {
            console.error('Failed to toggle pin:', error);
            await fetchNotes();
        }
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
                        pinned: editingNote.pinned,
                    }),
                });

                if (response.ok) {
                    const updated: Note = await response.json();
                    setNotes((prevNotes) =>
                        sortNotes(
                            prevNotes.map((n) => (n.id === editingNote.id ? updated : n))
                        )
                    );
                    if (viewingNote?.id === editingNote.id) {
                        setViewingNote(updated);
                    }
                    handleCloseEditModal();
                }
            } else {
                // Create note
                const response = await fetch(`${API_BASE_URL}/notes/create`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        title: noteTitle,
                        content: noteContent,
                        pinned: false,
                    }),
                });

                if (response.ok) {
                    await fetchNotes();
                    handleCloseEditModal();
                }
            }
        } catch (error) {
            console.error('Failed to save note:', error);
        }
    };

    const handleDeleteNote = async (id: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (!confirm('Delete this note?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setNotes(notes.filter((n) => n.id !== id));
                if (viewingNote?.id === id) {
                    setViewingNote(null);
                }
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
            n.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            n.content.toLowerCase().includes(debouncedSearch.toLowerCase())
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
                        <button className="btn-new-note" onClick={() => handleOpenEditModal()}>
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

                    {isLoading || isSearching ? (
                        <div className="notes-grid">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="note-skeleton" />
                            ))}
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-animated-icon">
                                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
                                </svg>
                            </div>
                            <h3 className="empty-state-title">
                                {debouncedSearch ? (
                                    randomEmptyMessage?.title(debouncedSearch)
                                ) : (
                                    'Your vault is quiet'
                                )}
                            </h3>
                            <p className="empty-state-text">
                                {debouncedSearch ? (
                                    randomEmptyMessage?.subtitle
                                ) : (
                                    'Create your first note to get started.'
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="notes-grid">
                            {filteredNotes.map((note, index) => {
                                const cardBaseDelay = Math.min(index * 0.15, 1.2);
                                const titleStartDelay = Math.round(cardBaseDelay * 1000) + 60;
                                const contentStartDelay = Math.round(cardBaseDelay * 1000) + 160;

                                return (
                                    <AnimatedContent
                                        key={note.id}
                                        distance={35}
                                        direction="vertical"
                                        duration={0.6}
                                        ease="power3.out"
                                        delay={cardBaseDelay}
                                        scale={0.96}
                                        threshold={0.05}
                                    >
                                        <article
                                            className={`note-item ${note.pinned ? 'is-pinned' : ''}`}
                                            onClick={() => handleOpenViewModal(note)}
                                        >
                                            <div>
                                                <SplitText
                                                    key={`card-title-${note.id}-${note.title}`}
                                                    text={note.title || 'Untitled'}
                                                    tag="h3"
                                                    className="note-item-title"
                                                    startDelay={titleStartDelay}
                                                    delay={15}
                                                    duration={0.45}
                                                />
                                                <BlurText
                                                    key={`card-content-${note.id}-${note.content}`}
                                                    text={note.content || ''}
                                                    animateBy="words"
                                                    startDelay={contentStartDelay}
                                                    delay={18}
                                                    stepDuration={0.25}
                                                    direction="top"
                                                    className="note-item-body"
                                                />
                                            </div>

                                            <div className="note-item-footer">
                                                <div className="note-card-actions">
                                                    <button
                                                        className={`btn-card-action pin ${note.pinned ? 'active' : ''}`}
                                                        title={note.pinned ? 'Unpin note' : 'Pin note'}
                                                        onClick={(e) => handleTogglePin(note.id, e)}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill={note.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="12" y1="17" x2="12" y2="22" />
                                                            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="btn-card-action"
                                                        title="Edit note"
                                                        onClick={(e) => handleOpenEditModal(note, e)}
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
                                    </AnimatedContent>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* 3. View Note Modal (with SplitText for Title & BlurText for Content) */}
                {viewingNote && (
                    <div className="modal-overlay" onClick={handleCloseViewModal}>
                        <div className="view-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="view-modal-header">
                                <button
                                    className={`btn-modal-action pin ${viewingNote.pinned ? 'active' : ''}`}
                                    title={viewingNote.pinned ? 'Unpin note' : 'Pin note'}
                                    onClick={() => handleTogglePin(viewingNote.id)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill={viewingNote.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="17" x2="12" y2="22" />
                                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z" />
                                    </svg>
                                </button>
                                <button className="modal-close" onClick={handleCloseViewModal} title="Close">
                                    ✕
                                </button>
                            </div>

                            <div className="view-modal-content-wrap">
                                <SplitText
                                    key={`title-${viewingNote.id}-${viewingNote.title}`}
                                    text={viewingNote.title || 'Untitled'}
                                    tag="h2"
                                    className="view-modal-title"
                                    delay={25}
                                    duration={0.55}
                                    ease="power3.out"
                                    splitType="chars"
                                    from={{ opacity: 0, y: 25 }}
                                    to={{ opacity: 1, y: 0 }}
                                />

                                <BlurText
                                    key={`content-${viewingNote.id}-${viewingNote.content}`}
                                    text={viewingNote.content || ''}
                                    animateBy="words"
                                    delay={25}
                                    stepDuration={0.25}
                                    direction="top"
                                    className="view-modal-body"
                                />
                            </div>

                            <div className="view-modal-footer">
                                <div className="note-card-actions">
                                    <button
                                        className="btn-card-action"
                                        title="Edit note"
                                        onClick={() => {
                                            const noteToEdit = viewingNote;
                                            handleCloseViewModal();
                                            handleOpenEditModal(noteToEdit);
                                        }}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="btn-card-action delete"
                                        title="Delete note"
                                        onClick={() => handleDeleteNote(viewingNote.id)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Create / Edit Note Modal */}
                {isEditModalOpen && (
                    <div className="modal-overlay" onClick={handleCloseEditModal}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {editingNote ? 'Edit Note' : 'New Note'}
                                </h3>
                                <button className="modal-close" onClick={handleCloseEditModal} title="Close">
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
                                    rows={10}
                                />

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCloseEditModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-save">
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 5. Dashboard Footer */}
                <footer className="dashboard-footer">
                    <p>Made with ❤️ by <span>Dandan</span></p>
                </footer>
            </div>
        </>
    );
}

export default Dashboard;
