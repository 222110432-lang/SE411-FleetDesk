package edu.se411.fleetdesk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ComputerController.class)
class ComputerControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockitoBean ComputerService service;
    private final UUID id = UUID.randomUUID();

    private ObjectNode validBody() {
        return mapper.valueToTree(ComputerServiceTest.request("PC-01", "SERIAL-01", "Available", ""));
    }

    @Test void createsWith201LocationAndGeneratedId() throws Exception {
        Computer computer = new Computer(ComputerServiceTest.request("PC-01", "SERIAL-01", "Available", ""));
        ReflectionTestUtils.setField(computer, "id", id);
        when(service.create(any())).thenReturn(computer);
        mvc.perform(post("/api/computers").contentType(MediaType.APPLICATION_JSON).content(validBody().toString()))
                .andExpect(status().isCreated()).andExpect(header().string("Location", "/api/computers/" + id))
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @ParameterizedTest
    @CsvSource({"tag, -BAD", "name, ' '", "serial, ' '", "type, Tablet", "status, Unknown", "department, Other", "location, ' '", "purchaseDate, 2099-01-01", "cost, -1", "cost, 1000000.01", "cost, 1.234"})
    void rejectsInvalidFieldsBeforeCallingService(String field, String value) throws Exception {
        mvc.perform(post("/api/computers").contentType(MediaType.APPLICATION_JSON).content(validBody().put(field, value).toString()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors." + field).exists());
        verifyNoInteractions(service);
    }

    @Test void rejectsMissingDateAndCost() throws Exception {
        ObjectNode body = validBody(); body.remove(List.of("purchaseDate", "cost"));
        mvc.perform(post("/api/computers").contentType(MediaType.APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.purchaseDate").exists())
                .andExpect(jsonPath("$.errors.cost").exists());
    }

    @Test void rejectsOversizedFields() throws Exception {
        ObjectNode body = validBody().put("name", "n".repeat(81)).put("serial", "s".repeat(65))
                .put("assignedTo", "a".repeat(81)).put("location", "l".repeat(101)).put("notes", "n".repeat(501));
        mvc.perform(post("/api/computers").contentType(MediaType.APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.serial").exists()).andExpect(jsonPath("$.errors.notes").exists())
                .andExpect(jsonPath("$.errors.assignedTo").exists()).andExpect(jsonPath("$.errors.location").exists());
    }

    @Test void rejectsMalformedIdJsonAndQueryNumber() throws Exception {
        mvc.perform(get("/api/computers/not-a-uuid")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/computers?page=not-a-number")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/computers").contentType(MediaType.APPLICATION_JSON).content("{oops"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").exists());
        verifyNoInteractions(service);
    }

    @Test void returnsMissingRecordErrorAsJson() throws Exception {
        when(service.get(id)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "Computer not found.", Map.of()));
        mvc.perform(get("/api/computers/" + id)).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Computer not found."));
    }

    @Test void databaseConstraintRaceBecomes409WithoutSqlLeak() throws Exception {
        when(service.create(any())).thenThrow(new DataIntegrityViolationException("PRIVATE SQL"));
        mvc.perform(post("/api/computers").contentType(MediaType.APPLICATION_JSON).content(validBody().toString()))
                .andExpect(status().isConflict()).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("PRIVATE SQL"))));
    }

    @Test void unexpectedFailureHasSafe500Response() throws Exception {
        when(service.get(id)).thenThrow(new IllegalStateException("PRIVATE INTERNAL DETAIL"));
        mvc.perform(get("/api/computers/" + id)).andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("The server could not complete this request. Please try again."));
    }

    @Test void deleteReturns204WithNoBody() throws Exception {
        mvc.perform(delete("/api/computers/" + id)).andExpect(status().isNoContent()).andExpect(content().string(""));
        verify(service).delete(id);
    }
}
