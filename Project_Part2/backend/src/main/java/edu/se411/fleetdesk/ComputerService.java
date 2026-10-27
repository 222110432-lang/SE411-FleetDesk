package edu.se411.fleetdesk;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ComputerService {
    static final List<String> STATUSES = List.of("Assigned", "Available", "Maintenance", "Retired");
    static final List<String> DEPARTMENTS = List.of("Engineering", "Design", "Operations", "Finance", "People", "IT");
    private final ComputerRepository repository;

    public ComputerService(ComputerRepository repository) { this.repository = repository; }

    public Computer get(UUID id) {
        return repository.findById(id).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "Computer not found.", Map.of()));
    }

    public ComputerPage list(int page, int size, String q, String status, String department, String sort) {
        if (page < 0 || size < 1 || size > 100)
            throw badRequest("Use page >= 0 and size between 1 and 100.");
        if (q.length() > 200) throw badRequest("Search must be 200 characters or fewer.");
        if (!status.isEmpty() && !STATUSES.contains(status)) throw badRequest("Choose a valid status filter.");
        if (!department.isEmpty() && !DEPARTMENTS.contains(department)) throw badRequest("Choose a valid department filter.");
        Sort order = switch (sort) {
            case "tag" -> Sort.by("tag");
            case "name" -> Sort.by("name").and(Sort.by("tag"));
            case "cost" -> Sort.by(Sort.Direction.DESC, "cost").and(Sort.by("tag"));
            case "purchaseDate" -> Sort.by(Sort.Direction.DESC, "purchaseDate").and(Sort.by("tag"));
            default -> throw badRequest("Choose tag, name, cost, or purchaseDate for sort.");
        };
        return ComputerPage.from(repository.findAll(search(q, status, department), PageRequest.of(page, size, order)));
    }

    static Specification<Computer> search(String q, String status, String department) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!status.isEmpty()) predicates.add(cb.equal(root.get("status"), status));
            if (!department.isEmpty()) predicates.add(cb.equal(root.get("department"), department));
            // Every word must match at least one field. Escape SQL LIKE metacharacters.
            for (String term : q.trim().toLowerCase(Locale.ROOT).split("\\s+")) {
                if (term.isEmpty()) continue;
                String pattern = "%" + term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                Predicate[] fields = List.of("tag", "name", "serial", "type", "status", "department", "assignedTo", "location", "notes")
                        .stream().map(field -> cb.like(cb.lower(root.get(field)), pattern, '\\')).toArray(Predicate[]::new);
                predicates.add(cb.or(fields));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    @Transactional
    public Computer create(ComputerRequest request) {
        validateAssignment(request);
        ensureUnique(request, null);
        return repository.saveAndFlush(new Computer(request));
    }

    @Transactional
    public Computer update(UUID id, ComputerRequest request) {
        Computer computer = get(id);
        validateAssignment(request);
        ensureUnique(request, id);
        computer.update(request);
        return repository.saveAndFlush(computer);
    }

    @Transactional
    public void delete(UUID id) { repository.delete(get(id)); }

    public InventorySummary summary() {
        Map<String, Long> statuses = new LinkedHashMap<>();
        STATUSES.forEach(s -> statuses.put(s, 0L));
        repository.countByStatus().forEach(row -> statuses.put(row.getLabel(), row.getTotal()));
        Map<String, Long> departments = new LinkedHashMap<>();
        DEPARTMENTS.forEach(d -> departments.put(d, 0L));
        repository.countByDepartment().forEach(row -> departments.put(row.getLabel(), row.getTotal()));
        long total = statuses.values().stream().mapToLong(Long::longValue).sum();
        long active = total - statuses.get("Retired");
        return new InventorySummary(total, repository.totalPurchaseValue(), statuses, departments,
                active == 0 ? 0 : Math.round(100.0 * statuses.get("Assigned") / active),
                repository.findByStatusOrderByTagAsc("Maintenance", PageRequest.of(0, 5)));
    }

    private void ensureUnique(ComputerRequest request, UUID editingId) {
        Map<String, String> errors = new LinkedHashMap<>();
        repository.findByTag(request.tag()).filter(c -> !Objects.equals(c.getId(), editingId))
                .ifPresent(c -> errors.put("tag", "This asset tag already exists."));
        repository.findBySerial(request.serial()).filter(c -> !Objects.equals(c.getId(), editingId))
                .ifPresent(c -> errors.put("serial", "This serial number already exists."));
        if (!errors.isEmpty()) throw new ApiException(HttpStatus.CONFLICT, "A computer with these identifiers already exists.", errors);
    }

    private void validateAssignment(ComputerRequest request) {
        String error = null;
        if (request.status().equals("Assigned") && request.assignedTo().isBlank())
            error = "Enter the person or team using this computer.";
        if (List.of("Available", "Retired").contains(request.status()) && !request.assignedTo().isBlank())
            error = "Available and retired computers must be unassigned.";
        if (error != null) throw new ApiException(HttpStatus.BAD_REQUEST, "Please correct the highlighted fields.", Map.of("assignedTo", error));
    }

    private ApiException badRequest(String message) { return new ApiException(HttpStatus.BAD_REQUEST, message, Map.of()); }
}
