import React from 'react'
import './Footer.css'
import Image1 from '../../Images/companylogo.png'
import { Link, useNavigate } from 'react-router-dom'
function Footer() {
    const navigate = useNavigate();
    const navigatetohome = () => {
        navigate('/')
    }
    return (
        <div className='footer-section'>
            <div className='footerleftIcon'>
                <div className='footerleftIconcontainer'>

                    <img onClick={navigatetohome} src={Image1} alt='images' />
                </div>
                <p>© 2025 Bastionex Infotech, Inc.
                    All rights reserved.</p>
            </div>
            <div className='footerrightcontent'>
                <div className='footerrightsections'>
                    <p className='footerlinksheading'>Quick Links</p>
                    <p className='footerlink'><Link to='/'>Home</Link></p>
                    <p className='footerlink'><Link to='/about'>About</Link></p>
                    <p className='footerlink'><Link to='/product'>Explore</Link></p>
                    <p className='footerlink'><Link to='/contact'>Contact</Link></p>
                </div>
                <div className='footerrightsections'>
                    <p className='footerlinksheading'>Exolore More</p>
                    <p className='footerlink'><Link to='/faqs'>Faq</Link></p>
                    <p className='footerlink'><Link to='/privacypolicy'>Privacy Policy</Link></p>

                </div>
                <div className='footerrightsections'>
                    <p className='footerlinksheading'>Connect with us</p>
                    <p className='footerlink'><a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a></p>
                    <p className='footerlink'><a href="https://twitter.com/" target="_blank" rel="noreferrer">Twitter</a></p>
                    <p className='footerlink'><a href="https://linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a></p>
                    <p className='footerlink'><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a></p>

                </div>
            </div>
        </div>
    )
}

export default Footer