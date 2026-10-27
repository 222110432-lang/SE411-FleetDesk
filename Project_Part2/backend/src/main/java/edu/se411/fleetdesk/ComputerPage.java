package edu.se411.fleetdesk;

import org.springframework.data.domain.Page;
import java.util.List;

/** Explicit response contract, independent of Spring's internal Page JSON format. */
public record ComputerPage(List<Computer> content, int page, int size, long totalElements,
                           int totalPages, boolean first, boolean last) {
    public static ComputerPage from(Page<Computer> page) {
        return new ComputerPage(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isFirst(), page.isLast());
    }
}
