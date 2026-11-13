package com.onboardai.documents;

import com.onboardai.common.BusinessRuleException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Objects;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);
    private final Path rootLocation;

    public LocalStorageService(@Value("${app.storage.location:./storage/documents}") String storageLocation) {
        this.rootLocation = Paths.get(storageLocation).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            log.error("Could not initialize storage directory", e);
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    @Override
    public String store(MultipartFile file) {
        String cleanOriginalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        if (cleanOriginalFilename.contains("..")) {
            throw new BusinessRuleException("Path traversal attempt detected in filename: " + cleanOriginalFilename);
        }

        String extension = "";
        int dotIndex = cleanOriginalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = cleanOriginalFilename.substring(dotIndex);
        }

        String storedFilename = UUID.randomUUID() + extension;
        Path destinationFile = this.rootLocation.resolve(storedFilename).normalize().toAbsolutePath();

        if (!destinationFile.getParent().equals(this.rootLocation)) {
            throw new BusinessRuleException("Cannot store file outside target directory");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            return storedFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + cleanOriginalFilename, e);
        }
    }

    @Override
    public Resource loadAsResource(String storedFilename) {
        try {
            Path file = rootLocation.resolve(storedFilename).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new BusinessRuleException("Could not read file: " + storedFilename);
            }
        } catch (MalformedURLException e) {
            throw new BusinessRuleException("Could not read file: " + storedFilename);
        }
    }

    @Override
    public void delete(String storedFilename) {
        try {
            Path file = rootLocation.resolve(storedFilename).normalize();
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Failed to delete stored file: {}", storedFilename, e);
        }
    }
}
