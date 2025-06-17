import React, { useState } from 'react'
import "./Home.css"
import { motion } from "framer-motion";
import Invoice from '../Invoice/Invoice';
import imageBanner from '../../Images/bannerimage.png';
import secondSectionImage from '../../Images/secondsection.png';
import { IoIosArrowDown } from "react-icons/io";
import platform1 from "../../Images/platform1.png";
import platform2 from "../../Images/platform2.png";
import platform3 from "../../Images/platform3.png";
import platform4 from "../../Images/platform4.png";
import platform5 from "../../Images/platform5.png";
import user1 from "../../Images/user1.png";
import user2 from "../../Images/user2.png";
import user3 from "../../Images/user3.png";
import logo from "../../Images/logo.png";
import platform6 from "../../Images/platform6.png";
import { TiTick } from "react-icons/ti";
import tickimage from "../../Images/tick.png";
//image of seciond section url D:\new NHAI\NhaiTrackingSystem\src\Images\secondsectionimage.png

const Home = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="landing-container">
      <main className="main-content">
        {/* Hero Section */}
        {/* <motion.section
          className="hero-section"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="hero-image-container">
            <img src={imageBanner} alt="Infrastructure Project Tracking Dashboard" className="hero-image" />
          </div>
        </motion.section> */}
<div className="header">
         <section className="hero-section">
      <div className="hero-container">
        <div className="hero-text">
          <p className="breadcrumb">📎 ContractChain NHAI</p>
          <h1>
            Transparent<br></br> Infrastructure Project<br></br> Tracking with <br></br><span className="highlight">Hyperledger Fabric</span>
          </h1>
          <p className="subheading">Digitize. Track. Trust.</p>
          <p className="description">
            ContractChain empowers NHAI, Agencies, and Contractors with a secure, <br></br>blockchain-based platform to manage
            infrastructure projects from initiation to<br></br> execution.
          </p>
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
          <div className="cta-buttons">
            <button className="get-started">Get Started</button>
            <button className="watch-demo">Watch Demo</button>
          </div>
        </div>
        <div className="hero-image-container">
          <img src={imageBanner} alt="Infrastructure Project Tracking Dashboard" className="hero-image" style={{width:"40vw"}} />
        </div>
      </div>
    </section>
    </div>

        {/* Why ContractChain Section */}
        <div className='section2'>
          <motion.section
            className="why-contractchain-section"
            id="about"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <div className="section-image-container">
              <img src={secondSectionImage} alt="ContractChain Benefits" className="section-image" />
            </div>
            <div className="section-content">
              <h3 className="section-heading">Why ContractChain?</h3>
              <p className="section-description">Infrastructure development involves a maze of contracts, fund
                disbursal, milestone checks, and approvals. Traditional paper-based
                workflows cause bottlenecks.</p>
              <p className="section-description">ContractChain, built on Hyperledger Fabric, replaces this with an
                automated, transparent, and tamper-proof tracking system —
                monitored in real-time by all stakeholders.</p>
              <div className="milestone-box">
                <p className="milestone-text"><img src={tickimage} alt="Milestone Tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> Milestone Monitoring</p>
                <p className="milestone-subtext">Track project progress against defined deliverables.</p>
              </div>
            </div>
          </motion.section>
        </div>
        {/* About ContractChain Section */}
        {/* Who Uses ContractChain Section */}
        <motion.section
          className="who-uses-section"
          id="who-uses-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="section-content">
            <h3 className="section-heading">User Roles</h3>
            <div className="user-types">
              <div className="user-box">
                <img src={user1} alt="NHAI Admin" style={{ width: '31.5px', height: '36px', display: 'block', margin: '0 auto' }} />
                <h4>NHAI (Admin)</h4>
                <ul>
                  <li><img src={tickimage} alt="tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> Onboards users (agencies & contractors)</li>
                  <li><img src={tickimage} alt="tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> Creates contracts and batches</li>
                  <li><img src={tickimage} alt="tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> Verifies milestones and invoices</li>
                </ul>
              </div>
              <div className="user-box">
                <img src={user2} alt="Agencies" style={{ width: '31.5px', height: '36px', display: 'block', margin: '0 auto' }} />
                <h4>Agencies</h4>
                <ul>
                  <li><img src={tickimage} alt="tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> Fund infrastructure projects</li>
                  <li><img src={tickimage} alt="tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> View contract status</li>
                  <li><img src={tickimage} alt="tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> Track invoice history</li>
                </ul>
              </div>
              <div className="user-box">
                <img src={user3} alt="Contractors" style={{ width: '31.5px', height: '36px', display: 'block', margin: '0 auto' }} />
                <h4>Contractors</h4>
                <ul>
                  <li><img src={tickimage} alt="tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> View assigned contracts</li>
                  <li><img src={tickimage} alt="tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> Update project progress</li>
                  <li><img src={tickimage} alt="tick" style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} /> Raise invoices after completing milestones</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Platform Features Section */}
        <div className='section2'>
          <motion.section
            className="platform-features-section"
            id="platform-features-section"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <div className="section-content">
              <h3 className="section-heading">Platform Features</h3>
              <div className="feature-grid">
                <div className="feature-item">
                  <img src={platform1} alt="Role-Based Dashboards" className="feature-icon" />
                  <h4 className="feature-title">Role-Based Dashboards</h4>
                </div>
                <div className="feature-item">
                  <img src={platform2} alt="Smart Contract Automation" className="feature-icon" />
                  <h4 className="feature-title">Smart Contract Automation</h4>
                </div>
                <div className="feature-item">
                  <img src={platform3} alt="Milestone Monitoring" className="feature-icon" />
                  <h4 className="feature-title">Milestone Monitoring</h4>
                </div>
                <div className="feature-item">
                  <img src={platform4} alt="Immutable Invoice Logs" className="feature-icon" />
                  <h4 className="feature-title">Immutable Invoice Logs</h4>
                </div>
                <div className="feature-item">
                  <img src={platform5} alt="Real-Time Status Updates" className="feature-icon" />
                  <h4 className="feature-title">Real-Time Status Updates</h4>
                </div>
                <div className="feature-item">
                  <img src={platform6} alt="Full Audit History" className="feature-icon" />
                  <h4 className="feature-title">Full Audit History</h4>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
        {/* How It Works - Real Example Section */}
        <motion.section
          className="how-it-works-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="section-content">
            <h3 className="section-heading">How It Works - Real Example</h3>
            <p className="how-it-works-subtitle">Follow a contract through its complete lifecycle</p>
            <div className="process-timeline">
              <div className="timeline-item1">
                <div className="timeline-content">
                  <h4>NHAI creates  contract</h4>
                  <p>Project initiated and contract terms defined</p>
                </div>
                <div className="timeline-dot"></div>
              </div>
              <div className="timeline-item1">
                <div className="timeline-content">
                  <h4>Links Agency X & Contractor Y</h4>
                  <p>Stakeholders onboarded to the platform</p>
                </div>
                <div className="timeline-dot"></div>
              </div>
              <div className="timeline-item1">
                <div className="timeline-content">
                  <h4>Agency funds – Admin verifies</h4>
                  <p>Funding secured and verified on blockchain</p>
                </div>
                <div className="timeline-dot"></div>
              </div>
              <div className="timeline-item1">
                <div className="timeline-content">
                  <h4>Contractor completes Phase 1</h4>
                  <p>Milestone achieved and documented</p>
                </div>
                <div className="timeline-dot"></div>
              </div>
              <div className="timeline-item1">
                <div className="timeline-content">
                  <h4>Payment auto-released</h4>
                  <p>Smart contract triggers automatic payment</p>
                </div>
                <div className="timeline-dot"></div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* FAQs Section */}

        <div className='section2'>
          <motion.section
            className="faqs-section"
            id="faqs-section"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <div className="section-content">
              <h3 className="section-heading">Frequently Asked Questions</h3>
              <div className="faq-items">
                <div className={`faq-item ${openFaq === 0 ? 'open' : ''}`}>
                  <h4 onClick={() => toggleFaq(0)}>Q: Is ContractChain live?<span className="faq-toggle-icon"><IoIosArrowDown /></span></h4>
                  <p className="faq-answer"><b>A</b>: Currently under pilot testing with select NHAI projects.</p>
                </div>
                <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`}>
                  <h4 onClick={() => toggleFaq(1)}>Q: Can Admin add new users? <span className="faq-toggle-icon"><IoIosArrowDown /></span></h4>
                  <p className="faq-answer"><b>A</b>: Yes, Admin has full control over creating and assigning users.</p>
                </div>
                <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`}>
                  <h4 onClick={() => toggleFaq(2)}>Q: Is this public? <span className="faq-toggle-icon"><IoIosArrowDown /></span></h4>
                  <p className="faq-answer"><b>A</b>:No, this is a permissioned system for verified stakeholders only.</p>
                </div>
                <div className={`faq-item ${openFaq === 3 ? 'open' : ''}`}>
                  <h4 onClick={() => toggleFaq(3)}>Q: Scalable? <span className="faq-toggle-icon"><IoIosArrowDown /></span></h4>
                  <p className="faq-answer"><b>A</b>: Absolutely. It's built with enterprise-grade Hyperledger Fabric for scalability.</p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
        {/* Build Trust Section */}
        <motion.section
          className="build-trust-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="section-content">
            <h3 className="section-heading">Build Trust, One Milestone at a Time</h3>
            <p className="section-description">Join the future of transparent infrastructure tracking. Secure.<br></br>
            Scalable. Smart.</p>
            <div className="build-trust-buttons">
              <a href="#" className="btn primary">Request a Demo</a>
              <a href="#" className="btn secondary">Partner with Us</a>
            </div>
          </div>
        </motion.section>

      </main>
      {/* <Invoice /> */}
    </div>
  )
}

export default Home