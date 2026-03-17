🏔️ THE GROTTO | Digital Route Management System
Version: 1.1.0-beta
Status: Active Development
Target Platform: Mobile-First Web App

📖 Project Overview
The Grotto is a bespoke digital platform designed for the modern bouldering community. 
It solves the "Ghost Route" problem and the difficulty of tracking traversing routes by utilizing a custom multi-wall image stitching engine. 
It provides setters with a powerful administrative suite and climbers with a high-fidelity, interactive "tick-list" experience.

🛠️ Feature Deep-Dive1.

1. The Image Stitching Engine
Unlike standard gallery apps, The Grotto understands the physical layout of the gym.

Sequential Logic: The app identifies the starting wall and the finishing wall of any route.
Adaptive Display: It automatically calculates and renders only the necessary wall sections in the correct sequence, providing a seamless "path" for the climber to follow.

2. Marker Precision & LegendRoutes are marked using a relative coordinate system ($x, y$ percentages), ensuring that markers remain perfectly centered on holds regardless of device screen size.
MarkerTypeDescription
🟢StartDesignated starting holds (Standard 2-hand or split start).
🔴HoldHand or foot holds available for the route.
🟡FootSpecific "foot-only" smears or jibs to clarify the beta.
🔵TopThe finishing hold or designated "top-out" point.

3. User Experience (UX) & Quality of Life
Haptic Feedback: Successfully "Sending" a route triggers a 25ms vibration pulse on mobile devices, providing a tactile reward for the achievement.
High Contrast Mode: Optimized for gym environments with dim or harsh overhead lighting; increases marker visibility and border thickness.
Focus Mode: A "clean view" toggle that strips away grades, names, and buttons, leaving only the wall and the route markers.
Persistent Settings: Preferences (Marker Style, Marker Size, Contrast) are stored in localStorage, so the app remains configured to the user's liking across sessions.

🔐 The Setter Suite (Admin Features)
Access to management tools is restricted to gym staff via a secure Setter Code gateway.

Live Archive System (v1.1): Setters can instantly hide routes that have been stripped from the gym floor without deleting the data.
This keeps the public gallery clean and up-to-date.

Interactive Edit Mode: Change hold types, move marker positions, or adjust grades in real-time while standing at the wall.

Direct Route Creation: A dedicated carousel-style setup for photographing new sets and uploading them to the Supabase backend instantly.

📊 Technical Architecture
Frontend: Next.js (App Router) with Tailwind CSS.
Backend: Supabase (PostgreSQL) for real-time data syncing and image hosting.
State Management: React Hooks (useState, useEffect, useMemo) for high-performance UI updates.
Persistence: sessionStorage for auth-states and localStorage for user preferences.

🚀 Release Historyv1.1.0 (Current)
RESTORATION: Re-implemented the Archive/Unarchive toggle for setters.
UX: Added haptic feedback for "Sent" routes.
UI: Bumped versioning on the Global Splash Screen.
FIX: Resolved marker selection logic in Edit Mode.v1.0.0

Initial Beta deployment.
Gallery filtering and Grade sorting.
Image-stitching engine launch.

📋 Gym Committee Summary
The Grotto is designed to reduce the workload of setters while increasing climber engagement. 
By digitizing the gym floor, we provide:
Clarity: No more guessing which hold belongs to which tape color.
Engagement: A digital "Tick List" encourages climbers to complete more routes.
Data: Historical archiving allows the gym to see the evolution of their setting over time.
Note: This is a Beta product. Feedback from the gym committee regarding specific grade colors or wall layouts is welcomed for the v1.2 roadmap.
