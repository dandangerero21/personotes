package com.example.personotes.services;

import org.springframework.stereotype.Service;

import com.example.personotes.auth.JwtService;
import com.example.personotes.dtos.UserAuthDTO;
import com.example.personotes.dtos.UserRequestDTO;
import com.example.personotes.dtos.UserResponseDTO;
import com.example.personotes.models.User;
import com.example.personotes.repositories.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final SecurityService passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository, SecurityService passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public User loadUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public UserResponseDTO registerUser(UserRequestDTO request) {

        // TWO CHECKERS USING EMAIL AND USERNAME TO AVOID DUPLICATES
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user = userRepository.save(user);

        return new UserResponseDTO(user.getUsername(), user.getEmail());
    }

    public UserAuthDTO loginUser(UserRequestDTO request) {
        User user = userRepository.findByUsername(request.getUsername());
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtService.generateToken(user.getUsername());
        return new UserAuthDTO(user.getUsername(), user.getEmail(), token);
    }

    public UserResponseDTO updateUser(Long id, UserRequestDTO request, String username) {
        User user = userRepository.findByIdAndUsername(id, username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user.setEmail(request.getEmail());
        }

        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            user.setUsername(request.getUsername());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        return new UserResponseDTO(user.getUsername(), user.getEmail());
    }

    public void deleteUser(Long id, String username) {
        User user = userRepository.findByIdAndUsername(id, username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        userRepository.delete(user);
    }
}
