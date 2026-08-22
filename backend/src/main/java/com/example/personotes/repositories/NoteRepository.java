package com.example.personotes.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.personotes.models.Note;
import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUser_Username(String username);

    List<Note> findByTitleContainingAndUser_Username(String title, String username);

    List<Note> findByContentContainingAndUser_Username(String content, String username);

    Optional<Note> findByIdAndUser_Username(Long id, String username);

}
