package edu.se411.fleetdesk;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "computers")
public class Computer {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, unique = true, length = 24) private String tag;
    @Column(nullable = false, length = 80) private String name;
    @Column(nullable = false, unique = true, length = 64) private String serial;
    @Column(nullable = false, length = 20) private String type;
    @Column(nullable = false, length = 20) private String status;
    @Column(nullable = false, length = 20) private String department;
    @Column(nullable = false, length = 80) private String assignedTo;
    @Column(nullable = false, length = 100) private String location;
    @Column(nullable = false) private LocalDate purchaseDate;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal cost;
    @Column(nullable = false, length = 500) private String notes;

    protected Computer() { }

    public Computer(ComputerRequest request) { update(request); }

    public void update(ComputerRequest request) {
        tag = request.tag(); name = request.name(); serial = request.serial();
        type = request.type(); status = request.status(); department = request.department();
        assignedTo = request.assignedTo(); location = request.location();
        purchaseDate = request.purchaseDate(); cost = request.cost(); notes = request.notes();
    }

    public UUID getId() { return id; }
    public String getTag() { return tag; }
    public String getName() { return name; }
    public String getSerial() { return serial; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getDepartment() { return department; }
    public String getAssignedTo() { return assignedTo; }
    public String getLocation() { return location; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public BigDecimal getCost() { return cost; }
    public String getNotes() { return notes; }
}
