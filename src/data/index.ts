export const eventDetails = {
  name: "Hostle Solvathon",
  date: "November 15-16, 2026",
  description: "A 24-hour hackathon to solve real-world hostel management problems. Compete, innovate, and win amazing prizes!"
};

export const problemStatements = [
  {
    id: "PS-01",
    track: "Power Systems",
    title: "Autonomous Hostel Energy Grid Balancing",
    description: "Design a low-latency micro-inverter and sensor telemetry agent that redistributes peak electrical loads across hostel wings during generator failover periods without shedding critical room loads.",
    tags: ["IoT / ESP32", "Reinforcement Learning", "Edge Telemetry"],
    mentor: "Dr. Ramanathan",
    difficulty: "Level 4/5"
  },
  {
    id: "PS-02",
    track: "Smart Dining",
    title: "Real-time Mess Queue & Waste Analytics",
    description: "Build an edge-deployed computer vision pipeline that estimates tray depletion rates, predicts queue wait times across dining halls, and triggers automated surplus notifications for hostel staff.",
    tags: ["YOLOv8 Edge", "WebSockets API", "Vision AI"],
    mentor: "Prof. Narayanan",
    difficulty: "Level 3/5"
  },
  {
    id: "PS-03",
    track: "Disaster Comms",
    title: "Localized Mesh Network for Disaster Comms",
    description: "Implement zero-infrastructure packet forwarding over LoRa and peer-to-peer Wi-Fi Direct between Block A through Block G for emergency notifications when centralized ISP routing drops.",
    tags: ["LoRaWAN", "Cryptographic Gossip", "Hardware Mesh"],
    mentor: "Dr. Priya Nair",
    difficulty: "Level 5/5"
  },
  {
    id: "PS-04",
    track: "Residential Access",
    title: "Attendance Verification via Edge Vision",
    description: "Build an anti-spoofing night-vision facial verification engine that integrates with local hostel warden portals, logging 4,000 students under 20 minutes without queue stalling or remote server lag.",
    tags: ["TensorRT", "Local SQLite Cache", "Edge AI"],
    mentor: "Cyber Lead Guild",
    difficulty: "Level 4/5"
  }
];

export const timeline = [
  { time: "Day 1 - 09:00 AM", event: "Registration & Breakfast" },
  { time: "Day 1 - 10:00 AM", event: "Opening Ceremony" },
  { time: "Day 1 - 11:00 AM", event: "Hackathon Commences" },
  { time: "Day 2 - 11:00 AM", event: "Hackathon Concludes" },
  { time: "Day 2 - 01:00 PM", event: "Presentations & Judging" },
  { time: "Day 2 - 04:00 PM", event: "Closing Ceremony & Prize Distribution" }
];

export const committee = [
  { name: "Dr. A. Sharma", role: "Chief Warden" },
  { name: "Mr. R. Kumar", role: "Block A Warden" },
  { name: "Ms. S. Gupta", role: "Director of Student Welfare" }
];
