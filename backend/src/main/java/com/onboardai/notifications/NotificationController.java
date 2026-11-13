package com.onboardai.notifications;

import com.onboardai.common.ApiResponse;
import com.onboardai.common.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Endpoints for managing user notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get current user notifications with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<Notification>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        Page<Notification> notifications = notificationService.getMyNotifications(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(notifications)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications for current user")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("unreadCount", count)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark single notification as read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable UUID id) {
        Notification updated = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", updated));
    }

    @PostMapping("/mark-all-read")
    @Operation(summary = "Mark all notifications as read for current user")
    public ResponseEntity<ApiResponse<String>> markAllRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", "Success"));
    }
}
