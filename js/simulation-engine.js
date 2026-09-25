/**
 * RescuRoute AI - Closed-Loop Agent Simulation Engine
 * Manages the 7-step Closed Loop workflow:
 * Detect -> Classify -> n8n Assign -> Responder Action (Accept/Reject) -> Lifecycle Progression -> Verification -> Escalation/Reroute.
 */

class ClosedLoopSimulationEngine {
  constructor() {
    this.state = "IDLE";
    this.slaTimerSeconds = 90;
    this.slaInterval = null;
    this.currentResponderStage = 0; // 0 to 5

    this.listeners = {
      onStateChange: [],
      onSlaTick: [],
      onLogEntry: []
    };
  }

  subscribe(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  startSimulation(origin = "Majestic", destination = "Manipal Hospital") {
    this.currentResponderStage = 0;
    this.setState("EN_ROUTE");
    this.addLog("INFO", `Ambulance AMB-04 dispatched from ${origin} to ${destination} via MG Road vector.`);
  }

  triggerObstructionAtJunction4() {
    this.setState("OBSTRUCTION_DETECTED");
    this.addLog("ALERT", "🚨 AI Agent Detected Route Obstruction at Junction 4 (MG Road): Broken-down vehicle (Ambulance ETA: 3 min).");
    
    // Trigger n8n Automated Assignment Workflow
    setTimeout(() => {
      this.triggerN8nDispatch();
    }, 1500);
  }

  triggerN8nDispatch() {
    this.setState("N8N_DISPATCHED");
    this.addLog("ACTION", "⚡ n8n Workflow Triggered: Matched nearest available responder Tow Unit #07. Clearance request dispatched to Responder Dashboard.");
    this.startSlaTimer();
  }

  startSlaTimer() {
    clearInterval(this.slaInterval);
    this.slaTimerSeconds = 90;

    this.slaInterval = setInterval(() => {
      this.slaTimerSeconds--;
      this.emit("onSlaTick", this.slaTimerSeconds);

      if (this.slaTimerSeconds <= 0) {
        clearInterval(this.slaInterval);
        this.triggerTimeoutEscalation();
      }
    }, 1000);
  }

  responderAccepts() {
    clearInterval(this.slaInterval);
    this.currentResponderStage = 1;
    this.setState("RESPONDER_ACCEPTED");
    this.addLog("SUCCESS", "✅ Responder Action: Tow Unit #07 Accepted clearance request. Status updated to ACCEPTED.");
  }

  responderRejects() {
    clearInterval(this.slaInterval);
    this.setState("RESPONDER_REJECTED");
    this.addLog("ALERT", "❌ Responder Action: Tow Unit #07 REJECTED clearance request!");
    this.triggerAutoEscalationAndReroute();
  }

  advanceResponderLifecycle() {
    if (this.currentResponderStage < 5) {
      this.currentResponderStage++;
    }

    const stages = ["", "ACCEPTED", "ON THE WAY", "REACHED SITE", "CLEARING ROAD", "CLEARED"];
    const currentName = stages[this.currentResponderStage];

    this.addLog("ACTION", `🚜 Responder Lifecycle Updated: Stage ${this.currentResponderStage} - ${currentName}.`);

    if (this.currentResponderStage === 5) {
      this.setState("CLEARANCE_SUCCESS");
      this.addLog("SUCCESS", "🎉 Road Clearance Verified! Junction 4 cleared by Tow Unit #07. Ambulance priority vector restored.");
    } else {
      this.emit("onStateChange", `LIFECYCLE_STAGE_${this.currentResponderStage}`);
    }
  }

  triggerTimeoutEscalation() {
    this.addLog("ALERT", "⚠️ SLA Window Breached: Responder action timed out after 90s!");
    this.triggerAutoEscalationAndReroute();
  }

  triggerAutoEscalationAndReroute() {
    clearInterval(this.slaInterval);
    this.setState("SLA_BREACH_ESCALATED");
    this.addLog("ACTION", "⚡ Closed-Loop AI Agent: Auto-Escalated request to Secondary Traffic Patrol #04.");
    this.addLog("ACTION", "🔄 Closed-Loop AI Agent: Dynamic Reroute activated via Avenue 6 (ETA Saved: 2.4 min).");
  }

  resetSimulation() {
    clearInterval(this.slaInterval);
    this.slaTimerSeconds = 90;
    this.currentResponderStage = 0;
    this.setState("IDLE");
    this.addLog("INFO", "System reset to dispatch standby.");
  }

  setState(newState) {
    this.state = newState;
    this.emit("onStateChange", newState);
  }

  addLog(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    this.emit("onLogEntry", { type, message, timestamp });
  }
}
