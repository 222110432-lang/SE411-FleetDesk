package edu.se411.fleetdesk;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/** One-time fictional data for local demonstrations. Disable with SEED_DEMO=false. */
@Component
public class DemoSeeder implements CommandLineRunner {
    private final boolean enabled;
    private final ComputerRepository repository;
    private final ObjectMapper mapper;
    private final JdbcTemplate jdbc;

    public DemoSeeder(@Value("${app.seed-demo}") boolean enabled, ComputerRepository repository,
                      ObjectMapper mapper, JdbcTemplate jdbc) {
        this.enabled = enabled; this.repository = repository; this.mapper = mapper; this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (!enabled || jdbc.queryForObject("SELECT COUNT(*) FROM app_settings WHERE setting_key = 'demo-seed-v1'", Integer.class) > 0) return;
        if (repository.count() == 0) {
            try (var input = new ClassPathResource("demo-computers.json").getInputStream()) {
                List<ComputerRequest> samples = mapper.readValue(input, new TypeReference<>() { });
                repository.saveAll(samples.stream().map(Computer::new).toList());
            }
        }
        jdbc.update("INSERT INTO app_settings(setting_key, setting_value) VALUES ('demo-seed-v1', 'done')");
    }
}
