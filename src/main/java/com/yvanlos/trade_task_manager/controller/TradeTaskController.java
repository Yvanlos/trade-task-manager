package com.yvanlos.trade_task_manager.controller;

import com.yvanlos.trade_task_manager.model.TradeTask;
import com.yvanlos.trade_task_manager.repository.TradeTaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins="*")
public class TradeTaskController {
    private final TradeTaskRepository repository;
    public TradeTaskController(TradeTaskRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<TradeTask> getAllTasks(){
        return repository.findAll();
    }

     @PostMapping
    public TradeTask createTask(@RequestBody TradeTask task) {
        return repository.save(task);
    }
    @PutMapping("/{id}")
    public ResponseEntity<TradeTask> updateTask(@PathVariable Long id, @RequestBody TradeTask updated) {
        return repository.findById(id)
                .map(task -> {
                    task.setTitle(updated.getTitle());
                    task.setDescription(updated.getDescription());
                    task.setStatus(updated.getStatus());
                    task.setPriority(updated.getPriority());
                    return ResponseEntity.ok(repository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
       if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
         repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}
