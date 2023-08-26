import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import '../styles/Footer.css'


const Footer = () => {
  return (
    <footer className="footer">
      <div className="container py-3">
        <div className="row">
          <div className="col-lg-6">
            <ul className="list-inline mb-0">
              <li className="list-inline-item">
                <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faFacebook} />
                </a>
              </li>
              <li className="list-inline-item">
                <a href="https://www.twitter.com/" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faTwitter} />
                </a>
              </li>
              <li className="list-inline-item">
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
              </li>
            </ul>
          </div>
          <div className="col-lg-6 text-lg-right">
            <span className="text-muted">About Us</span>
            <span className="mx-2 text-muted">|</span>
            <span className="text-muted">Contact Us</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;