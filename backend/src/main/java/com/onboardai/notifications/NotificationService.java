package com.onboardai.notifications;

import com.onboardai.common.ResourceNotFoundException;
import com.onboardai.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void createNotification(UUID organizationId, UUID userId, String title, String message, String type, String linkUrl) {
        Notification notification = new Notification(organizationId, userId, title, message, type, linkUrl);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<Notification> getMyNotifications(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(currentUserId, pageable);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        return notificationRepository.countByUserIdAndReadAtIsNull(currentUserId);
    }

    @Transactional
    public Notification markAsRead(UUID id) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Notification notification = notificationRepository.findByIdAndUserId(id, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));

        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return notification;
    }

    @Transactional
    public void markAllAsRead() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<Notification> unread = notificationRepository.findAllByUserIdOrderByCreatedAtDesc(currentUserId, Pageable.unpaged());
        Instant now = Instant.now();
        unread.forEach(n -> {
            if (n.getReadAt() == null) {
                n.setReadAt(now);
            }
        });
        notificationRepository.saveAll(unread);
    }
}
