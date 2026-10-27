package edu.se411.fleetdesk;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real controller + validation + service + JPA + Flyway + isolated H2 database. */
@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:fleetdesk-tests;DB_CLOSE_DELAY=-1", "app.seed-demo=false"})
@AutoConfigureMockMvc
class InventoryIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ComputerRepository repository;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach void clearDatabase() {
        repository.deleteAll();
        jdbc.update("DELETE FROM app_settings");
    }

    private JsonNode create(String tag) throws Exception {
        String json = mapper.writeValueAsString(ComputerServiceTest.request(tag, "SERIAL-" + tag, "Available", ""));
        return mapper.readTree(mvc.perform(post("/api/computers").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    @Test void completeCrudJourneyUsesSameIdAndPersistsChanges() throws Exception {
        JsonNode created = create("PC-01");
        String id = created.get("id").asText();
        mvc.perform(get("/api/computers/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.tag").value("PC-01"));
        String update = mapper.writeValueAsString(ComputerServiceTest.request("PC-01", "SERIAL-PC-01", "Assigned", "QA team"));
        mvc.perform(put("/api/computers/" + id).contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id)).andExpect(jsonPath("$.assignedTo").value("QA team"));
        assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus()).isEqualTo("Assigned");
        mvc.perform(delete("/api/computers/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/computers/" + id)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/computers/" + id)).andExpect(status().isNotFound());
    }

    @Test void pagesDoNotOverlapAndOutOfRangePageIsEmpty() throws Exception {
        for (int i = 1; i <= 7; i++) create("PC-0" + i);
        mvc.perform(get("/api/computers?page=0&size=5")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(5)).andExpect(jsonPath("$.totalElements").value(7))
                .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.content[0].tag").value("PC-01"))
                .andExpect(jsonPath("$.first").value(true)).andExpect(jsonPath("$.last").value(false));
        mvc.perform(get("/api/computers?page=1&size=5")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2)).andExpect(jsonPath("$.content[0].tag").value("PC-06"))
                .andExpect(jsonPath("$.last").value(true));
        mvc.perform(get("/api/computers?page=99&size=5")).andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty());
    }

    @Test void combinesCaseInsensitiveWordsFiltersAndEscapesWildcards() throws Exception {
        create("PC-01");
        repository.saveAndFlush(new Computer(ComputerServiceTest.request("PC-02", "S2", "Maintenance", "Data team")));
        mvc.perform(get("/api/computers").param("q", " LAPTOP   Riyadh ").param("status", "Maintenance").param("department", "IT"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].tag").value("PC-02"));
        mvc.perform(get("/api/computers").param("q", "%")).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/computers").param("q", "_")).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test void duplicateIdentifiersAreCaseInsensitiveAndDoNotInsertOrOverwrite() throws Exception {
        JsonNode first = create("PC-01");
        JsonNode second = create("PC-02");
        String conflict = mapper.writeValueAsString(ComputerServiceTest.request(" pc-01 ", " serial-pc-01 ", "Available", ""));
        mvc.perform(post("/api/computers").contentType(MediaType.APPLICATION_JSON).content(conflict))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.errors.tag").exists()).andExpect(jsonPath("$.errors.serial").exists());
        mvc.perform(put("/api/computers/" + second.get("id").asText()).contentType(MediaType.APPLICATION_JSON).content(conflict))
                .andExpect(status().isConflict());
        assertThat(repository.count()).isEqualTo(2);
        assertThat(repository.findById(UUID.fromString(first.get("id").asText())).orElseThrow().getTag()).isEqualTo("PC-01");
        assertThat(repository.findById(UUID.fromString(second.get("id").asText())).orElseThrow().getTag()).isEqualTo("PC-02");
    }

    @Test void databaseItselfEnforcesUniqueness() throws Exception {
        create("PC-01");
        assertThatThrownBy(() -> repository.saveAndFlush(new Computer(ComputerServiceTest.request("PC-01", "DIFFERENT", "Available", ""))))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test void summaryUsesWholeInventoryAndExcludesRetiredFromAssignmentRate() throws Exception {
        repository.saveAllAndFlush(List.of(
                new Computer(ComputerServiceTest.request("PC-01", "S1", "Assigned", "QA")),
                new Computer(ComputerServiceTest.request("PC-02", "S2", "Available", "")),
                new Computer(ComputerServiceTest.request("PC-03", "S3", "Retired", "")),
                new Computer(ComputerServiceTest.request("PC-04", "S4", "Maintenance", "QA"))));
        mvc.perform(get("/api/computers/summary")).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(4))
                .andExpect(jsonPath("$.value").value(5002.00)).andExpect(jsonPath("$.statusCounts.Assigned").value(1))
                .andExpect(jsonPath("$.departments.IT").value(4)).andExpect(jsonPath("$.assignmentRate").value(33))
                .andExpect(jsonPath("$.maintenance[0].tag").value("PC-04"));
    }

    @Test void invalidPaginationAndAssignmentAreRejectedThroughHttp() throws Exception {
        mvc.perform(get("/api/computers?size=101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/computers?page=-1")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/computers?sort=password")).andExpect(status().isBadRequest());
        String json = mapper.writeValueAsString(ComputerServiceTest.request("PC-01", "S1", "Assigned", ""));
        mvc.perform(post("/api/computers").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.assignedTo").exists());
        assertThat(repository.count()).isZero();
    }

    @Test void fictionalDataSeedsOnceAndDeletedRecordsDoNotReappear() throws Exception {
        DemoSeeder seeder = new DemoSeeder(true, repository, mapper, jdbc);
        seeder.run();
        assertThat(repository.count()).isEqualTo(12);
        seeder.run();
        assertThat(repository.count()).isEqualTo(12);
        repository.deleteAll();
        seeder.run();
        assertThat(repository.count()).isZero();
    }

    @Test void seederDoesNotReplaceAnExistingInventory() throws Exception {
        create("PC-01");
        new DemoSeeder(true, repository, mapper, jdbc).run();
        assertThat(repository.count()).isEqualTo(1);
    }
}
