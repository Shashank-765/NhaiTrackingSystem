import React from 'react'
import "./Home.css"
import { motion } from "framer-motion";
import Invoice from '../Invoice/Invoice';


const Home = () => {
  return (
    <div className="landing-container">
      <main className="main-content">
        {/* Hero Section */}
        <motion.section
          className="hero-section"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="hero-title">
            Empowering Infrastructure Through Transparent Bidding
          </h2>
          <p className="hero-description">
            NHAI BidConnect is revolutionizing infrastructure development by connecting project initiators with skilled contractors through a transparent, competitive bidding process.
          </p>
        </motion.section>

        {/* Features Section */}
        <motion.section
          className="features-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="feature-box">
            <h3 className="feature-title">Post Projects Easily</h3>
            <p className="feature-text">Intuitive interface to create and manage infrastructure projects.</p>
          </div>
          <div className="feature-box">
            <h3 className="feature-title">Competitive Bidding</h3>
            <p className="feature-text">Contractors submit bids in a transparent and fair environment.</p>
          </div>
          <div className="feature-box">
            <h3 className="feature-title">Real-Time Monitoring</h3>
            <p className="feature-text">Track project and bid statuses in real-time with analytics.</p>
          </div>
          <div className="feature-box">
            <h3 className="feature-title">Secure & Reliable</h3>
            <p className="feature-text">Built with security and scalability at its core.</p>
          </div>
        </motion.section>

        {/* Process Section */}
        <motion.section
          className="process-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h3 className="section-heading">How It Works</h3>
          <div className="process-steps">
            <div className="step-box">
              <h4 className="step-title">1. Register</h4>
              <p className="step-description">Sign up as an end user or contractor to get started.</p>
            </div>
            <div className="step-box">
              <h4 className="step-title">2. Post or Bid</h4>
              <p className="step-description">End users post projects, contractors place bids.</p>
            </div>
            <div className="step-box">
              <h4 className="step-title">3. Award & Track</h4>
              <p className="step-description">Select the best bid and track project progress.</p>
            </div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          className="testimonials-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h3 className="section-heading">What Our Users Say</h3>
          <div className="testimonials">
            <div className="testimonial-box">
              <p className="testimonial-text">"BidConnect made it easy to find quality contractors and complete our projects on time. Highly recommend!"</p>
              <span className="testimonial-author">— Project Manager, NHAI</span>
            </div>
            <div className="testimonial-box">
              <p className="testimonial-text">"The transparent bidding process gives everyone a fair shot. It’s a game changer for contractors."</p>
              <span className="testimonial-author">— Contractor Partner</span>
            </div>
          </div>
        </motion.section>
      </main>
      {/* <Invoice /> */}
    </div>
  )
}

export default Home