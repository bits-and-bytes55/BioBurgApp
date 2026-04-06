import HeroSection from "./sections/HeroSection";
import AboutSection from "./sections/AboutSection";

const SectionRenderer = ({ section }) => {
  switch (section.sectionKey) {
    case "hero":
      return <HeroSection data={section} />;

    case "about":
      return <AboutSection data={section} />;

    default:
      return null;
  }
};

export default SectionRenderer;
