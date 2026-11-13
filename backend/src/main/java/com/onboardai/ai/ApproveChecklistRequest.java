package com.onboardai.ai;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class ApproveChecklistRequest {

    @NotEmpty(message = "At least one approved suggestion must be selected")
    private List<ChecklistSuggestionDto> selectedSuggestions;

    public ApproveChecklistRequest() {}

    public List<ChecklistSuggestionDto> getSelectedSuggestions() {
        return selectedSuggestions;
    }

    public void setSelectedSuggestions(List<ChecklistSuggestionDto> selectedSuggestions) {
        this.selectedSuggestions = selectedSuggestions;
    }
}
