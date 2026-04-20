# Module: Society & Community

The Society module manages the social and logistical infrastructure of housing associations, creating a connected "digital township" experience.

## 🏢 Society Structure
- **Society**: The top-level association.
- **Buildings**: Sub-units within the society.
- **Rules**: Local bylaws (Noise, Parking, Pets) categorized for clarity.

---

## 🏗️ Community Feed & Social Logic

The platform serves as a real-time comms hub for residents:
- **Notices**: Official landlord or admin announcements.
- **Events**: Community gatherings (Diwali Meet, Health Camp, AGMs).
- **Resident Directory**: Filtered unit-to-resident list (with privacy controls).

---

## 🏊 Amenity Booking Engine

A slot-based reservation system for clubhouse, gym, and pool facilities.

### 1. Booking Constraints
To ensure fair resource sharing, the system enforces:
- **Overlap Protection**: Prevents multiple residents from booking the same facility at the same time.
- **Duration Limits**: Max booking duration (e.g., 2 hours) set per amenity.

### 2. Status Lifecycle
- **PENDING**: Initial request.
- **CONFIRMED**: Auto-approved or admin-approved slot.
- **CANCELLED**: Resident or admin retracted the booking.

## 🖥️ Frontend Integration Playbook
1. **Calendar View**: Use a calendar widget (FullCalendar or similar) to visualize events and amenity availability.
2. **Push Notifications**: Listen for `notification` socket events to show live society alerts.
3. **Admin Dashboard**: Provide a "Manage Rules" interface for society admins to update bylaws dynamically.
