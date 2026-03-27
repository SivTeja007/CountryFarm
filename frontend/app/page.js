import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="landing-hero section-wrap">
        <div className="hero-panel">
          <p className="eyebrow">Live Country Chicken Booking</p>
          <h1>Farm Fresh Chicken, Reserved for Your Chosen Slot</h1>
          <p className="subtext">
            Book by weight range and delivery window. We confirm final weight and
            final payable amount after admin review.
          </p>
          <div className="hero-actions">
            <Link href="/order" className="btn btn-primary">
              Book Now
            </Link>
            <Link href="/admin" className="btn btn-secondary hero-secondary-btn">
              Open Admin
            </Link>
          </div>
          <div className="hero-meta">
            <span>COD Available</span>
            <span>Slot Delivery</span>
            <span>Live Weight Confirmation</span>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <strong>4 Delivery Slots</strong>
            <p>Choose your preferred timing window every day.</p>
          </div>
          <div className="stat-card">
            <strong>Transparent Pricing</strong>
            <p>Estimated booking first, final price after live check.</p>
          </div>
          <div className="stat-card">
            <strong>Direct WhatsApp Share</strong>
            <p>Instantly share booking details after order placement.</p>
          </div>
        </div>
      </section>

      <section className="section-wrap section-block">
        <div className="section-head">
          <h2>How It Works</h2>
          <p>Simple booking flow built for real farm-to-home operations.</p>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span>01</span>
            <h3>Place Booking</h3>
            <p>Pick weight range, quantity, date, slot, address, and notes.</p>
          </article>
          <article className="step-card">
            <span>02</span>
            <h3>Admin Confirmation</h3>
            <p>Our team confirms order status and updates final weight/price.</p>
          </article>
          <article className="step-card">
            <span>03</span>
            <h3>Delivery</h3>
            <p>Order is delivered in selected slot with COD/manual payment.</p>
          </article>
        </div>
      </section>

      <section className="section-wrap section-block">
        <div className="section-head">
          <h2>Why Families Choose CountryFarm</h2>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <h3>Live Country Quality</h3>
            <p>Freshly prepared country chicken from trusted local farm supply.</p>
          </article>
          <article className="feature-card">
            <h3>Reliable Slot Delivery</h3>
            <p>Operationally practical time windows to avoid late deliveries.</p>
          </article>
          <article className="feature-card">
            <h3>Admin-Controlled Workflow</h3>
            <p>Status and pricing are managed cleanly from one dashboard.</p>
          </article>
        </div>
      </section>

      <section className="section-wrap cta-band">
        <h2>Ready to Reserve Today&apos;s Fresh Stock?</h2>
        <p>Move from phone-call chaos to structured, trackable bookings.</p>
        <Link href="/order" className="btn btn-primary">
          Start Booking
        </Link>
      </section>
    </>
  );
}
