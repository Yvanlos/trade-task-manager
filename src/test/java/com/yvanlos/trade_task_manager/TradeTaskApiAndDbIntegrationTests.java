package com.yvanlos.trade_task_manager;

import com.yvanlos.trade_task_manager.model.TradeTask;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TradeTaskApiAndDbIntegrationTests {

	@LocalServerPort
	private int port;

	private final TestRestTemplate restTemplate = new TestRestTemplate();

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void shouldCreateUpdateAndDeleteTaskAndValidateInPostgreSQL() {
		String baseUrl = "http://localhost:" + port + "/api/tasks";
		String uniqueTitle = "SQL Validation Check " + System.currentTimeMillis();

		// 1. API-Aufruf: Neue Aufgabe per HTTP POST anlegen
		TradeTask newTask = new TradeTask();
		newTask.setTitle(uniqueTitle);
		newTask.setDescription("Prüfung der Datenbank-Integrität");
		newTask.setPriority("HIGH");
		newTask.setStatus("OPEN");

		ResponseEntity<TradeTask> postResponse = restTemplate.postForEntity(baseUrl, newTask, TradeTask.class);
		assertEquals(HttpStatus.OK, postResponse.getStatusCode());
		assertNotNull(postResponse.getBody());
		Long createdId = postResponse.getBody().getId();
		assertNotNull(createdId);

		// 2. Direkte SQL-Validierung in PostgreSQL via JdbcTemplate
		Map<String, Object> dbRow = jdbcTemplate.queryForMap(
				"SELECT title, priority, status FROM trade_tasks WHERE id = ?",
				createdId
		);
		assertEquals(uniqueTitle, dbRow.get("title"));
		assertEquals("HIGH", dbRow.get("priority"));
		assertEquals("OPEN", dbRow.get("status"));

		// 3. API-Aufruf: Status per HTTP PUT auf DONE setzen
		newTask.setStatus("DONE");
		ResponseEntity<TradeTask> putResponse = restTemplate.exchange(
				baseUrl + "/" + createdId,
				HttpMethod.PUT,
				new HttpEntity<>(newTask),
				TradeTask.class
		);
		assertEquals(HttpStatus.OK, putResponse.getStatusCode());

		// 4. Erneute SQL-Prüfung in PostgreSQL: Wurde der Status wirklich aktualisiert?
		String updatedStatusInDb = jdbcTemplate.queryForObject(
				"SELECT status FROM trade_tasks WHERE id = ?",
				String.class,
				createdId
		);
		assertEquals("DONE", updatedStatusInDb);

		// 5. API-Aufruf: Aufgabe per HTTP DELETE löschen & SQL-Cleanup prüfen
		ResponseEntity<Void> deleteResponse = restTemplate.exchange(
				baseUrl + "/" + createdId,
				HttpMethod.DELETE,
				null,
				Void.class
		);
		assertEquals(HttpStatus.NO_CONTENT, deleteResponse.getStatusCode());

		Integer countAfterDelete = jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM trade_tasks WHERE id = ?",
				Integer.class,
				createdId
		);
		assertEquals(0, countAfterDelete);
	}
}
