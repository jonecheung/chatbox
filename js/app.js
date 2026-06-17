/* Japan Station Lift Finder
 * Loads curated station accessibility data, renders a searchable list + map,
 * and shows elevator / step-free details per station.
 */
(function () {
  "use strict";

  var STATUS = {
    yes: { label: "Step-free", icon: "✅" },
    partial: { label: "Partly step-free", icon: "⚠️" },
    no: { label: "No step-free route", icon: "⛔" }
  };

  var state = {
    stations: [],
    filtered: [],
    markers: {},
    activeId: null,
    query: "",
    onlyStepFree: false,
    city: "",
    reportUrl: ""
  };

  var map, markerLayer;
  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.search = document.getElementById("search");
    els.filterStepFree = document.getElementById("filter-stepfree");
    els.filterCity = document.getElementById("filter-city");
    els.list = document.getElementById("station-list");
    els.count = document.getElementById("result-count");
    els.disclaimer = document.getElementById("disclaimer");
    els.detail = document.getElementById("detail");
    els.detailBody = document.getElementById("detail-body");
    els.detailClose = document.getElementById("detail-close");

    initMap();

    els.search.addEventListener("input", function (e) {
      state.query = e.target.value.trim().toLowerCase();
      applyFilters();
    });
    els.filterStepFree.addEventListener("change", function (e) {
      state.onlyStepFree = e.target.checked;
      applyFilters();
    });
    els.filterCity.addEventListener("change", function (e) {
      state.city = e.target.value;
      applyFilters();
    });
    els.detailClose.addEventListener("click", closeDetail);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDetail();
    });

    loadData();
  }

  function initMap() {
    map = L.map("map", { zoomControl: true }).setView([36.2, 138.2], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
  }

  function loadData() {
    fetch("data/stations.json")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        state.stations = data.stations || [];
        if (data.meta) {
          if (data.meta.disclaimer) {
            els.disclaimer.textContent = "ⓘ " + data.meta.disclaimer;
          }
          state.reportUrl = data.meta.reportUrl || "";
        }
        populateCityFilter();
        applyFilters();
      })
      .catch(function (err) {
        els.list.innerHTML =
          '<li class="empty">Could not load station data (' +
          escapeHtml(err.message) +
          ").<br>If you opened this file directly, run a local web server instead.</li>";
      });
  }

  function populateCityFilter() {
    var cities = {};
    state.stations.forEach(function (s) { cities[s.city] = true; });
    Object.keys(cities).sort().forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      els.filterCity.appendChild(opt);
    });
  }

  function applyFilters() {
    var q = state.query;
    state.filtered = state.stations.filter(function (s) {
      if (state.onlyStepFree && s.stepFree !== "yes") return false;
      if (state.city && s.city !== state.city) return false;
      if (!q) return true;
      var hay = [s.name, s.nameJa, s.city, (s.lines || []).join(" "), (s.operators || []).join(" ")]
        .join(" ")
        .toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    renderList();
    renderMarkers();
  }

  function renderList() {
    var n = state.filtered.length;
    els.count.textContent =
      n + (n === 1 ? " station" : " stations") + " shown" +
      (state.stations.length ? " of " + state.stations.length : "");

    if (!n) {
      els.list.innerHTML = '<li class="empty">No stations match your search.</li>';
      return;
    }

    var html = state.filtered.map(function (s) {
      var st = STATUS[s.stepFree] || STATUS.no;
      var lines = (s.lines || []).slice(0, 4).map(function (l) {
        return '<span class="line-pill">' + escapeHtml(l) + "</span>";
      }).join("");
      var more = (s.lines || []).length > 4 ? '<span class="line-pill">+' + ((s.lines.length) - 4) + "</span>" : "";
      return (
        '<li class="station-card' + (s.id === state.activeId ? " active" : "") + '" data-id="' + s.id + '" tabindex="0" role="button">' +
        '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">' +
        "<h3>" + escapeHtml(s.name) + '<span class="ja">' + escapeHtml(s.nameJa || "") + "</span></h3>" +
        '<span class="badge ' + s.stepFree + '">' + st.icon + " " + st.label + "</span>" +
        "</div>" +
        '<p class="meta">' + escapeHtml(s.city) + " · " + escapeHtml((s.operators || []).join(", ")) + "</p>" +
        '<div class="lines">' + lines + more + "</div>" +
        "</li>"
      );
    }).join("");
    els.list.innerHTML = html;

    Array.prototype.forEach.call(els.list.querySelectorAll(".station-card"), function (card) {
      card.addEventListener("click", function () { selectStation(card.getAttribute("data-id"), true); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectStation(card.getAttribute("data-id"), true);
        }
      });
    });
  }

  function renderMarkers() {
    markerLayer.clearLayers();
    state.markers = {};
    var pts = [];
    state.filtered.forEach(function (s) {
      var icon = L.divIcon({
        className: "",
        html: '<div class="marker-pin">' + (STATUS[s.stepFree] || STATUS.no).icon + "</div>",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      var m = L.marker([s.lat, s.lng], { icon: icon, title: s.name });
      m.on("click", function () { selectStation(s.id, false); });
      m.bindTooltip(s.name + " (" + s.nameJa + ")", { direction: "top", offset: [0, -10] });
      m.addTo(markerLayer);
      state.markers[s.id] = m;
      pts.push([s.lat, s.lng]);
    });
    if (pts.length && !state.activeId) {
      map.fitBounds(pts, { padding: [40, 40], maxZoom: 12 });
    }
  }

  function selectStation(id, pan) {
    var s = findStation(id);
    if (!s) return;
    state.activeId = id;
    renderList();
    if (pan && state.markers[id]) {
      map.setView([s.lat, s.lng], Math.max(map.getZoom(), 13), { animate: true });
    }
    var m = state.markers[id];
    if (m) m.openTooltip();
    renderDetail(s);
  }

  function renderDetail(s) {
    var st = STATUS[s.stepFree] || STATUS.no;

    var entrances = (s.entrances || []).map(function (e) {
      var liftBadge = e.hasLift
        ? '<span class="badge yes">🛗 Has lift</span>'
        : '<span class="badge no">🚫 No lift</span>';
      var platforms = (e.toPlatforms || []).map(function (p) {
        return '<span class="line-pill">' + escapeHtml(p) + "</span>";
      }).join("");
      return (
        '<div class="entrance-item">' +
        '<div class="entrance-head"><span class="entrance-name">' + escapeHtml(e.exit) + " exit</span>" + liftBadge + "</div>" +
        (platforms
          ? '<div class="entrance-reach"><span class="reach-label">Step-free to:</span> ' + platforms + "</div>"
          : "") +
        (e.notes ? '<div class="notes">' + escapeHtml(e.notes) + "</div>" : "") +
        "</div>"
      );
    }).join("") || '<p class="notes">No exit / lift detail recorded yet.</p>';

    var lines = (s.lines || []).map(function (l) {
      return '<span class="line-pill">' + escapeHtml(l) + "</span>";
    }).join("");

    var hotelQuery = encodeURIComponent("hotels near " + s.name + " station " + s.city + " Japan");
    var navQuery = encodeURIComponent(s.name + " station " + s.city + " Japan");

    var verified = s.lastVerified
      ? '<p class="verified">✔ Last verified: ' + escapeHtml(s.lastVerified) + " · always confirm before you travel</p>"
      : "";

    var reportLink = state.reportUrl
      ? '<a class="report" target="_blank" rel="noopener" href="' + escapeHtml(state.reportUrl) + '">⚑ Report a problem with this info</a>'
      : "";

    els.detailBody.innerHTML =
      "<h2>" + escapeHtml(s.name) + '<span class="ja"> ' + escapeHtml(s.nameJa || "") + "</span></h2>" +
      '<p class="sub">' + escapeHtml(s.city) + " · " + escapeHtml((s.operators || []).join(", ")) + "</p>" +
      '<span class="badge ' + s.stepFree + '">' + st.icon + " " + st.label + "</span>" +
      verified +
      "<h4>Lines</h4><div class=\"lines\">" + lines + "</div>" +
      "<h4>Step-free exits (with lift → platform)</h4>" + entrances +
      '<div class="actions">' +
      '<a class="btn btn-primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + navQuery + '">🧭 Navigate to station (Google Maps)</a>' +
      '<a class="btn btn-secondary" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + hotelQuery + '">🏨 Find accessible hotels nearby</a>' +
      (s.officialUrl ? '<a class="btn btn-secondary" target="_blank" rel="noopener" href="' + escapeHtml(s.officialUrl) + '">ⓘ Official station info</a>' : "") +
      "</div>" +
      reportLink;

    els.detail.hidden = false;
  }

  function closeDetail() {
    els.detail.hidden = true;
  }

  function findStation(id) {
    for (var i = 0; i < state.stations.length; i++) {
      if (state.stations[i].id === id) return state.stations[i];
    }
    return null;
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
