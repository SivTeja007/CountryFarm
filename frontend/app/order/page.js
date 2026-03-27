"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const initialForm = {
  phone: "",
  weight_range: "1-1.5kg",
  quantity: 1,
  delivery_date: "",
  delivery_slot: "6AM-9AM",
  address: "",
  notes: "",
};

const DELIVERY_SLOTS = ["6AM-9AM", "9AM-12PM", "12PM-3PM", "3PM-6PM"];
const WEIGHT_RANGES = ["1-1.5kg", "1.5-2kg", "2-2.5kg"];

export default function OrderPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  const whatsappText = useMemo(() => {
    if (!result) {
      return "";
    }

    return [
      "New Chicken Booking",
      `Order ID: ${result.id}`,
      `Phone: ${result.phone}`,
      `Weight Range: ${result.weight_range}`,
      `Quantity: ${result.quantity}`,
      `Delivery Date: ${new Date(result.delivery_date).toLocaleDateString()}`,
      `Slot: ${result.delivery_slot}`,
      `Address: ${result.address}`,
      `Notes: ${result.notes || "N/A"}`,
      `Status: ${result.status}`,
    ].join("\n");
  }, [result]);

  const whatsappLink = whatsappText
    ? `https://wa.me/?text=${encodeURIComponent(whatsappText)}`
    : "";

  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      setResult(data.data);
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-wrap">
      <section className="form-card">
        <div className="page-top">
          <h1>Book Your Live Country Chicken</h1>
          <Link href="/" className="text-link">
            Back to Home
          </Link>
        </div>

        <form onSubmit={onSubmit} className="order-form">
          <label>
            Phone Number
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="10-digit phone"
              required
            />
          </label>

          <label>
            Weight Range
            <select
              name="weight_range"
              value={form.weight_range}
              onChange={onChange}
              required
            >
              {WEIGHT_RANGES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Quantity
            <input
              type="number"
              name="quantity"
              min={1}
              value={form.quantity}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Delivery Date
            <input
              type="date"
              name="delivery_date"
              value={form.delivery_date}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Time Slot
            <select
              name="delivery_slot"
              value={form.delivery_slot}
              onChange={onChange}
              required
            >
              {DELIVERY_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>

          <label>
            Address
            <textarea
              name="address"
              value={form.address}
              onChange={onChange}
              rows={3}
              required
            />
          </label>

          <label>
            Notes (Optional)
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={2}
            />
          </label>

          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Placing Order..." : "Place Booking"}
          </button>
        </form>

        {error ? <p className="error-msg">{error}</p> : null}

        {result ? (
          <div className="success-box">
            <p>
              Booking Created. Order ID: <strong>#{result.id}</strong>
            </p>
            <p>Status: {result.status}</p>
            <a
              className="btn btn-secondary"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
            >
              Send Details on WhatsApp
            </a>
          </div>
        ) : null}
      </section>
    </main>
  );
}
