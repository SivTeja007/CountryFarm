"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const STATUSES = ["Pending", "Confirmed", "Out for Delivery", "Delivered"];

export default function AdminPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/admin/orders`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      setOrders(data.data || []);
      setDrafts((prev) => {
        const nextDrafts = { ...prev };
        for (const order of data.data || []) {
          if (!nextDrafts[order.id]) {
            nextDrafts[order.id] = {
              status: order.status,
              final_price:
                order.final_price === null || order.final_price === undefined
                  ? ""
                  : String(order.final_price),
              final_weight:
                order.final_weight === null || order.final_weight === undefined
                  ? ""
                  : String(order.final_weight),
            };
          }
        }
        return nextDrafts;
      });
    } catch (fetchError) {
      setError(fetchError.message || "Something went wrong while loading.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function updateDraft(orderId, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [field]: value,
      },
    }));
  }

  async function saveOrder(orderId) {
    const draft = drafts[orderId] || {};
    const payload = {
      status: draft.status,
    };

    if (draft.final_price !== "") {
      payload.final_price = Number(draft.final_price);
    }

    if (draft.final_weight !== "") {
      payload.final_weight = Number(draft.final_weight);
    }

    setSavingId(orderId);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/order/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update order");
      }

      setOrders((prev) =>
        prev.map((item) => (item.id === orderId ? data.data : item))
      );
    } catch (saveError) {
      setError(saveError.message || "Failed to update order.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="page-wrap admin-wrap">
      <section className="form-card">
        <div className="page-top">
          <h1>Admin Dashboard</h1>
          <div className="admin-top-actions">
            <button className="btn btn-secondary" type="button" onClick={fetchOrders}>
              Refresh
            </button>
            <Link href="/" className="text-link">
              Home
            </Link>
          </div>
        </div>

        {loading ? <p>Loading orders...</p> : null}
        {error ? <p className="error-msg">{error}</p> : null}

        {!loading && orders.length === 0 ? (
          <p className="subtext">No orders found yet.</p>
        ) : null}

        <div className="admin-list">
          {orders.map((order) => {
            const draft = drafts[order.id] || {
              status: order.status,
              final_price: "",
              final_weight: "",
            };

            return (
              <article key={order.id} className="admin-order-card">
                <div className="admin-order-head">
                  <h2>Order #{order.id}</h2>
                  <span className="status-pill">{order.status}</span>
                </div>

                <div className="admin-order-grid">
                  <p>
                    <strong>Phone:</strong> {order.phone}
                  </p>
                  <p>
                    <strong>Weight Range:</strong> {order.weight_range}
                  </p>
                  <p>
                    <strong>Qty:</strong> {order.quantity}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(order.delivery_date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Slot:</strong> {order.delivery_slot}
                  </p>
                  <p>
                    <strong>Address:</strong> {order.address}
                  </p>
                  <p>
                    <strong>Notes:</strong> {order.notes || "N/A"}
                  </p>
                </div>

                <div className="admin-edit-row">
                  <label>
                    Status
                    <select
                      value={draft.status || order.status}
                      onChange={(event) =>
                        updateDraft(order.id, "status", event.target.value)
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Final Price
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.final_price}
                      onChange={(event) =>
                        updateDraft(order.id, "final_price", event.target.value)
                      }
                      placeholder="e.g. 780"
                    />
                  </label>

                  <label>
                    Final Weight (kg)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.final_weight}
                      onChange={(event) =>
                        updateDraft(order.id, "final_weight", event.target.value)
                      }
                      placeholder="e.g. 1.65"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => saveOrder(order.id)}
                  disabled={savingId === order.id}
                >
                  {savingId === order.id ? "Saving..." : "Update Order"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
