const STORAGE_KEY = "table-thyme-orders-v1";
const TIME_ZONE = "Asia/Singapore";
const form = document.querySelector("#order-form");
const orderInput = document.querySelector("#order-input");
const ordersList = document.querySelector("#orders-list");
const emptyState = document.querySelector("#empty-state");
let orders = loadOrders();

function loadOrders() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.flatMap((order) => {
      if (!order || typeof order.id !== "string" || typeof order.createdAt !== "string" || typeof order.served !== "boolean") {
        return [];
      }
      if (typeof order.details === "string" && order.details.trim()) {
        return [{ id: order.id, details: order.details, createdAt: order.createdAt, served: order.served }];
      }
      if (Array.isArray(order.items) && order.items.every((item) => typeof item === "string")) {
        const details = [order.customer, ...order.items].filter((part) => typeof part === "string" && part.trim()).join("\n");
        return details ? [{ id: order.id, details, createdAt: order.createdAt, served: order.served }] : [];
      }
      return [];
    });
  } catch (error) {
    console.error("Could not load saved orders.", error);
    return [];
  }
}

function saveOrders() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error("Could not save orders.", error);
  }
}

function formatTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Time unavailable · UTC+8";
  const formatted = new Intl.DateTimeFormat("en-SG", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${formatted} · UTC+8`;
}

function render() {
  ordersList.replaceChildren(...orders.map((order) => {
    const card = document.createElement("article");
    card.className = `order-card${order.served ? " is-served" : ""}`;

    const content = document.createElement("div");
    content.className = "order-content";
    const time = document.createElement("time");
    time.className = "order-time";
    time.dateTime = order.createdAt;
    time.textContent = formatTime(order.createdAt);
    const details = document.createElement("p");
    details.className = "order-details";
    details.textContent = order.details;
    content.append(time, details);

    const actions = document.createElement("div");
    actions.className = "order-actions";
    const serveButton = document.createElement("button");
    serveButton.className = "serve-button";
    serveButton.type = "button";
    serveButton.dataset.action = "toggle-served";
    serveButton.dataset.id = order.id;
    serveButton.setAttribute("aria-pressed", String(order.served));
    serveButton.textContent = order.served ? "Undo" : "✓ Served";
    serveButton.setAttribute("aria-label", order.served ? "Mark order as not served" : "Mark order as served");
    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.dataset.action = "remove";
    removeButton.dataset.id = order.id;
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove this order");
    actions.append(serveButton, removeButton);
    card.append(content, actions);
    return card;
  }));
  emptyState.hidden = orders.length > 0;
  document.querySelector("#order-count").textContent = orders.length;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const details = orderInput.value.trim();
  if (!details) {
    orderInput.focus();
    return;
  }
  orders.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    details,
    createdAt: new Date().toISOString(),
    served: false,
  });
  saveOrders();
  render();
  form.reset();
  orderInput.focus();
});

ordersList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "toggle-served") {
    orders = orders.map((order) => order.id === button.dataset.id ? { ...order, served: !order.served } : order);
  } else if (button.dataset.action === "remove") {
    orders = orders.filter((order) => order.id !== button.dataset.id);
  } else {
    return;
  }
  saveOrders();
  render();
});

render();
