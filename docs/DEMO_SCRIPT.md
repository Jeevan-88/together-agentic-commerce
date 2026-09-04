# 5-Minute Video Demonstration Script

This script provides the complete scene-by-scene walkthrough and narration for the TOGETHER Razorpay Buildathon video submission.

---

### [0:00 - 0:30] The Problem
- **Visual**: Screen showing cluttered group chat with scattered links, budget disagreements, and confusing split payment calculations.
- **Narration**:
  "Shopping together today is broken. Whether you are planning a trip with friends, furnishing an apartment, or ordering supplies for your team, the process is fragmented. Links get lost in group chats, budgets are misunderstood, decisions drag on, and when it is finally time to pay, one person is left stuck with the bill. We built TOGETHER to solve this."

---

### [0:30 - 1:00] What TOGETHER Does
- **Visual**: Navigate to the TOGETHER homepage (http://localhost:3000). Show clean fintech aesthetic, hero headline, and How It Works section. Toggle A11y mode briefly to demonstrate accessibility.
- **Narration**:
  "TOGETHER is a unified commerce platform designed specifically for group and solo purchases, powered by Razorpay. It bridges intent formulation, catalog discovery, collective group consensus, and secure checkout into one seamless, transparent workflow."

---

### [1:00 - 1:30] Shopping Request & Voice Input
- **Visual**: Click "Start shopping" -> navigate to `/shop`. Click the "Speak" microphone button, speak: "I need a lightweight travel backpack for a weekend trip under 6,000 rupees." Show text populating the textarea in real time.
- **Narration**:
  "Users can begin by typing or using our voice input powered by the native Web Speech API. There are no heavy dependencies, and it works natively inside modern browsers. We select 'Buy together' to coordinate with our group."

---

### [1:30 - 2:00] Product Comparison
- **Visual**: Click "Continue to products" -> navigate to `/shop/results`. Show comparison cards: Urban Trail 25L, Voyager Carry 28L, LitePack 24L. Highlight the capacity, weight, and merchant tags.
- **Narration**:
  "TOGETHER pulls catalog items from verified merchants. Each option displays transparent pricing, capacity, weight, and feature highlights so everyone in the group has the objective facts needed to decide."

---

### [2:00 - 2:30] Group Creation & Management
- **Visual**: Navigate to `/group`. Show existing groups. Type "Weekend Explorers" and "Alex Owner", click "Create group". Add member "Sarah" with email.
- **Narration**:
  "In the Groups hub, users can organize their shopping circles. The creator automatically receives the OWNER role, which is protected from accidental deletion. Adding members prevents duplicate emails, keeping the group clean and organized."

---

### [2:30 - 3:00] Group Decision & Approval
- **Visual**: Select the "Weekend Explorers" group -> continue to shopping -> choose "Urban Trail 25L" -> view `/shop/proposal`. Show the group selection, member tags, and confirmation checkbox.
- **Narration**:
  "On the proposal page, the chosen product is paired with the selected shopping group. Everyone can review the total cost and merchant details. Once agreement is reached, checking the approval box transitions the purchase from draft to approved status."

---

### [3:00 - 3:40] Razorpay Test Checkout
- **Visual**: Click "Approve and continue" -> navigate to `/shop/payment`. Click "Pay securely with Razorpay". The standard Razorpay Test Mode checkout modal appears on screen. Select Netbanking / UPI simulated payment and click 'Pay'.
- **Narration**:
  "With approval granted, the backend creates a Razorpay payment order. Clicking pay launches the standard Razorpay checkout modal in Test Mode. We simulate a successful payment transaction. Behind the scenes, the backend performs server-side signature verification."

---

### [3:40 - 4:20] Real-Time Webhook & Audit Trail
- **Visual**: Redirect to `/shop/status?purchaseId=...`. Show status badge changing to 'Payment confirmed' (PAID). Scroll to show the 4-step progress bar, the shopping group members, and the auto-updating Audit Trail.
- **Narration**:
  "Instantly, the user is redirected to the status dashboard. A 3-second polling loop monitors the order. When the Razorpay payment.captured webhook arrives, the backend validates the raw signature, updates the database state to PAID, and records every step into the immutable audit trail."

---

### [4:20 - 4:50] Resilience & Recovery Demonstration
- **Visual**: Show terminal output of running `npm test tests/webhooks.test.ts` showing duplicate webhook delivery being safely ignored with `duplicate: true`, and show terminal health checks.
- **Narration**:
  "Reliability is paramount in fintech. If Razorpay delivers a duplicate webhook, our idempotency ledger detects the existing event ID and safely ignores it without corrupting the order state. We have also built automated test coverage across 17 distinct scenarios to guarantee stability."

---

### [4:50 - 5:00] Conclusion
- **Visual**: Return to TOGETHER home page. Display GitHub repository link and production URLs.
- **Narration**:
  "TOGETHER transforms group commerce from a source of friction into a transparent, collaborative experience built on Razorpay. Thank you."
