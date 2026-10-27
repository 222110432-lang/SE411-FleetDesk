package edu.se411.fleetdesk;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;

/** The writable API fields. The server alone generates the record ID. */
public record ComputerRequest(
        @NotBlank @Pattern(regexp = "[A-Z0-9][A-Z0-9-]{1,23}", message = "Use 2–24 letters, numbers, or hyphens.") String tag,
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 64) String serial,
        @NotBlank @Pattern(regexp = "Laptop|Desktop|Workstation", message = "Choose a valid computer type.") String type,
        @NotBlank @Pattern(regexp = "Assigned|Available|Maintenance|Retired", message = "Choose a valid status.") String status,
        @NotBlank @Pattern(regexp = "Engineering|Design|Operations|Finance|People|IT", message = "Choose a valid department.") String department,
        @Size(max = 80) String assignedTo,
        @NotBlank @Size(max = 100) String location,
        @NotNull @PastOrPresent LocalDate purchaseDate,
        @NotNull @DecimalMin("0.00") @DecimalMax("1000000.00") @Digits(integer = 7, fraction = 2) BigDecimal cost,
        @Size(max = 500) String notes) {
    public ComputerRequest {
        tag = clean(tag).toUpperCase(Locale.ROOT);
        serial = clean(serial).toUpperCase(Locale.ROOT);
        name = clean(name);
        type = clean(type);
        status = clean(status);
        department = clean(department);
        assignedTo = clean(assignedTo);
        location = clean(location);
        notes = clean(notes);
    }

    private static String clean(String value) { return value == null ? "" : value.trim(); }
}
