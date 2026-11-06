(() => {
  "use strict";

  const $ = s => document.querySelector(s);

  // Only the welcome and memory views remain.
  const views = ["welcome", "memory"];

  const OPEN_AT = new Date("2027-05-22T05:33:00+08:00");

  let db = null;
  let writingCode = "";

  // Toast notification
  const toast = message => {
    const el = $("#toast");

    el.textContent = message;
    el.classList.remove("hidden");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      el.classList.add("hidden");
    }, 3500);
  };

  // ==========================================
  // INBOX POPUP CONTROLS
  // ==========================================

  const inboxModal = $("#inboxModal");

  $("#openLetterComposer").addEventListener("click", () => {
    inboxModal.classList.remove("hidden");
    document.body.classList.add("modal-open");

    $("#writeCode").focus();
  });

  function closeInbox() {
    inboxModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  $("#closeInbox").addEventListener("click", closeInbox);

  inboxModal.addEventListener("click", event => {
    if (event.target === inboxModal) {
      closeInbox();
    }
  });

  // Close popups using Escape
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!inboxModal.classList.contains("hidden")) {
        closeInbox();
      }

      $("#noteModal").classList.add("hidden");
    }
  });

  // ==========================================
  // PAGE NAVIGATION
  // ==========================================

  function go(view) {
    views.forEach(name => {
      $(`#${name}View`).classList.toggle(
        "active",
        name === view
      );
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    if (view === "memory") {
      updateBirthdayState();
    }
  }

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-view]");

    if (button) {
      event.preventDefault();
      go(button.dataset.view);
    }
  });

  // ==========================================
  // EIGHT FLOWER NOTES
  // ==========================================

  document.querySelectorAll(".note").forEach(button => {
    button.addEventListener("click", () => {
      $("#noteText").textContent = button.dataset.note;
      $("#noteModal").classList.remove("hidden");
    });
  });

  $("#closeNote").addEventListener("click", () => {
    $("#noteModal").classList.add("hidden");
  });

  $("#noteModal").addEventListener("click", event => {
    if (event.target === $("#noteModal")) {
      $("#noteModal").classList.add("hidden");
    }
  });

  // ==========================================
  // DATE INITIALIZATION
  // ==========================================

  $("#letterEntryDate").value = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  ).toISOString().slice(0, 10);

  // ==========================================
  // SUPABASE DATABASE CONNECTION
  // ==========================================

  function initDatabase() {
    if (db) return true;

    const config = window.APP_CONFIG || {};

    if (
      !window.supabase ||
      !config.SUPABASE_URL ||
      !config.SUPABASE_ANON_KEY ||
      config.SUPABASE_URL.includes("YOUR-PROJECT") ||
      config.SUPABASE_ANON_KEY.includes("YOUR_")
    ) {
      $("#codeMessage").textContent =
        "The box is not connected yet. Complete the Supabase setup in README.md.";

      return false;
    }

    db = window.supabase.createClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY
    );

    return true;
  }

  // ==========================================
  // BIRTHDAY COUNTDOWN
  // ==========================================

  function updateBirthdayState() {
    const now = new Date();
    const remaining = OPEN_AT.getTime() - now.getTime();

    const box = $("#birthdayBox");

    if (remaining <= 0) {
      $("#countdownTitle").textContent =
        "The little box is open. ♡";

      $("#countdownMessage").textContent =
        "It's time. The letters that were kept here are ready for you.";

      $("#countdown").classList.add("hidden");
      $("#openedLetters").classList.remove("hidden");

      box.setAttribute(
        "aria-label",
        "The birthday memory box is open"
      );

      loadLetters();

      return;
    }

    $("#countdownTitle").textContent =
      "This little box is still sealed.";

    $("#countdownMessage").textContent =
      "The box will open automatically on her birthday, exactly at 5:33 in the morning.";

    $("#countdown").classList.remove("hidden");
    $("#openedLetters").classList.add("hidden");

    const seconds = Math.floor(remaining / 1000);

    $("#days").textContent = String(
      Math.floor(seconds / 86400)
    ).padStart(3, "0");

    $("#hours").textContent = String(
      Math.floor((seconds % 86400) / 3600)
    ).padStart(2, "0");

    $("#minutes").textContent = String(
      Math.floor((seconds % 3600) / 60)
    ).padStart(2, "0");

    $("#seconds").textContent = String(
      seconds % 60
    ).padStart(2, "0");

    box.setAttribute(
      "aria-label",
      "Sealed birthday memory box. Opens May 22, 2027 at 5:33 AM Philippines time."
    );
  }

  $("#birthdayBox").addEventListener("click", () => {
    if (Date.now() < OPEN_AT.getTime()) {
      toast(
        "Not yet ♡ This little box opens on May 22, 2027 at 5:33 AM."
      );
    } else {
      updateBirthdayState();

      $("#openedLetters").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });

  // ==========================================
  // WRITING CODE FORM
  // ==========================================

  $("#codeForm").addEventListener("submit", event => {
    event.preventDefault();

    writingCode = $("#writeCode").value.trim();

    if (!writingCode) return;

    if (Date.now() >= OPEN_AT.getTime()) {
      $("#codeMessage").textContent =
        "The birthday box has already opened.";

      updateBirthdayState();

      return;
    }

    $("#codeMessage").textContent =
      "You can write your letter now. The code will be checked when you seal it. ♡";

    $("#letterForm").classList.remove("hidden");

    $("#writeCode").disabled = true;

    $("#authorName").focus();
  });

  // ==========================================
  // SUBMIT AND SAVE LETTER
  // ==========================================

  $("#letterForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!initDatabase()) return;

    if (Date.now() >= OPEN_AT.getTime()) {
      $("#saveMessage").textContent =
        "The box has opened. New letters can no longer be added.";

      updateBirthdayState();

      return;
    }

    const button = $("#saveLetter");

    button.disabled = true;
    button.textContent = "Sealing…";

    $("#saveMessage").textContent = "";

    try {
      const { data, error } = await db.rpc(
        "submit_birthday_letter",
        {
          p_code: writingCode,
          p_author_name: $("#authorName").value.trim(),
          p_letter: $("#letterContent").value.trim(),
          p_letter_date: $("#letterEntryDate").value
        }
      );

      if (error) throw error;

      if (data !== true) {
        throw new Error(
          "That writing code was not accepted."
        );
      }

      // Reset the form after successful submission
      $("#letterForm").reset();

      $("#letterEntryDate").value = new Date(
        Date.now() - new Date().getTimezoneOffset() * 60000
      ).toISOString().slice(0, 10);

      $("#letterForm").classList.add("hidden");

      $("#writeCode").value = "";
      $("#writeCode").disabled = false;

      writingCode = "";

      $("#codeMessage").textContent =
        "Your letter has been sealed safely in the box. ♡";

      toast("Your letter has been sealed. ♡");

      // Close popup after successful submission
      closeInbox();

    } catch (error) {
      $("#saveMessage").textContent =
        error.message ||
        "We couldn't seal your letter. Check your code and connection.";

      // Allow the user to try another code
      $("#writeCode").disabled = false;
      $("#writeCode").value = "";

      $("#letterForm").classList.add("hidden");

      writingCode = "";

      $("#codeMessage").textContent =
        "Please check your writing code and try again. ♡";

    } finally {
      button.disabled = false;
      button.textContent = "Seal my letter ♡";
    }
  });

  // ==========================================
  // LOAD LETTERS ON BIRTHDAY
  // ==========================================

  let lettersLoaded = false;
  let lettersLoading = false;

  async function loadLetters() {
    if (
      lettersLoaded ||
      lettersLoading ||
      !initDatabase()
    ) {
      return;
    }

    lettersLoading = true;

    const list = $("#letterList");

    list.innerHTML =
      '<div class="empty">Opening the box…</div>';

    try {
      const { data, error } = await db
        .from("birthday_letters")
        .select(
          "id,author_name,letter_date,letter_text,created_at"
        )
        .order("letter_date", {
          ascending: true
        })
        .order("created_at", {
          ascending: true
        });

      if (error) throw error;

      list.innerHTML = "";

      if (!data || data.length === 0) {
        list.innerHTML =
          '<div class="empty">The box is open. There are no letters inside just yet. ♡</div>';

      } else {
        data.forEach(letter => {
          const article = document.createElement("article");

          article.className = "saved-letter";

          const head = document.createElement("div");

          head.className = "saved-letter-head";

          const date = document.createElement("span");

          date.textContent = new Date(
            `${letter.letter_date}T12:00:00`
          ).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric"
          });

          const heart = document.createElement("span");

          heart.textContent = "♡ A LETTER KEPT FOR YOU";

          const title = document.createElement("h4");

          title.textContent =
            `Dear you, from ${letter.author_name}`;

          const content = document.createElement("p");

          content.textContent = letter.letter_text;

          head.append(date, heart);

          article.append(head, title, content);

          list.append(article);
        });
      }

      lettersLoaded = true;

    } catch (error) {
      list.innerHTML =
        '<div class="empty">The box is open, but the letters could not be loaded. Please check the database setup and refresh.</div>';

      console.error(error);

    } finally {
      lettersLoading = false;
    }
  }

  // ==========================================
  // INITIALIZE WEBSITE
  // ==========================================

  updateBirthdayState();

  setInterval(updateBirthdayState, 1000);

})();
