import React from 'react';
import Navbar from '../components/Navbar/NavBar';
import Footer from '../components/Footer';
import { useEffect } from 'react';

const Legal = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />

      <main className="legal-main">
        <h1 className="legal-title">Legal Page Mockup</h1>

        <section className="legal-section">
          <h2 className="legal-section-title1">Title 1</h2>
          <h3 className="legal-section-title2">Title 2</h3>
          <p className="legal-section-paragraph">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title1">Title 1</h2>
          <h3 className="legal-section-title2">Title 2</h3>
          <p className="legal-section-paragraph">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title1">Title 1</h2>
          <h3 className="legal-section-title2">Title 2</h3>
          <p className="legal-section-paragraph">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title1">Title 1</h2>
          <h3 className="legal-section-title2">Title 2</h3>
          <p className="legal-section-paragraph">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse mattis metus neque, ac hendrerit risus pharetra ac.
          </p>
        </section>
      </main>



      <Footer />
    </>
  );
};

export default Legal;