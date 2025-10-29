document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // --- NEW: helper to escape HTML in participant names/emails ---
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";
  // Reset activity select options to avoid duplicates when reloading
  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list with a delete icon for each participant
        const participantsHtml = details.participants && details.participants.length
          ? "<ul>" + details.participants.map(p => `
              <li>
                <span class=\"participant-email\">${escapeHtml(p)}</span>
                <button class=\"delete-participant\" data-activity=\"${escapeHtml(name)}\" data-email=\"${escapeHtml(p)}\" aria-label=\"Remove participant\">✖</button>
              </li>`).join("") + "</ul>"
          : '<p class="info">No participants yet.</p>';

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description || "")}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule || "")}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants">
            <h5>Participants (${details.participants ? details.participants.length : 0})</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Event delegation for delete buttons on participants
  activitiesList.addEventListener("click", async (event) => {
    const deleteBtn = event.target.closest(".delete-participant");
    if (!deleteBtn) return;

    const activity = deleteBtn.dataset.activity;
    const email = deleteBtn.dataset.email;

    if (!activity || !email) return;

    // Optional: ask for confirmation
    const confirmed = confirm(`Unregister ${email} from ${activity}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });

      const result = await res.json();

      if (res.ok) {
        // Refresh activities list to reflect removal
        fetchActivities();
      } else {
        // Show error message briefly
        messageDiv.textContent = result.detail || result.message || "Failed to unregister participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
      }
    } catch (err) {
      console.error("Error unregistering participant:", err);
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh the activities list so the newly signed-up member appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
