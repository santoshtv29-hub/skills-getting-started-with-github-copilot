document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const container = document.getElementById("activities");
  const statusEl = document.getElementById("status");

  function showStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.style.color = isError ? "red" : "green";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 4000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
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

  function renderActivities(data) {
    container.innerHTML = "";
    Object.entries(data).forEach(([name, info]) => {
      const card = document.createElement("div");
      card.className = "activity-card";
      card.innerHTML = `
        <h2>${name}</h2>
        <p>${info.description}</p>
        <p><strong>Schedule:</strong> ${info.schedule}</p>

        <div class="participants">
          <h4>Participants <span class="participants-badge">${info.participants.length}</span></h4>
          ${info.participants.length
            ? `<ul class="participants-list">${info.participants.map((p) => `<li>${p}</li>`).join("")}</ul>`
            : `<p class="no-participants">No participants yet</p>`
          }
        </div>

        <p class="capacity"><strong>Capacity:</strong> <span class="count">${info.participants.length}</span> / ${info.max_participants}</p>

        <div class="signup">
          <input type="email" placeholder="you@school.edu" class="email" />
          <button class="signup-btn">Sign up</button>
        </div>
      `;

      const btn = card.querySelector(".signup-btn");
      const emailInput = card.querySelector(".email");
      let participantsList = card.querySelector(".participants-list"); // may be null
      const noParticipants = card.querySelector(".no-participants"); // may be null
      const badge = card.querySelector(".participants-badge");
      const countEl = card.querySelector(".count");

      btn.addEventListener("click", () => {
        const email = emailInput.value.trim();
        if (!email) {
          showStatus("Enter a valid email", true);
          return;
        }
        btn.disabled = true;
        fetch(`/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`, {
          method: "POST",
        })
          .then(async (res) => {
            btn.disabled = false;
            if (!res.ok) {
              const err = await res.json().catch(() => ({ detail: "Unknown error" }));
              throw new Error(err.detail || "Signup failed");
            }
            return res.json();
          })
          .then((json) => {
            // update UI: if previously empty, replace 'No participants yet' with a list
            if (!participantsList) {
              const ul = document.createElement("ul");
              ul.className = "participants-list";
              ul.innerHTML = `<li>${email}</li>`;
              if (noParticipants) {
                noParticipants.replaceWith(ul);
              } else {
                const pWrap = card.querySelector(".participants");
                pWrap.appendChild(ul);
              }
              participantsList = card.querySelector(".participants-list");
            } else {
              participantsList.insertAdjacentHTML("beforeend", `<li>${email}</li>`);
            }

            // update counts/badge
            const newCount = parseInt(countEl.textContent, 10) + 1;
            countEl.textContent = newCount;
            if (badge) badge.textContent = newCount;

            emailInput.value = "";
            showStatus(json.message || "Signed up successfully");
          })
          .catch((err) => showStatus(err.message || "Signup failed", true));
      });

      container.appendChild(card);
    });
  }

  // initial load
  fetch("/activities")
    .then((res) => res.json())
    .then(renderActivities)
    .catch(() => showStatus("Failed to load activities", true));
});
