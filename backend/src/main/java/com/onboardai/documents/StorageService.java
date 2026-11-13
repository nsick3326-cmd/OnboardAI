package com.onboardai.documents;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String store(MultipartFile file);
    Resource loadAsResource(String storedFilename);
    void delete(String storedFilename);
}
