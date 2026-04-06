import React from "react";

const HomeSections = ({ sections }) => {
  return (
    <>
      {sections
        .filter(sec => sec.isActive)
        .sort((a, b) => a.order - b.order)
        .map(sec => (
          <SectionRenderer key={sec.sectionKey} section={sec} />
        ))}
    </>
  );
};

export default HomeSections;
