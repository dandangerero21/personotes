package com.example.personotes.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.personotes.dtos.NoteRequestDTO;
import com.example.personotes.dtos.NoteResponseDTO;
import com.example.personotes.services.NoteService;

@RestController
@RequestMapping("/notes")
@CrossOrigin(origins = "*")
public class NoteController {
    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping("/get")
    public List<NoteResponseDTO> getNotes(Authentication authentication) {
        String currentUsername = authentication.getName();
        return noteService.getUserNotes(currentUsername);
    }

    @GetMapping("/get-by-title")
    public List<NoteResponseDTO> getNoteByTitle(@RequestParam String title, Authentication authentication) {
        String currentUsername = authentication.getName();
        return noteService.getNoteByTitle(title, currentUsername);
    }

    @GetMapping("/get-by-content")
    public List<NoteResponseDTO> getNoteByContent(@RequestParam String content, Authentication authentication) {
        String currentUsername = authentication.getName();
        return noteService.getNoteByContent(content, currentUsername);
    }

    @PostMapping("/create")
    public ResponseEntity<NoteResponseDTO> create(@RequestBody NoteRequestDTO dto, Authentication authentication) {
        String currentUsername = authentication.getName();
        return noteService.createNote(dto, currentUsername);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<NoteResponseDTO> update(@PathVariable Long id, @RequestBody NoteRequestDTO dto,
            Authentication authentication) {
        String currentUsername = authentication.getName();
        return noteService.updateNote(id, dto, currentUsername);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, Authentication authentication) {
        String currentUsername = authentication.getName();
        noteService.deleteNote(id, currentUsername);
    }

}
