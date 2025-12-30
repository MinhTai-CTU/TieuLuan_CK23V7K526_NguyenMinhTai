import React from "react";
import Hero from "./Hero";
import Categories from "./Categories";
import FeaturedPromos from "./FeaturedPromos";
import NewArrival from "./NewArrivals";
import PromotionalSection from "./PromotionalSection";
import BestSeller from "./BestSeller";
import CounDown from "./Countdown";
import Testimonials from "./Testimonials";

const Home = () => {
  return (
    <main>
      <Hero />
      <Categories />
      <FeaturedPromos />
      <NewArrival />
      <PromotionalSection />
      <BestSeller />
      <CounDown />
      <Testimonials />
    </main>
  );
};

export default Home;
