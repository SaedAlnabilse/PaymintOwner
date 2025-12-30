# Requirements Document

## Introduction

This feature redesigns the Dashboard screen header to match the visual style of the metric cards below it. The current header has a white/surface background with rounded bottom corners, while the cards have a more elevated card design with shadows and borders. The goal is to create visual consistency by applying the same card styling to the header section.

## Glossary

- **Dashboard Header**: The top section of the Dashboard screen containing the greeting text ("Hello, Admin 👋"), the "Dashboard" title, and the refresh button
- **Metric Cards**: The card components below the header that display statistics (Orders, Cash, Card, Average) with rounded corners, shadows, and border styling
- **Surface**: The background color used for card components in the current theme
- **Card Styling**: The visual treatment including rounded corners, shadows, borders, and elevation used on metric cards

## Requirements

### Requirement 1

**User Story:** As a user, I want the dashboard header to have the same visual style as the metric cards, so that the interface feels cohesive and professionally designed.

#### Acceptance Criteria

1. WHEN the Dashboard screen loads THEN the header SHALL display with rounded corners matching the metric card border radius (16px)
2. WHEN the Dashboard screen loads THEN the header SHALL display with the same shadow styling as the metric cards (iOS shadow and Android elevation)
3. WHEN the Dashboard screen loads THEN the header SHALL display with the same border styling as the metric cards (1px border with border color)
4. WHEN the Dashboard screen loads THEN the header SHALL maintain the same background color (surface color) as the metric cards
5. WHEN the Dashboard screen loads THEN the header SHALL remove the bottom-only rounded corners and apply uniform rounded corners to all four corners

### Requirement 2

**User Story:** As a user, I want the header spacing and layout to remain functional after the redesign, so that all elements are properly visible and accessible.

#### Acceptance Criteria

1. WHEN the header is restyled THEN the greeting text, title, and refresh button SHALL remain in their current positions
2. WHEN the header is restyled THEN the padding and margins SHALL be adjusted if needed to maintain proper spacing with the card styling
3. WHEN the header is restyled THEN the header SHALL not overlap with the status bar or other UI elements
4. WHEN the header is restyled THEN the header content SHALL remain readable and properly aligned

### Requirement 3

**User Story:** As a user, I want the header redesign to work correctly in both light and dark modes, so that the visual consistency is maintained across all theme settings.

#### Acceptance Criteria

1. WHEN the app is in light mode THEN the header SHALL use the light mode surface color and border colors
2. WHEN the app is in dark mode THEN the header SHALL use the dark mode surface color and border colors
3. WHEN switching between light and dark modes THEN the header styling SHALL update appropriately to match the metric cards
4. WHEN in either theme mode THEN the shadow and elevation effects SHALL be visible and consistent with the metric cards
