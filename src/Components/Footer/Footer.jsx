import React from 'react'
import './Footer.css'
import Image1 from '../../Images/companylogo.png'
import { SlPaperClip } from "react-icons/sl";
import { Link, useNavigate } from 'react-router-dom'
import logo from "../../Images/logo.png";
function Footer() {
    const navigate = useNavigate();
    const navigatetohome = () => {
        navigate('/')
    }
    return (
        <>
            <div className='contract-chain-nhai'>
                <p className='footer-main-title'><img src={logo} alt="ContractChain NHAI Logo" className="footer-logo-image" /> ContractChain NHAI</p>
                <p className='footer-p1' style={{color:"#4BA3C7"}}>Powered by Hyperledger Fabric</p>
                <p className='footer-p2'>Built for NHAI & Government Infrastructure</p>
                <p className='footer-p3'>Contact Privacy Terms</p>
                {/* <a href="#" className="help-button">
                    <span className="help-icon">?</span> Help
                </a> */}
            </div>
        </>
    )
}

export default Footer