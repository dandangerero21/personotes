package com.example.personotes.services;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import com.example.personotes.models.Note;
import com.example.personotes.models.User;
import com.example.personotes.dtos.NoteRequestDTO;
import com.example.personotes.dtos.NoteResponseDTO;
import com.example.personotes.repositories.NoteRepository;
import com.example.personotes.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoteService {
    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    public NoteService(NoteRepository noteRepository, UserRepository userRepository) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
    }

    public List<NoteResponseDTO> getUserNotes(String username) {
        List<Note> notes = noteRepository.findByUser_Username(username);
        List<NoteResponseDTO> noteResponses = notes.stream()
                .map(note -> new NoteResponseDTO(note.getId(), note.getTitle(), note.getContent())).collect(Collectors.toList());
        return noteResponses;
    }

    public List<NoteResponseDTO> getNoteByTitle(String title, String username) {
        List<Note> notes = noteRepository.findByTitleContainingAndUser_Username(title, username);
        List<NoteResponseDTO> noteResponses = notes.stream()
                .map(note -> new NoteResponseDTO(note.getId(), note.getTitle(), note.getContent())).collect(Collectors.toList());
        return noteResponses;
    }

    public List<NoteResponseDTO> getNoteByContent(String content, String username) {
        List<Note> notes = noteRepository.findByContentContainingAndUser_Username(content, username);
        List<NoteResponseDTO> noteResponses = notes.stream()
                .map(note -> new NoteResponseDTO(note.getId(), note.getTitle(), note.getContent())).collect(Collectors.toList());
        return noteResponses;
    }

    public ResponseEntity<NoteResponseDTO> createNote(NoteRequestDTO noteRequest, String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found!");
        }
        Note note = new Note();
        note.setTitle(noteRequest.getTitle());
        note.setContent(noteRequest.getContent());
        note.setUser(user);
        note = noteRepository.save(note);
        return ResponseEntity.ok(new NoteResponseDTO(note.getId(), note.getTitle(), note.getContent()));
    }

    public ResponseEntity<NoteResponseDTO> updateNote(Long id, NoteRequestDTO noteRequest, String username) {
        Note note = noteRepository.findByIdAndUser_Username(id, username)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        note.setTitle(noteRequest.getTitle());
        note.setContent(noteRequest.getContent());
        note.setUpdatedAt(LocalDateTime.now());
        note = noteRepository.save(note);
        return ResponseEntity.ok(new NoteResponseDTO(note.getId(), note.getTitle(), note.getContent()));
    }

    public void deleteNote(Long id, String username) {
        Note note = noteRepository.findByIdAndUser_Username(id, username)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        noteRepository.delete(note);
    }

}
