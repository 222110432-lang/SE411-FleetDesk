package edu.se411.fleetdesk;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record InventorySummary(long total, BigDecimal value, Map<String, Long> statusCounts,
                               Map<String, Long> departments, long assignmentRate,
                               List<Computer> maintenance) { }
