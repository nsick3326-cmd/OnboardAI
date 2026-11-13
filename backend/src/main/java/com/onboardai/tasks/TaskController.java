package com.onboardai.tasks;

import com.onboardai.common.ApiResponse;
import com.onboardai.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Tasks", description = "Endpoints for managing onboarding task assignments and status updates")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    @Operation(summary = "Get filtered list of onboarding tasks")
    public ResponseEntity<ApiResponse<PagedResponse<TaskDto>>> getTasks(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) TaskCategory category,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<TaskDto> tasks = taskService.getTasks(employeeId, category, status, overdue, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(tasks)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get onboarding task details by ID")
    public ResponseEntity<ApiResponse<TaskDto>> getTaskById(@PathVariable UUID id) {
        TaskDto task = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.ok(task));
    }

    @PostMapping
    @Operation(summary = "Create an additional onboarding task for an employee")
    public ResponseEntity<ApiResponse<TaskDto>> createTask(@Valid @RequestBody CreateTaskRequest request) {
        TaskDto created = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Task created successfully", created));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update task status and append optional comments")
    public ResponseEntity<ApiResponse<TaskDto>> updateTaskStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskStatusRequest request) {
        TaskDto updated = taskService.updateTaskStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Task status updated", updated));
    }
}
