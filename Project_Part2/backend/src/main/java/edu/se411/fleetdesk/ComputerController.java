package edu.se411.fleetdesk;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/computers")
public class ComputerController {
    private final ComputerService service;

    public ComputerController(ComputerService service) { this.service = service; }

    @GetMapping
    public ComputerPage list(@RequestParam(defaultValue = "0") int page,
                             @RequestParam(defaultValue = "5") int size,
                             @RequestParam(defaultValue = "") String q,
                             @RequestParam(defaultValue = "") String status,
                             @RequestParam(defaultValue = "") String department,
                             @RequestParam(defaultValue = "tag") String sort) {
        return service.list(page, size, q, status, department, sort);
    }

    @GetMapping("/summary")
    public InventorySummary summary() { return service.summary(); }

    @GetMapping("/{id}")
    public Computer get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    public ResponseEntity<Computer> create(@Valid @RequestBody ComputerRequest request) {
        Computer created = service.create(request);
        return ResponseEntity.created(URI.create("/api/computers/" + created.getId())).body(created);
    }

    @PutMapping("/{id}")
    public Computer update(@PathVariable UUID id, @Valid @RequestBody ComputerRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
