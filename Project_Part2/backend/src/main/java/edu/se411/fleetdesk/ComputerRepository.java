package edu.se411.fleetdesk;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ComputerRepository extends JpaRepository<Computer, UUID>, JpaSpecificationExecutor<Computer> {
    Optional<Computer> findByTag(String tag);
    Optional<Computer> findBySerial(String serial);
    List<Computer> findByStatusOrderByTagAsc(String status, Pageable pageable);

    interface CountRow {
        String getLabel();
        long getTotal();
    }

    @Query("select c.status as label, count(c) as total from Computer c group by c.status")
    List<CountRow> countByStatus();

    @Query("select c.department as label, count(c) as total from Computer c group by c.department")
    List<CountRow> countByDepartment();

    @Query("select coalesce(sum(c.cost), 0) from Computer c")
    BigDecimal totalPurchaseValue();
}
