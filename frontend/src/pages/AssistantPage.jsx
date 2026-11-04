import { useEffect, useState } from "react";
import { ImagePlus, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useSimulationTelemetry } from "../context/SimulationTelemetryContext.jsx";
import "./AssistantPage.css";

function analyzeLocally(question, telemetry, hasSample) {
  const prompt = question.toLowerCase();
  if (!hasSample) {
    return "No simulator sample is available yet. Start the 3D simulator to review its local telemetry. No external AI service is configured.";
  }
  if (prompt.includes("physics") || prompt.includes("lift") || prompt.includes("gravity")) {
    return "The educational model balances lift demand against gravity and damps vertical velocity toward the selected altitude. Horizontal inputs create acceleration; drag reduces residual velocity. It is a simplified simulation, not a flight-control model.";
  }
  if (prompt.includes("battery")) {
    const level = Math.round(telemetry.batteryPercent);
    return level < 20
      ? `Simulated battery is low at ${level}%. In a real operation, follow the aircraft manufacturer's procedures; this browser simulation has no aircraft connection.`
      : `The simulator estimates ${level}% battery. This is a local model value, not a measurement from a battery.`;
  }

  const warnings = [];
  if (telemetry.batteryPercent < 20) warnings.push("simulated battery is below 20%");
  if (telemetry.altitude > 3.5) warnings.push("altitude is near the simulator's 4 m ceiling");
  if (telemetry.speed > 4) warnings.push("speed is near the simulator's 4.5 m/s limit");
  if (Math.abs(telemetry.verticalSpeed) > 2) warnings.push("vertical speed is elevated");
  const condition = warnings.length
    ? `Potential simulated conditions to review: ${warnings.join("; ")}.`
    : "No configured simulated thresholds are currently exceeded.";
  return `Local simulator summary: altitude ${telemetry.altitude.toFixed(2)} m, ground speed ${telemetry.speed.toFixed(2)} m/s, vertical speed ${telemetry.verticalSpeed.toFixed(2)} m/s, heading ${Math.round(telemetry.yaw)}°. ${condition} These are simulated values only.`;
}

export default function AssistantPage() {
  const { telemetry, hasSample } = useSimulationTelemetry();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("drone-os.assistant-history.v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || !parsed.every((entry) =>
          entry &&
          typeof entry.id === "string" &&
          typeof entry.question === "string" &&
          typeof entry.response === "string" &&
          typeof entry.time === "string"
        )) {
          throw new Error("Saved assistant history has an invalid format.");
        }
        setHistory(parsed.slice(0, 20));
      }
    } catch (loadError) {
      setError(`Could not load local assistant history: ${loadError.message}`);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const analyze = (event) => {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt) {
      setError("Enter a question before requesting local analysis.");
      return;
    }

    const nextHistory = [{
      id: `${Date.now()}-${history.length}`,
      question: prompt,
      response: analyzeLocally(prompt, telemetry, hasSample),
      time: new Date().toLocaleTimeString()
    }, ...history].slice(0, 20);
    setHistory(nextHistory);
    try {
      window.localStorage.setItem("drone-os.assistant-history.v1", JSON.stringify(nextHistory));
      setError("");
    } catch (saveError) {
      setError(`Analysis completed, but history could not be saved: ${saveError.message}`);
    }
    setQuestion("");
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setError("Choose an image smaller than 10 MB. Files stay in this browser and are not uploaded.");
      event.target.value = "";
      return;
    }

    try {
      setImageUrl(URL.createObjectURL(file));
      setImageName(file.name);
      setError("");
    } catch (previewError) {
      setError(`Could not preview the selected image: ${previewError.message}`);
    }
    event.target.value = "";
  };

  return (
    <section className="assistant-page">
      <header className="assistant-heading">
        <div>
          <span className="simulator-eyebrow">LOCAL RULES · NO EXTERNAL AI</span>
          <h2>AI Assistant</h2>
          <p>Ask about the local simulation. Responses use deterministic rules, not a configured AI model.</p>
        </div>
        <div className="assistant-mode"><Sparkles size={15} /> RULES MODE</div>
      </header>

      <div className="assistant-layout">
        <section className="panel assistant-chat">
          <div className="assistant-chat-title">
            <ShieldCheck size={16} />
            <span>SIMULATION SAFETY</span>
            <small>No physical aircraft connection</small>
          </div>
          <form onSubmit={analyze} className="assistant-form">
            <label htmlFor="assistant-question">Ask about telemetry, battery, or flight physics</label>
            <textarea
              id="assistant-question"
              rows={3}
              maxLength={500}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="For example: explain gravity and lift in the simulator"
            />
            {error && <p className="assistant-error" role="alert">{error}</p>}
            <button type="submit" className="mission-primary-button" disabled={!historyLoaded}><Send size={14} /> Analyze locally</button>
          </form>

          <div className="assistant-history">
            {history.length === 0 ? (
              <div className="assistant-empty">Your local analysis history will appear here.</div>
            ) : history.map((entry) => (
              <article className="assistant-entry" key={entry.id}>
                <time>{entry.time}</time>
                <strong>{entry.question}</strong>
                <p>{entry.response}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel assistant-image-panel">
          <div className="mission-panel-title">LOCAL IMAGE PREVIEW</div>
          <p>Images are not uploaded. No object-detection model is configured.</p>
          <label className="assistant-upload">
            <ImagePlus size={18} />
            <span>Select image (max 10 MB)</span>
            <input type="file" accept="image/*" onChange={handleImage} />
          </label>
          {imageUrl && (
            <figure className="assistant-image-preview">
              <img src={imageUrl} alt="Selected image preview; no detections performed" />
              <figcaption>{imageName} · preview only, no detections</figcaption>
            </figure>
          )}
        </aside>
      </div>
    </section>
  );
}
