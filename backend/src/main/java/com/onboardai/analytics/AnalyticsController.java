package com.onboardai.analytics;

import com.onboardai.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics", description = "Endpoints for aggregate onboarding analytics, KPI metrics, and trends")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Get overview metrics and KPIs calculated from persistent database data")
    public ResponseEntity<ApiResponse<OverviewMetricsDto>> getOverviewMetrics() {
        OverviewMetricsDto metrics = analyticsService.getOverviewMetrics();
        return ResponseEntity.ok(ApiResponse.ok(metrics));
    }

    @GetMapping("/onboarding-trends")
    @Operation(summary = "Get 6-month historical onboarding completion and new hire trends")
    public ResponseEntity<ApiResponse<List<OnboardingTrendDto>>> getOnboardingTrends() {
        List<OnboardingTrendDto> trends = analyticsService.getOnboardingTrends();
        return ResponseEntity.ok(ApiResponse.ok(trends));
    }

    @GetMapping("/task-breakdown")
    @Operation(summary = "Get department-level onboarding progress breakdown")
    public ResponseEntity<ApiResponse<List<DepartmentBreakdownDto>>> getDepartmentBreakdown() {
        List<DepartmentBreakdownDto> breakdown = analyticsService.getDepartmentBreakdown();
        return ResponseEntity.ok(ApiResponse.ok(breakdown));
    }
}
