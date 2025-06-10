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
            🏗 Contract Tracking Chain  NHAI
          </h2>
          <h4>Transparent Infrastructure Project Tracking with Hyperledger Fabric</h4>
          <p style={{ marginTop: "20px" }}>🚀 Digitize. Track. Trust.</p>
          <div className="hero-buttons">
            <a href="#" className="btn primary">Get Started</a>
            {/* <a href="#" className="btn secondary">Watch Demo</a> */}
          </div>
          <div className="info-boxes">
            <div className="info-box">
              <p>🔗 Powered by Hyperledger Fabric</p>
            </div>
            <div className="info-box">
              <p>🔍 100% Transparent</p>
            </div>
            <div className="info-box">
              <p>🔐 Role-Based Access</p>
            </div>
          </div>
        </motion.section>





        {/* Features Section */}
        {/*
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
        */}

        {/* Process Section */}
        {/*
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
        */}

        {/* Testimonials Section */}
        {/*
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
              <p className="testimonial-text">"The transparent bidding process gives everyone a fair shot. It's a game changer for contractors."</p>
              <span className="testimonial-author">— Contractor Partner</span>
            </div>
          </div>
        </motion.section>
        */}

        {/* About ContractChain Section */}
        <motion.section
          className="about-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="section-content">
            <h3 className="section-heading">About ContractChain</h3>
            <p>
              Infrastructure development is a complex web of contracts, fund flows, milestone tracking, and payments. Manual processes often lead to delays, miscommunication, and lack of accountability. ContractChain solves this using blockchain technology.
            </p>
            <p>
              Built on Hyperledger Fabric, it provides a permissioned, transparent, and verifiable system for all stakeholders — ensuring smooth operations, automated invoicing, and milestone monitoring.
            </p>
          </div>
        </motion.section>

        {/* Who Uses ContractChain Section */}
        <motion.section
          className="who-uses-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="section-content">
            <h3 className="section-heading">Who Uses ContractChain?</h3>
            <div className="user-types">
              <div className="user-box">
                <h4 className="user-title">👷 NHAI (Admin)</h4>
                <ul>
                  <li>Onboards users (agencies & contractors)</li>
                  <li>Creates contracts and assigns batches</li>
                  <li>Verifies work and payments</li>
                </ul>
              </div>
              <div className="user-box">
                <h4 className="user-title">🏛️ Agencies</h4>
                <ul>
                  <li>Fund infrastructure projects</li>
                  <li>View contract status</li>
                  <li>Track invoice history</li>
                </ul>
              </div>
              <div className="user-box">
                <h4 className="user-title">🏗️ Contractors</h4>
                <ul>
                  <li>View assigned contracts</li>
                  <li>Update project progress</li>
                  <li>Raise invoices after completing milestones</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Platform Features Section */}
        <motion.section
          className="platform-features-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="section-content">
            <h3 className="section-heading"><span className="platform-icon">🌟</span> Platform Features</h3>
            <ul className="feature-list">
              <li> <b style={{color:"#1e3a8a",fontSize:"18px"}}>Role-Based Access Control :</b> Tailored dashboards for Admin (NHAI), Agencies, and Contractors.</li>
              <li> <b style={{color:"#1e3a8a",fontSize:"18px"}}>Smart Contract Automation :</b> Triggers payments and approvals based on milestone achievements.</li>
              <li> <b style={{color:"#1e3a8a",fontSize:"18px"}}>Milestone Monitoring :</b> Track the exact progress of each contract against defined deliverables.</li>
              <li> <b style={{color:"#1e3a8a",fontSize:"18px"}}>Immutable Invoice Logs :</b> Every invoice is cryptographically recorded and tamper-proof.</li>
              <li> <b style={{color:"#1e3a8a",fontSize:"18px"}}>Real-Time Updates :</b> Instantly view project status and financial transactions.</li>
              <li> <b style={{color:"#1e3a8a",fontSize:"18px"}}>Audit Trails & History :</b> Every action is recorded for compliance and transparency.</li>
            </ul>
          </div>
        </motion.section>

        {/* Key Benefits Section */}
        <motion.section
          className="key-benefits-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="section-content">
            <h3 className="section-heading">💡 Key Benefits</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <h4>⏱ Faster Approvals:</h4>
                <p>Automate workflows to streamline validations.</p>
              </div>
              <div className="benefit-item">
                <h4>📉 Lower Disputes:</h4>
                <p>Real-time visibility and immutable logs.</p>
              </div>
              <div className="benefit-item">
                <h4>🔒 Enhanced Security:</h4>
                <p>Built on enterprise-grade blockchain tech.</p>
              </div>
              <div className="benefit-item">
                <h4>🤝 Decentralized Control:</h4>
                <p>Shared visibility without compromising control.</p>
              </div>
              <div className="benefit-item">
                <h4>📈 Project Accountability:</h4>
                <p>Everyone follows their responsibilities and timelines.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Real-Life Use Case Example Section */}
        <motion.section
          className="use-case-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="section-content">
            <h3 className="section-heading">📝 Real-Life Use Case Example</h3>
            <h4 className="use-case-subtitle">Scenario: Road Development Contract in Maharashtra</h4>
            <ul className="use-case-list">
              <li>▪️<b style={{color:"#1e3a8a"}}> NHAI : </b> creates a batch under PWD (Roads) common.</li>
              <li>▪️<b style={{color:"#1e3a8a"}}> Links Agency X and Contractor Y. </b></li>
              <li><b style={{color:"#1e3a8a"}}>▪️ Agency: </b> funds first batch + admin verifies.</li>
              <li>▪️<b style={{color:"#1e3a8a"}}> Contractor : </b>completes Phase 1 → updates milestone.</li>
              <li>▪️<b style={{color:"#1e3a8a"}}> Admin : </b> verifies → Contractor generates e-invoice.</li>
              <li>▪️<b style={{color:"#1e3a8a"}}>Admin : </b> approves payment → Smart contract initiates funds.</li>
              <li>▪️<b style={{color:"#1e3a8a"}}>Business :</b> reports project completion → fully tracked & transparent.</li>
            </ul>
          </div>
        </motion.section>

        {/* FAQs Section */}
        <motion.section
          className="faqs-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="section-content">
            <h3 className="section-heading">❓ FAQs</h3>
            <div className="faq-items">
              <div className="faq-item">
                <h4>Q: Is ContractChain live in pilot?</h4>
                <p>A: Currently under pilot testing with select NHAI projects.</p>
              </div>
              <div className="faq-item">
                <h4>Q: Can new users be onboarded by Admin?</h4>
                <p>A: Yes, Admin has full control over creating and managing users.</p>
              </div>
              <div className="faq-item">
                <h4>Q: Is it open to the public?</h4>
                <p>A: No, this is a permissioned system for verified stakeholders only.</p>
              </div>
              <div className="faq-item">
                <h4>Q: Is it scalable for national rollout?</h4>
                <p>A: Absolutely, it's built with enterprise-grade Hyperledger Fabric for scalability.</p>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
      {/* <Invoice /> */}
    </div>
  )
}

export default Home