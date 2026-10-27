package edu.se411.fleetdesk;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComputerServiceTest {
    @Mock ComputerRepository repository;
    @InjectMocks ComputerService service;
    private final UUID id = UUID.randomUUID();

    static ComputerRequest request(String tag, String serial, String status, String assignedTo) {
        return new ComputerRequest(tag, " Test laptop ", serial, "Laptop", status, "IT", assignedTo,
                " Riyadh ", LocalDate.of(2025, 1, 1), new BigDecimal("1250.50"), "");
    }

    private Computer computer() {
        Computer computer = new Computer(request("PC-01", "SERIAL-01", "Available", ""));
        ReflectionTestUtils.setField(computer, "id", id);
        return computer;
    }

    @Test void createsNormalizedComputerAndPersistsIt() {
        when(repository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        Computer saved = service.create(request(" pc-02 ", " serial-02 ", "Available", ""));
        assertThat(saved.getTag()).isEqualTo("PC-02");
        assertThat(saved.getSerial()).isEqualTo("SERIAL-02");
        assertThat(saved.getName()).isEqualTo("Test laptop");
        verify(repository).saveAndFlush(saved);
    }

    @Test void findsExistingId() {
        Computer computer = computer();
        when(repository.findById(id)).thenReturn(Optional.of(computer));
        assertThat(service.get(id)).isSameAs(computer);
    }

    @Test void missingIdReturns404() {
        assertThatThrownBy(() -> service.get(id)).isInstanceOfSatisfying(ApiException.class,
                error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test void reportsDuplicateTagAndSerial() {
        Computer computer = computer();
        when(repository.findByTag("PC-01")).thenReturn(Optional.of(computer));
        when(repository.findBySerial("SERIAL-01")).thenReturn(Optional.of(computer));
        assertThatThrownBy(() -> service.create(request("pc-01", "serial-01", "Available", "")))
                .isInstanceOfSatisfying(ApiException.class, error -> {
                    assertThat(error.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(error.getErrors()).containsKeys("tag", "serial");
                });
        verify(repository, never()).saveAndFlush(any());
    }

    @Test void updatesSameIdAndAllowsUnchangedUniqueFields() {
        Computer computer = computer();
        when(repository.findById(id)).thenReturn(Optional.of(computer));
        when(repository.findByTag("PC-01")).thenReturn(Optional.of(computer));
        when(repository.findBySerial("SERIAL-01")).thenReturn(Optional.of(computer));
        when(repository.saveAndFlush(computer)).thenReturn(computer);
        Computer saved = service.update(id, request("PC-01", "SERIAL-01", "Assigned", "QA team"));
        assertThat(saved.getId()).isEqualTo(id);
        assertThat(saved.getAssignedTo()).isEqualTo("QA team");
        assertThat(saved.getStatus()).isEqualTo("Assigned");
    }

    @Test void missingUpdateDoesNotInsert() {
        assertThatThrownBy(() -> service.update(id, request("PC-01", "S", "Available", ""))).isInstanceOf(ApiException.class);
        verify(repository, never()).saveAndFlush(any());
    }

    @Test void deletesOnlyTheRequestedRecord() {
        Computer computer = computer();
        when(repository.findById(id)).thenReturn(Optional.of(computer));
        service.delete(id);
        verify(repository).delete(computer);
    }

    @Test void missingDeleteReturns404() {
        assertThatThrownBy(() -> service.delete(id)).isInstanceOf(ApiException.class);
        verify(repository, never()).delete(any(Computer.class));
    }

    @Test void assignedRequiresAnAssignee() {
        assertThatThrownBy(() -> service.create(request("PC-01", "S", "Assigned", " ")))
                .isInstanceOfSatisfying(ApiException.class, error -> assertThat(error.getErrors()).containsKey("assignedTo"));
        verifyNoInteractions(repository);
    }

    @ParameterizedTest @ValueSource(strings = {"Available", "Retired"})
    void unassignedStatusesRejectAnAssignee(String status) {
        assertThatThrownBy(() -> service.create(request("PC-01", "S", status, "Someone"))).isInstanceOf(ApiException.class);
        verifyNoInteractions(repository);
    }

    @Test void maintenanceMayKeepAnAssignee() {
        when(repository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        assertThat(service.create(request("PC-01", "S", "Maintenance", "QA")).getAssignedTo()).isEqualTo("QA");
    }

    @ParameterizedTest @ValueSource(strings = {"tag", "name", "cost", "purchaseDate"})
    @SuppressWarnings("unchecked")
    void passesPaginationAndStableSortingToRepository(String sort) {
        when(repository.findAll(any(Specification.class), any(Pageable.class))).thenAnswer(call ->
                new PageImpl<>(List.of(computer()), call.getArgument(1), 12));
        ComputerPage page = service.list(1, 5, "laptop", "Available", "IT", sort);
        assertThat(page.page()).isEqualTo(1);
        assertThat(page.totalElements()).isEqualTo(12);
        assertThat(page.totalPages()).isEqualTo(3);
        assertThat(page.first()).isFalse();
        verify(repository).findAll(any(Specification.class), argThat((Pageable p) ->
                p.getPageNumber() == 1 && p.getPageSize() == 5 && p.getSort().getOrderFor("tag") != null));
    }

    @Test void rejectsInvalidPagingFiltersSearchAndSort() {
        assertThatThrownBy(() -> service.list(-1, 5, "", "", "", "tag")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.list(0, 0, "", "", "", "tag")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.list(0, 101, "", "", "", "tag")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.list(0, 5, "x".repeat(201), "", "", "tag")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.list(0, 5, "", "Bad", "", "tag")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.list(0, 5, "", "", "Bad", "tag")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.list(0, 5, "", "", "", "id")).isInstanceOf(ApiException.class);
        verifyNoInteractions(repository);
    }

    @Test void emptySummaryHasZeroCountsAndNoDivisionByZero() {
        when(repository.totalPurchaseValue()).thenReturn(BigDecimal.ZERO);
        InventorySummary summary = service.summary();
        assertThat(summary.total()).isZero();
        assertThat(summary.assignmentRate()).isZero();
        assertThat(summary.statusCounts()).containsEntry("Available", 0L);
        assertThat(summary.departments()).containsEntry("IT", 0L);
    }
}
